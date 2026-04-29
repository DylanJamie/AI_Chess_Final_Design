import chess
import chess.engine
import os

# Path to Stockfish executable
STOCKFISH_PATH = "/opt/homebrew/bin/stockfish"

# Path to your custom NNUE
NNUE_1_PATH = os.path.expanduser("~/Downloads/model_testing/carlsen270.nnue")
NNUE_1_NAME = "Carlsen 270 epochs"

# Opponent Settings
OPPONENT_NAME = "Stockfish 2200 Elo"
TARGET_ELO = 2200

# Match settings
SEARCH_DEPTH = 12
NUM_GAMES = 100
HASH_MB = 64
THREADS = 1
MAX_PLIES = 300

# ============================================================
# ENGINE SETUP
# ============================================================
def configure_engine(engine, nnue_path=None, elo=None):
    """
    Configures engine for either a custom NNUE or a specific Elo level.
    """
    config = {
        "Hash": HASH_MB,
        "Threads": THREADS
    }

    if nnue_path:
        config["EvalFile"] = os.path.abspath(nnue_path)
    
    if elo:
        config["UCI_LimitStrength"] = True
        config["UCI_Elo"] = elo
        # Optional: Skill Level usually corresponds to Elo ranges in SF
        # For 2200, Skill Level 20 (max) is fine if UCI_Elo is set.
    
    engine.configure(config)


def start_engine(engine_name, nnue_path=None, elo=None):
    """
    Starts Stockfish. If nnue_path is given, it loads the custom net.
    If elo is given, it limits the engine's strength.
    """
    print(f"Starting {engine_name}...")
    
    if not os.path.exists(STOCKFISH_PATH):
        raise FileNotFoundError(f"Stockfish executable not found: {STOCKFISH_PATH}")

    engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)

    try:
        configure_engine(engine, nnue_path=nnue_path, elo=elo)
        
        # Validation: Ask for one move
        board = chess.Board()
        engine.play(board, chess.engine.Limit(depth=1))
        
        print(f"{engine_name} initialized successfully.\n")
        return engine
    except Exception as e:
        engine.quit()
        raise RuntimeError(f"Failed to initialize {engine_name}: {e}")

# ============================================================
# PLAY ONE GAME (Logic remains largely the same)
# ============================================================
def play_one_game(engine1, engine2, game_number):
    board = chess.Board()

    if game_number % 2 == 0:
        white_engine, black_engine = engine1, engine2
        white_name, black_name = NNUE_1_NAME, OPPONENT_NAME
    else:
        white_engine, black_engine = engine2, engine1
        white_name, black_name = OPPONENT_NAME, NNUE_1_NAME

    ply_count = 0
    while not board.is_game_over() and ply_count < MAX_PLIES:
        current_engine = white_engine if board.turn == chess.WHITE else black_engine
        result = current_engine.play(board, chess.engine.Limit(depth=SEARCH_DEPTH))
        
        if result.move is None:
            break
        board.push(result.move)
        ply_count += 1

    if not board.is_game_over():
        return None, "1/2-1/2"

    res = board.result()
    if res == "1-0": return white_name, res
    if res == "0-1": return black_name, res
    return None, res

# ============================================================
# MAIN MATCH LOOP
# ============================================================
def run_match():
    engine1 = None
    engine2 = None
    net_wins, opp_wins, draws = 0, 0, 0

    try:
        # Start Engine 1 (Custom NNUE)
        engine1 = start_engine(NNUE_1_NAME, nnue_path=NNUE_1_PATH)
        
        # Start Engine 2 (Elo Limited Stockfish)
        engine2 = start_engine(OPPONENT_NAME, elo=TARGET_ELO)

        for i in range(NUM_GAMES):
            winner, result_str = play_one_game(engine1, engine2, i)

            if winner == NNUE_1_NAME:
                net_wins += 1
            elif winner == OPPONENT_NAME:
                opp_wins += 1
            else:
                draws += 1

            print(f"Game {i+1}/{NUM_GAMES}: {result_str} | Wins: {net_wins}, Losses: {opp_wins}, Draws: {draws}")

        print("\n" + "="*40 + "\nFINAL RESULTS\n" + "="*40)
        print(f"{NNUE_1_NAME}: {net_wins}\n{OPPONENT_NAME}: {opp_wins}\nDraws: {draws}")

    except Exception as e:
        print(f"\nMatch Error: {e}")
    finally:
        if engine1: engine1.quit()
        if engine2: engine2.quit()

if __name__ == "__main__":
    run_match()
