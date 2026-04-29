/* 
Board Initialization, Creation and Piece Management
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/static/CSS/board.js
*/

//------------------------------------------------------------------------------
//
// function: createChessBoard
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  This function creates an 8x8 chessboard grid in the HTML element with ID
//  'chessboard'. Each square is assigned color, position data, and a click
//  event listener.
//
//------------------------------------------------------------------------------

function createChessBoard() {
    const board = document.getElementById('chessboard');
    board.innerHTML = '';

    // Make constant variables for the files and ranks
    //
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    // loop through creating the rows for 8 by 8 grid
    //
    for (let row = 0; row < 8; row++) {
        const boardRow = document.createElement('div');
        boardRow.className = 'board-row';

        // loop through creating the columns for 8 by 8 grid alternating back and forth from black or white square
        //
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
            square.dataset.row = row;
            square.dataset.col = col;
            square.dataset.position = files[col] + ranks[row];

            // Add click event
            //
            square.addEventListener('click', function() {
                handleSquareClick(this);
            });

            boardRow.appendChild(square);
        }
        board.appendChild(boardRow);
    }
}

//------------------------------------------------------------------------------
//
// function: setupPieces
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Places all chess pieces in their initial positions on the board.
//  Uses shorthand piece codes (e.g., 'wK', 'bQ') and calls addPieceToSquare().
//
//------------------------------------------------------------------------------

function setupPieces() {
    // clear the board fully opon every reset
    document.querySelectorAll('.square').forEach(sq => removePieceFromSquare(sq));
    
    const pieces = {
        // Black pieces (row 0-1) assigning where all the pieces on black start and their identities
        //
        'a8': 'bR', 'b8': 'bN', 'c8': 'bB', 'd8': 'bQ', 'e8': 'bK', 'f8': 'bB', 'g8': 'bN', 'h8': 'bR',
        'a7': 'bP', 'b7': 'bP', 'c7': 'bP', 'd7': 'bP', 'e7': 'bP', 'f7': 'bP', 'g7': 'bP', 'h7': 'bP',
        
        // White pieces (row 6-7) assigning where all the pieces on white start and their identities
        //
        'a2': 'wP', 'b2': 'wP', 'c2': 'wP', 'd2': 'wP', 'e2': 'wP', 'f2': 'wP', 'g2': 'wP', 'h2': 'wP',
        'a1': 'wR', 'b1': 'wN', 'c1': 'wB', 'd1': 'wQ', 'e1': 'wK', 'f1': 'wB', 'g1': 'wN', 'h1': 'wR'
    };

    // Place pieces on the board In the coorisponding positions
    //
    for (const [position, pieceCode] of Object.entries(pieces)) {
        const square = document.querySelector(`.square[data-position="${position}"]`);
        if (square) {
            addPieceToSquare(square, pieceCode);
        }
    }
}

//------------------------------------------------------------------------------
//
// function: addPieceToSquare
//
// arguments:
//  square: the target DOM element representing a square
//  pieceCode: a string representing the piece (e.g., "wK", "bP")
//
// returns:
//  nothing
//
// description:
//  Clears any existing content and classes from a square, then adds
//  the piece image and data attributes corresponding to the piece code.
//
//------------------------------------------------------------------------------

function addPieceToSquare(square, pieceCode) {
    // Clear any existing content
    //
    square.textContent = '';
    
    // Remove any existing piece classes
    //
    const pieceClasses = ['piece', 'piece-wK', 'piece-wQ', 'piece-wR', 'piece-wB', 'piece-wN', 'piece-wP', 
                         'piece-bK', 'piece-bQ', 'piece-bR', 'piece-bB', 'piece-bN', 'piece-bP'];
    square.classList.remove(...pieceClasses);
    
    // Add the piece class
    //
    square.classList.add('piece', `piece-${pieceCode}`);
    square.dataset.piece = pieceCode;
}


