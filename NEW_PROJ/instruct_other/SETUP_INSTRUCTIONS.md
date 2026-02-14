# AI Chess Setup Instructions

This document explains how to set up and run the AI Chess system with communication between a laptop and Raspberry Pi.

## System Architecture

- **Laptop**: Runs the web GUI (Flask app) on port 5001
- **Raspberry Pi**: Runs the chess engine server on port 5002
- **Communication**: HTTP API calls between laptop and Pi

## Prerequisites

### On the Laptop:
- Python 3.7+
- Flask
- requests library

### On the Raspberry Pi:
- Python 3.7+
- Stockfish chess engine
- chess library
- Flask

## Installation

### 1. Install Stockfish on Raspberry Pi

```bash
# On Raspberry Pi
sudo apt update
sudo apt install stockfish
```

### 2. Install Python Dependencies

#### On Laptop:
```bash
cd /path/to/AI_Chess_Senior_Design/GUI
pip install flask requests
```

#### On Raspberry Pi:
```bash
cd /path/to/AI_Chess_Senior_Design/Board_apps
pip install flask chess chess-engine
```

## Configuration

### 1. Set Raspberry Pi IP Address

Edit `GUI/config.py` and change the `PI_IP` to your Raspberry Pi's actual IP address:

```python
PI_IP = "192.168.1.100"  # Change this to your Pi's IP address
```

### 2. Verify Stockfish Path

The Pi server expects Stockfish at `/usr/games/stockfish`. If it's installed elsewhere, edit `Board_apps/pi_chess_server.py`:

```python
engine = chess.engine.SimpleEngine.popen_uci("/path/to/your/stockfish")
```

## Running the System

### 1. Start the Raspberry Pi Server

On the Raspberry Pi:
```bash
cd /path/to/AI_Chess_Senior_Design/Board_apps
python3 pi_chess_server.py
```

You should see:
```
Starting Raspberry Pi Chess Server...
Chess engine initialized successfully
Server ready!
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5002
 * Running on http://[your-pi-ip]:5002
```

### 2. Start the Laptop GUI

On the laptop:
```bash
cd /path/to/AI_Chess_Senior_Design/GUI
python3 app.py
```

You should see:
```
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5001
 * Running on http://[your-laptop-ip]:5001
```

### 3. Access the Web Interface

Open your web browser and go to:
```
http://localhost:5001
```

## Usage

1. **Connection Status**: The interface will show 🟢 when connected to the Pi, 🔴 when disconnected
2. **Making Moves**: Click on a piece, then click on the destination square
3. **Engine Response**: After your move, the engine will automatically make its move
4. **Game Controls**: Use pause/play, navigation, and reset buttons as needed

## Troubleshooting

### Connection Issues

1. **Check IP Address**: Ensure the Pi's IP in `config.py` is correct
2. **Check Firewall**: Make sure ports 5001 and 5002 are open
3. **Check Network**: Ensure both devices are on the same network

### Engine Issues

1. **Stockfish Not Found**: Verify Stockfish is installed and path is correct
2. **Engine Errors**: Check the Pi server console for error messages
3. **Slow Responses**: Increase timeout values in `config.py`

### Common Error Messages

- `🔴 Not connected to Raspberry Pi`: Check Pi server is running and IP is correct
- `Connection error`: Network connectivity issue
- `Engine error`: Chess engine problem on the Pi
- `Invalid move`: Move is not legal according to chess rules

## API Endpoints

### Laptop Server (Port 5001)
- `GET /` - Web interface
- `POST /api/move` - Send move to Pi
- `POST /api/engine-move` - Get engine move
- `GET /api/pi-status` - Check Pi connection
- `POST /api/game-control` - Send control commands

### Pi Server (Port 5002)
- `GET /api/status` - Server status
- `POST /api/move` - Process human move
- `POST /api/engine-move` - Get engine move
- `GET /api/board-state` - Get current board state
- `POST /api/game-control` - Handle game controls

## Development Notes

- The system uses HTTP for communication (not WebSockets)
- Move validation happens on the Pi side
- Board state is maintained on the Pi
- The laptop GUI is purely for display and user interaction
- Connection is checked every 10 seconds automatically


