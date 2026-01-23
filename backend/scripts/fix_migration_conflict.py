import os
import glob

# Path to versions dir - assuming running from backend dir
versions_dir = os.path.join("alembic", "versions")

# Find the specific migration file
search_pattern = os.path.join(versions_dir, "f228bcf6d2e7*.py")
files = glob.glob(search_pattern)

if not files:
    print(f"Migration file not found matching {search_pattern}")
    exit(1)

file_path = files[0]
print(f"Modifying {file_path}...")

with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
changes_made = False
for line in lines:
    # Comment out conflicting column additions
    if ("patient_dni" in line or "patient_age" in line) and "op.add_column" in line:
        print(f"Commenting out ADD COLUMN conflict: {line.strip()}")
        new_lines.append(f"# {line}") 
        changes_made = True
    # Also comment out drop column lines to be safe if downgrading? 
    # Usually Conflicts happen on UPGRADE (add_column).
    # Let's simple check for the keywords in op.add_column
    else:
        new_lines.append(line)

if changes_made:
    with open(file_path, "w") as f:
        f.writelines(new_lines)
    print("File updated successfully. Conflicts removed.")
else:
    print("No conflicting column operations found (or already fixed).")
