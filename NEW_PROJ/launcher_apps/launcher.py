# launcher.py
# This file Builds our Launchable chess app with 2 terminal opens

# Libraries
import paramiko
import time
import webview
import signal
import sys
import threading
import subprocess
from GUI.app import run_flask

# Configurations
PIS = [
    {
        "host": "pi5-chess.local",
        "username" : "pi",
        "path": "/home/pi/Downloads/PIGAME_TEST/raspberry_white_PI1",
        "server_script": "pi_chess_server_white.py",
        "label" : "Pi 1 - White"
    },
    {
        "host": "pi5-chess2.local",
        "username" : "pi",
        "path": "/home/pi/Downloads/PIGAME_TEST/raspberry_black_PI2"
        "server_script": "pi_chess_server_white.py",
        "label" : "Pi 2 - Black"
    }
]
LOCAL_APP_PATH = "/Users/dylanboles/Documents/GitHub_DylanJamie/AI_Chess_Final_Design/NEW_PROJ/GUI"
LOCAL_URL = "http://127.0.0.1:5001/"

# Store all the SSH Connections
ssh_connections = []

# Open up the SSH Connections
def open_ssh_connections_terminal(pi):
    """
    This Opens a mac Terminal that sshs to the pis and opens the chess app in the FOREGROUND so that the HTTP Output stream is live
    The Window title is the label so we can differ them
    """
    user_host = f"{pi['username']}@{pi['host']}"
    cmd = f"cd {pi['path']} && python3 {pi['server_script']}"
    ssh_cmd = f"ssh -t {user_host} '{remote_cmd}'"

    # This is the Apple script
    applescript = f"""
    tell application "Terminal"
    activate
    set newTab to do script "{ssh_cmd}"
    set custom title of newTab to "{pi['label']}"
    end tell
    """
    subprocess.Popen(["osascript", "-e", applescript])
    print(f"{pi['label']} ({pi['host']}) opened")

# Use paramko to kill all dead processes
def start_background_scripts(pi):
    """
    Uses paramiko to SSH in, kill any stale processes, then start the
    LED + LCD animation scripts silently in the background.
    The chess server itself is left for the terminal window (foreground).
    """
    
    print(f"Connecting to {pi['host']}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(pi['host'], username=pi['username'])
        
    # Kill any stale processes from a previous run
    ssh.exec_command("pkill -f LED_Program.py")
    ssh.exec_command("pkill -f lcd_animation.py")
    ssh.exec_command("pkill -f pi_chess_server_white.py")
    time.sleep(1)   # give pkill a moment to finish
        
    # Start LED + LCD silently in the background
    bg_cmd = (
        f"cd {pi['path']} && "
        f"nohup python3 LED_Program.py   > /dev/null 2>&1 & "
        f"nohup python3 lcd_animation.py > /dev/null 2>&1 &"
    )
    ssh.exec_command(f"bash -c '{bg_cmd}'")
        
    ssh_connections.append(ssh)
    
# Clean Up killing all the Programs on the PIs
def cleanup(sig, frame):
    print("\n[Shutting Down] Killing all local and remote processes...")    
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

# Main program
def main():
    # Start the background scripts
    #  open a dedicated Terminal window streaming the chess server output
    for pi in PIS:
        start_background_scripts(pi)
        open_ssh_terminal(pi)

    # Start local Flask server in a background daemon thread
    print("Starting local Flask GUI...")
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Give Flask a moment to bind before opening the webview
    time.sleep(2)

    # Open the web app in a native webview window (blocks until closed)
    print(f"Opening webview → {LOCAL_URL}")
    webview.create_window("ChessApp", LOCAL_URL, width=1024, height=768, resizable=True)
    webview.start()
    
if __name__ == "__main__":
    main()
