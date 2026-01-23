
import sys
import os
import json
from sqlalchemy import create_engine, text

# DB Connection
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gyn13409534@localhost:5432/gynsys")

def dump_schema():
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Query all columns from preconsultation_questions
            # We select specific columns commonly likely to exist. 
            # If 'options' or 'config' column exists, we want that.
            # Safe bet: SELECT * and map dynamically.
            sql = text("SELECT * FROM preconsultation_questions ORDER BY category, id")
            result = conn.execute(sql)
            
            # Get column names
            columns = result.keys()
            
            formatted_list = []
            for row in result:
                item = {}
                for col, val in zip(columns, row):
                    item[col] = val
                formatted_list.append(item)
            
            print(json.dumps(formatted_list, indent=2, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    dump_schema()
