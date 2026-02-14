/* 
Game JavaScript - Game logic, move validation, game state
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/static/CSS/game.js
*/

//------------------------------------------------------------------------------
//
// function: getPieceNameFromCode
//
// arguments:
//  pieceCode: String representing the piece ("wK", "bQ")
//
// returns:
//  string: full name of the piece or "Empty/Unknown piece" ("wk" == "White King")
//
// description:
//  For Logging, Converts a piece into a human readable piece name for display logging
//
//------------------------------------------------------------------------------

function getPieceNameFromCode(pieceCode) {
    if (!pieceCode) return 'Empty';
    
    const pieceNames = {
        'wK': 'White King', 'wQ': 'White Queen', 'wR': 'White Rook', 
        'wB': 'White Bishop', 'wN': 'White Knight', 'wP': 'White Pawn',
        'bK': 'Black King', 'bQ': 'Black Queen', 'bR': 'Black Rook', 
        'bB': 'Black Bishop', 'bN': 'Black Knight', 'bP': 'Black Pawn'
    };
    return pieceNames[pieceCode] || 'Unknown Piece';
}

//------------------------------------------------------------------------------
//
// function: getPieceSymbol
//
// arguments:
//  pieceCode: String representing the piece ("wK", "bQ") or single char ("K", "q")
//
// returns:
//  string: Unicode chess symbol corresponding to its respected piece
//
// description:
//  For Visual Representation (Retrieves the proper unicode symbol for piece code)
//  Now handles both full codes (wK, bQ) and single character codes (K, q)
//
//------------------------------------------------------------------------------

function getPieceSymbol(pieceCode) {
    if (!pieceCode) return '?';
    
    // Handle both formats: "wK" and "K" (uppercase = white, lowercase = black)
    const symbols = {
        'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
        'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
        'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
        'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
    };
    return symbols[pieceCode] || '?';
}

//------------------------------------------------------------------------------
//
// function: convertPieceSymbolToPieceCode
//
// arguments:
//  pieceSymbol: single character piece symbol (K, q, R, etc.)
//
// returns:
//  string: full piece code (wK, bQ, wR, etc.)
//
// description:
//  Converts single character piece symbols to full piece codes
//
//------------------------------------------------------------------------------

function convertPieceSymbolToPieceCode(pieceSymbol) {
    if (!pieceSymbol) return null;
    
    // If already a full code, return it
    if (pieceSymbol.length === 2 && (pieceSymbol[0] === 'w' || pieceSymbol[0] === 'b')) {
        return pieceSymbol;
    }
    
    // Convert single char to full code
    const pieceMap = {
        'K': 'wK', 'Q': 'wQ', 'R': 'wR', 'B': 'wB', 'N': 'wN', 'P': 'wP',
        'k': 'bK', 'q': 'bQ', 'r': 'bR', 'b': 'bB', 'n': 'bN', 'p': 'bP'
    };
    return pieceMap[pieceSymbol] || null;
}

//------------------------------------------------------------------------------
//
// function: initializeMovesPanel
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Set up the panel with UI default of "No moves yet" message
//
//------------------------------------------------------------------------------

function initializeMovesPanel() {
    const movesList = document.getElementById('moves-list');
    movesList.innerHTML = '<div style="text-align: center; color: #888; font-style: italic;">No moves yet</div>';
}

//------------------------------------------------------------------------------
//
// function: recordMove
//
// arguments:
//  pieceCode: string represents the moved piece ("wK" or "wN" or "K" or "n") 
//  fromPosition: string represents starting square (e4, or f5)
//  toPosition: string represents ending square (e6 or f6)
//
// returns:
//  nothing
//
// description:
//  Records a move into the game history, increment the move count
//  and refresh the move display panel. Now handles both piece code formats.
//
//------------------------------------------------------------------------------

function recordMove(pieceCode, fromPosition, toPosition) {
    // Ensure we have a full piece code
    const fullPieceCode = convertPieceSymbolToPieceCode(pieceCode) || pieceCode;
    
    const move = {
        piece: fullPieceCode,
        from: fromPosition,
        to: toPosition,
        moveNumber: moveNumber,
        isWhite: fullPieceCode.startsWith('w') || (fullPieceCode.length === 1 && fullPieceCode === fullPieceCode.toUpperCase())
    };
    
    console.log('Recording move:', move);
    
    gameMoves.push(move);
    updateMovesDisplay();
    moveNumber++;
}

//------------------------------------------------------------------------------
//
// function: updateMovesDisplay
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Updates all the moves panel to display all moves made so far
//  Groups white and black under respective their move numbers.
//
//------------------------------------------------------------------------------

function updateMovesDisplay() {
    const movesList = document.getElementById('moves-list');

    if (gameMoves.length === 0) {
        movesList.innerHTML = '<div style="text-align: center; color: #888; font-style: italic;">No moves yet</div>';
        return;
    }

    let html = '';

    // Increment by 2 to group White and Black moves together
    for (let i = 0; i < gameMoves.length; i += 2) {
        const whiteMove = gameMoves[i];
        const blackMove = gameMoves[i + 1]; // This will be undefined if Black hasn't moved yet
        const currentMoveNumber = Math.floor(i / 2) + 1;

        html += `
            <div class="move-item">
                <span class="move-number">${currentMoveNumber}.</span>
                <span class="move-text white-move">${formatMove(whiteMove)}</span>
                <span class="move-text black-move">${blackMove ? formatMove(blackMove) : ''}</span>
            </div>`;
    }

    movesList.innerHTML = html;
    
    // Scroll to bottom to show latest moves
    movesList.scrollTop = movesList.scrollHeight;
}

//------------------------------------------------------------------------------
//
// function: formatMove
//
// arguments:
//  move: object containing piece from and to fields
//
// returns:
//  string formatted move with piece symbol and positions
//
// description:
//  Converts a move object into a user-readable string for display in the moves panel.
//  Includes proper Unicode chess piece symbols.
//
//------------------------------------------------------------------------------

function formatMove(move) {
    const pieceSymbol = getPieceSymbol(move.piece);
    return `${pieceSymbol} ${move.from}-${move.to}`;
}

//------------------------------------------------------------------------------
//
// function: updateGameScore
//
// arguments:
//  winner: string ('white', 'black', or 'draw')
//
// returns:
//  nothing
//
// description:
//  Updates the game score based on the winner
//
//------------------------------------------------------------------------------

function updateGameScore(winner) {
    if (winner === 'white') gameScore.white++;
    else if (winner === 'black') gameScore.black++;
    else if (winner === 'draw') gameScore.draws++;
    
    // Call the UI update function we just made
    updateScoreUI(); 
}

//
// End of file
