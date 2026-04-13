/* 
Main JavaScript - Initialization and global variables
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/static/CSS/main.js
*/

//------------------------------------------------------------------------------
//
// Global Variables
//
// description:
//  These variables manage the overall game state, connection status, and
//  timing control for the AI Chess GUI.
//
//------------------------------------------------------------------------------

let selectedPiece = null;
let gameMoves = [];
let currentDiffPage = 1;
let moveNumber = 1;
let isGamePaused = false; // Tracks if the game is Pausesd
let currentMoveIndex = -1; // -1 means at the beginning, 0+ means at that move
let boardHistory = []; // Store board states for navigation
let gameSpeed = 10; // Game speed in G/sec
let piConnected = false;
let connectionCheckInterval = null;
let currentGameMode = "user_vs_cpu"; // Track current game mode
let autorestart = true // See if autorestart is activated
let currentPlayer = "white"; // Track current player (white/black)
let cpuMoveTimeout = null; // To track the active loop
let interruptRequested = false; // Track if interrupt button was pressed
let gameScore = { white: 0, black: 0, draws: 0 }; // Track game scores

//------------------------------------------------------------------------------
//
// function: DOMContentLoaded
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Initializes the chessboard, pieces, control systems, and connection checks
//  once the web page is fully connected
//
//------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    createChessBoard();
    setupPieces();
    setupGameControls();
    checkPiConnection();
    startConnectionMonitoring();
    
    // Initially disable game controls until bot is selected
    disableGameControls();

        // --- Overlay mode & difficulty flow ---
    const modeOverlay = document.getElementById('mode-overlay');
    const difficultyOverlay = document.getElementById('difficulty-overlay');
    const overlayUserBtn = document.getElementById('overlay-user-vs-cpu');
    const overlayCpuBtn = document.getElementById('overlay-cpu-vs-cpu');
    const diffBackBtn = document.getElementById('difficulty-back-btn');
    const diffStartBtn = document.getElementById('difficulty-start-btn');
    const diffPrevPageBtn = document.getElementById('difficulty-prev-page-btn');
    const diffNextPageBtn = document.getElementById('difficulty-next-page-btn');
    const leftColumn = document.getElementById('left-difficulty-column');
    const rightColumn = document.getElementById('right-difficulty-column');
    const leftColumnModels = document.getElementById('left-difficulty-column-models');
    const rightColumnModels = document.getElementById('right-difficulty-column-models');
    const whiteCardsElo = document.getElementById('white-cards-elo');
    const blackCardsElo = document.getElementById('black-cards-elo');
    const whiteCardsModels = document.getElementById('white-cards-models');
    const blackCardsModels = document.getElementById('black-cards-models');
    const page1 = document.getElementById('difficulty-page-1');
    const page2 = document.getElementById('difficulty-page-2');

    // show first overlay on load
    if (modeOverlay) modeOverlay.style.display = 'flex';

    let chosenMode = null;
    let chosenWhiteElo = null;
    let chosenBlackElo = null;
    let chosenWhiteNNUE = false;
    let chosenBlackNNUE = false;
    let chosenWhiteNNUEModel = 'carlsen';
    let chosenBlackNNUEModel = 'carlsen';
    let currentDifficultyPage = 1;

    function clearSelectionIn(container) {
        const cards = container.querySelectorAll('.difficulty-card');
        cards.forEach(c=>c.classList.remove('selected'));
    }

    function addCardListeners(container, isWhite, isModelPage = false) {
        container.querySelectorAll('.difficulty-card').forEach(card => {
            card.addEventListener('click', () => {
                // single-select behaviour per column
                clearSelectionIn(container);
                card.classList.add('selected');
                
                if (isModelPage) {
                    // Model page: set NNUE model (clears ELO page selection)
                    const nnueModel = card.getAttribute('data-nnue-model');
                    const elo = parseInt(card.getAttribute('data-elo'));
                    if (isWhite) {
                        chosenWhiteNNUE = true;
                        chosenWhiteNNUEModel = nnueModel;
                        chosenWhiteElo = elo;
                        // Clear ELO page selection
                        clearSelectionIn(whiteCardsElo);
                    } else {
                        chosenBlackNNUE = true;
                        chosenBlackNNUEModel = nnueModel;
                        chosenBlackElo = elo;
                        // Clear ELO page selection
                        clearSelectionIn(blackCardsElo);
                    }
                } else {
                    // ELO page: set ELO (not NNUE) (clears model page selection)
                    const elo = parseInt(card.getAttribute('data-elo'));
                    const isNNUE = card.getAttribute('data-nnue') === 'true';
                    if (isWhite) {
                        chosenWhiteElo = elo;
                        chosenWhiteNNUE = isNNUE;
                        if (!isNNUE) {
                            chosenWhiteNNUEModel = 'carlsen'; // reset to default
                            // Clear model page selection
                            clearSelectionIn(whiteCardsModels);
                        }
                    } else {
                        chosenBlackElo = elo;
                        chosenBlackNNUE = isNNUE;
                        if (!isNNUE) {
                            chosenBlackNNUEModel = 'carlsen'; // reset to default
                            // Clear model page selection
                            clearSelectionIn(blackCardsModels);
                        }
                    }
                }

                // enable start when appropriate
                if (chosenMode === 'user_vs_cpu' && chosenBlackElo) diffStartBtn.disabled = false;
                if (chosenMode === 'cpu_vs_cpu' && chosenWhiteElo && chosenBlackElo) diffStartBtn.disabled = false;
            });
        });
    }

    function showDifficultyPage(pageNum) {

        const pages = [
            document.getElementById('difficulty-page-1'),
            document.getElementById('difficulty-page-2')
        ];
            
        pages.forEach(p => { if(p) p.style.display = 'none'; });

        // Show the specific page requested
        const targetPage = document.getElementById(`difficulty-page-${pageNum}`);
        if (targetPage) {
            targetPage.style.display = 'block';
        }

        // Update the title and buttons based on the page number
        const title = document.getElementById('difficulty-title');
        const nextBtn = document.getElementById('difficulty-next-page-btn');
        const prevBtn = document.getElementById('difficulty-prev-page-btn');

        if (pageNum === 1) {
            title.textContent = "Select Elo Difficulty";
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'inline-block';
        } else if (pageNum === 2) {
            title.textContent = "Select Pro Player Models";
            prevBtn.style.display = 'inline-block';
	}
    }

    overlayUserBtn.addEventListener('click', () => {
        chosenMode = 'user_vs_cpu';
        // show only the right column (CPU)
        leftColumn.style.display = 'none';
        rightColumn.style.display = 'block';
        leftColumnModels.style.display = 'none';
        rightColumnModels.style.display = 'block';
        document.getElementById('right-column-title').textContent = 'CPU Engine';
        document.getElementById('right-column-title-models').textContent = 'CPU Engine';
        // document.getElementById('difficulty-title').textContent = 'Select CPU Difficulty';
	// Add this line to make the transition feel contextual
	document.getElementById('difficulty-title').textContent = "Configure Your Opponent";
        // reset
        clearSelectionIn(blackCardsElo);
        clearSelectionIn(blackCardsModels);
        chosenWhiteElo = null; chosenBlackElo = null;
        chosenWhiteNNUE = false; chosenBlackNNUE = false;
        chosenWhiteNNUEModel = 'carlsen';
        chosenBlackNNUEModel = 'carlsen';
        diffStartBtn.disabled = true;
        showDifficultyPage(1);
        modeOverlay.style.display = 'none';
        difficultyOverlay.style.display = 'flex';
    });

    overlayCpuBtn.addEventListener('click', () => {
        chosenMode = 'cpu_vs_cpu';
        leftColumn.style.display = 'block';
        rightColumn.style.display = 'block';
        leftColumnModels.style.display = 'block';
        rightColumnModels.style.display = 'block';
        document.getElementById('difficulty-title').textContent = 'Select White and Black Difficulty';
        clearSelectionIn(whiteCardsElo); clearSelectionIn(blackCardsElo);
        clearSelectionIn(whiteCardsModels); clearSelectionIn(blackCardsModels);
        chosenWhiteElo = null; chosenBlackElo = null;
        chosenWhiteNNUE = false; chosenBlackNNUE = false;
        chosenWhiteNNUEModel = 'carlsen';
        chosenBlackNNUEModel = 'carlsen';
        diffStartBtn.disabled = true;
        showDifficultyPage(1);
        modeOverlay.style.display = 'none';
        difficultyOverlay.style.display = 'flex';
    });

    diffBackBtn.addEventListener('click', () => {
        difficultyOverlay.style.display = 'none';
        modeOverlay.style.display = 'flex';
        currentDiffPage = 1;
        showDifficultyPage(currentDiffPage);
    });

    diffPrevPageBtn.addEventListener('click', () => {
        if (currentDiffPage > 1) {
            currentDiffPage--;
            showDifficultyPage(currentDiffPage);
        }
    });

    diffNextPageBtn.addEventListener('click', () => {
        if (currentDiffPage < 2) {
            currentDiffPage++;
            showDifficultyPage(currentDiffPage);
	    diffNextPageBtn.style.display = 'none';
	    diffPrevPageBtn.style.display = 'inline-block';
        }
    });

    // add listeners to card pools
    addCardListeners(blackCardsElo, false, false);
    addCardListeners(whiteCardsElo, true, false);
    addCardListeners(blackCardsModels, false, true);
    addCardListeners(whiteCardsModels, true, true);

    diffStartBtn.addEventListener('click', async () => {
    let payload = { mode: chosenMode };

    if (chosenMode === 'user_vs_cpu') {
        payload.black_elo = chosenBlackElo;
        payload.black_nnue = chosenBlackNNUE;
        if (chosenBlackNNUE) payload.black_nnue_model = chosenBlackNNUEModel;

        // Call the functions now that they are global
        updatePlayerNames('You (White)', formatPlayerName(chosenBlackElo, chosenBlackNNUE, chosenBlackNNUEModel));
    } else {
        payload.white_elo = chosenWhiteElo;
        payload.black_elo = chosenBlackElo;
        payload.white_nnue = chosenWhiteNNUE;
        payload.black_nnue = chosenBlackNNUE;
        if (chosenWhiteNNUE) payload.white_nnue_model = chosenWhiteNNUEModel;
        if (chosenBlackNNUE) payload.black_nnue_model = chosenBlackNNUEModel;

        updatePlayerNames(
            formatPlayerName(chosenWhiteElo, chosenWhiteNNUE, chosenWhiteNNUEModel),
            formatPlayerName(chosenBlackElo, chosenBlackNNUE, chosenBlackNNUEModel)
        );
    }

    updateScoreUI(); // Sync the 0-0 score display

    // Handle NNUE models in payload
    if (chosenWhiteNNUE) {
        payload.white_nnue_model = chosenWhiteNNUEModel;
    }
    if (chosenBlackNNUE) {
        payload.black_nnue_model = chosenBlackNNUEModel;
    }

    // Refresh the win count display
    if (typeof updateScoreUI === 'function') {
        updateScoreUI();
    }

        // POST to server
        try {
            const response = await fetch('/api/set-game-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Set global game mode
                currentGameMode = chosenMode;
                
                // Hide overlays
                difficultyOverlay.style.display = 'none';
                modeOverlay.style.display = 'none';
                
                // Hide bot selector and show game moves
                const botSelector = document.getElementById('bot-selector');
                const gameMoves = document.getElementById('game-moves');
                if (botSelector) botSelector.style.display = 'none';
                if (gameMoves) gameMoves.style.display = 'block';
                
                // Initialize game state
                gameStarted = true;
                currentPlayer = 'white'; // Always start with white
                
                // Reset board to starting position
                setupPieces();
                initializeMovesPanel();
                saveBoardState();
                
                // Enable game controls
                enableGameControls();
                
                // Start game based on mode
                if (chosenMode === 'cpu_vs_cpu') {
                    autorestart = true; // Ensure auto-restart is active for CPU vs CPU
                    // CPU vs CPU: Start automatic play
                    document.getElementById('click-status').textContent = 
                        `CPU vs CPU game started! White: ${chosenWhiteElo} ELO, Black: ${chosenBlackElo} ELO`;
                    // Wait a moment for backend to fully initialize engines, then start the loop
                    // This prevents 400 errors from trying to make moves before engines are ready
                    setTimeout(() => {
                        cpuMoveLoop();
                    }, 500);
                } else {
                    // User vs CPU: User plays white, wait for user move
                    document.getElementById('click-status').textContent = 
                        `Game started! You are White. CPU (Black) is ${chosenBlackElo} ELO. Make your move!`;
                }
            } else {
                alert('Error setting mode: ' + (data.message || 'unknown'));
                difficultyOverlay.style.display = 'flex';
            }
        } catch (err) {
            console.error('Failed to set mode', err);
            alert('Failed to contact server');
            difficultyOverlay.style.display = 'flex';
        }
    });

    // -----------------------------------------------------------------------
    // INTERRUPT BUTTON — stops CPU vs CPU loop and returns to mode select
    // -----------------------------------------------------------------------
    const interruptBtn = document.getElementById('interrupt-btn');
    if (interruptBtn) {
	interruptBtn.addEventListener('click', async () => {
	    // REMOVED: the old guard that blocked user_vs_cpu — interrupt should work in ALL modes
	    console.log('Interrupt requested — stopping game');
	    interruptRequested = true;
	    
	    // Stop any running CPU loop
	    if (cpuMoveTimeout) {
		clearTimeout(cpuMoveTimeout);
		cpuMoveTimeout = null;
	    }
	    
	    // Reset scores and game state
	    gameScore.white = 0;
	    gameScore.black = 0;
	    gameScore.draws = 0;
	    if (typeof updateScoreUI === 'function') updateScoreUI();
	    
	    // Reset backend
	    try {
		await fetch('/api/game-control', {
		    method: 'POST',
		    headers: { 'Content-Type': 'application/json' },
		    body: JSON.stringify({ command: 'reset' })
		});
	    } catch (err) {
		console.error('Interrupt reset error:', err);
	    }
	    
	    // Reset frontend
	    setupPieces();
	    clearLegalMoveHints();
	    document.getElementById('chessboard').classList.remove('in-check');
	    gameMoves = [];
	    boardHistory = [];
	    moveNumber = 1;
	    if (typeof currentMoveIdx !== 'undefined') currentMoveIdx = -1;
	    gameStarted = false;
	    isGamePaused = false;
	    currentPlayer = 'white';
	    autorestart = false;
	    initializeMovesPanel();
	    interruptRequested = false;
	    
	    // Return to mode-select overlay
	    modeOverlay.style.display = 'flex';
	    difficultyOverlay.style.display = 'none';
	    document.getElementById('click-status').textContent = 'Select game mode to start playing';
	});
    }

    // -----------------------------------------------------------------------
    // OVERLAY 3: GAME-OVER button handlers (Player vs CPU only)
    // -----------------------------------------------------------------------
    const gameOverOverlay      = document.getElementById('game-over-overlay');
    const continuePlayingBtn   = document.getElementById('continue-playing-btn');
    const newOpponentBtn       = document.getElementById('new-opponent-btn');

    // -----------------------------------------------------------------------
    // VIEW BOARD — dismiss overlay so player can study the final position
    // -----------------------------------------------------------------------
    const viewBoardBtn    = document.getElementById('view-board-btn');
    const viewBoardBanner = document.getElementById('view-board-banner');

    if (viewBoardBtn) {
	viewBoardBtn.addEventListener('click', () => {
            gameOverOverlay.style.display = 'none';
            viewBoardBanner.style.display = 'block';
	});
    }

    // Clicking the floating banner brings the overlay back
    if (viewBoardBanner) {
	viewBoardBanner.addEventListener('click', () => {
            viewBoardBanner.style.display = 'none';
            gameOverOverlay.style.display = 'flex';
	});
    }

    // Space bar toggles between viewing board and seeing the overlay
    document.addEventListener('keydown', (e) => {
	if (e.code !== 'Space') return;
	// Only act when game is over (banner or overlay is visible)
	const bannerVisible  = viewBoardBanner  && viewBoardBanner.style.display  !== 'none';
	const overlayVisible = gameOverOverlay  && gameOverOverlay.style.display  !== 'none';
	if (!bannerVisible && !overlayVisible) return;

	e.preventDefault(); // stop page scroll on space
	if (overlayVisible) {
            gameOverOverlay.style.display  = 'none';
            viewBoardBanner.style.display  = 'block';
	} else {
            viewBoardBanner.style.display  = 'none';
            gameOverOverlay.style.display  = 'flex';
	}
    });
    
    if (continuePlayingBtn) {
        continuePlayingBtn.addEventListener('click', async () => {
            // Hide the overlay immediately so the user sees the board reset
            gameOverOverlay.style.display = 'none';
 
            // Update the score UI (score was already incremented in handleGameEnd)
            if (typeof updateScoreUI === 'function') updateScoreUI();

            // Reset the backend + board, then start a fresh game automatically
            try {
                const response = await fetch('/api/game-control', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: 'reset' })
                });
                const result = await response.json();

                if (result.status === 'success') {
                    // Reset frontend state
                    setupPieces();
                    gameMoves = [];
                    boardHistory = [];
                    moveNumber = 1;
                    if (typeof currentMoveIdx !== 'undefined') currentMoveIdx = -1;
                    saveBoardState();
                    initializeMovesPanel();
		    document.getElementById('chessboard').classList.remove('in-check'); 
		    updateCheckStatus({ is_check: false }); 
		    
                    // Un-pause and restart
                    gameStarted = true;
		     // set the Game to be unpaused
		    isGamePaused = false
                    currentPlayer = 'white';
		    updateGameControls();
		    
		    
                    document.getElementById('click-status').textContent =
                        'New game started! You are White. Make your move!';
                } else {
                    console.error('Reset failed:', result.message);
                    document.getElementById('click-status').textContent =
                        'Reset failed — please try again.';
                }
            } catch (err) {
                console.error('Continue playing error:', err);
                document.getElementById('click-status').textContent =
                    'Connection error during reset. Please refresh.';
            }
        });
    }

    if (newOpponentBtn) {
        newOpponentBtn.addEventListener('click', async () => {
            gameOverOverlay.style.display = 'none';

            // Reset scores completely
            gameScore.white  = 0;
            gameScore.black  = 0;
            gameScore.draws  = 0;
            if (typeof updateScoreUI === 'function') updateScoreUI();

            // Stop any running CPU loop
            if (cpuMoveTimeout) {
                clearTimeout(cpuMoveTimeout);
                cpuMoveTimeout = null;
            }

            // Reset backend
            try {
                await fetch('/api/game-control', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: 'reset' })
                });
            } catch (err) {
                console.error('Reset error on new opponent:', err);
            }

            // Reset frontend board
            setupPieces();
            gameMoves = [];
            boardHistory = [];
            moveNumber = 1;
            if (typeof currentMoveIdx !== 'undefined') currentMoveIdx = -1;
            gameStarted = false;
            isGamePaused = false;
            currentPlayer = 'white';
            initializeMovesPanel();

            // Return to mode-select overlay
            modeOverlay.style.display = 'flex';
            difficultyOverlay.style.display = 'none';
            document.getElementById('click-status').textContent = 'Select game mode to start playing';
        });
    }

    
    
    // Game mode UI logic
    const gameModeSelect = document.getElementById("game-mode");
    if (gameModeSelect) {
	const userCpuBox = document.getElementById("user-vs-cpu-difficulty");
	const cpuCpuBox = document.getElementById("cpu-vs-cpu-difficulty");

	gameModeSelect.addEventListener("change", () => {
            const startCpuVsCpuBtn = document.getElementById("start-cpu-vs-cpu-btn");
            if (gameModeSelect.value === "user_vs_cpu") {
		if (userCpuBox) userCpuBox.style.display = "block";
		if (cpuCpuBox) cpuCpuBox.style.display = "none";
		// if (startCpuVsCpuBtn) startCpuVsCpuBtn.style.display = "none";
            } else {
		if (userCpuBox) userCpuBox.style.display = "none";
		if (cpuCpuBox) cpuCpuBox.style.display = "block";
		// if (startCpuVsCpuBtn) startCpuVsCpuBtn.style.display = "block";
            }
	});
    }
    
    // Add event listener for start CPU vs CPU button
    const startCpuVsCpuBtn = document.getElementById("start-cpu-vs-cpu-btn");
    if (startCpuVsCpuBtn) {
        startCpuVsCpuBtn.addEventListener("click", () => {
            // First set the game mode, then start the game
            const mode = document.getElementById("game-mode").value;
            let payload = { mode };
            payload.white_elo = parseInt(document.getElementById("white-elo").value);
            payload.black_elo = parseInt(document.getElementById("black-elo").value);
            
            fetch("/api/set-game-mode", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === "success") {
                    currentGameMode = mode;
                    startCpuVsCpuGame();
                } else {
                    alert("Error: " + data.message);
                }
            })
            .catch(error => {
                console.error("Error setting game mode:", error);
                alert("Failed to set game mode. Please try again.");
            });
        });
    }
});

