import subprocess
import os

FILES = [
    "__init__.py",
    "base.py",
    "registry.py",
    "context.py",
    "sender.py",
    "processor.py",
    "health.py"
]

REMOTE_DIR = "/opt/appgynsys/backend/app/services/notifications"
LOCAL_DIR = "backend/app/services/notifications"
REMOTE_HOST = "root@167.172.115.154"

def deploy():
    try:
        # 1. Clean up and recreate directory
        print("Cleaning up remote directory...")
        # Use simple SSH command, avoid complex shell chaining in the subprocess list if possible
        subprocess.run(["ssh", REMOTE_HOST, f"rm -rf {REMOTE_DIR}"], check=True)
        subprocess.run(["ssh", REMOTE_HOST, f"mkdir -p {REMOTE_DIR}"], check=True)
        
        # 2. SCP each file
        for f in FILES:
            local_path = os.path.join(LOCAL_DIR, f)
            print(f"Transferring {f}...")
            # Use absolute path for local file for scp
            abs_local_path = os.path.abspath(local_path)
            subprocess.run(["scp", abs_local_path, f"{REMOTE_HOST}:{REMOTE_DIR}/{f}"], check=True)
        
        # 3. Restart services
        print("Restarting services...")
        subprocess.run(["ssh", REMOTE_HOST, "cd /opt/appgynsys && docker compose restart backend celery_worker celery_beat"], check=True)
        
        print("Deployment and restart successful!")
        
    except subprocess.CalledProcessError as e:
        print(f"Error during deployment: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    deploy()
