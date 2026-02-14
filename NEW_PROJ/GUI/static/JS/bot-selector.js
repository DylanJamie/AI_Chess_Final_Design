// Bot Selector JavaScript - Handle bot selection and game initialization
// Date: 10/08/2025
// file: /AI_Chess_Senior_Design/GUI/static/JS/bot-selector.js

// Global variables for bot selection & game state
let selectedBot = null;
let gameStarted = false;

//------------------------------------------------------------------------------
//
// function: initializeBotSelector
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Sets up event listeners fro bot selection and start game button.
//------------------------------------------------------------------------------

function initializeBotSelector() {
    // No longer needed - overlays handle bot selection now
    // This function is kept for compatibility with main.js
    console.log("Bot selector initialized (using overlay mode)");
}

//------------------------------------------------------------------------------
//
// function: selectBot
//
// arguments:
//  botElement
//
// returns:
//  nothing
//
// description:
//  Highlights the selected bot and stores its information globally
//------------------------------------------------------------------------------

function selectBot(botElement) {
    // Remove previous selection
    document.querySelectorAll('.bot-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked bot
    botElement.classList.add('selected');
    
    // Store selected bot data
    selectedBot = {
        name: botElement.querySelector('.bot-name').textContent,
        elo: botElement.dataset.elo,
        skill: botElement.dataset.skill
    };
    
    // Show selected bot info
    showSelectedBotInfo();
}

//------------------------------------------------------------------------------
//
// function: showSelectedBotInfo
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Displays the selected bot's name and ELO rating in the UI
//------------------------------------------------------------------------------

function showSelectedBotInfo() {
    const selectedBotInfo = document.getElementById('selected-bot-info');
    const selectedBotName = document.getElementById('selected-bot-name');
    const selectedBotElo = document.getElementById('selected-bot-elo');
    
    selectedBotName.textContent = selectedBot.name;
    selectedBotElo.textContent = `${selectedBot.elo} ELO`;
    selectedBotInfo.style.display = 'block';
}

//------------------------------------------------------------------------------
//
// function: startGame
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Initializes a new game using the selected bot and updates the board state.
//------------------------------------------------------------------------------

async function startGame() {
    // For CPU vs CPU mode, skip bot selection
    if (currentGameMode === "cpu_vs_cpu") {
        await startCpuVsCpuGame();
        return;
    }
    
    // For user vs CPU mode, require bot selection
    if (!selectedBot) {
        alert('Please select a bot first!');
        return;
    }
    
    if (!piConnected) {
        alert('Cannot start game: Engine not ready. Please wait...');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('click-status').textContent = 'Starting game...';
        
        // Send bot selection to backend
        const response = await fetch('/api/set-bot-difficulty', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                elo: parseInt(selectedBot.elo),
                skill: parseInt(selectedBot.skill)
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            // Hide bot selector and show game moves
            document.getElementById('bot-selector').style.display = 'none';
            document.getElementById('game-moves').style.display = 'block';
            
            // Initialize game state
            gameStarted = true;
            initializeMovesPanel();
            
            // Update the board with the Pi's board state if provided
            if (result.board_state) {
                updateBoardFromPiState(result.board_state);
            } else {
                // Fallback: reset the board to starting position
                setupPieces();
            }
            
            // Save initial board state
            saveBoardState();
            
            // Update status
            document.getElementById('click-status').textContent = 
                `Game started! Playing against ${selectedBot.name} (${selectedBot.elo} ELO)`;
            
            // Enable game controls
            enableGameControls();
            
            // Show score panel
            const scorePanel = document.getElementById('score-panel');
            if (scorePanel) {
                scorePanel.style.display = 'block';
            }
            
        } else {
            document.getElementById('click-status').textContent = 
                `Failed to start game: ${result.message}`;
        }
        
    } catch (error) {
        console.error('Start game error:', error);
        document.getElementById('click-status').textContent = 
            'Failed to start game. Please try again.';
    }
}

//------------------------------------------------------------------------------
//
// function: startCpuVsCpuGame
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Starts a CPU vs CPU game without requiring bot selection
//------------------------------------------------------------------------------

async function startCpuVsCpuGame() {
    if (!piConnected) {
        alert('Cannot start game: Engine not ready. Please wait...');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('click-status').textContent = 'Starting CPU vs CPU game...';
        
        // Hide bot selector and show game moves
        document.getElementById('bot-selector').style.display = 'none';
        document.getElementById('game-moves').style.display = 'block';
        
        // Initialize game state
        gameStarted = true;
	isGamePaused = false;
	currentGameMode = "cpu_vs_cpu";
        initializeMovesPanel();
        
        // Reset the board to starting position
        setupPieces();
        
        // Save initial board state
        saveBoardState();
        
        // Update status
        const whiteElo = document.getElementById('white-elo') ? parseInt(document.getElementById('white-elo').value) : 1350;
        const blackElo = document.getElementById('black-elo') ? parseInt(document.getElementById('black-elo').value) : 1350;
        document.getElementById('click-status').textContent = 
            `CPU vs CPU game started! White: ${whiteElo} ELO, Black: ${blackElo} ELO`;
        
        // Enable game controls
        enableGameControls();
        
        // Show score panel
        const scorePanel = document.getElementById('score-panel');
        if (scorePanel) {
            scorePanel.style.display = 'block';
        }
        
        // Start the game by making the first move (white starts)
        currentPlayer = "white";
        
        // Wait a moment for backend to fully initialize engines, then start the loop
        // This prevents 400 errors from trying to make moves before engines are ready
        setTimeout(() => {
            cpuMoveLoop();
        }, 500);
	
    } catch (error) {
        console.error('Start CPU vs CPU game error:', error);
        document.getElementById('click-status').textContent = 
            'Failed to start CPU vs CPU game. Please try again.';
    }
}

//------------------------------------------------------------------------------
//
// function: resetToBotSelector
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Resets the interface and state variables back to the bot selection screen.
//------------------------------------------------------------------------------

function resetToBotSelector() {
    gameStarted = false;
    selectedBot = null;

    // Reset game state
    gameMoves = [];
    moveNumber = 1;
    boardHistory = [];
    currentMoveIndex = -1;

    // Disable game controls
    disableGameControls();

    // Show the mode selection overlay for next game
    const modeOverlay = document.getElementById('mode-overlay');
    const difficultyOverlay = document.getElementById('difficulty-overlay');

    // Hide difficulty overlay if it's showing
    if (difficultyOverlay) {
        difficultyOverlay.style.display = 'none';
    }
    
    // Show mode overlay
    if (modeOverlay) {
        modeOverlay.style.display = 'flex';
    }
    
    // Update status
    document.getElementById('click-status').textContent = 'Select game mode to start playing';
}

//------------------------------------------------------------------------------
//
// function: enableGameControls
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Enables all game control buttons after a game has started.
//------------------------------------------------------------------------------

function enableGameControls() {
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
    });
}

