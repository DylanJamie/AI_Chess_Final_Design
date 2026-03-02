"""
Web Application Server for AI Chess GUI (Local Version - No Raspberry Pi)
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/app.py

Local version - runs entirely on your computer
Uses local Stockfish engines for both CPU vs CPU and Player vs CPU modes
"""
from flask import Flask, render_template, jsonify, request
import chess
import chess.engine
import json
import os
import time
import shutil

try:
    from GUI.config import (
        FLASK_HOST, FLASK_PORT, FLASK_DEBUG, 
        GAME_MODES, DEFAULT_WHITE_ELO, DEFAULT_BLACK_ELO
    )
except:
    from config import (
        FLASK_HOST, FLASK_PORT, FLASK_DEBUG, 
        GAME_MODES, DEFAULT_WHITE_ELO, DEFAULT_BLACK_ELO
    )
    
""" Determine the root path """
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

# Local board state (no Pi needed)
board = chess.Board()

# Local engines
engine_white = None
engine_black = None

# NNUE file paths
NNUE_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'nnue'))
CARLSEN_NNUE_PATH = os.path.join(NNUE_BASE_DIR, 'carlsen_halfkav2_hm.nnue')
FISCHER_NNUE_PATH = os.path.join(NNUE_BASE_DIR, 'fischer.nnue')

def run_flask():
    '''Function to call flask'''
    print(f"Starting Flask on {FLASK_HOST}:{FLASK_PORT}")
    app.run(debug=False, host=FLASK_HOST, port=FLASK_PORT, use_reloader=False)

def find_stockfish():
    """Find Stockfish executable in common locations"""
    # Check environment variable first
    stockfish_path = os.environ.get('STOCKFISH_PATH')
    if stockfish_path and os.path.exists(stockfish_path):
        return stockfish_path
    
    # Common paths
    common_paths = [
        '/usr/local/bin/stockfish',  # macOS Homebrew
        '/opt/homebrew/bin/stockfish',  # macOS Homebrew (Apple Silicon)
        '/usr/bin/stockfish',  # Linux
        '/usr/games/stockfish',  # Linux
        'stockfish',  # In PATH
    ]
    
    for path in common_paths:
        if shutil.which(path) or (os.path.exists(path) and os.access(path, os.X_OK)):
            return path if path != 'stockfish' else shutil.which('stockfish')
    
    return None

def create_engine(elo, use_nnue=False, nnue_model='carlsen'):
    """Create and configure a Stockfish engine instance
    
    IMPORTANT: When using UCI_LimitStrength + UCI_Elo, do NOT set Skill Level
    as they conflict with each other.
    """
    stockfish_path = find_stockfish()
    if not stockfish_path:
        print("ERROR: Stockfish not found! Please install Stockfish:")
        print("  macOS: brew install stockfish")
        print("  Linux: sudo apt-get install stockfish")
        print("  Or set STOCKFISH_PATH environment variable")
        return None
    
    try:
        engine = chess.engine.SimpleEngine.popen_uci(stockfish_path)
        
        # Configure engine - Use EITHER Skill Level OR UCI_Elo, not both
        # For ELO-based play, use UCI_LimitStrength + UCI_Elo
        config = {
            "UCI_LimitStrength": True,
            "UCI_Elo": elo,
            "UCI_ShowWDL": True
        }
        
        # Add NNUE file if requested
        if use_nnue:
            if nnue_model == 'fischer':
                nnue_path = FISCHER_NNUE_PATH
            else:  # default to carlsen
                nnue_path = CARLSEN_NNUE_PATH
            
            if os.path.exists(nnue_path):
                config["EvalFile"] = nnue_path
                print(f"  Using NNUE evaluation file: {nnue_path} (model: {nnue_model})")
            else:
                print(f"  Warning: NNUE file not found at {nnue_path}, using default evaluation")
        
        engine.configure(config)
        print(f"  Engine configured: ELO {elo}, NNUE: {use_nnue}")
        return engine
    except Exception as e:
        print(f"Failed to create engine: {e}")
        return None

def get_board_state():
    """Get current board state as a dictionary"""
    board_state = {}
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            square_name = chess.square_name(square)
            piece_symbol = piece.symbol()
            board_state[square_name] = piece_symbol
    return board_state