//------------------------------------------------------------------------------
//
// function: checkPiConnection
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Sends connection to the backend to check if the Raspberry PI is connected.
//  Updates global connection status and user interface accordingly
//
//------------------------------------------------------------------------------

async function checkPiConnection() {
    try {
        const response = await fetch('/api/pi-status');
        const result = await response.json();
        
        if (result.status === 'connected') {
            piConnected = true;
            // Check if it's standalone mode (has engine_connected field)
            if (result.engine_connected !== undefined) {
                updateConnectionStatus('Standalone mode - Chess engine ready', 'connected');
            } else {
                updateConnectionStatus('Connected to Raspberry Pi', 'connected');
            }
        } else {
            piConnected = false;
            updateConnectionStatus('Disconnected from Raspberry Pi', 'disconnected');
        }
    } catch (error) {
        piConnected = false;
        updateConnectionStatus('Cannot connect to Raspberry Pi', 'disconnected');
    }
}

//------------------------------------------------------------------------------
//
// function: startConnectionMonitoring
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Continuosly monitors the Raspberry PI connection every 10 seconds
//  by repeading 'checkPiConnection' function
//
//------------------------------------------------------------------------------

function startConnectionMonitoring() {
    // Check connection every 10 seconds
    connectionCheckInterval = setInterval(checkPiConnection, 10000);
}

