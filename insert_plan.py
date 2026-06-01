import subprocess

query = """
INSERT INTO plans (id, name, description, price, features, max_testimonials, max_gallery_images, max_faqs, custom_domain, analytics_dashboard, priority_support, is_active, max_staff_members)
VALUES (3, 'Plan Institucional', 'Para clinicas y centros medicos', 150.00, '{}', 20, 50, 20, true, true, true, true, 10);
"""

cmd = ["python", "ssh_runner.py", f"docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \"{query}\""]
subprocess.run(cmd)