//------------------------------------------------------------------------------
//
// function: isPawnPromotion
//
// arguments:
//  pieceCode, fromPosition, targetPosition
//
// returns:
//  True or False
//
// description:
//  This will allow white and black pawns to promote to another Piece
//
//------------------------------------------------------------------------------
function isPawnPromotion(pieceCode, fromPosition, targetPosition) {
    // White pawn moving to rank 8, or black pawn moving to rank 1
    if (pieceCode === 'wP' && targetPosition[1] === '8') return true;
    if (pieceCode === 'bP' && targetPosition[1] === '1') return true;
    return false;
}



//------------------------------------------------------------------------------
//
// function: showPromotionOverlay
//
// arguments:
//  pieceCode, fromPosition, targetPosition
//
// returns:
//  nothing
//
// description:
//  This allows for the promotion overlay to show when a player goes to promote
//  a pawn
//
//------------------------------------------------------------------------------

function showPromotionOverlay(pieceCode, fromPosition, targetPosition) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('promotion-overlay');
        const isWhite = pieceCode === 'wP';
        const color = isWhite ? 'White' : 'Black';

        // Set the correct piece images based on who is promoting
        const pieceImages = {
            q: `/static/images/pieces/${color}-Queen.png`,
            r: `/static/images/pieces/${color}-Rook.png`,
            b: `/static/images/pieces/${color}-Bishop.png`,
            n: `/static/images/pieces/${color}-Knight.png`
        };

        document.getElementById('promo-queen').style.backgroundImage  = `url('${pieceImages.q}')`;
        document.getElementById('promo-rook').style.backgroundImage   = `url('${pieceImages.r}')`;
        document.getElementById('promo-bishop').style.backgroundImage = `url('${pieceImages.b}')`;
        document.getElementById('promo-knight').style.backgroundImage = `url('${pieceImages.n}')`;

        document.querySelectorAll('.promotion-btn').forEach(btn => {
            btn.onclick = () => {
                overlay.style.display = 'none';
                resolve(btn.dataset.piece);
            };
        });

        overlay.style.display = 'flex';
    });
}

//------------------------------------------------------------------------------
//
// function: animatePieceSlide
//
// arguments:
//  fromSquare, toSquare, pieceCode, callback
//
// returns:
//  nothing
//
// description:
//  Visually slides a piece from one square to another, then runs a callback
//
//------------------------------------------------------------------------------

function animatePieceSlide(fromSquare, toSquare, pieceCode) {
    return new Promise((resolve) => {
        const fromRect = fromSquare.getBoundingClientRect();
        const toRect   = toSquare.getBoundingClientRect();

        const imageMap = {
            wK: 'White-King',   wQ: 'White-Queen',  wR: 'White-Rook',
            wB: 'White-Bishop', wN: 'White-Knight', wP: 'White-Pawn',
            bK: 'Black-King',   bQ: 'Black-Queen',  bR: 'Black-Rook',
            bB: 'Black-Bishop', bN: 'Black-Knight', bP: 'Black-Pawn'
        };

        // Hide piece image only — keeps square background color visible
        fromSquare.classList.add('piece-hidden');

        const floater = document.createElement('div');
        floater.className = 'piece-sliding';
        floater.style.backgroundImage = `url('/static/images/pieces/${imageMap[pieceCode]}.png')`;
        floater.style.left = `${fromRect.left + window.scrollX}px`;
        floater.style.top  = `${fromRect.top  + window.scrollY}px`;
        document.body.appendChild(floater);

        let finished = false;
        function finish() {
            if (finished) return;
            finished = true;
            fromSquare.classList.remove('piece-hidden');
            floater.remove();
            resolve();
        }

        const safetyTimer = setTimeout(finish, 350);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                floater.style.left = `${toRect.left + window.scrollX}px`;
                floater.style.top  = `${toRect.top  + window.scrollY}px`;
            });
        });

        floater.addEventListener('transitionend', () => {
            clearTimeout(safetyTimer);
            finish();
        }, { once: true });
    });
}

//------------------------------------------------------------------------------
//
// function: clearLegalMoveHints
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
// Clears all legal moves
//
//------------------------------------------------------------------------------

function clearLegalMoveHints() {
    document.querySelectorAll('.square.legal-hint').forEach(sq => {
        sq.classList.remove('legal-hint');
    });
}

