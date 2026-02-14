#!/usr/bin/env python3
"""
Simple test script to check chess moves and board state
"""

import chess
import chess.engine

def test_chess_moves():
    """Test basic chess move functionality"""
    
    # Create a new board
    board = chess.Board()
    
    print("=== CHESS BOARD TEST ===")
    print(f"Initial FEN: {board.fen()}")
    print(f"Turn: {'White' if board.turn else 'Black'}")
    print()
    
    # Show all legal moves
    print("Legal moves:")
    legal_moves = []
    for move in board.legal_moves:
        legal_moves.append({
            'from': chess.square_name(move.from_square),
            'to': chess.square_name(move.to_square),
            'san': board.san(move)
        })
        print(f"  {chess.square_name(move.from_square)} -> {chess.square_name(move.to_square)} ({board.san(move)})")
    
    print(f"\nTotal legal moves: {len(legal_moves)}")
    print()
    
    # Test a specific move (e2 to e4)
    print("=== TESTING MOVE: e2 to e4 ===")
    try:
        from_sq = chess.parse_square('e2')
        to_sq = chess.parse_square('e4')
        move = chess.Move(from_sq, to_sq)
        
        print(f"Parsed squares: {from_sq} to {to_sq}")
        print(f"Move object: {move}")
        print(f"Is legal: {move in board.legal_moves}")
        
        if move in board.legal_moves:
            board.push(move)
            print(f"Move successful! New FEN: {board.fen()}")
            print(f"Turn: {'White' if board.turn else 'Black'}")
        else:
            print("Move is not legal!")
            
    except Exception as e:
        print(f"Error testing move: {e}")
    
    print()
    
    # Test another move (d7 to d5)
    print("=== TESTING MOVE: d7 to d5 ===")
    try:
        from_sq = chess.parse_square('d7')
        to_sq = chess.parse_square('d5')
        move = chess.Move(from_sq, to_sq)
        
        print(f"Parsed squares: {from_sq} to {to_sq}")
        print(f"Move object: {move}")
        print(f"Is legal: {move in board.legal_moves}")
        
        if move in board.legal_moves:
            board.push(move)
            print(f"Move successful! New FEN: {board.fen()}")
            print(f"Turn: {'White' if board.turn else 'Black'}")
        else:
            print("Move is not legal!")
            
    except Exception as e:
        print(f"Error testing move: {e}")

if __name__ == "__main__":
    test_chess_moves()


