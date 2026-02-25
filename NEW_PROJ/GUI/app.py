"""
Web Application Server for AI Chess GUI (API Endpoints for Flask)
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/app.py

Standalone version - works without Raspberry Pi connection
Uses Stockfish engine locally

import system modules & Libraries
"""
from flask import Flask, render_template, jsonify, request
import chess
import chess.engine
import json
import os
import requests
from requests.adapters import HTTPAdapter
try:
    from urllib3.util.retry import Retry
except ImportError:
    from requests.packages.urllib3.util.retry import Retry
import time
try:
    from GUI.config import (
        FLASK_HOST, FLASK_PORT, FLASK_DEBUG, 
        PI_WHITE_IP, PI_BLACK_IP, PI_PORT, PI_TIMEOUT,
        GAME_MODES, DEFAULT_WHITE_ELO, DEFAULT_BLACK_ELO
    )
except:
    from config import (
        FLASK_HOST, FLASK_PORT, FLASK_DEBUG, 
        PI_WHITE_IP, PI_BLACK_IP, PI_PORT, PI_TIMEOUT,
        GAME_MODES, DEFAULT_WHITE_ELO, DEFAULT_BLACK_ELO
    )

print(f"DEBUG: PI_WHITE_IP = {PI_WHITE_IP}")
print(f"DEBUG: PI_BLACK_IP = {PI_BLACK_IP}")

""" Determin the root path """
app = Flask(__name__)

# Global game state
current_game_mode = None
white_elo = DEFAULT_WHITE_ELO
black_elo = DEFAULT_BLACK_ELO
white_nnue = False
black_nnue = False
white_nnue_model = 'carlsen'  # 'carlsen' or 'fischer'
black_nnue_model = 'carlsen'  # 'carlsen' or 'fischer'
game_active = False
current_player = 'white'

# Pi connection status
pi_white_connected = False
pi_black_connected = False

def run_flask():
    ''' function to call flask'''
    print(f"Starting Flask on {FLASK_HOST}:{FLASK_PORT}")
    app.run(debug=False, host=FLASK_HOST, port=FLASK_PORT, use_reloader=False)

# Create persistent HTTP sessions with connection pooling and retry logic
def create_pi_session():
    """Create a requests session with connection pooling, keep-alive, and retry logic"""
    session = requests.Session()
    
    # Configure retry strategy with exponential backoff
    retry_strategy = Retry(
        total=3,  # Total number of retries
        backoff_factor=1,  # Wait 1s, 2s, 4s between retries
        status_forcelist=[500, 502, 503, 504],  # Retry on these HTTP status codes
        allowed_methods=["GET", "POST"]  # Only retry safe methods
    )
    
    # Configure HTTP adapter with connection pooling
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=2,  # One pool per Pi (white and black)
        pool_maxsize=10,  # Max connections per pool
        pool_block=False  # Don't block if pool is full
    )
    
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    # Set default headers for keep-alive
    session.headers.update({
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30, max=100'
    })
    
    return session

# Create sessions for each Pi
pi_white_session = create_pi_session()
pi_black_session = create_pi_session()

def get_pi_session(color):
    """Get the appropriate session for a Pi color"""
    return pi_white_session if color == 'white' else pi_black_session

def get_pi_url(color):
    """Get the appropriate Pi URL based on color"""
    if color == 'white':
        return f"http://{PI_WHITE_IP}:{PI_PORT}"
    else:
        return f"http://{PI_BLACK_IP}:{PI_PORT}"

