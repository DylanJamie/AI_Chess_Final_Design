/* 
Controls JavaScript - All control button functionality
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/static/CSS/controls.js
*/

//------------------------------------------------------------------------------
//
// function: setupGameControls
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Initializes all control buttons and sets up their event listeners.
//  Also Manages the game speed slider and initial board state
//
//------------------------------------------------------------------------------

function setupGameControls() {
    const pauseBtn = document.getElementById('pause-btn');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const resetBtn = document.getElementById('reset-btn');
    const interruptBtn = document.getElementById('interrupt-btn');
    const speedSlider = document.getElementById('speed-slider');
    
    pauseBtn.addEventListener('click', pauseGame);
    playBtn.addEventListener('click', resumeGame);
    prevBtn.addEventListener('click', previousMove);
    nextBtn.addEventListener('click', nextMove);
    resetBtn.addEventListener('click', resetToCurrentGame);
    interruptBtn.addEventListener('click', interruptGame);
    
    // Speed slider functionality
    speedSlider.addEventListener('input', function() {
        const newSpeed = parseInt(this.value);
        gameSpeed = newSpeed;
        document.getElementById('speed-value').textContent = newSpeed;
	
        // Log it to the console so you can verify the value is changing
        console.log("New Game Speed:", newSpeed);
	
        // Update warning text based on speed
        const warning = document.querySelector('.speed-warning');
        if (newSpeed >= 10) {
            warning.textContent = 'Must be <10 g/sec to see chessboard';
            warning.style.color = '#ff0000';
        } else {
            warning.textContent = 'Speed OK - chessboard visible';
            warning.style.color = '#000000';
        }
        
        // Show/hide overlay for fast games
        updateSpeedOverlay(newSpeed);
        
        // If CPU vs CPU loop is running, it will pick up the new speed on next iteration
        // The delay is recalculated each time in cpuMoveLoop()
    });
    
    // Initialize board history with starting position
    saveBoardState();
    
    // Initialize speed overlay state
    updateSpeedOverlay(gameSpeed);
}

//------------------------------------------------------------------------------
//
// function: updateSpeedOverlay
//
// arguments:
//  speed: integer representing the current game speed
//
// returns:
//  nothing
//
// description:
//  Shows or hides the speed overlay based on whether the game is too fast
//  to display (speed >= 10 G/sec)
//
//------------------------------------------------------------------------------

function updateSpeedOverlay(speed) {
    const overlay = document.getElementById('speed-overlay');
    const overlaySpeedValue = document.getElementById('overlay-speed-value');
    
    if (!overlay) return;
    
    // Update the speed value in the overlay
    if (overlaySpeedValue) {
        overlaySpeedValue.textContent = speed;
    }

    if (currentGameMode === "cpu_vs_cpu") {
	if (speed >= 15) {
            overlay.style.display = 'flex';
	} else {
            overlay.style.display = 'none';
	}
    }
}

//------------------------------------------------------------------------------
//
// function: pauseGame
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Pauses the game, disables board interaction, and enables move navigation
//
//------------------------------------------------------------------------------

function pauseGame() {
    // Don't allow pause if game hasn't started
    if (!gameStarted) {
        document.getElementById('click-status').textContent = 'No game to pause. Start a game first!';
        return;
    }
    
    isGamePaused = true;
    
    // Stop the CPU loop if it's running
    if (cpuMoveTimeout) {
        clearTimeout(cpuMoveTimeout);
        cpuMoveTimeout = null;
    }
    
    // Hide pause button, show play button
    document.getElementById('pause-btn').style.display = 'none';
    document.getElementById('play-btn').style.display = 'block';
    
    // Clear any current selection
    resetSelection();
    
    // Update status message
    document.getElementById('click-status').textContent = 'Game paused. Use navigation buttons to review moves.';
    
    // Add visual indication that game is paused
    const board = document.getElementById('chessboard');
    board.style.opacity = '0.7';
    board.style.pointerEvents = 'none';
    
    // Update navigation button states
    updateNavigationButtons();
    
    console.log('Game paused');
}

//------------------------------------------------------------------------------
//
// function: resumeGame
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Resumes normal gameplay, and re-enables board interaction
//
//------------------------------------------------------------------------------

function resumeGame() {
    // Don't allow resume if game hasn't started
    if (!gameStarted) {
        document.getElementById('click-status').textContent = 'No game to resume. Start a game first!';
        return;
    }
    
    isGamePaused = false;
    updateGameControls();
    
    // Hide play button, show pause button
    document.getElementById('play-btn').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'block';
    
    // Reset to current game state
    resetToCurrentGame();
    
    // Update status message
    if (currentGameMode === "cpu_vs_cpu") {
        document.getElementById('click-status').textContent = 'Game resumed - CPU vs CPU playing...';
    } else {
        document.getElementById('click-status').textContent = 'Game resumed - your turn!';
    }
    
    // Remove visual indication that game is paused
    const board = document.getElementById('chessboard');
    board.style.opacity = '1';
    board.style.pointerEvents = 'auto';

    // Restart the loop if we are in CPU vs CPU mode
    if (currentGameMode === "cpu_vs_cpu") {
        console.log('Resuming CPU vs CPU game loop...');
        // Small delay to ensure state is fully updated
        setTimeout(() => {
            cpuMoveLoop();
        }, 100);
    }
    
    console.log('Game resumed');
}

//------------------------------------------------------------------------------
//
// function: interruptGame
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Interrupts the current game session, resets the score, and returns to
//  bot selection overlay
//
//------------------------------------------------------------------------------

function interruptGame() {
    interruptRequested = true;
    isGamePaused = true;
    gameStarted = false;
    
    if (cpuMoveTimeout) {
        clearTimeout(cpuMoveTimeout);
        cpuMoveTimeout = null;
    }

    // Reset the data and update the existing scoreboard
    gameScore = { white: 0, black: 0, draws: 0 }; 
    if (typeof updateScoreDisplay === 'function') {
        updateScoreDisplay();
    }

    const modeOverlay = document.getElementById('mode-overlay');
    if (modeOverlay) {
        modeOverlay.style.display = 'flex';
    }
    
    document.getElementById('click-status').textContent = 'Game interrupted. Select game mode to start playing';
    console.log('Game interrupted - score reset');
}

//------------------------------------------------------------------------------
//
// function: updateGameControls
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Synchronizes button states and board interactivity
//  with the current pause/resume status.
//
//------------------------------------------------------------------------------

function updateGameControls() {
    if (isGamePaused) {
        // show play button and disable board
        document.getElementById('pause-btn').style.display = 'none';
        document.getElementById('play-btn').style.display = 'block';
        
        const board = document.getElementById('chessboard');
        board.style.opacity = '0.7';
        board.style.pointerEvents = 'none';
    } else {
        // show pause button and enable board
        document.getElementById('play-btn').style.display = 'none';
        document.getElementById('pause-btn').style.display = 'block';
        
        const board = document.getElementById('chessboard');
        board.style.opacity = '1';
        board.style.pointerEvents = 'auto';
    }
    
    // Always refresh navigation button states
    updateNavigationButtons();
}
//
// End of file
