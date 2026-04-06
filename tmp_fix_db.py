import os
import subprocess
import sys

# SQL commands to fix the DB
commands = [
    "ALTER TABLE notification_rules ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);",
    "ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);",
    "ALTER TABLE pending_notifications ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);",
    "CREATE INDEX IF NOT EXISTS ix_notification_logs_recipient_email_direct ON notification_logs (recipient_email_direct);",
    "CREATE INDEX IF NOT EXISTS ix_pending_notifications_recipient_email_direct ON pending_notifications (recipient_email_direct);",
    "UPDATE doctors SET card_shadow = 'true' WHERE card_shadow NOT IN ('true', 'false');",
    "UPDATE doctors SET container_shadow = 'true' WHERE container_shadow NOT IN ('true', 'false');",
    "ALTER TABLE doctors ALTER COLUMN card_shadow TYPE BOOLEAN USING (card_shadow::boolean);",
    "ALTER TABLE doctors ALTER COLUMN container_shadow TYPE BOOLEAN USING (container_shadow::boolean);"
]

def run_sql(cmd):
    full_cmd = f"docker exec -e PGPASSWORD=gyn13409534 appgynsys-db-1 psql -U postgres -d gynsys -c \"{cmd}\""
    print(f"Running: {full_cmd}")
    # We use subprocess to call ssh_runner.py with the command
    result = subprocess.run(["python", "C:\\Users\\pablo\\Documents\\appgynsys\\ssh_runner.py", full_cmd], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(f"Error: {result.stderr}")

for cmd in commands:
    run_sql(cmd)