def is_valid_move(from_square, to_square, piece_code=None):
    """Validate if a move is legal, including promotions"""
    try:
        from_sq = chess.parse_square(from_square)
        to_sq   = chess.parse_square(to_square)

        piece = board.piece_at(from_sq)
        promotion = None
        if piece and piece.piece_type == chess.PAWN:
            if (piece.color == chess.WHITE and chess.square_rank(to_sq) == 7) or \
               (piece.color == chess.BLACK and chess.square_rank(to_sq) == 0):
                promo_map = {'q': chess.QUEEN, 'r': chess.ROOK,
                             'b': chess.BISHOP, 'n': chess.KNIGHT}
                promotion = promo_map.get(str(piece_code).lower(), chess.QUEEN)

        move = chess.Move(from_sq, to_sq, promotion=promotion)
        return move in board.legal_moves
    except Exception as e:
        print(f"Move validation error: {e}")
        return False

def make_move_local(from_square, to_square, piece_code=None):
    """Make a move on the local board, including promotions"""
    try:
        from_sq = chess.parse_square(from_square)
        to_sq   = chess.parse_square(to_square)

        piece = board.piece_at(from_sq)
        promotion = None
        if piece and piece.piece_type == chess.PAWN:
            if (piece.color == chess.WHITE and chess.square_rank(to_sq) == 7) or \
               (piece.color == chess.BLACK and chess.square_rank(to_sq) == 0):
                promo_map = {'q': chess.QUEEN, 'r': chess.ROOK,
                             'b': chess.BISHOP, 'n': chess.KNIGHT}
                promotion = promo_map.get(str(piece_code).lower(), chess.QUEEN)

        move = chess.Move(from_sq, to_sq, promotion=promotion)
        if move in board.legal_moves:
            board.push(move)
            return True
        return False
    except Exception as e:
        print(f"Error making move: {e}")
        return False
    
def get_engine_move_local(engine, game_speed=10):
    """Get engine move from a local engine"""
    if not engine:
        return None
        
    if board.is_game_over():
        return None
    
    try:
        # Calculate thinking time based on game speed
        thinking_time = max(0.1, 2.0 / game_speed)
        
        result = engine.play(board, chess.engine.Limit(time=thinking_time), info=chess.engine.Info.ALL)
        move = result.move
        info = result.info

        # Initialize wdl_stats to None
        wdl_stats = None
        
        # only extract the win probabilities if the game is 5 speed or less
        
        # Extract the WDL Probabilites
        if 'wdl' in info:
            wdl = info['wdl'].white()
            total = wdl.wins + wdl.draws + wdl.losses
            wdl_stats = {
                'win': round((wdl.wins / total) * 100, 1),
                'draw': round((wdl.draws / total) * 100, 1),
                'loss': round((wdl.losses / total) * 100, 1)
            }
            
        if move not in board.legal_moves:
            return None
        
        # Get piece and SAN before pushing
        piece_obj = board.piece_at(move.from_square)
        if piece_obj:
            # Convert chess library format ('K', 'k', 'Q', 'q', etc.) 
            # to frontend format ('wK', 'bK', 'wQ', 'bQ', etc.)
            piece_symbol = piece_obj.symbol()
            if piece_symbol.isupper():
                # White piece
                piece = 'w' + piece_symbol
            else:
                # Black piece
                piece = 'b' + piece_symbol.upper()
        else:
            piece = None
            
        san_notation = board.san(move)
        
        # Make the move
        board.push(move)
        
        move_data = {
            'from': chess.square_name(move.from_square),
            'to': chess.square_name(move.to_square),
            'piece': piece,
            'san': san_notation
        }
        
        # Add WDL data if available
        if wdl_stats:
            move_data['wdl'] = wdl_stats
        
        return move_data
    except Exception as e:
        print(f"Engine move error: {e}")
        return None

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
        'chess': '♔♕♖♗♘♙'
    })

@app.route('/api/pi-status', methods=['GET'])
def check_pi_status():
    """Check connection status (always connected in local mode)"""
    return jsonify({
        'status': 'connected',
        'message': 'Local mode - Engine ready',
        'white_connected': True,
        'black_connected': True,
        'game_mode': current_game_mode,
        'engine_connected': True  # Always true in local mode
    })

