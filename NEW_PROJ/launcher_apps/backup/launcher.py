# This is the orignial Launcher with NO Terminals Opening
import paramiko
import time
import webview
import signal
import sys
import threading
from GUI.app import run_flask

# Updated Configuration based on your exact paths
PIS = [
    {
        "host": "192.168.10.2", 
        "path": "/home/pi/Downloads/PIGAME_TEST/raspberry_white_PI1"
    },
    {
        "host": "192.168.10.3", 
        "path": "/home/pi/Downloads/PIGAME_TEST/raspberry_black_PI2"
    }
]
LOCAL_APP_PATH = "/Users/dylanboles/Documents/GitHub_DylanJamie/AI_Chess_Final_Design/NEW_PROJ/GUI"
LOCAL_URL = "http://127.0.0.1:5001/"

processes = []
ssh_connections = []

def cleanup(sig, frame):
    print("\n[Shutting Down] Killing all local and remote processes...")
    for p in processes:
        p.terminate()
    
    for ssh in ssh_connections:
        try:
            # Targeted kill
            ssh.exec_command("pkill -f LED_Program.py")
            ssh.exec_command("pkill -f lcd_animation.py")
            ssh.exec_command("pkill -f pi_chess_server_white.py")
            ssh.close()
        except:
            pass
    print("Cleanup complete.")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)

def wait_for_server(url, timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        try:
            requests.get(url)
            return True
        except:
            time.sleep(0.5)
    return False

def main():
    for pi in PIS:
        try:
            print(f"Connecting to {pi['host']}...")
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Note: This assumes you have SSH Keys set up. 
            # If not, add password='yourpassword' to ssh.connect
            key_path = os.path.expanduser("~/.ssh/chess-key")
            ssh.connect(pi['host'], username='pi', key_filename=key_path)
            
            # Kill any old instances first
            ssh.exec_command("pkill -f LED_Program.py")
            ssh.exec_command("pkill -f lcd_animation.py")
            ssh.exec_command("pkill -f pi_chess_server_white.py")
            
            # The "One-Liner" Command:
            # 1. Source the env using absolute path
            # 2. CD into the folder
            # 3. Run the python script with nohup (background)
            cmd = f"cd {pi['path']} && nohup ./pi_start.sh > /dev/null 2>&1 &"
            
            # We use invoke_shell or exec_command with a bash prefix to ensure 'source' works
            ssh.exec_command(f"bash -c '{cmd}'")
            
            ssh_connections.append(ssh)
            print(f" Started server on {pi['host']}")
        except Exception as e:
            print(f" Failed to connect to {pi['host']}: {e}")

    # Start Local App
    print("Starting local GUI...")
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    wait_for_server(LOCAL_URL)    
    webbrowser = webview.create_window("ChessApp", "http://127.0.0.1:5001/")
    
    # Start the webpage
    webview.start()
    
if __name__ == "__main__":
    main()
