import subprocess
import sys

def run_ssh(cmd):
    ssh_cmd = [
        "ssh", 
        "-i", "C:/Users/pablo/.ssh/id_ed25519", 
        "root@167.172.115.154", 
        cmd
    ]
    try:
        result = subprocess.run(ssh_cmd, capture_output=True, text=True, check=True)
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error: {e.stderr}")
        sys.exit(1)

if __name__ == "__main__":
    run_ssh(sys.argv[1])
