# launcher_windows.py
# This file builds our Launchable chess app with 2 terminal opens
# Windows-compatible version of launcher.py

# Libraries
import paramiko
import time
import webview
import signal
import sys
import threading
import subprocess
import platform
import atexit
from pathlib import Path
from GUI.app import run_flask

# Import the keygen
import launcher_apps.keygen as kg
keypath = Path(kg.create_private_key())

# Configurations
PIS = [
    {
        "username": "pi",
        "host": "192.168.10.2",
        "path": "/home/pi/Downloads/PIGAME_TEST/raspberry_white_PI1",
        "label": "Pi 1 - White"
    },
    {
        "username": "pi",
        "host": "192.168.10.3",
        "path": "/home/pi/Downloads/PIGAME_TEST/raspberry_black_PI2",
        "label": "Pi 2 - Black"
    }
]

LOCAL_APP_PATH = str(Path(__file__).parent / "GUI")
LOCAL_URL = "http://127.0.0.1:5001/"

# Store all the SSH Connections
ssh_connections = []


def open_ssh_connections_terminal(pi):
    """
    Opens a Windows CMD window that SSHs to the Pi and runs the chess app
    in the FOREGROUND so that the HTTP output stream is live.
    The window title is the label so we can distinguish them.
    """
    user_host = f"{pi['username']}@{pi['host']}"
    cmd = f"cd {pi['path']} && ./pi_start.sh"
    # Use forward slashes in the keypath for SSH on Windows (OpenSSH handles it)
    keypath_str = str(keypath).replace("\\", "/")
    ssh_cmd = f'ssh -i "{keypath_str}" -t {user_host} "{cmd}"'

    # Opens a new titled CMD window; /k keeps it open after the command ends
    subprocess.Popen(
        f'start "{pi["label"]}" cmd /k {ssh_cmd}',
        shell=True
    )
    print(f"{pi['label']} ({pi['host']}) opened")


def cleanup(sig=None, frame=None):
    """Clean up: kill all remote processes and close SSH connections."""
    print("\n[Shutting Down] Killing all local and remote processes...")
    for ssh in ssh_connections:
        try:
            ssh.exec_command("pkill python")
            ssh.exec_command("pkill -f LED_Program.py")
            ssh.exec_command("pkill -f lcd_animation.py")
            ssh.exec_command("pkill -f pi_chess_server_white.py")
            ssh.close()
        except Exception as e:
            print(f"[Cleanup Warning] {e}")
    print("Cleanup complete.")
    sys.exit(0)


# Register cleanup on both SIGINT (Ctrl+C) and normal exit
signal.signal(signal.SIGINT, cleanup)
atexit.register(cleanup)


def main():
    # Open a dedicated CMD window streaming the chess server output for each Pi
    for pi in PIS:
        open_ssh_connections_terminal(pi)

    # Start local Flask server in a background daemon thread
    print("Starting local Flask GUI...")
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Give Flask a moment to bind before opening the webview
    time.sleep(2)

    # Open the web app in a native webview window (blocks until closed)
    # Requires Microsoft WebView2 Runtime to be installed on the target machine:
    # https://developer.microsoft.com/en-us/microsoft-edge/webview2/
    print(f"Opening webview -> {LOCAL_URL}")
    webview.create_window(
        "ChessApp",
        LOCAL_URL,
        width=1400,
        height=900,
        x=0,
        y=0,
        resizable=True
    )
    webview.start()


if __name__ == "__main__":
    main()
