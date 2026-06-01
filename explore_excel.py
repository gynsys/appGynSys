import sys

try:
    import openpyxl
except ImportError:
    print("openpyxl not installed. Please install it.")
    sys.exit(1)

file_path = "app diseño de mezclas.xlsx"

try:
    wb = openpyxl.load_workbook(file_path, data_only=False)
    print("Sheets in the workbook:")
    for sheet_name in wb.sheetnames:
        print(f" - {sheet_name}")
except Exception as e:
    print(f"Error reading file: {e}")
