import os
import glob

versions_dir = os.path.join("alembic", "versions")
search_pattern = os.path.join(versions_dir, "f228bcf6d2e7*.py")
files = glob.glob(search_pattern)

if files:
    with open(files[0], 'r') as f:
        print(f.read())
else:
    print("Migration file not found.")
