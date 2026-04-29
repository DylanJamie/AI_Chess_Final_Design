/* 
Player Info Management - Add this code to main.js
This handles displaying player names and clearing them on interrupt
*/

// Add these global variables to the top of main.js (around line 31):
// let whitePlayerInfo = '-';
// let blackPlayerInfo = '-';

// Move these OUTSIDE of any other functions or listeners
function updatePlayerNames(whiteName, blackName) {
    const whiteElem = document.getElementById('white-player-name');
    const blackElem = document.getElementById('black-player-name');
    if (whiteElem) whiteElem.textContent = whiteName;
    if (blackElem) blackElem.textContent = blackName;
}

// Update your clear function to reset scores if needed
function clearPlayerNames() {
    updatePlayerNames('-', '-');
    gameScore = { white: 0, black: 0, draws: 0 }; // Reset score logic
    updateScoreUI();
}

// Enhanced formatting for names
function formatPlayerName(elo, isNNUE, nnueModel) {
    if (isNNUE) {
	const botNames = {
	    'fischer': 'Bobby Fischer Bot',
            'carlsen': 'Magnus Carlsen Bot',
            'yifan': 'Hou Yifan Bot',
            'spassky': 'Boris Spassky Bot',
	    'nakamura': 'Hikaru Nakamura Bot',
	    'krush': 'Irina Krush Bot',
	    'polgar': 'Judit Polgar Bot',
	    'anand': 'Viswanathan Anand Bot',
	    'stockfish': 'StockFish Computer'
	};
	return botNames[nnueModel] || 'Unknown Bot';
    } else {
        const ranks = {
            1350: "Club Player",
            1600: "Club Player+",
            1900: "Intermediate",
            2200: "Advanced",
            2600: "Master",
            3000: "Grandmaster",
	    'stockfish': 'StockFish Computer'
        };
        return `${ranks[elo] || 'CPU'} (${elo} ELO)`;
    }
}

// In the diffStartBtn.addEventListener('click', async () => { ... }) handler,
// After the line: gameStarted = true;
// Add these lines:

// Set player names based on mode
if (chosenMode === 'user_vs_cpu') {
    updatePlayerNames('You', formatPlayerName(chosenBlackElo, chosenBlackNNUE, chosenBlackNNUEModel));
} else {
    updatePlayerNames(
        formatPlayerName(chosenWhiteElo, chosenWhiteNNUE, chosenWhiteNNUEModel),
        formatPlayerName(chosenBlackElo, chosenBlackNNUE, chosenBlackNNUEModel)
    );
}

// In the resetToBotSelector() function in bot-selector.js, add:
// clearPlayerNames();

// Add an interrupt button handler in the DOMContentLoaded function:
const interruptBtn = document.getElementById('interrupt-btn');
if (interruptBtn) {
    interruptBtn.addEventListener('click', function() {
        clearPlayerNames();
        resetToBotSelector();
        if (cpuMoveTimeout) {
            clearTimeout(cpuMoveTimeout);
            cpuMoveTimeout = null;
        }
    });
}

// Function to update the score display
function updateScoreUI() {
    const whiteScoreElem = document.getElementById('white-score');
    const blackScoreElem = document.getElementById('black-score');
    
    // Only update if the elements actually exist in the HTML
    if (whiteScoreElem && blackScoreElem) {
        whiteScoreElem.textContent = `Wins: ${gameScore.white}`;
        blackScoreElem.textContent = `Wins: ${gameScore.black}`;
    } else {
        // This log will tell you exactly what is missing without crashing the game
        console.warn("UI Warning: Score elements ('white-score' or 'black-score') not found.");
    }
}

// Ensure board.js can find this function if it calls 'updateScoreDisplay'
window.updateScoreDisplay = updateScoreUI;
//
// End Of File
