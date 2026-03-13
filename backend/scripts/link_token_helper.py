import argparse
import subprocess
import json

def run_psql(command: str):
    """Ejecuta un comando SQL dentro del contenedor de la base de datos."""
    ssh_cmd = f"docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \"{command}\""
    # Aquí usaríamos el ssh_runner.py si estuviéramos en entorno local, 
    # pero este script está diseñado para ser usado vía CLI.
    print(f"Ejecutando: {ssh_cmd}")
    try:
        # En el entorno del usuario, esto debería ejecutarse vía el runner o directo si tiene acceso.
        # Para esta implementación, generamos el comando final.
        return ssh_cmd
    except Exception as e:
        return str(e)

def main():
    parser = argparse.ArgumentParser(description="Vincular tokens de push manualmente.")
    parser.add_argument("--type", choices=["doctor", "user"], required=True, help="Tipo de perfil")
    parser.add_argument("--id", required=True, help="Slug del doctor o Email del usuario")
    parser.add_argument("--token", required=True, help="Token FCM/Capacitor")

    args = parser.parse_args()

    if args.type == "doctor":
        sql = f"INSERT INTO push_subscriptions (doctor_id, token, updated_at) SELECT id, '{args.token}', NOW() FROM doctors WHERE slug_url = '{args.id}' ON CONFLICT (token) DO UPDATE SET doctor_id = EXCLUDED.doctor_id, updated_at = EXCLUDED.updated_at;"
    else:
        sql = f"INSERT INTO push_subscriptions (user_id, token, updated_at) SELECT id, '{args.token}', NOW() FROM cycle_users WHERE email = '{args.id}' ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, updated_at = EXCLUDED.updated_at;"

    cmd = f"python ssh_runner.py \"docker exec appgynsys-db-1 psql -U postgres -d gynsys -c \\\"{sql}\\\"\""
    
    print("\n" + "="*60)
    print("COPIE Y PEGUE ESTE COMANDO PARA VINCULAR EL TOKEN:")
    print("="*60)
    print(cmd)
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
