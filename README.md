# Finsight.AI

Finsight.AI is an intelligent, natural-language data analytics platform built for digital payment operations. It allows users to query complex transaction data using plain English, automatically translates those queries into optimized SQL, executes them against a local analytical database, and visualizes the results using dynamically generated UI components such as charts, tables, and metric cards. Currently, the system is specifically tailored and trained on a proprietary dataset of financial transaction logs.

![Finsight.AI - Screenshot 1](https://res.cloudinary.com/dk3mcvikk/image/upload/v1772391584/Screenshot_2026-02-28_123904_wuv1jb.png)

![Finsight.AI - Screenshot 2](https://res.cloudinary.com/dk3mcvikk/image/upload/v1772391688/Screenshot_2026-03-02_003113_jo6rc5.png)





## Features

- **Natural Language Analytics**: Ask questions such as "Show me fraud trends" or "What is total volume by bank?" and receive immediate data-driven answers.
- **Self-Healing Data Pipeline**: The AI agent automatically detects SQL execution errors and iteratively self-corrects (up to 3 times) before falling back, ensuring reliable and accurate answers.
- **Dynamic UI Generation**: The system determines the optimal method to visualize your data, seamlessly rendering composed charts, interactive tables, metric carousels, and context-aware follow-up suggestions.
- **Chat Archive & History**: Persistent chat sessions are stored in MongoDB. Users can manage previous analyses by renaming, starring, or deleting sessions.
- **Customizable Interface**: Includes toggleable Dark/Light mode, a Compact mode for dense information viewing, and custom auto-scroll behaviors.


![sample](https://github.com/user-attachments/assets/e5d318ac-7904-4f40-8275-04f279537df0)


## Sample Queries

Here are some example questions you can ask the platform:
- "Show me the total transaction amount and transaction count broken down by transaction types (P2M vs P2P)."
- "How has the daily transaction volume fluctuated over the last 30 days?"
- "Compare the total successful transaction values between the 18-25 and 26-35 sender age groups."
- "Show me the 10 most recent transactions flagged for review, including the merchant category and amount."
- "What is the distribution of devices used for Recharges?"

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router) & React 18
- **Styling**: Tailwind CSS & [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: Lucide React
- **Language**: TypeScript

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI/LLM**: Google Gemini API (`gemini-flash-latest`)
- **Data Engine**: DuckDB (Fast, in-process analytical SQL database)
- **Database**: MongoDB (via Motor/PyMongo) for persisting session state and chat histories

## Architecture Overview

1. **Pass 1 (Text-to-SQL)**: The user submits a question. The backend prompts Gemini with the digital payments database schema (`transactions`) to generate a highly optimized DuckDB SQL query.
2. **Data Execution**: The backend executes the SQL against `DuckDB` using the local CSV/Parquet data. If an error occurs, it is fed back to the LLM to self-correct in a self-healing loop.
3. **Pass 2 (Data-to-UI)**: The raw SQL results are passed back to Gemini, which structures the output strictly into a UI-component JSON schema (e.g., Line charts, Data Tables) and generates a human-readable narrative.
4. **Pass 3 (Session Naming)**: A lightweight background agent reads the first prompt and generates a concise, business-friendly name for the newly created session.

## Getting Started

### Prerequisites

- Node.js 18+ and `pnpm`
- Python 3.9+ 
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) URI
- A [Google Gemini API Key](https://aistudio.google.com/)

### 1. Backend Setup

Navigate to the `backend` directory:
```bash
cd backend
```

Create a virtual environment and install dependencies:
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Set up the environment variables:
Create a `.env` file in the `backend/` directory:
```env
MONGO_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/"
GEMINI_API_KEY="your_gemini_api_key_here"
```

*Note: Ensure the data file (`transactions.csv`) is present in the `backend/` directory.*

Start the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

Navigate to the project root directory:
```bash
# Install dependencies
pnpm install
```

Set up the frontend environment variables by creating a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the Next.js development server:
```bash
pnpm dev
```

The application will now be running on [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```text
├── backend/                   # Python FastAPI Backend
│   ├── main.py                # Server entry point
│   ├── routers/chat.py        # Controller for chat API endpoints & pipeline
│   ├── llm_service.py         # Google Gemini integration & prompt engineering
│   ├── data_engine.py         # DuckDB execution engine
│   ├── database.py            # MongoDB session persistence
│   └── transactions.csv       # Sourced dataset constraints
├── src/                       # Next.js Frontend
│   ├── app/                   # App Router pages (page.tsx)
│   ├── components/            # Reusable UI & DynamicRenderer components
│   └── lib/                   # API utilities (frontend_api.ts) & helpers
├── public/                    # Static assets
└── tailwind.config.ts         # Tailwind configuration
```

## License
This project is proprietary and intended for internal use at Finsight.AI.