//------------------------------------------------------------------------------
//
// function: showLegalMoveHints
//
// arguments:
//  fromPosition
//
// returns:
//  nothing
//
// description:
// Fetches legal moves for a selected piece and shows dots on valid squares
//
//------------------------------------------------------------------------------

async function showLegalMoveHints(fromPosition) {
    clearLegalMoveHints();
    try {
        const response = await fetch('/api/legal-moves', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: fromPosition })
        });
        const data = await response.json();
        if (data.status === 'success') {
            data.legal_moves.forEach(pos => {
                const sq = document.querySelector(`.square[data-position="${pos}"]`);
                if (sq) sq.classList.add('legal-hint');
            });
        }
    } catch (e) {
        console.warn('Could not fetch legal moves:', e);
    }
}

//------------------------------------------------------------------------------
//
// function: removePieceFromSquare
//
// arguments:
//  square: the target square element
//
// returns:
//  nothing
//
// description:
//  Removes any piece-related classes and attributes from the specified square.
//
//------------------------------------------------------------------------------

function removePieceFromSquare(square) {
    const pieceClasses = ['piece', 'piece-wK', 'piece-wQ', 'piece-wR', 'piece-wB', 'piece-wN', 'piece-wP', 
                         'piece-bK', 'piece-bQ', 'piece-bR', 'piece-bB', 'piece-bN', 'piece-bP'];
    square.classList.remove(...pieceClasses);
    delete square.dataset.piece;
    square.textContent = '';
}

// Handle square clicks
function handleSquareClick(square) {
    // Check if game has started
    if (!isGameStarted()) {
        document.getElementById('click-status').textContent = 'Please select a bot and start the game first!';
        return;
    }
    
    // Check if engine is connected (Pi or standalone)
    if (!piConnected) {
        document.getElementById('click-status').textContent = '🔴 Not ready - Please wait for connection...';
        return;
    }
    
    // Don't allow moves when game is paused
    if (isGamePaused) {
        document.getElementById('click-status').textContent = 'Game is paused. Click Play to resume.';
        return;
    }
    
    // In CPU vs CPU mode, don't allow user moves
    if (currentGameMode === "cpu_vs_cpu") {
        document.getElementById('click-status').textContent = 'CPU vs CPU mode - moves are automatic';
        return;
    }
    
    const position = square.dataset.position;
    const hasPiece = square.dataset.piece; // Check if square has a piece using dataset.piece
    
    // If no piece is selected and this square has a piece
    if (!selectedPiece && hasPiece) {
        selectPiece(square, position);
    } 
    // If we have a selected piece and click on another square
    else if (selectedPiece && selectedPiece.element !== square) {
        movePiece(square, position);
    }
    // Clicking the same square or empty square resets selection
    else {
        resetSelection();
    }
}

//------------------------------------------------------------------------------
//
// function: selectPiece
//
// arguments:
//  square: the target square element
//  position: chess coord string (e4)
//
// returns:
//  nothing
//
// description:
//  Marks square as Selected and Visually highlights the box
//
//------------------------------------------------------------------------------

// Select a piece Gets the actual Coords
function selectPiece(square, position) {
    selectedPiece = {
        element: square,
        position: position,
        pieceCode: square.dataset.piece
    };
    square.classList.add('selected');

    document.getElementById('click-status').textContent =
        `Selected: ${position} (${getPieceNameFromCode(square.dataset.piece)})`;

    // Show legal move dots in user_vs_cpu mode
    if (currentGameMode === 'user_vs_cpu') {
        showLegalMoveHints(position);
    }
}

//------------------------------------------------------------------------------
//
// function: movePiece
//
// arguments:
//  targetsquare: destination square DOM element
//  targetposition: coordinate string (e5)
//
// returns:
//  nothing
//
// description:
//  Sends a move to the back end and updates the board if it is successful
//  Handles invalid moves and connection errors gracefully
//
//------------------------------------------------------------------------------

