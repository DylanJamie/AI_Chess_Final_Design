# Import Specific Libraries
import chess
import chess.engine


def print_ascii_board(board):
    files = "abcdefgh"
    print("   +---+---+---+---+---+---+---+---+")
    for rank in range(8, 0, -1):
        row = f" {rank} |"
        for file in files:
            square = chess.parse_square(file + str(rank))
            piece = board.piece_at(square)
            row += f" {piece.symbol() if piece else '.'} |"
        print(row)
        print("   +---+---+---+---+---+---+---+---+")
    print("     " + "   ".join(files))

# initialize a blank board
board = chess.Board()

# Connect Stockfish
engine = chess.engine.SimpleEngine.popen_uci("/usr/games/stockfish")

engine.configure({
    "Skill Level": 10,          # Range: 0 (weakest) to 20 (strongest)
    "UCI_LimitStrength": True, # Force it to play below max strength
    "UCI_Elo": 1350            # Target playing strength (e.g., 1200–2800)
})

print("Game has started!")
print("You are White ENTER A MOVE")
print("Example Moves: Nf3, e4, Bb5")

while not board.is_game_over():
    # Print current board
    print_ascii_board(board)
    print("Your Move:")

    # list of legal SAN moves
    legal_san_moves = [
        board.san(m)
        for m in board.legal_moves
    ]

    # Get SAN Move input
    move_input = input("> ")

    if move_input.lower() in ["q", "quit", "exit"]:
        print("You quit the game.")
        break

    try:
        move = board.parse_san(move_input)  # convert SAN string into a move
        if move in board.legal_moves:       # check if it’s actually legal
            board.push(move)
        else:
            print("Illegal move, try again.")
            continue
    except ValueError:
        print("Invalid SAN notation, try again.")
        continue

    if board.is_game_over():
        break
    
    # give 1 second to think
    result = engine.play(board, chess.engine.Limit(time=1.0))
    board.push(result.move)

# Final Board + Result
print(board)
print("Game Over:", board.result())

engine.quit()