//------------------------------------------------------------------------------
//
// function: updateConnectionStatus
//
// arguments:
//  message: string representing the connection status message
//  status: string either "connected" or "disconnected"
//
// returns:
//  nothing
//
// description:
//  Updates the UI element showing the current state of the PI
//  including visual indicator and visual message
//
//------------------------------------------------------------------------------

function updateConnectionStatus(message, status) {
    const statusElement = document.getElementById('click-status');
    const originalText = statusElement.textContent;
    
    // Add connection indicator
    const indicator = status === 'connected' ? '🟢' : '🔴';
    statusElement.textContent = `${indicator} ${message}`;
    
    // If this was just a status check and not an error, restore original text after 2 seconds
    if (originalText !== 'Click on a square to test interaction' && 
        !originalText.includes('Error:') && 
        !originalText.includes('Processing') &&
        !originalText.includes('Engine is thinking')) {
        setTimeout(() => {
            if (statusElement.textContent === `${indicator} ${message}`) {
                statusElement.textContent = originalText;
            }
        }, 2000);
    }
}

//------------------------------------------------------------------------------
//
// function: resetSelection
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Clears any currently selected chess piece and updates the status message
//  depending on the connection state to the raspberry PI
//
//------------------------------------------------------------------------------

function resetSelection() {
    if (selectedPiece) {
        selectedPiece.element.classList.remove('selected');
        selectedPiece = null;
	clearLegalMoveHints(); 
    }
    
    if (piConnected) {
        document.getElementById('click-status').textContent = 'Click on a square to test interaction';
    } else {
        document.getElementById('click-status').textContent = '🔴 Not connected - Please wait...';
    }
}


//------------------------------------------------------------------------------
//
// NOTE: The old event listener for overlay-cpu-vs-cpu has been removed.
// The new flow uses the overlay system in the DOMContentLoaded event above.
// When user clicks "Start Game" after selecting ELOs, it calls /api/set-game-mode
// which properly initializes the engines, THEN starts cpuMoveLoop().
//
// This prevents 400 errors from trying to make moves before engines are initialized.
//
//------------------------------------------------------------------------------

//
// End of file
