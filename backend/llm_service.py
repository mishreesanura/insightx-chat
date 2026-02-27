import os
import json

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL = "gemini-2.5-flash-preview-04-17"


# ══════════════════════════════════════════════════════════════
# PASS 1 – Text-to-SQL Agent
# ══════════════════════════════════════════════════════════════

SQL_SYSTEM_INSTRUCTION = """
You are an expert DuckDB SQL analyst. Write a highly optimized read-only SQL query to answer the user.
Table name: transactions. Limit results to a maximum of 50 rows. Return ONLY a JSON object with the key 'sql_query'.
DATASET SCHEMA & RULES:
transaction_id: Unique identifier for each transaction
timestamp: Date and time of transaction
transaction_type: P2P (Person-to-Person), P2M (Person-to-Merchant), Bill Payment, or Recharge
merchant_category: Food, Grocery, Fuel, Entertainment, Shopping, Healthcare, Education, Transport, Utilities, Other. (NOTE: NULL for P2P transactions)
amount_inr: Transaction amount in Indian Rupees
transaction_status: SUCCESS or FAILED
sender_age_group: 18-25, 26-35, 36-45, 46-55, 56+
receiver_age_group: Age group of receiver. (NOTE: only applicable for P2P transactions, NULL otherwise)
sender_state: Indian state of the sender
sender_bank: Sender's bank (SBI, HDFC, ICICI, Axis, PNB, Kotak, IndusInd, Yes Bank)
receiver_bank: Receiver's bank (same list as sender_bank)
device_type: Device used (Android, iOS, Web)
network_type: Network connection (4G, 5G, WiFi, 3G)
fraud_flag: Binary indicator (0 = not flagged, 1 = flagged for review). NOTE: This represents flagged for review, NOT confirmed fraud cases.
hour_of_day: Hour of transaction (0-23)
day_of_week: Day of transaction (Monday-Sunday)
is_weekend: Binary indicator (0 = weekday, 1 = weekend)
"""


async def generate_sql(
    user_query: str,
    chat_history: list,
    previous_errors: list | None = None,
) -> str:
    """
    Pass 1 – Ask the LLM to produce a DuckDB SQL query for the user's question.
    Returns the raw SQL string.
    If previous_errors is provided the LLM is told about the failures so it can
    self-correct.
    """

    # Build conversation history
    contents: list[types.Content] = []
    for msg in chat_history:
        contents.append(
            types.Content(
                role="user" if msg["role"] == "user" else "model",
                parts=[types.Part.from_text(text=msg["text"])],
            )
        )

    # Build the user prompt (include error context if retrying)
    prompt = user_query
    if previous_errors:
        error_text = "\n".join(f"- {e}" for e in previous_errors)
        prompt += (
            f"\n\nYour previous SQL failed with these errors:\n{error_text}\n"
            "Please fix the SQL query."
        )

    contents.append(
        types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
    )

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=["sql_query"],
            properties={
                "sql_query": genai.types.Schema(type=genai.types.Type.STRING),
            },
        ),
        system_instruction=[types.Part.from_text(text=SQL_SYSTEM_INSTRUCTION)],
    )

    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=config,
    )

    result = json.loads(response.text)
    return result["sql_query"]


# ══════════════════════════════════════════════════════════════
# PASS 2 – Data-to-UI Agent
# ══════════════════════════════════════════════════════════════

