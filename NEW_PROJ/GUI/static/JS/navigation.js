/* 
Navigation JavaScript - Move navigation and history
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/static/CSS/navigation.js
*/

//------------------------------------------------------------------------------
//
// function: saveBoardState
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Captures the current state of the chessboard by recording each square's
//  position and piece (if present). Saves the state to the `boardHistory`
//  array and updates the `currentMoveIndex`.
//
//------------------------------------------------------------------------------

function saveBoardState() {
    const boardState = [];
    const squares = document.querySelectorAll('.square');
    
    squares.forEach(square => {
        const position = square.dataset.position;
        const piece = square.dataset.piece || null;
        boardState.push({ position, piece });
    });
    
    boardHistory.push(boardState);
    currentMoveIndex = boardHistory.length - 1;
}

//------------------------------------------------------------------------------
//
// function: loadBoardState
//
// arguments:
//  moveIndex: integer representing the index of the board state to load 
//
// returns:
//  nothing
//
// description:
//  Loads a specific board state from `boardHistory` based on `moveIndex`.
//  Clears all current pieces from the board, restores the saved configuration,
//  updates `currentMoveIndex`, and refreshes navigation button states.
//
//------------------------------------------------------------------------------

function loadBoardState(moveIndex) {
    if (moveIndex < 0 || moveIndex >= boardHistory.length) return;
    
    const boardState = boardHistory[moveIndex];
    
    // Clear all pieces
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        removePieceFromSquare(square);
    });
    
    // Restore pieces
    boardState.forEach(({ position, piece }) => {
        if (piece) {
            const square = document.querySelector(`.square[data-position="${position}"]`);
            if (square) {
                addPieceToSquare(square, piece);
            }
        }
    });
    
    currentMoveIndex = moveIndex;
    updateNavigationButtons();
}

//------------------------------------------------------------------------------
//
// function: previousMove
//
// arguments:
//  none 
//
// returns:
//  nothing
//
// description:
//  Loads the prievious move from the board history if avalible and updates
//  the on screen status message that reflect the current view move index
//
//------------------------------------------------------------------------------

function previousMove() {
    if (currentMoveIndex > 0) {
        loadBoardState(currentMoveIndex - 1);
        document.getElementById('click-status').textContent = 
            `Viewing move ${currentMoveIndex} of ${boardHistory.length - 1}`;
    }
}


//------------------------------------------------------------------------------
//
// function: nextMove
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Loads the next move from the board history if available and updates
//  the on-screen status message to reflect the currently viewed move index.
//
//------------------------------------------------------------------------------

function nextMove() {
    if (currentMoveIndex < boardHistory.length - 1) {
        loadBoardState(currentMoveIndex + 1);
        document.getElementById('click-status').textContent = 
            `Viewing move ${currentMoveIndex} of ${boardHistory.length - 1}`;
    }
}

//------------------------------------------------------------------------------
//
// function: resetToCurrentGame
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Restores the chessboard to the most recent game state (the latest entry
//  in `boardHistory`) and updates the status text to indicate this reset.
//
//------------------------------------------------------------------------------

function resetToCurrentGame() {
    loadBoardState(boardHistory.length - 1);
    document.getElementById('click-status').textContent = 'Back to current game state';
}

//------------------------------------------------------------------------------
//
// function: updateNavigationButtons
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Enables or disables the navigation buttons (`prev-btn` and `next-btn`)
//  depending on the user's current position in the move history.
//
//------------------------------------------------------------------------------

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // Enable/disable previous button
    prevBtn.disabled = currentMoveIndex <= 0;
    
    // Enable/disable next button
    nextBtn.disabled = currentMoveIndex >= boardHistory.length - 1;
}
//
// End of file