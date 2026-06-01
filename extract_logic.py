import openpyxl
import json

file_path = "app diseño de mezclas.xlsx"
sheet_name = "DISEÑO IDEAL"

wb = openpyxl.load_workbook(file_path, data_only=False)
sheet = wb[sheet_name]

data = []
for row in sheet.iter_rows(min_row=1, max_row=150, min_col=1, max_col=15):
    row_data = []
    for cell in row:
        if cell.value is not None:
            # We want to know if it's a formula or a value
            cell_type = "formula" if str(cell.value).startswith('=') else "value"
            row_data.append({
                "ref": cell.coordinate,
                "val": str(cell.value),
                "type": cell_type
            })
    if row_data:
        data.append(row_data)

with open("logic_dump.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Dump completed to logic_dump.json")
