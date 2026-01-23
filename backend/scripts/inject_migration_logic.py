import os
import glob

versions_dir = os.path.join("alembic", "versions")
search_pattern = os.path.join(versions_dir, "f228bcf6d2e7*.py")
files = glob.glob(search_pattern)

if not files:
    print("Migration file not found.")
    exit(1)

file_path = files[0]
print(f"Injecting logic into {file_path}...")

with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
in_upgrade = False
injunction_done = False

for line in lines:
    new_lines.append(line)
    
    if "def upgrade() -> None:" in line:
        in_upgrade = True
    
    # Insert at the beginning of upgrade function body
    if in_upgrade and not injunction_done and "### commands auto generated" in line:
        # Check if already injected (strict check)
        already_has_doctor = any("op.add_column('preconsultation_questions', sa.Column('doctor_id'" in l for l in lines)
        if not already_has_doctor:
            print("Injecting doctor_id column operations...")
            new_lines.append("    # Manual injection of missing operations\n")
            new_lines.append("    op.add_column('preconsultation_questions', sa.Column('doctor_id', sa.Integer(), nullable=True))\n")
            new_lines.append("    op.create_foreign_key(None, 'preconsultation_questions', 'doctors', ['doctor_id'], ['id'])\n")
            injunction_done = True
        else:
            print("doctor_id column logic already present. Skipping injection.")
            injunction_done = True

with open(file_path, "w") as f:
    f.writelines(new_lines)

print("Migration file updated successfully.")
