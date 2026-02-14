/* 
WDL Probability Bar - Win/Draw/Loss probability display
Date: 02/12/2026
file: /AI_Chess_Senior_Design/GUI/static/JS/wdl-probability.js
*/

//------------------------------------------------------------------------------
//
// function: updateWDLBar
//
// arguments:
//  wdlData: object containing win, draw, loss percentages
//           e.g., { win: 45.2, draw: 30.1, loss: 24.7 }
//
// returns:
//  nothing
//
// description:
//  Updates the WDL probability bar with the latest win/draw/loss percentages
//  from Stockfish's evaluation
//
//------------------------------------------------------------------------------

function updateWDLBar(wdlData) {
    if (!wdlData) {
        console.log('No WDL data available');
        return;
    }
    
    const wdlContainer = document.getElementById('wdl-probability');
    const whiteBar = document.getElementById('wdl-white-bar');
    const drawBar = document.getElementById('wdl-draw-bar');
    const blackBar = document.getElementById('wdl-black-bar');
    const whiteText = document.getElementById('wdl-white-text');
    const drawText = document.getElementById('wdl-draw-text');
    const blackText = document.getElementById('wdl-black-text');
    
    if (!whiteBar || !drawBar || !blackBar) {
        console.warn('WDL bar elements not found');
        return;
    }
    
    // Show the container if it's hidden
    if (wdlContainer) {
        wdlContainer.style.display = 'block';
    }
    
    // Extract percentages (ensure they're numbers)
    const winPct = parseFloat(wdlData.win) || 0;
    const drawPct = parseFloat(wdlData.draw) || 0;
    const lossPct = parseFloat(wdlData.loss) || 0;
    
    // Update bar widths
    whiteBar.style.width = `${winPct}%`;
    drawBar.style.width = `${drawPct}%`;
    blackBar.style.width = `${lossPct}%`;
    
    // Update text labels (only show if percentage is > 5% to avoid clutter)
    whiteText.textContent = winPct > 5 ? `${winPct.toFixed(1)}%` : '';
    drawText.textContent = drawPct > 5 ? `${drawPct.toFixed(1)}%` : '';
    blackText.textContent = lossPct > 5 ? `${lossPct.toFixed(1)}%` : '';
    
    console.log(`WDL updated - Win: ${winPct}%, Draw: ${drawPct}%, Loss: ${lossPct}%`);
}

//------------------------------------------------------------------------------
//
// function: hideWDLBar
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Hides the WDL probability bar (used when game is reset or interrupted)
//
//------------------------------------------------------------------------------

function hideWDLBar() {
    const wdlContainer = document.getElementById('wdl-probability');
    if (wdlContainer) {
        wdlContainer.style.display = 'none';
    }
}

//------------------------------------------------------------------------------
//
// function: resetWDLBar
//
// arguments:
//  none
//
// returns:
//  nothing
//
// description:
//  Resets the WDL bar to 50-50 (starting position)
//
//------------------------------------------------------------------------------

function resetWDLBar() {
    updateWDLBar({ win: 50, draw: 0, loss: 50 });
}

//
// End of file