UI_SYSTEM_INSTRUCTION = """
You are InsightX, an expert data analytics AI for a digital payments company.
Use the Executed SQL Data provided to answer the user's query.
Format the response strictly using the provided UI component JSON schemas.

The 'components' field MUST be a stringified JSON array containing one or more UI component objects.
You must strictly adhere to the following schemas, allowed values, and data mapping rules:

1. CHART COMPONENT
- Schema: {"type": "chart", "chart_type": "<TYPE>", "title": "...", "data":[<DATA_OBJECTS>], "config": {"xAxis": {"dataKey": "<X_KEY>"}, "yAxis": {"tickFormatter": "<FORMAT>"}, "series":[{"dataKey": "<Y_KEY>", "color": "hsl(var(--chart-1))", "yAxisId": "left"}]}}
- <TYPE> must be one of: "bar", "line", "area", "pie", "radar", "radial", "composed".
- <FORMAT> must be one of: "currency", "percentage", "compact_number", "standard".
- DATA MAPPING: The <DATA_OBJECTS> in the "data" array must be flat dictionaries. The keys in these dictionaries MUST perfectly match the <X_KEY> and <Y_KEY> defined in the config. Values for <Y_KEY> must be raw numbers (e.g., 150000.50), NOT formatted strings.

2. TABLE COMPONENT
- Schema: {"type": "table", "title": "...", "columns":[{"key": "<COL_KEY>", "header": "...", "format": "<COL_FORMAT>"}], "rows":[<ROW_OBJECTS>]}
- <COL_FORMAT> must be one of: "text", "currency", "badge".
- DATA MAPPING: Each object in the "rows" array must use the exact <COL_KEY>s defined in the columns.
- BADGE RULE: If a column format is "badge", the value in the row object MUST be a dictionary: {"label": "Flagged", "variant": "<VARIANT>"}.
- <VARIANT> must be one of: "default", "secondary", "destructive", "success", "outline".

3. CARD CAROUSEL COMPONENT
- Schema: {"type": "card_carousel", "cards":[{"title": "...", "description": "...", "content": "...", "trend": {"direction": "<DIR>", "value": "..."}, "badges":[{"label": "...", "variant": "<VARIANT>"}]}]}
- <DIR> must be one of: "up", "down", "neutral".

4. LIST COMPONENT
- Schema: {"type": "list", "items":[{"leading_slot": "...", "default_slot": "...", "secondary_slot": "...", "metadata_slot": "...", "trailing_slot": {"is_badge": true, "text": "...", "variant": "<VARIANT>"}}]}
- All slots are strings except trailing_slot which can optionally be a badge object.

5. INTERACTIVE INPUTS (Select & Date Picker)
- Select Schema: {"type": "select", "prompt_text": "...", "parameter_name": "...", "options":[{"label": "...", "value": "..."}]}
- Date Picker Schema: {"type": "date_picker", "prompt_text": "...", "parameter_name": "...", "mode": "range|single"}
- Use these when you need the user to clarify an entity (e.g., specific device, bank, or time range) before you can provide the data.

6. SEPARATOR COMPONENT
- Schema: {"type": "separator"}
- Use to visually separate groups of components.

Ensure the 'components' array is properly stringified before returning the final JSON.
Do not use markdown code blocks.
"""


async def generate_ui_response(
    user_query: str,
    sql_data: list[dict],
    chat_history: list,
) -> dict:
    """
    Pass 2 – Given the raw SQL result rows, ask the LLM to build the
    narrative + UI components JSON for the frontend.
    """

    # Build conversation history
    contents: list[types.Content] = []
    for msg in chat_history:
        contents.append(
            types.Content(
                role="user" if msg["role"] == "user" else "model",
                parts=[types.Part.from_text(text=msg["text"])],
            )
        )

    # Append user query + data payload
    data_prompt = (
        f"User Query: {user_query}\n\n"
        f"Executed SQL Data: {json.dumps(sql_data, default=str)}"
    )
    contents.append(
        types.Content(role="user", parts=[types.Part.from_text(text=data_prompt)])
    )

    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=genai.types.Schema(
            type=genai.types.Type.OBJECT,
            required=["narrative", "components", "suggested_follow_ups"],
            properties={
                "narrative": genai.types.Schema(type=genai.types.Type.STRING),
                "components": genai.types.Schema(
                    type=genai.types.Type.STRING,
                    description=(
                        "A stringified JSON array of component objects "
                        "matching system instructions exactly."
                    ),
                ),
                "suggested_follow_ups": genai.types.Schema(
                    type=genai.types.Type.ARRAY,
                    items=genai.types.Schema(type=genai.types.Type.STRING),
                ),
            },
        ),
        system_instruction=[types.Part.from_text(text=UI_SYSTEM_INSTRUCTION)],
    )

    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=config,
    )

    return json.loads(response.text)