async function movePiece(targetSquare, targetPosition) {
    const pieceCode = selectedPiece.element.dataset.piece;
    const fromPosition = selectedPiece.position;

    // Clear selection first
    selectedPiece.element.classList.remove('selected');
    selectedPiece = null;
    clearLegalMoveHints();

    // Check if this is a pawn promotion
    let promotionPiece = null;
    if (isPawnPromotion(pieceCode, fromPosition, targetPosition)) {
        document.getElementById('click-status').textContent = 'Choose a promotion piece...';
        promotionPiece = await showPromotionOverlay(pieceCode, fromPosition, targetPosition);
    }
    
    // Show loading state
    document.getElementById('click-status').textContent = 'Processing move...';
    
    // Send move to backend API
    sendMoveToBackend(pieceCode, fromPosition, targetPosition, promotionPiece)
        .then(response => {
            if (response.status === 'success') {
                // Move was accepted by the engine
                if (response.move_accepted) {
                    // Update the board using the Pi's board state
                    updateBoardFromPiState(response.board_state, fromPosition, targetPosition);

		    // Check if we are in check
		    updateCheckStatus(response);
		    
                    // Record and save
                    recordMove(pieceCode, fromPosition, targetPosition);
                    /////////////////saveBoardState();
		    // New
		    setTimeout(() => saveBoardState(), 400);

		    if (!response.is_check) {
			document.getElementById('click-status').textContent = 
			    `Moved ${getPieceNameFromCode(pieceCode)} from ${fromPosition} to ${targetPosition}`;
		    }
		    
                    // Update current player if provided
                    if (response.current_player) {
                        currentPlayer = response.current_player;
                    }
                    
                    // Check if game is over
                    if (response.game_over) {
                        handleGameEnd(response.winner);
                    } 
                    // ✅ Only call engine if move_accepted is TRUE and game not over
                    // In user_vs_cpu mode, always call engine after user move (user is white, engine is black)
                    // In cpu_vs_cpu mode, both sides are CPU, so always call engine
                    else if (response.move_accepted && currentGameMode === "user_vs_cpu") {
                        // User vs CPU: User just moved, now it's engine's turn (black)
                        setTimeout(() => {
                            getEngineMove();
                        }, 1000);
                    }
                } else {
                    // Move was rejected - don't update the board
                    document.getElementById('click-status').textContent = 
                        `Invalid move: ${fromPosition} to ${targetPosition}. Try refreshing the board.`;
                    
                    // Offer to sync the board state
                    setTimeout(() => {
                        if (confirm("Board state may be out of sync. Reset the game?")) {
                            resetGame();
                        }
                    }, 1000);
                }
            } else {
                // Error occurred
                document.getElementById('click-status').textContent = 
                    `Error: ${response.message}`;
            }
        })
        // Move Error
        .catch(error => {
            console.error('Move error:', error);
            document.getElementById('click-status').textContent = 
                'Connection error. Please try again.';
        });
}

//------------------------------------------------------------------------------
//
// function: sendMoveToBackend
//
// arguments:
//  pieceCode: string representing a Piece
//  fromPosition: starting coord
//  toPosition: ending coord
//
// returns:
//  JSON representation from the backend
//
// description:
//  Sends a POST move to the back end of the code
//
//------------------------------------------------------------------------------

