import re

input_path = r'c:\Users\pablo\Documents\appgynsys\frontend\src\features\preconsulta\data\backup_preconsulta_ginecologia.txt'

try:
    with open(input_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Regex to capture "Number. " at start of line
    # Using capturing group to keep the delimiter
    chunks = re.split(r'(^\d+\.\s)', text, flags=re.MULTILINE)
    
    # chunks[0] is usually empty string before first match
    new_parts = [chunks[0]]
    
    # Iterate over pairs (Delimiter, Content)
    # i=1 is delimiter, i=2 is content
    current_new_number = 1
    
    # Check if we have odd number of splits (pre-split + N * (delim+content))
    # len should be 1 + 2*N
    
    num_questions = (len(chunks) - 1) // 2
    print(f"Found {num_questions} questions.")

    for i in range(num_questions):
        idx_marker = 1 + i*2
        idx_content = 1 + i*2 + 1
        
        # Original Question Number (logical index is i+1)
        original_idx = i + 1
        
        if original_idx <= 6:
            # Skip questions 1 to 6
            continue
            
        # Renumber
        marker = f"{current_new_number}. "
        content = chunks[idx_content]
        
        new_parts.append(marker)
        new_parts.append(content)
        current_new_number += 1

    final_text = "".join(new_parts)
    
    # Basic cleanup of extra newlines at start if any
    final_text = final_text.lstrip()

    with open(input_path, 'w', encoding='utf-8') as f:
        f.write(final_text)

    print(f"Successfully removed 6 questions and renumbered {current_new_number - 1} questions.")

except Exception as e:
    print(f"Error: {e}")
