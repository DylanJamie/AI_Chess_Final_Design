"""
Global variables for the app.py web application
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/config.py

Standalone version - no Raspberry Pi connection needed

"""
# Flask app settings
FLASK_HOST = "0.0.0.0"
FLASK_PORT = 5001
FLASK_DEBUG = True

# Raspberry Pi Configuration
# Set these to your actual Pi IP addresses
PI_WHITE_IP = "192.168.10.2"  # IP of Pi playing white (CPU vs CPU mode)
PI_BLACK_IP = "192.168.10.3"  # IP of Pi playing black (both modes)
PI_PORT = 5002  # Port where pi_chess_server.py runs

# Timeouts for Pi communication
PI_TIMEOUT = 30  # Seconds to wait for Pi response (increased for reliability)
ENGINE_TIMEOUT = 45  # Seconds to wait for engine response (increased for long calculations)

# Usr Vs CPU || CPU vs CPU
# Game mode settings
GAME_MODES = {
    "user_vs_cpu": "user_vs_cpu",
    "cpu_vs_cpu": "cpu_vs_cpu"
}

# Default ELO ratings
DEFAULT_WHITE_ELO = 1350
DEFAULT_BLACK_ELO = 1350

# Chess engine settings
ENGINE_SKILL_LEVEL = 10  # Range: 0 (weakest) to 20 (strongest)
ENGINE_ELO_RATING = 1350  # Target playing strength
ENGINE_THINK_TIME = 2.0  # Seconds for engine to think

# Game settings
ENGINE_TIMEOUT = 15  # Seconds to wait for engine response