async function sendMoveToBackend(pieceCode, fromPosition, toPosition, promotionPiece) {
    const moveData = {
        from: fromPosition,
        to: toPosition,
        piece: promotionPiece || pieceCode,
        move_number: moveNumber
    };
    
    try {
        const response = await fetch('/api/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(moveData)
        });
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

//------------------------------------------------------------------------------
//
// function: getEngineMove
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  sends a move request to the back end of the server via /api/moves.
//
//------------------------------------------------------------------------------

async function getEngineMove() {
    try {
	const statusEl = document.getElementById('click-status');
	if (!statusEl.textContent.includes('Check')) {
	    statusEl.textContent = 'Engine is thinking...';
	}
	
        // Send current game speed to backend so it can adjust engine thinking time
        const currentSpeed = gameSpeed || 10;
        const startTime = performance.now(); // Track timing
        
        const response = await fetch('/api/engine-move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_speed: currentSpeed
            })
        });
        
        const endTime = performance.now();
        const moveTime = endTime - startTime;
        
        const result = await response.json();

	if (isGamePaused) {
	    console.log('Engine move discarded — game was paused during fetch');
	    return null;
	}
	
        // If the backend reports game over (stalemate/checkmate/draw), handle it cleanly.
        // This avoids throwing errors / freezing when there are no legal moves.
        if (result && result.game_over) {
            const winner = result.winner || 'draw';
            console.log('Game over reported by engine-move endpoint. Winner:', winner);

            // Stop the CPU loop immediately to prevent it from continuing
            if (cpuMoveTimeout) {
                clearTimeout(cpuMoveTimeout);
                cpuMoveTimeout = null;
            }

            // Update the board to show the final position (checkmate/stalemate) before reset
            if (result.board_state) {
		updateBoardFromPiState(result.board_state, result.engine_move.from, result.engine_move.to);
                saveBoardState();
            }

	    // Show red border if checkmate
	    updateCheckStatus(result);
	    
            // In user_vs_cpu mode, end the game immediately here.
            if (currentGameMode === "user_vs_cpu") {
                handleGameEnd(winner);
                return { gameEnded: true }; // Return flag to indicate game ended
            } else {
                // In CPU vs CPU mode, handle game end and trigger auto-restart
                handleGameEnd(winner, false); // false = don't pause, we're auto-restarting
                
                document.getElementById('click-status').textContent = 
                    `Game Over! Winner: ${winner || 'Draw'}. Score - W:${gameScore.white} B:${gameScore.black} D:${gameScore.draws}`;
                
                // Wait so the user can see the checkmate/stalemate position before reset
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Reset the game for next round (this will auto-restart if autorestart is enabled)
                await resetGame();
                return { gameEnded: true }; // Return flag to indicate game ended
            }
        }
        
        // Check if we got an error - if engines aren't initialized, stop the loop
        if (result.status === 'error') {
            console.error('Engine move error:', result.message);
            // If engines aren't initialized, don't keep retrying
            if (result.message && result.message.includes('not initialized')) {
                console.log('Engines not initialized yet - stopping CPU loop');
                if (cpuMoveTimeout) {
                    clearTimeout(cpuMoveTimeout);
                    cpuMoveTimeout = null;
                }
                document.getElementById('click-status').textContent = 
                    'Error: Engines not ready. Please wait for game to initialize.';
                return;
            }
            // For other errors, throw to be caught by the catch block
            throw new Error(result.message);
        }
        
        // Log timing information
        const thinkingTime = (2000 / currentSpeed).toFixed(0);
        console.log(`Move completed in ${moveTime.toFixed(0)}ms (speed: ${currentSpeed} G/sec, engine thinking: ~${thinkingTime}ms)`);
        
        if (result.status === 'success' && result.engine_move) {
            // Update the board using the Pi's board state
            if (result.board_state) {
		updateBoardFromPiState(result.board_state, result.engine_move.from, result.engine_move.to);
            } else {
                // Fallback to individual move if no board state
                applyEngineMove(result.engine_move);
            }
            
            // Record the move
            recordMove(result.engine_move.piece, result.engine_move.from, result.engine_move.to);
            
            // Save board state
            ///////////////saveBoardState();
	    // New
	    setTimeout(() => saveBoardState(), 400);
	    
	    // Check if we are in check
	    updateCheckStatus(result);
	    
	    // Replace lines 479-480 with:
	    if (!result.is_check) {
		document.getElementById('click-status').textContent = 
		    `Engine moved: ${result.engine_move.from} to ${result.engine_move.to}`;
	    }
	    
	    // Update the Probability Bar if Possible
	    if (result.engine_move.wdl) {
		updateWDLBar(result.engine_move.wdl);
	    }
            
            // Update current player from backend response
            if (result.current_player) {
                currentPlayer = result.current_player;
            }
            
            // Check if game is over
            if (result.game_over) {
                // In CPU vs CPU mode, let cpuMoveLoop() handle game end and restart
                // Only handle game end here for user_vs_cpu mode
                if (currentGameMode === "user_vs_cpu") {
                    handleGameEnd(result.winner);
                    // Stop the CPU loop if it's running
                    if (cpuMoveTimeout) {
                        clearTimeout(cpuMoveTimeout);
                        cpuMoveTimeout = null;
                    }
                }
                // For CPU vs CPU, cpuMoveLoop will detect game_over via /api/board-state
                // and handle the restart automatically
            } else {
                // Game is not over - continue
                // In CPU vs CPU mode, DO NOT recursively call getEngineMove here
                // The cpuMoveLoop() function handles the loop - calling it here causes duplicate API calls
                // In user_vs_cpu mode, after engine move, it's user's turn again
                if (currentGameMode === "user_vs_cpu" && !isGamePaused && !result.is_check) {
                    document.getElementById('click-status').textContent = 
                        'Your turn! Make your move.';
                }
                // Note: cpuMoveLoop() will handle the next move in CPU vs CPU mode
            }
        // click error
        } else {
            document.getElementById('click-status').textContent = 
                `Engine error: ${result.message}`;
        }
    // Move Error
    } catch (error) {
        console.error('Engine move error:', error);
        document.getElementById('click-status').textContent = 
            'Failed to get engine move. Please try again.';
    }
}