@app.route('/api/set-game-mode', methods=['POST'])
def set_game_mode():
    """Set game mode and initialize local engines"""
    global current_game_mode, white_elo, black_elo, white_nnue, black_nnue
    global white_nnue_model, black_nnue_model, current_player, game_active
    global engine_white, engine_black, board
    
    data = request.get_json()
    mode = data.get('mode')
    
    if mode not in GAME_MODES.values():
        return jsonify({"status": "error", "message": "Invalid mode"}), 400
    
    # Clean up existing engines
    if engine_white:
        try:
            engine_white.quit()
        except:
            pass
        engine_white = None
    
    if engine_black:
        try:
            engine_black.quit()
        except:
            pass
        engine_black = None
    
    # Reset board
    board = chess.Board()
    
    current_game_mode = mode
    white_elo = data.get("white_elo", DEFAULT_WHITE_ELO)
    black_elo = data.get("black_elo", DEFAULT_BLACK_ELO)
    white_nnue = data.get("white_nnue", False)
    black_nnue = data.get("black_nnue", False)
    white_nnue_model = data.get("white_nnue_model", "carlsen")
    black_nnue_model = data.get("black_nnue_model", "carlsen")
    current_player = 'white'
    game_active = True
    
    print(f"\n{'='*60}")
    print(f"Setting up LOCAL game mode: {mode}")
    print(f"White: ELO {white_elo}, NNUE: {white_nnue} ({white_nnue_model if white_nnue else 'N/A'})")
    print(f"Black: ELO {black_elo}, NNUE: {black_nnue} ({black_nnue_model if black_nnue else 'N/A'})")
    print(f"{'='*60}\n")
    
    # Initialize appropriate engines based on mode
    if mode == GAME_MODES['user_vs_cpu']:
        # Only need black engine
        print("Initializing Black engine...")
        engine_black = create_engine(black_elo, black_nnue, black_nnue_model)
        if not engine_black:
            return jsonify({
                "status": "error",
                "message": "Failed to initialize Black engine. Check Stockfish installation."
            }), 500
        print("Black engine initialized successfully")
        
    elif mode == GAME_MODES['cpu_vs_cpu']:
        # Need both engines
        print("Initializing White engine...")
        engine_white = create_engine(white_elo, white_nnue, white_nnue_model)
        if not engine_white:
            return jsonify({
                "status": "error",
                "message": "Failed to initialize White engine. Check Stockfish installation."
            }), 500
        print("White engine initialized successfully")
        
        print("Initializing Black engine...")
        engine_black = create_engine(black_elo, black_nnue, black_nnue_model)
        if not engine_black:
            return jsonify({
                "status": "error",
                "message": "Failed to initialize Black engine. Check Stockfish installation."
            }), 500
        print("Black engine initialized successfully")
    
    board_state = get_board_state()
    
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
        
        # Validate and make move on local board
        if not is_valid_move(from_square, to_square, piece):
            return jsonify({
                'status': 'error',
                'message': 'Invalid move',
                'move_accepted': False
            }), 400
        
        if make_move_local(from_square, to_square, piece):
            # Check if game is over
            game_over = board.is_game_over()
            winner = None
            
            if game_over:
                result = board.result()
                if result == '1-0':
                    winner = 'white'
                elif result == '0-1':
                    winner = 'black'
                else:
                    winner = 'draw'
            
            current_player = 'black'
            return jsonify({
                'status': 'success',
                'move_accepted': True,
                'board_state': get_board_state(),
                'game_over': game_over,
                'is_check': board.is_check(),
                'winner': winner,
                'current_player': current_player
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to make move',
                'move_accepted': False
            }), 400
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Server error: {str(e)}'
        }), 500

@app.route('/api/board-state', methods=['GET'])
def get_board_state_endpoint():
    """Get current board state from local board"""
    try:
        game_over = board.is_game_over()
        winner = None
        
        if game_over:
            result = board.result()
            print(f"\n{'='*60}")
            print(f"GAME OVER!")
            print(f"Board result: {result}")
            if result == '1-0':
                winner = 'white'
                print(f"Winner: WHITE")
            elif result == '0-1':
                winner = 'black'
                print(f"Winner: BLACK")
            else:
                winner = 'draw'
                print(f"Result: DRAW")
            print(f"{'='*60}\n")
        
        return jsonify({
            'status': 'success',
            'board_state': get_board_state(),
            'current_player': current_player,
            'game_mode': current_game_mode,
            'game_over': game_over,
            'is_check': board.is_check(),
            'winner': winner,
            'board_fen': board.fen()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Error getting board state: {str(e)}'
        }), 500

