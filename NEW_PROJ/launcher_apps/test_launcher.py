import time
import webview
import signal
import sys
import threading
import subprocess
from GUI.app import run_flask

# ── Config ────────────────────────────────────────────────────────────────────
PI_HOST     = "pi@192.168.1.226"
PI_SCRIPT   = "~/Downloads/myfile.py"
LOCAL_URL   = "http://127.0.0.1:5001/"
# ─────────────────────────────────────────────────────────────────────────────

terminal_proc = None

def open_ssh_terminal():
    """
    Opens a new macOS Terminal window that SSHs into the Pi and streams
    the output of myfile.py live.  The window stays open after the script
    finishes so you can read the last output.
    """
    ssh_cmd = f"ssh -t {PI_HOST} 'python3 {PI_SCRIPT}'"

    # AppleScript: open a fresh Terminal tab/window running the ssh command
    applescript = f"""
    tell application "Terminal"
        activate
        do script "{ssh_cmd}"
    end tell
    """
    subprocess.Popen(["osascript", "-e", applescript])
    print(" SSH terminal window opened.")


def cleanup(sig, frame):
    print("\n[Shutting Down] Cleaning up...")
    # Ask the Pi to kill the script if still running
    try:
        subprocess.run(
            ["ssh", PI_HOST, f"pkill -f {PI_SCRIPT}"],
            timeout=5
        )
    except Exception:
        pass
    print("Cleanup complete.")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)


def main():
    # Open SSH terminal window (Pi output streams here)
    print(f"Opening SSH terminal → {PI_HOST} : {PI_SCRIPT}")
    open_ssh_terminal()

    # Start local Flask server in a background thread
    print("Starting local Flask GUI...")
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()

    # Give Flask a moment to bind
    time.sleep(2)

    # Open the web-app in a native webview window
    print(f"Opening webview → {LOCAL_URL}")
    window = webview.create_window(
        "ChessApp",
        LOCAL_URL,
        width=1024,
        height=768,
        resizable=True,
    )
    webview.start()   # blocks until the window is closed


if __name__ == "__main__":
    main()
