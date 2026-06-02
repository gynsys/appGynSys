import os
import shutil

src_frontend_arko = r"C:\Users\pablo\Documents\appgynsys\frontend\src\modules\arko360"
dst_admin_src = r"C:\Users\pablo\Documents\arko360_platform\admin\src"

os.makedirs(dst_admin_src, exist_ok=True)

# We want to move everything inside appgynsys/frontend/src/modules/arko360 to arko360_platform/admin/src
if os.path.exists(src_frontend_arko):
    for item in os.listdir(src_frontend_arko):
        s = os.path.join(src_frontend_arko, item)
        d = os.path.join(dst_admin_src, item)
        if os.path.isdir(s):
            shutil.copytree(s, d, dirs_exist_ok=True)
        else:
            shutil.copy2(s, d)
    print("Admin frontend extracted.")
else:
    print("Source admin directory not found.")