//------------------------------------------------------------------------------
//
// function: handleGameEnd
//
// arguments:
//  winner: string representing the winner ('white', 'black', or 'draw')
//
// returns:
//  nothing
//
// description:
//  Handles game end by updating the score, displaying the result, and
//  automatically restarting if autorestart is enabled
//
//------------------------------------------------------------------------------

function handleGameEnd(winner, shouldPause = true) {
    // Update the score
    if (winner === 'white') {
        gameScore.white++;
    } else if (winner === 'black') {
        gameScore.black++;
    } else {
        gameScore.draws++;
    }
    
    // Update score display
    updateScoreDisplay();
    
    // Show score panel if it's hidden
    const scorePanel = document.getElementById('score-panel');
    if (scorePanel) {
        scorePanel.style.display = 'block';
    }
    
    // Display game over message in status bar
    document.getElementById('click-status').textContent = 
        `Game Over! Winner: ${winner || 'Draw'}`;
    
    // In user_vs_cpu mode, show the game-over overlay instead of just pausing
    if (currentGameMode === 'user_vs_cpu') {
        isGamePaused = true;
        updateGameControls();
        showGameOverOverlay(winner);
        console.log(`Game ended. Winner: ${winner}. Current score - White: ${gameScore.white}, Black: ${gameScore.black}, Draws: ${gameScore.draws}`);
        return;
    }

    // Only pause if requested (don't pause in CPU vs CPU auto-restart mode)
    if (shouldPause) {
        isGamePaused = true;
        updateGameControls();
    }
    
    console.log(`Game ended. Winner: ${winner}. Current score - White: ${gameScore.white}, Black: ${gameScore.black}, Draws: ${gameScore.draws}`);
}

//------------------------------------------------------------------------------
//
// function: showGameOverOverlay
//
// arguments:
//  winner: string ('white', 'black', or 'draw')
//
// returns:
//  nothing
//
// description:
//  Displays the game-over overlay with the result message for Player vs CPU mode.
//
//------------------------------------------------------------------------------

function showGameOverOverlay(winner) {
    const overlay = document.getElementById('game-over-overlay');
    const title   = document.getElementById('game-over-title');
    const message = document.getElementById('game-over-message');

    // Build a human-readable result string
    let resultText = '';
    if (winner === 'white') {
        resultText = '⬜ White wins!';
    } else if (winner === 'black') {
        resultText = '⬛ Black wins!';
    } else {
        resultText = "It's a Draw!";
    }

    title.textContent   = 'Game Over';
    message.textContent = `${resultText}  |  Score — White: ${gameScore.white}  Black: ${gameScore.black}  Draws: ${gameScore.draws}`;

    overlay.style.display = 'flex';
}

//------------------------------------------------------------------------------
//
// function: updateScoreDisplay
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Updates the score panel UI with current game scores
//
//------------------------------------------------------------------------------

function updateScoreDisplay() {
    document.getElementById('white-player-wins').textContent = `Wins: ${gameScore.white}`;
    document.getElementById('black-player-wins').textContent = `Wins: ${gameScore.black}`;
}

