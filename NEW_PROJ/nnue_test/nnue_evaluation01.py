import chess
import chess.pgn
import chess.engine
import os

# --- CONFIGURATION ---
STOCKFISH_PATH = "/opt/homebrew/bin/stockfish"  # Ensure this is your correct path
NNUE_FILE_PATH = "../nnue/nakamura.nnue"      # Change this as needed
PGN_FILE_PATH = "./pgn_data/Nakamura.pgn"              # Change this as needed
SEARCH_DEPTH = 12                               
MAX_GAMES = 100                                 

def get_metrics():
    # Initialize Engine
    engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
    engine.configure({"EvalFile": os.path.abspath(NNUE_FILE_PATH)})

    # Match Counters
    top1_matches = 0
    top3_matches = 0
    total_moves = 0
    total_cp_loss = 0

    print(f"Analyzing games using: {NNUE_FILE_PATH}")
    print(f"Against PGN: {PGN_FILE_PATH}")

    with open(PGN_FILE_PATH) as pgn:
        for game_num in range(MAX_GAMES):
            game = chess.pgn.read_game(pgn)
            if game is None: break
            
            # Auto-detect which side the pro player is on
            white_player = game.headers.get("White", "Unknown")
            black_player = game.headers.get("Black", "Unknown")
            
            target_name = "Nakamura" # or "Krush"
            
            is_pro_white = target_name in white_player
            is_pro_black = target_name in black_player

            board = game.board()
            
            for move in game.mainline_moves():
                # Check if it's the pro player's turn
                is_pro_turn = (board.turn == chess.WHITE and is_pro_white) or \
                              (board.turn == chess.BLACK and is_pro_black)
                
                if is_pro_turn:
                    # 1. Get Engine Analysis (Top 3 candidate moves)
                    analysis = engine.analyse(board, chess.engine.Limit(depth=SEARCH_DEPTH), multipv=3)
                    
                    if not analysis: continue

                    # 2. Extract Data for Calculations
                    engine_top_move = analysis[0].get("pv")[0]
                    # Get eval from the perspective of the player to move
                    engine_eval = analysis[0].get("score").white().score(mate_score=10000)
                    
                    # 3. Check Top-1 Match
                    if move == engine_top_move:
                        top1_matches += 1
                    
                    # 4. Check Top-3 Match
                    # We list the top moves available in the multipv analysis
                    top3_moves = [entry.get("pv")[0] for entry in analysis if "pv" in entry]
                    if move in top3_moves:
                        top3_matches += 1
    
                    # 5. Calculate Centipawn Loss (Relative to engine's #1 choice)
                    # Get evaluation after Magnus/Fischer actually moved
                    board.push(move)
                    player_eval_info = engine.analyse(board, chess.engine.Limit(depth=SEARCH_DEPTH))
                    player_eval = player_eval_info.get("score").white().score(mate_score=10000)
                    board.pop()

                    # Loss is the absolute difference in evaluations
                    loss = abs(engine_eval - player_eval)
                    total_cp_loss += loss
                    total_moves += 1

                board.push(move)

            print(f"Progress: {game_num + 1}/{MAX_GAMES} games analyzed...")

    engine.quit()

    # Final Metric Calculations
    top1_acc = (top1_matches / total_moves) * 100 if total_moves > 0 else 0
    top3_acc = (top3_matches / total_moves) * 100 if total_moves > 0 else 0
    avg_cp_loss = (total_cp_loss / total_moves) if total_moves > 0 else 0

    print("\n" + "="*30)
    print(f" FINAL RESULTS for {NNUE_FILE_PATH}")
    print("="*30)
    print(f"Total Pro Moves Analyzed: {total_moves}")
    print(f"Top-1 Match Accuracy:    {top1_acc:.2f}%")
    print(f"Top-3 Match Accuracy:    {top3_acc:.2f}%")
    print(f"Avg. Centipawn Loss:     {avg_cp_loss:.2f}")
    print("="*30)

if __name__ == "__main__":
    get_metrics()