@app.route('/api/engine-move', methods=['POST'])
def get_engine_move_endpoint():
    """Get engine move from local engine"""
    global current_player
    
    try:
        data = request.get_json() or {}
        game_speed = data.get('game_speed', 10)
        
        # Determine which engine to use
        if current_game_mode == GAME_MODES['user_vs_cpu']:
            # Always black engine
            engine = engine_black
        elif current_game_mode == GAME_MODES['cpu_vs_cpu']:
            # Alternate based on current player
            engine = engine_white if current_player == 'white' else engine_black
        else:
            return jsonify({
                'status': 'error',
                'message': 'No game mode set'
            }), 400
        
        if not engine:
            return jsonify({
                'status': 'error',
                'message': 'Engine not initialized'
            }), 500
        
        print(f"\nRequesting move from {'white' if engine == engine_white else 'black'} engine (current player: {current_player})")
        
        # Get move from local engine
        engine_move = get_engine_move_local(engine, game_speed)
        
        if engine_move:
            # Check if game is over
            game_over = board.is_game_over()
            winner = None
            
            if game_over:
                result = board.result()
                if result == '1-0':
                    winner = 'white'
                elif result == '0-1':
                    winner = 'black'
                else:
                    winner = 'draw'
            
            # Update current player
            current_player = 'black' if current_player == 'white' else 'white'
            print(f"Move complete. New current player: {current_player}\n")
            
            return jsonify({
                'status': 'success',
                'engine_move': engine_move,
                'board_state': get_board_state(),
                'game_over': game_over,
                'is_check': board.is_check(),
                'winner': winner,
                'current_player': current_player
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to get engine move'
            }), 500
            
    except Exception as e:
        print(f"Engine move error: {e}")
        return jsonify({
            "status": "error",
            "message": f"Engine error: {str(e)}"
        }), 500

@app.route('/api/game-control', methods=['POST'])
def handle_game_control():
    """Handle game control commands"""
    global current_player, game_active, white_elo, black_elo
    global white_nnue, black_nnue, white_nnue_model, black_nnue_model
    global engine_white, engine_black, board
    
    try:
        data = request.get_json()
        command = data.get('command')
        
        if command == 'reset':
            print("\nReset request received - resetting local engines and board...")
            
            # Reset board
            board = chess.Board()
            
            # Re-initialize engines based on mode
            if current_game_mode == GAME_MODES['cpu_vs_cpu']:
                # Re-initialize both engines
                if engine_white:
                    try:
                        engine_white.quit()
                    except:
                        pass
                if engine_black:
                    try:
                        engine_black.quit()
                    except:
                        pass
                
                print(f"Re-initializing White engine: ELO {white_elo}, NNUE {white_nnue} ({white_nnue_model if white_nnue else 'N/A'})")
                engine_white = create_engine(white_elo, white_nnue, white_nnue_model)
                if not engine_white:
                    return jsonify({
                        'status': 'error',
                        'message': "Failed to re-initialize White engine after reset."
                    }), 500
                
                print(f"Re-initializing Black engine: ELO {black_elo}, NNUE {black_nnue} ({black_nnue_model if black_nnue else 'N/A'})")
                engine_black = create_engine(black_elo, black_nnue, black_nnue_model)
                if not engine_black:
                    return jsonify({
                        'status': 'error',
                        'message': "Failed to re-initialize Black engine after reset."
                    }), 500
            else:
                # Re-initialize only black engine
                if engine_black:
                    try:
                        engine_black.quit()
                    except:
                        pass
                
                print(f"Re-initializing Black engine: ELO {black_elo}, NNUE {black_nnue} ({black_nnue_model if black_nnue else 'N/A'})")
                engine_black = create_engine(black_elo, black_nnue, black_nnue_model)
                if not engine_black:
                    return jsonify({
                        'status': 'error',
                        'message': "Failed to re-initialize Black engine after reset."
                    }), 500
            
            current_player = 'white'
            game_active = True
            
            board_state = get_board_state()
            
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

"""Returns the legal moves end point for the display of the possible moves"""
@app.route('/api/legal-moves', methods=['POST'])
def get_legal_moves():
    """Return all legal destination squares for a given piece position"""
    try:
        data = request.get_json()
        from_square = data.get('from')
        if not from_square:
            return jsonify({'status': 'error', 'message': 'Missing from square'}), 400

        from_sq = chess.parse_square(from_square)
        legal_targets = [
            chess.square_name(move.to_square)
            for move in board.legal_moves
            if move.from_square == from_sq
        ]
        return jsonify({'status': 'success', 'legal_moves': legal_targets})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
if __name__ == '__main__':
    print("="*60)
    print("Starting AI Chess GUI Server (LOCAL MODE - No Raspberry Pi)")
    print("="*60)
    print(f"\nConfiguration:")
    print(f"  GUI Server: {FLASK_HOST}:{FLASK_PORT}")
    print(f"  Mode: Local (all engines run on this computer)")
    print("\nMake sure Stockfish is installed:")
    print("  macOS: brew install stockfish")
    print("  Linux: sudo apt-get install stockfish")
    print("="*60 + "\n")
    
    # Check for Stockfish
    stockfish_path = find_stockfish()
    if stockfish_path:
        print(f"✓ Stockfish found at: {stockfish_path}\n")
    else:
        print("⚠ WARNING: Stockfish not found! The app may not work properly.\n")
    run_flask()
