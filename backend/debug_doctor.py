import sqlite3

db_path = 'gynsys.db'
conn = sqlite3.connect(db_path)
c = conn.cursor()

slug = 'mariel-herrera'
print(f"Provisioning doctor: {slug}")

# Check if exists
row = c.execute("SELECT id FROM doctors WHERE slug_url = ?", (slug,)).fetchone()
if not row:
    print("Doctor not found. Creating...")
    # Doctor was created last time but script failed later. Check ID 4 if validation error?
    # Actually if script failed, transaction might not have committed?
    # Wait, I didn't verify commit happens on error. 
    # Let's assume it might exist now or not.
    try:
        c.execute("""
            INSERT INTO doctors (
                nombre_completo, email, slug_url, password_hash, 
                is_active, is_verified, status, role
            )
            VALUES (
                'Dra. Mariel Herrera', 'mariel@example.com', ?, 'hash', 
                1, 1, 'active', 'doctor'
            )
        """, (slug,))
        doc_id = c.lastrowid
        print(f"Created doctor ID: {doc_id}")
    except Exception as e:
        print(f"Error creating doctor (might exist?): {e}")
        # Try finding it again
        row = c.execute("SELECT id FROM doctors WHERE slug_url = ?", (slug,)).fetchone()
        if row: doc_id = row[0]
        else: exit(1)

else:
    doc_id = row[0]
    print(f"Doctor exists. ID: {doc_id}")

# Check module
mod_row = c.execute("SELECT id FROM modules WHERE code = 'cycle_predictor'").fetchone()
if not mod_row:
     print("Creating cycle_predictor module...")
     try:
        c.execute("INSERT INTO modules (code, name, description) VALUES ('cycle_predictor', 'Predictor de Ciclos', 'Seguimiento menstrual')")
        mod_id = c.lastrowid
     except Exception as e:
        # Maybe description doesn't exist? Try min
        print(f"Retrying module create (min): {e}")
        # Assuming last run created it?
        mod_row = c.execute("SELECT id FROM modules WHERE code = 'cycle_predictor'").fetchone()
        if mod_row: mod_id = mod_row[0]
        else: 
            c.execute("INSERT INTO modules (code, name) VALUES ('cycle_predictor', 'Predictor de Ciclos')")
            mod_id = c.lastrowid
else:
     mod_id = mod_row[0]

# Check link
link_row = c.execute("SELECT * FROM tenant_modules WHERE tenant_id = ? AND module_id = ?", (doc_id, mod_id)).fetchone()
if not link_row:
    print("Linking module to doctor...")
    try:
        # Try without is_active
        c.execute("INSERT INTO tenant_modules (tenant_id, module_id) VALUES (?, ?)", (doc_id, mod_id))
        print("Linked.")
    except Exception as e:
        print(f"Error linking: {e}")
else:
    print("Module already linked.")

conn.commit()
conn.close()
