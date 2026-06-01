import subprocess
import json

ssh_cmd = [
    "ssh", 
    "-i", "C:/Users/pablo/.ssh/id_ed25519", 
    "root@167.172.115.154", 
    "docker logs --tail 100 appgynsys-backend-1 2>&1"
]
try:
    result = subprocess.run(ssh_cmd, capture_output=True, text=True, check=True, encoding='utf-8')
    print("OUTPUT:")
    print(result.stdout)
except subprocess.CalledProcessError as e:
    print(f"Error executing SSH command: {e.stderr}")
    print(f"STDOUT: {e.stdout}")