def check_pi_connection(color, retries=2):
    """Check if a specific Pi is connected with retry logic"""
    session = get_pi_session(color)
    url = get_pi_url(color)
    
    for attempt in range(retries + 1):
        try:
            response = session.get(f"{url}/api/status", timeout=PI_TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                return data.get('engine_connected', False)
            elif attempt < retries:
                time.sleep(0.5 * (attempt + 1))  # Exponential backoff
                continue
            return False
        except requests.exceptions.ConnectionError as e:
            if attempt < retries:
                print(f"Connection error checking {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(0.5 * (attempt + 1))
                continue
            print(f"Connection error checking {color} Pi: {e}")
            return False
        except requests.exceptions.Timeout as e:
            if attempt < retries:
                print(f"Timeout checking {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(0.5 * (attempt + 1))
                continue
            print(f"Timeout error checking {color} Pi: {e}")
            return False
        except requests.exceptions.RequestException as e:
            print(f"Request error checking {color} Pi: {e}")
            return False
        except Exception as e:
            print(f"Unexpected error checking {color} Pi: {e}")
            return False
    return False

def initialize_pi_engine(color, elo, skill, use_nnue=False, nnue_model='carlsen', retries=3):
    """Initialize a Pi's engine with specific settings and retry logic
    
    Args:
        color: 'white' or 'black'
        elo: ELO rating
        skill: Skill level (0-20)
        use_nnue: Whether to use NNUE evaluation file
        nnue_model: NNUE model name ('carlsen' or 'fischer')
        retries: Number of retry attempts
    """
    session = get_pi_session(color)
    url = get_pi_url(color)
    
    payload = {"elo": elo, "skill": skill}
    if use_nnue:
        payload["use_nnue"] = True
        payload["nnue_model"] = nnue_model
    
    for attempt in range(retries + 1):
        try:
            if attempt == 0:
                print(f"Attempting to connect to {color} Pi at {url}...")
            else:
                print(f"Retrying connection to {color} Pi (attempt {attempt + 1}/{retries + 1})...")
            
            if use_nnue:
                print(f"  Using NNUE evaluation file ({nnue_model}) for {color} Pi")
            
            response = session.post(
                f"{url}/api/set-bot-difficulty",
                json=payload,
                timeout=PI_TIMEOUT * 2  # Longer timeout for initialization
            )
            
            if response.status_code == 200:
                print(f"{color.capitalize()} Pi engine initialized: ELO {elo}, Skill {skill}")
                return True
            else:
                print(f"Failed to initialize {color} Pi: HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"Error details: {error_data.get('message', 'No details')}")
                except:
                    print(f"Error response: {response.text}")
                
                if attempt < retries:
                    time.sleep(1 * (attempt + 1))
                    continue
                return False
                
        except requests.exceptions.ConnectionError as e:
            if attempt < retries:
                print(f"Connection error initializing {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(1 * (attempt + 1))
                continue
            print(f"Connection error initializing {color} Pi at {url}: {e}")
            print(f"Make sure the Pi is running pi_chess_server.py and is accessible at {url}")
            return False
        except requests.exceptions.Timeout as e:
            if attempt < retries:
                print(f"Timeout error initializing {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(1 * (attempt + 1))
                continue
            print(f"Timeout error initializing {color} Pi at {url}: {e}")
            return False
        except Exception as e:
            print(f"Error initializing {color} Pi: {e}")
            if attempt < retries:
                time.sleep(1 * (attempt + 1))
                continue
            return False
    
    return False

def send_move_to_pi(color, from_square, to_square, piece, retries=2):
    """Send a move to a specific Pi with retry logic"""
    session = get_pi_session(color)
    url = get_pi_url(color)
    move_data = {
        'from': from_square,
        'to': to_square,
        'piece': piece
    }
    
    for attempt in range(retries + 1):
        try:
            response = session.post(
                f"{url}/api/move",
                json=move_data,
                timeout=PI_TIMEOUT
            )
            return response.json()
        except requests.exceptions.ConnectionError as e:
            if attempt < retries:
                print(f"Connection error sending move to {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(0.5 * (attempt + 1))
                continue
            print(f"Error sending move to {color} Pi: {e}")
            return {'status': 'error', 'message': str(e)}
        except requests.exceptions.Timeout as e:
            if attempt < retries:
                print(f"Timeout sending move to {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(0.5 * (attempt + 1))
                continue
            print(f"Timeout error sending move to {color} Pi: {e}")
            return {'status': 'error', 'message': f'Timeout: {str(e)}'}
        except Exception as e:
            print(f"Error sending move to {color} Pi: {e}")
            if attempt < retries:
                time.sleep(0.5 * (attempt + 1))
                continue
            return {'status': 'error', 'message': str(e)}
    
    return {'status': 'error', 'message': 'Failed after retries'}

def get_engine_move_from_pi(color, game_speed=10, retries=2):
    """Get engine move from a specific Pi with retry logic and extended timeout"""
    session = get_pi_session(color)
    url = get_pi_url(color)
    
    # Use longer timeout for engine moves (they can take time to calculate)
    engine_timeout = max(PI_TIMEOUT * 3, 30)  # At least 30 seconds for engine moves
    
    for attempt in range(retries + 1):
        try:
            response = session.post(
                f"{url}/api/engine-move",
                json={'game_speed': game_speed},
                timeout=engine_timeout
            )
            return response.json()
        except requests.exceptions.ConnectionError as e:
            if attempt < retries:
                print(f"Connection error getting move from {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(1 * (attempt + 1))
                continue
            print(f"Error getting move from {color} Pi: {e}")
            return {'status': 'error', 'message': str(e)}
        except requests.exceptions.Timeout as e:
            if attempt < retries:
                print(f"Timeout getting move from {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(1 * (attempt + 1))
                continue
            print(f"Timeout error getting move from {color} Pi: {e}")
            return {'status': 'error', 'message': f'Timeout: Engine took too long to respond'}
        except Exception as e:
            print(f"Error getting move from {color} Pi: {e}")
            if attempt < retries:
                time.sleep(1 * (attempt + 1))
                continue
            return {'status': 'error', 'message': str(e)}
    
    return {'status': 'error', 'message': 'Failed after retries'}

def get_board_state_from_pi(color, retries=2):
    """Get board state from a specific Pi with retry logic"""
    session = get_pi_session(color)
    url = get_pi_url(color)
    
    for attempt in range(retries + 1):
        try:
            response = session.get(f"{url}/api/board-state", timeout=PI_TIMEOUT)
            return response.json()
        except requests.exceptions.ConnectionError as e:
            if attempt < retries:
                print(f"Connection error getting board state from {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(0.5 * (attempt + 1))
                continue
            print(f"Error getting board state from {color} Pi: {e}")
            return {'status': 'error', 'message': str(e)}
        except requests.exceptions.Timeout as e:
            if attempt < retries:
                print(f"Timeout getting board state from {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(0.5 * (attempt + 1))
                continue
            print(f"Timeout error getting board state from {color} Pi: {e}")
            return {'status': 'error', 'message': f'Timeout: {str(e)}'}
        except Exception as e:
            print(f"Error getting board state from {color} Pi: {e}")
            if attempt < retries:
                time.sleep(0.5 * (attempt + 1))
                continue
            return {'status': 'error', 'message': str(e)}
    
    return {'status': 'error', 'message': 'Failed after retries'}

def reset_pi(color, retries=2):
    """Reset a specific Pi's board with retry logic"""
    session = get_pi_session(color)
    url = get_pi_url(color)
    
    for attempt in range(retries + 1):
        try:
            response = session.post(
                f"{url}/api/game-control",
                json={'command': 'reset'},
                timeout=PI_TIMEOUT
            )
            return response.json()
        except requests.exceptions.ConnectionError as e:
            if attempt < retries:
                print(f"Connection error resetting {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(0.5 * (attempt + 1))
                continue
            print(f"Error resetting {color} Pi: {e}")
            return {'status': 'error', 'message': str(e)}
        except requests.exceptions.Timeout as e:
            if attempt < retries:
                print(f"Timeout resetting {color} Pi (attempt {attempt + 1}/{retries + 1}): {e}")
                time.sleep(0.5 * (attempt + 1))
                continue
            print(f"Timeout error resetting {color} Pi: {e}")
            return {'status': 'error', 'message': f'Timeout: {str(e)}'}
        except Exception as e:
            print(f"Error resetting {color} Pi: {e}")
            if attempt < retries:
                time.sleep(0.5 * (attempt + 1))
                continue
            return {'status': 'error', 'message': str(e)}
    
    return {'status': 'error', 'message': 'Failed after retries'}

@app.route('/')
def index():
    """Return the main page"""
    return render_template('index.html')

@app.route('/api/test')
def test_api():
    """Test the API"""
    return jsonify({
        'message': 'API is working!',
        'status': 'success',
        'chess': 'â™”â™•â™–â™—â™˜â™™'
    })

@app.route('/api/pi-status', methods=['GET'])
def check_pi_status():
    """Check connection status of both Pis"""
    global pi_white_connected, pi_black_connected
    
    pi_white_connected = check_pi_connection('white')
    pi_black_connected = check_pi_connection('black')
    
    status_msg = []
    if current_game_mode == GAME_MODES['cpu_vs_cpu']:
        if pi_white_connected and pi_black_connected:
            status_msg.append("Both Pis connected")
            status = 'connected'
        else:
            if not pi_white_connected:
                status_msg.append("White Pi disconnected")
            if not pi_black_connected:
                status_msg.append("Black Pi disconnected")
            status = 'partial'
    else:  # user_vs_cpu mode
        if pi_black_connected:
            status_msg.append("Black Pi connected")
            status = 'connected'
        else:
            status_msg.append("Black Pi disconnected")
            status = 'disconnected'
    
    return jsonify({
        'status': status,
        'message': ', '.join(status_msg),
        'white_connected': pi_white_connected,
        'black_connected': pi_black_connected,
        'game_mode': current_game_mode
    })

@app.route('/api/set-game-mode', methods=['POST'])
def set_game_mode():
    """Set game mode and initialize appropriate Pis"""
    global current_game_mode, white_elo, black_elo, white_nnue, black_nnue, white_nnue_model, black_nnue_model, current_player, game_active
    
    data = request.get_json()
    mode = data.get('mode')
    
    if mode not in GAME_MODES.values():
        return jsonify({"status": "error", "message": "Invalid mode"}), 400
    
    current_game_mode = mode
    white_elo = data.get("white_elo", DEFAULT_WHITE_ELO)
    black_elo = data.get("black_elo", DEFAULT_BLACK_ELO)
    white_nnue = data.get("white_nnue", False)
    black_nnue = data.get("black_nnue", False)
    white_nnue_model = data.get("white_nnue_model", "carlsen")
    black_nnue_model = data.get("black_nnue_model", "carlsen")
    current_player = 'white'
    game_active = True
    
    # Calculate skill level from ELO (approximation)
    def elo_to_skill(elo):
        # Map ELO to Stockfish skill level (0-20)
        if elo < 1350:
            return 0
        elif elo >= 2850:
            return 20
        else:
            return int((elo - 1350) / 75)
    
    white_skill = elo_to_skill(white_elo)
    black_skill = elo_to_skill(black_elo)
    
    print(f"\n{'='*60}")
    print(f"Setting up game mode: {mode}")
    print(f"White: ELO {white_elo}, Skill {white_skill}, NNUE: {white_nnue} ({white_nnue_model if white_nnue else 'N/A'})")
    print(f"Black: ELO {black_elo}, Skill {black_skill}, NNUE: {black_nnue} ({black_nnue_model if black_nnue else 'N/A'})")
    print(f"{'='*60}\n")
    
    # Initialize appropriate Pis based on mode
    success = True
    
    if mode == GAME_MODES['user_vs_cpu']:
        # Only need black Pi
        print(f"Initializing Black Pi at {PI_BLACK_IP}...")
        if not initialize_pi_engine('black', black_elo, black_skill, black_nnue, black_nnue_model):
            return jsonify({
                "status": "error",
                "message": "Failed to initialize Black Pi. Check connection."
            }), 500
        print("Black Pi initialized successfully")

        # Use default settings since it won't be calculating moves ###########################
        print("Initializing White Pi as visualizer...")
        initialize_pi_engine('white', white_elo, 10, False, 'carlsen')
        
    elif mode == GAME_MODES['cpu_vs_cpu']:
        # Need both Pis
        print(f"Initializing White Pi at {PI_WHITE_IP}...")
        if not initialize_pi_engine('white', white_elo, white_skill, white_nnue, white_nnue_model):
            return jsonify({
                "status": "error",
                "message": "Failed to initialize White Pi. Check connection."
            }), 500
        print("White Pi initialized successfully")
        
        print(f"Initializing Black Pi at {PI_BLACK_IP}...")
        if not initialize_pi_engine('black', black_elo, black_skill, black_nnue, black_nnue_model):
            return jsonify({
                "status": "error",
                "message": "Failed to initialize Black Pi. Check connection."
            }), 500
        print("Black Pi initialized successfully")
    
    # Get initial board state from black Pi (as reference)
    board_state_response = get_board_state_from_pi('black')
    board_state = board_state_response.get('board_state', {})
    
    print(f"\nGame mode setup complete!")
    print(f"Current player: {current_player}\n")
    
    return jsonify({
        "status": "success",
        "mode": mode,
        "white_elo": white_elo,
        "black_elo": black_elo,
        "board_state": board_state,
        "current_player": current_player
    })

@app.route('/api/move', methods=['POST'])
def handle_move():
    """Handle a move from the user (only in user_vs_cpu mode)"""
    global current_player
    
    if current_game_mode != GAME_MODES['user_vs_cpu']:
        return jsonify({
            'status': 'error',
            'message': 'User moves only allowed in user_vs_cpu mode'
        }), 400
    
    try:
        data = request.get_json()
        from_square = data.get('from')
        to_square = data.get('to')
        piece = data.get('piece')
        
        if not from_square or not to_square:
            return jsonify({
                'status': 'error',
                'message': 'Missing from or to square'
            }), 400

        # Send move to black Pi (it maintains the board state)
        result = send_move_to_pi('black', from_square, to_square, piece)

        ##########################################
        # NEW: Mirror move to White Pi for LEDs/LCD
        send_move_to_pi('white', from_square, to_square, piece)
        
        if result.get('status') == 'success' and result.get('move_accepted'):
            current_player = result.get('current_player', 'black')
            return jsonify(result)
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/board-state', methods=['GET'])
def get_board_state_endpoint():
    """Get current board state from appropriate Pi"""
    try:
        # Get board state from black Pi (it's always involved)
        result = get_board_state_from_pi('black')
        
        if result.get('status') == 'success':
            result['current_player'] = current_player
            result['game_mode'] = current_game_mode
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error getting board state: {str(e)}'
        }), 500

@app.route('/api/engine-move', methods=['POST'])
def get_engine_move_endpoint():
    """Get engine move from appropriate Pi"""
    global current_player
    
    try:
        data = request.get_json() or {}
        game_speed = data.get('game_speed', 10)
        
        # Determine which Pi to get move from
        if current_game_mode == GAME_MODES['user_vs_cpu']:
            # Always black Pi
            pi_color = 'black'
        elif current_game_mode == GAME_MODES['cpu_vs_cpu']:
            # Alternate based on current player
            pi_color = current_player
        else:
            return jsonify({
                'status': 'error',
                'message': 'No game mode set'
            }), 400
        
        print(f"\nRequesting move from {pi_color} Pi (current player: {current_player})")
        
        # Get move from appropriate Pi
        result = get_engine_move_from_pi(pi_color, game_speed)

        if result.get('status') == 'success':
            engine_move = result.get('engine_move')
            game_over = result.get('game_over') 
            wdl_data = result.get('wdl')

            # 1. Sync the move to the other Pi FIRST (even if it's game over)
            if engine_move and current_game_mode == GAME_MODES['cpu_vs_cpu']:
                # Your if/else block for colors
                if pi_color == 'white':
                    other_color = 'black'
                else:
                    other_color = 'white'
                
                print(f"Syncing move to {other_color} PI...")
                send_move_to_pi(
                    other_color,
                    engine_move.get('from'),
                    engine_move.get('to'),
                    engine_move.get('piece')
                )
            
            # NOW check for game over to return to the GUI
            if game_over:
                print(f"Game finished. Winner: {result.get('winner')}")
                return jsonify(result)
                
            # Handle continuing game
            current_player = result.get('current_player', 'white' if pi_color == 'black' else 'black')
            final_response = result
            final_response['current_player'] = current_player
            return jsonify(final_response)
        
        else:
            print("Warning: Pi returned success but engine_move is None and game_over is False")
                
            # Update current player (only really matters if game is continuing)
            current_player = result.get('current_player', 'white' if pi_color == 'black' else 'black')
            print(f"Move complete. New current player: {current_player}\n")

            final_response = result
            final_response['current_player'] = current_player

            return jsonify(final_response)
            
    except Exception as e:
        print(f"Engine move error: {e}")
        return jsonify({
            "status": "error",
            "message": f"Engine error: {str(e)}"
        }), 500

@app.route('/api/game-control', methods=['POST'])
def handle_game_control():
    """Handle game control commands"""
    global current_player, game_active, white_elo, black_elo, white_nnue, black_nnue, white_nnue_model, black_nnue_model
    
    try:
        data = request.get_json()
        command = data.get('command')
        
        if command == 'reset':
            print("\nReset request received - resetting and re-initializing Pis...")
            
            # Calculate skill levels from stored ELOs
            def elo_to_skill(elo):
                if elo < 1350:
                    return 0
                elif elo >= 2850:
                    return 20
                else:
                    return int((elo - 1350) / 75)
            
            white_skill = elo_to_skill(white_elo)
            black_skill = elo_to_skill(black_elo)
            
            # Reset and re-initialize appropriate Pis based on mode
            if current_game_mode == GAME_MODES['cpu_vs_cpu']:
                # Reset and re-initialize both Pis
                print(f"Re-initializing White Pi: ELO {white_elo}, NNUE {white_nnue} ({white_nnue_model if white_nnue else 'N/A'})")
                if not initialize_pi_engine('white', white_elo, white_skill, white_nnue, white_nnue_model):
                    return jsonify({
                        'status': 'error',
                        'message': "Failed to re-initialize White Pi after reset."
                    }), 500
                
                print(f"Re-initializing Black Pi: ELO {black_elo}, NNUE {black_nnue} ({black_nnue_model if black_nnue else 'N/A'})")
                if not initialize_pi_engine('black', black_elo, black_skill, black_nnue, black_nnue_model):
                    return jsonify({
                        'status': 'error',
                        'message': "Failed to re-initialize Black Pi after reset."
                    }), 500
            else:
                # Reset and re-initialize only black Pi
                print(f"Re-initializing Black Pi: ELO {black_elo}, NNUE {black_nnue} ({black_nnue_model if black_nnue else 'N/A'})")
                if not initialize_pi_engine('black', black_elo, black_skill, black_nnue, black_nnue_model):
                    return jsonify({
                        'status': 'error',
                        'message': "Failed to re-initialize Black Pi after reset."
                    }), 500
            
            current_player = 'white'
            game_active = True
            
            # Get board state after reset
            board_state_response = get_board_state_from_pi('black')
            board_state = board_state_response.get('board_state', {})
            
            print("Reset and re-initialization complete\n")
            
            return jsonify({
                'status': 'success',
                'message': 'Game reset to starting position',
                'board_state': board_state,
                'current_player': current_player,
                'game_mode': current_game_mode
            })
        
        elif command == 'pause':
            game_active = False
            return jsonify({
                'status': 'success',
                'message': 'Game paused'
            })
        
        elif command == 'resume':
            game_active = True
            return jsonify({
                'status': 'success',
                'message': 'Game resumed'
            })
        
        elif command == 'interrupt':
            # Interrupt command - reset game and clear scores
            print("\nInterrupt request received - resetting Pis and clearing scores...")
            
            # Reset appropriate Pis based on mode
            if current_game_mode == GAME_MODES['cpu_vs_cpu']:
                # Reset both Pis
                reset_pi('white')
                reset_pi('black')
            else:
                # Reset only black Pi
                reset_pi('black')
            
            # Reset game state
            current_player = 'white'
            game_active = False
            
            print("Interrupt complete - game reset, scores cleared\n")
            
            return jsonify({
                'status': 'success',
                'message': 'Game interrupted and reset',
                'current_player': current_player
            })
        
        else:
            return jsonify({
                'status': 'error',
                'message': f'Unknown command: {command}'
            }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Control error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("="*60)
    print("Starting AI Chess GUI Server with Raspberry Pi Integration")
    print("="*60)
    print(f"\nConfiguration:")
    print(f"  White Pi: {PI_WHITE_IP}:{PI_PORT}")
    print(f"  Black Pi: {PI_BLACK_IP}:{PI_PORT}")
    print(f"  GUI Server: {FLASK_HOST}:{FLASK_PORT}")
    print("\nMake sure both Pis are running pi_chess_server.py")
    print("="*60 + "\n")

    run_flask()
    # try:
    #     app.run(debug=FLASK_DEBUG, host=FLASK_HOST, port=FLASK_PORT)
    # except KeyboardInterrupt:
    #     print("\n\nShutting down server...")
