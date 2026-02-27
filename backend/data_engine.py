import duckdb

# ──────────────────────────────────────────────
# DuckDB in-memory engine
# ──────────────────────────────────────────────

# Persistent in-memory connection (lives for the process lifetime)
conn = duckdb.connect(":memory:")

# Load the CSV as a queryable view on import
conn.execute(
    "CREATE VIEW transactions AS SELECT * FROM read_csv_auto('transactions.csv')"
)
print("✅  DuckDB: 'transactions' view created from transactions.csv")


def execute_query(sql_query: str) -> list[dict]:
    """
    Execute a read-only SQL query against the transactions view
    and return the result set as a list of flat dictionaries.

    Raises an Exception with a descriptive message if the query fails
    (this is intentional – the self-healing loop catches and retries).
    """
    try:
        result = conn.execute(sql_query)
        columns = [desc[0] for desc in result.description]
        rows = result.fetchall()
        return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        raise Exception(f"DuckDB execution error: {str(e)}")