//------------------------------------------------------------------------------
//
// function: updateBoardFromPiState
//
// arguments:
//  boardState: direction mapping positions to piece symbols
//
// returns:
//  nothing
//
// description:
//  Updates entire board state based on the board state sent from PI
//
//------------------------------------------------------------------------------
function updateBoardFromPiState(boardState, animateFrom, animateTo) {
    if (animateFrom && animateTo) {
        const fromSquare = document.querySelector(`.square[data-position="${animateFrom}"]`);
        const toSquare   = document.querySelector(`.square[data-position="${animateTo}"]`);
        const pieceCode  = fromSquare ? fromSquare.dataset.piece : null;

        if (fromSquare && toSquare && pieceCode) {

            // Detect castling: king moves exactly 2 files
            const fromFile = animateFrom.charCodeAt(0);
            const toFile   = animateTo.charCodeAt(0);
            const isCastle = (pieceCode === 'wK' || pieceCode === 'bK')
                             && Math.abs(fromFile - toFile) === 2;

            if (isCastle) {
                const rank = animateFrom[1]; // '1' for white, '8' for black

                // Work out rook from/to based on kingside vs queenside
                let rookFrom, rookTo;
                if (toFile > fromFile) {
                    // Kingside — rook moves h→f
                    rookFrom = 'h' + rank;
                    rookTo   = 'f' + rank;
                } else {
                    // Queenside — rook moves a→d
                    rookFrom = 'a' + rank;
                    rookTo   = 'd' + rank;
                }

                const rookFromSq = document.querySelector(`.square[data-position="${rookFrom}"]`);
                const rookToSq   = document.querySelector(`.square[data-position="${rookTo}"]`);
                const rookCode   = pieceCode === 'wK' ? 'wR' : 'bR';

                // Animate king and rook simultaneously, apply board state when both finish
                const animations = [animatePieceSlide(fromSquare, toSquare, pieceCode)];
                if (rookFromSq && rookToSq) {
                    animations.push(animatePieceSlide(rookFromSq, rookToSq, rookCode));
                }

                Promise.all(animations).then(() => applyBoardState(boardState));
                return;
            }

            // Normal move
            animatePieceSlide(fromSquare, toSquare, pieceCode)
                .then(() => applyBoardState(boardState));
            return;
        }
    }
    // No animation info — apply immediately
    applyBoardState(boardState);
}

function applyBoardState(boardState) {
    document.querySelectorAll('.square').forEach(sq => removePieceFromSquare(sq));
    for (const [position, pieceSymbol] of Object.entries(boardState)) {
        const square = document.querySelector(`.square[data-position="${position}"]`);
        if (square) {
            const pieceCode = convertPieceSymbolToCode(pieceSymbol);
            if (pieceCode) addPieceToSquare(square, pieceCode);
        }
    }
}

//------------------------------------------------------------------------------
//
// function: convertPieceSymbolToCode
//
// arguments:
//  pieceSymbol: maps single char string to a 2 char string (assigns upper and lowercase char to white or black)
//
// returns:
//  nothing
//
// description:
//  Converts FEN-style(base way stockfish prints) pieces to internal UI representation
//
//------------------------------------------------------------------------------

function convertPieceSymbolToCode(pieceSymbol) {
    const pieceMap = {
        'K': 'wK', 'Q': 'wQ', 'R': 'wR', 'B': 'wB', 'N': 'wN', 'P': 'wP',
        'k': 'bK', 'q': 'bQ', 'r': 'bR', 'b': 'bB', 'n': 'bN', 'p': 'bP'
    };
    return pieceMap[pieceSymbol] || null;
}

//------------------------------------------------------------------------------
//
// function: applyEngineMove
//
// arguments:
//  engineMove: object containing (from ' ' to ' ' piece)
//
// returns:
//  nothing
//
// description:
//  Applies the engines move on the front end of the board, when full state is unavalible
//
//------------------------------------------------------------------------------

