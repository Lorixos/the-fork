import os
from google.cloud import bigquery

# Set Google Application Credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/lorik/.gemini/antigravity/profile_configs/Dept/service-account.json"
PROJECT_ID = "byte-data-management"
DATASET_ID = "dashboard_backend"
TABLE_NAME = f"{PROJECT_ID}.{DATASET_ID}.the_fork_campaign_budgets"

def main():
    print(f"Initializing BigQuery client for project '{PROJECT_ID}'...")
    client = bigquery.Client(project=PROJECT_ID)

    # Define schema
    schema = [
        bigquery.SchemaField("campaign_name", "STRING", mode="REQUIRED", description="Name of the campaign"),
        bigquery.SchemaField("platform", "STRING", mode="REQUIRED", description="Ad platform (e.g. meta, tiktok)"),
        bigquery.SchemaField("budget", "FLOAT", mode="REQUIRED", description="Campaign budget value"),
        bigquery.SchemaField("updated_at", "TIMESTAMP", mode="REQUIRED", description="Time when the budget was updated"),
        bigquery.SchemaField("updated_by", "STRING", mode="NULLABLE", description="Identifies who updated the budget"),
    ]

    table = bigquery.Table(TABLE_NAME, schema=schema)
    print(f"Creating table '{TABLE_NAME}' in BigQuery...")
    try:
        table = client.create_table(table, exists_ok=True)
        print(f"SUCCESS: Table '{table.project}.{table.dataset_id}.{table.table_id}' created or already exists.")
    except Exception as e:
        print(f"FAILURE: Error creating table: {str(e)}")

if __name__ == "__main__":
    main()
