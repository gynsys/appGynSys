import re

def parse_seeds():
    path = 'c:/Users/pablo/Documents/appgynsys/backend/app/seeds/notification_rules.py'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find blocks of rules
    # This is brittle but can give us a quick list
    rule_blocks = re.findall(r'\{[^{}]*?"notification_type":\s*"(.*?)"[^{}]*?\}', content, re.DOTALL)
    
    discrepancies = []
    for block in re.finditer(r'\{[^{}]*?"notification_type":\s*"(.*?)"[^{}]*?\}', content, re.DOTALL):
        rule_text = block.group(0)
        rtype = block.group(1)
        
        msg_match = re.search(r'"message_template":\s*"(.*?)"', rule_text)
        txt_match = re.search(r'"message_text_template":\s*"(.*?)"', rule_text)
        
        if msg_match and txt_match:
            msg = msg_match.group(1)
            txt = txt_match.group(1)
            
            # If text is much shorter than message (ignoring formatting)
            clean_msg = re.sub(r'<[^>]+>', '', msg)
            if len(txt) < len(clean_msg) * 0.7:
                discrepancies.append((rtype, clean_msg, txt))
    
    for rtype, msg, txt in discrepancies:
        print(f"Rule: {rtype}")
        print(f"  HTML-ish: {msg[:100]}...")
        print(f"  Text: {txt}")
        print("-" * 20)

if __name__ == "__main__":
    parse_seeds()