//------------------------------------------------------------------------------
//
// function: disableGameControls
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Disables all game control buttons while in bot selection mode.
//------------------------------------------------------------------------------

function disableGameControls() {
    const controlButtons = document.querySelectorAll('.control-btn');
    controlButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
    });
}

//------------------------------------------------------------------------------
//
// function: getCurrentBot
//
// arguments:
//  none
//
// returns:
//  Object or null - current bot information or null if none is selected
//
// description:
//  Checks if Game is currently active
//------------------------------------------------------------------------------

function getCurrentBot() {
    return selectedBot;
}

//------------------------------------------------------------------------------
//
// function: isGameStarted
//
// arguments:
//  none
//
// returns:
//  Boolean valu - true if a game is active, false otherwise
//
// description:
//  Checks if Game is currently active
//------------------------------------------------------------------------------

function isGameStarted() {
    return gameStarted;
}

//------------------------------------------------------------------------------
//
// function: cpuMoveLoop
//
// arguments:
//  none
//
// returns:
//  Calculated Delay
//
// description:
//  Allows game speed to be changed with slider
//------------------------------------------------------------------------------

async function cpuMoveLoop() {
    // Clear any existing timeout to prevent multiple loops running at once
    if (cpuMoveTimeout) {
        clearTimeout(cpuMoveTimeout);
        cpuMoveTimeout = null;
    }
    
    // Safety checks: Stop the loop if the game is over
    if (!gameStarted || isGamePaused || currentGameMode !== "cpu_vs_cpu") {
        console.log("CPU LOOP Stopped - game is paused or not in CPU vs CPU mode");
        return; // exit cleanly
    } 
    
    // Check if game is over by checking board state
    try {
        const boardStateResponse = await fetch('/api/board-state');
	if (!boardStateResponse.ok) {
	    console.error("Failed to fetch board state:", boardStateResponse.status);
            // Wait and retry
            cpuMoveTimeout = setTimeout(cpuMoveLoop, 2000);
            return;
	}

	const boardState = await boardStateResponse.json();

        if (boardState.game_over) {
            console.log("Game finished - Auto-restarting...");
            console.log("Board state response:", boardState);
            
            // Determine the winner
            const winner = boardState.winner || 'draw';
            console.log("Winner determined:", winner);
            
            // Handle game end (updates score) - don't pause since we're auto-restarting (ERROR)
            handleGameEnd(winner, false);
            
            document.getElementById('click-status').textContent = 
                `Game Over! Winner: ${winner}. Score - W:${gameScore.white} B:${gameScore.black} D:${gameScore.draws}`;

	    // Wait to show final board and score
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            document.getElementById('click-status').textContent = 'Restarting next game...';
            
            // Reset the game for next round
            await resetGame();
            
            // resetGame() will handle the restart if autorestart is true
            // If we reach here and game is started, it means auto-restart succeeded
            return; // Exit - resetGame will start new loop if needed
        }
    } catch (error) {
        console.error("Error checking board state:", error);
        // If we can't check board state, wait a bit and retry
        cpuMoveTimeout = setTimeout(cpuMoveLoop, 1000);
        return;
    }
    
    // Trigger the Move
    // Call Function that talks to app.py
    try {
        const moveResult = await getEngineMove();
        
        // If getEngineMove() detected game_over, it will have handled reset/restart
        // and returned { gameEnded: true }. Stop the loop immediately.
        if (moveResult && moveResult.gameEnded) {
            console.log("Game ended - getEngineMove() handled reset/restart");
            return; // Exit - resetGame() should have been called by getEngineMove()
        }

	// Check again if game should continue (might have ended during move)
        // getEngineMove() will handle game_over and reset, so if it returned,
        // we should check if the game is still active before continuing
        if (!gameStarted || isGamePaused || currentGameMode !== "cpu_vs_cpu") {
            console.log("Game stopped during move execution");
            return;
        }
        
        // Double-check board state in case getEngineMove didn't catch game_over
        // (shouldn't happen, but safety check)
        try {
            const boardStateCheck = await fetch('/api/board-state');
            if (boardStateCheck.ok) {
                const boardState = await boardStateCheck.json();
                if (boardState.game_over) {
                    console.log("Game over detected after move - resetGame() should have been called");
                    return; // Exit - resetGame() should have been called by getEngineMove()
                }
            }
        } catch (e) {
            // Ignore board state check errors, continue with normal flow
        }
	
        // Calculate the delay based on slider
        // Game speed comes from slider
        // At speed 1: delay = 500ms (slower pace)
        // At speed 10: delay = 50ms (moderate)
        // At speed 20: delay = 25ms (very fast)
        // Read gameSpeed fresh each time to pick up slider changes
        const currentSpeed = gameSpeed || 10;
        // Delay is now shorter since engine thinking time also varies with speed
        // Total time per move = engine thinking time (2.0/speed) + delay (500/speed)
        const delay = Math.max(25, 500 / currentSpeed); // Minimum 25ms delay

        console.log(`Moving again in ${delay}ms (speed: ${currentSpeed} G/sec, engine thinking: ${(2000/currentSpeed).toFixed(0)}ms)`);

        // Schedule the next move
        cpuMoveTimeout = setTimeout(() => {
            cpuMoveLoop();
        }, delay);

    } catch (error) {
        console.error("CPU LOOP Error:", error);
        
        // Check if this is a "game over" scenario
        if (error.message && error.message.includes("Game is over")) {
            console.log("Game ended, stopping loop");
            return;
        }
        
        // For other errors, wait longer before retrying
        console.log("Server error, retrying in 3 seconds...");
        cpuMoveTimeout = setTimeout(cpuMoveLoop, 3000);
    }
}
//
// End of file
