
import os

file_path = 'frontend/src/modules/blog/pages/social-generator/index.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

open_braces = content.count('{')
close_braces = content.count('}')
open_parens = content.count('(')
close_parens = content.count(')')

print(f"Braces: {open_braces} open, {close_braces} close (Diff: {open_braces - close_braces})")
print(f"Parens: {open_parens} open, {close_parens} close (Diff: {open_parens - close_parens})")