function applyEngineMove(engineMove) {
    const fromSquare = document.querySelector(`.square[data-position="${engineMove.from}"]`);
    const toSquare = document.querySelector(`.square[data-position="${engineMove.to}"]`);
    
    if (fromSquare && toSquare) {
        const pieceCode = fromSquare.dataset.piece;
        
        // Remove piece from original square
        removePieceFromSquare(fromSquare);
        
        // Add piece to target square
        addPieceToSquare(toSquare, pieceCode);
    }
}

//------------------------------------------------------------------------------
//
// function: resetGame
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Sends reset command to backend and restores the board to its initial configuration on the front end
//
//------------------------------------------------------------------------------

async function resetGame() {
    try {
        // Stop the CPU loop if it's running
        if (cpuMoveTimeout) {
            clearTimeout(cpuMoveTimeout);
            cpuMoveTimeout = null;
        }

	// Store the previous game state to know if we should auto-restart
	const wasGameStarted = gameStarted;
	const previousGameMode = currentGameMode;
	
	// Prevent any moves during reset
	gameStarted = false;
	isGamePaused = true;
        
        document.getElementById('click-status').textContent = 'Resetting game...';
        
        // Send reset command to backend
        const response = await fetch('/api/game-control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command: 'reset' })
        });
        
        const result = await response.json();
	
        if (result.status === 'success') {
            // Reset the frontend board to starting position
            setupPieces();
	    document.getElementById('chessboard').classList.remove('in-check');
	    gameMoves = [];
	    boardHistory = [];
	    moveNumber = 1;
	    currentMoveIdx = -1;

	    saveBoardState();
	    initializeMovesPanel();
	    
	    // Check if we should auto-restart (CPU vs CPU mode with autorestart enabled)
	    if (autorestart === true && wasGameStarted && previousGameMode === "cpu_vs_cpu") {
		// Auto Restart the game
		console.log('Auto-restarting game...');
		document.getElementById('click-status').textContent = 'Auto-restarting game...';

		// Give the backend time to fully clean up engine state
		await new Promise(resolve => setTimeout(resolve, 1500));

		// Re-enable Game
		gameStarted = true;
		isGamePaused = false;
		currentPlayer = 'white';

		// Update the UI
		document.getElementById('click-status').textContent = 'Game restarted! Playing...';

		// Wait a moment for UI to update
                await new Promise(resolve => setTimeout(resolve, 500));

		// Now start the loop again
		console.log('Starting new game loop...');
		cpuMoveLoop();
	    } else {
		// Manual reset or user vs CPU mode - go back to the menu
		resetToBotSelector();
		document.getElementById('click-status').textContent = 'Game reset successfully! Select a bot to start a new game.';
	    }
        } else {
            document.getElementById('click-status').textContent = `Reset failed: ${result.message}`;
	    gameStarted = wasGameStarted; // Restore previous state on failure
	    isGamePaused = false;
	}
    // Reset Error
    } catch (error) {
        console.error('Reset error:', error);
        document.getElementById('click-status').textContent = 'Failed to reset game.';
	// Try to recover by stopping everything
        gameStarted = false;
        isGamePaused = true;
        if (cpuMoveTimeout) {
            clearTimeout(cpuMoveTimeout);
            cpuMoveTimeout = null;
        }
    }
}

// UpdateCheckStatus function for check
function updateCheckStatus(data) {
    const statusElement = document.getElementById('click-status');
    const boardElement = document.getElementById('chessboard');
    
    if (!statusElement || !boardElement) return;

    // Clear any old inline styles that would override the CSS class
    boardElement.style.border = '';
    boardElement.style.borderColor = '';
    boardElement.style.boxShadow = '';

    if (data.is_check === true) {
	const kingColor = data.current_player === 'white' ? 'White' : 'Black';
	// CHANGE: shorter message that fits under the board naturally
	statusElement.textContent = `⚠️ ${kingColor} is in Check!`;
	statusElement.style.color = 'red';
	statusElement.style.fontWeight = 'bold';
	boardElement.classList.add('in-check');
    } else {
        statusElement.style.color = '';
        statusElement.style.fontWeight = 'normal';
        boardElement.classList.remove('in-check');
        if (statusElement.textContent.includes('CHECK!')) {
            statusElement.textContent = '';
        }
    }
}
//
// End of file
