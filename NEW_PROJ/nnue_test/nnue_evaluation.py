import chess
import chess.pgn
import chess.engine
import os

# --- CONFIGURATION ---
STOCKFISH_PATH = "/opt/homebrew/bin/stockfish"  # Update this!
NNUE_FILE_PATH = "../nnue/nn-ae6a388e4a1a.nnue"           # Path to your uploaded file
PGN_FILE_PATH = "./pgn_data/Fischer.pgn"                    # Path to Carlsen's real games
SEARCH_DEPTH = 12                                     # Depth for the NNUE to "think"
MAX_GAMES = 100                                        # Number of games to sample

def get_metrics():
    # Initialize Engine
    engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
    
    # Updated configuration: remove "Use NNUE"
    engine.configure({
        "EvalFile": os.path.abspath(NNUE_FILE_PATH)
    })

    total_moves = 0
    exact_matches = 0
    total_cp_loss = 0

    print(f"Analyzing games using {NNUE_FILE_PATH}...")

    with open(PGN_FILE_PATH) as pgn:
        for game_num in range(MAX_GAMES):
            game = chess.pgn.read_game(pgn)
            if game is None: break
            
            board = game.board()
            # We only want to analyze moves made by Magnus (let's assume he is White/Black accordingly)
            player_name = "Carlsen, Magnus"
            is_magnus_white = player_name in game.headers.get("White", "")
            
            for move in game.mainline_moves():
                # Check if it's Magnus's turn to move
                if (board.turn == chess.WHITE and is_magnus_white) or \
                   (board.turn == chess.BLACK and not is_magnus_white):
                    
                    # 1. Get the Engine's top choice
                    # Inside your move loop:
                    analysis = engine.analyse(board, chess.engine.Limit(depth=SEARCH_DEPTH), multipv=3)

                    # Top-1 Match
                    if move == analysis[0].get("pv")[0]:
                        top1_matches += 1
                        
                        # Top-3 Match
                    top3_moves = [info.get("pv")[0] for info in analysis]
                    if move in top3_moves:
                        top3_matches += 1
    
                    # 3. Calculate Centipawn Loss for this move
                    # (How much better/worse was Magnus's move vs the Engine's top choice?)
                    board.push(move)
                    magnus_eval_info = engine.analyse(board, chess.engine.Limit(depth=SEARCH_DEPTH))
                    magnus_eval = magnus_eval_info.get("score").white().score(mate_score=10000)
                    board.pop()

                    # Loss is the difference (taking perspective into account)
                    loss = abs(engine_eval - magnus_eval)
                    total_cp_loss += loss
                    total_moves += 1

                board.push(move)

            print(f"Finished Game {game_num + 1}/{MAX_GAMES}")

    engine.quit()

    # Final Metrics
    accuracy = (exact_matches / total_moves) * 100 if total_moves > 0 else 0
    avg_cp_loss = (total_cp_loss / total_moves) if total_moves > 0 else 0

    print("\n--- RESULTS ---")
    print(f"Total Moves Analyzed: {total_moves}")
    print(f"Top-1 Move Match Accuracy: {accuracy:.2f}%")
    print(f"Top-3 Move Match Accuracy: {accuracy:.2f}%")
    print(f"Average Centipawn Loss vs Player: {avg_cp_loss:.2f}")

if __name__ == "__main__":
    get_metrics()
