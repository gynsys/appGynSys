import re
import os

file_path = r'c:\Users\pablo\Documents\appgynsys\backend\app\seeds\notification_rules.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

greeting = "👋 Hola! {patient_name}.\\n\\n"

def add_greeting(match):
    prefix = match.group(1) # "message_template": "
    original_text = match.group(2)
    suffix = match.group(3) # "
    
    if "👋 Hola!" in original_text:
        return match.group(0) # Already has it
    
    return f'{prefix}{greeting}{original_text}{suffix}'

# Update message_template and message_text_template
# Targeting lines with "message_template": "..." or "message_text_template": "..."
# We only want to target those in standard_rules.
# A safe way is to find entries between { and } that have "notification_type": "day_" or "notification_type": "prenatal_"
# But for simplicity, we'll target the whole file and skip if already present.

# Categories to target: day_ (menstrual), prenatal_
pattern = r'("(?:message_template|message_text_template)":\s*")((?:(?!"👋 Hola!).)+?)(")'

new_content = re.sub(pattern, add_greeting, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated notification_rules.py seed file.")
