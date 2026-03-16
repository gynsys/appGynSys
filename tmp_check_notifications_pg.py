import psycopg2

def check_notifications():
    conn = psycopg2.connect("postgresql://postgres:gyn13409534@127.0.0.1:5433/gynsys")
    cur = conn.cursor()
    
    print("--- Searching for 'doctor_new_appointment' rules ---")
    query = """
    SELECT id, tenant_id, notification_type, title_template, message_template, is_edited, updated_at 
    FROM notification_rules 
    WHERE notification_type = 'doctor_new_appointment'
    """
    cur.execute(query)
    rows = cur.fetchall()
    
    for row in rows:
        print(f"ID: {row[0]}, Tenant: {row[1]}, Type: {row[2]}")
        print(f"Title: {row[3]}")
        print(f"Message: {row[4]}")
        print(f"Is Edited: {row[5]}, Updated At: {row[6]}")
        print("-" * 30)
        
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_notifications()
