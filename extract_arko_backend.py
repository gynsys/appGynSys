import os
import shutil

src_backend = r"C:\Users\pablo\Documents\appgynsys\backend"
dst_backend = r"C:\Users\pablo\Documents\arko360_platform\backend"

# Ensure destination exists
os.makedirs(dst_backend, exist_ok=True)

# Copy requirements.txt
shutil.copy2(os.path.join(src_backend, "requirements.txt"), dst_backend)

# Create app directory
app_dst = os.path.join(dst_backend, "app")
os.makedirs(app_dst, exist_ok=True)

# Folders to copy (we'll prune them later)
folders_to_copy = ["api", "core", "db", "schemas"]

for folder in folders_to_copy:
    src_folder = os.path.join(src_backend, "app", folder)
    dst_folder = os.path.join(app_dst, folder)
    if os.path.exists(src_folder):
        shutil.copytree(src_folder, dst_folder, dirs_exist_ok=True)

# Copy main files
main_src = os.path.join(src_backend, "app", "arko_main.py")
if os.path.exists(main_src):
    shutil.copy2(main_src, os.path.join(app_dst, "main.py"))
    
# Copy initialization scripts
shutil.copy2(os.path.join(src_backend, "init_arko_db.py"), os.path.join(dst_backend, "init_db.py"))
shutil.copy2(os.path.join(src_backend, "create_arko_db.py"), os.path.join(dst_backend, "create_db.py"))

print("Backend base extraction complete.")
