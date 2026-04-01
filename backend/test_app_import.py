try:
    from app.main import app
    print("IMPORT_SUCCESSFUL")
except Exception as e:
    import traceback
    traceback.print_exc()
