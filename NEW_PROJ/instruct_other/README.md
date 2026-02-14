# AI_Chess_Senior_Design
Created By Samuel Georgi, Shane Mullin, Dylan Boles & Zephan Joseph

Two Hardware Devices Able to play each other using AI
Able to handle a program that Has AI open source data to games.
Can speed up to 1000 games per second (sequentially) or slow down to watch each individual move. 
Go back moves and forward moves as well as reset to current state of the game. 
Launch from the laptop and codes will be downloaded to hardware to execute games. 
A Stop and Start for the games Hardware can use programing language that is widely used. 
Be able to control Program Complexity. Such as the amount of look aheads in the game. (5 look aheads, 10 look aheads, etc.)

## Design Proposal Requirments
- Screen/User Interface Look
- Description Hardware
- Programming Enviorment
- AI Training and AI Enviorment

## CSS Design
├── main.css          # Base styles, layout, typography
├── board.css         # Chess board specific styles
├── controls.css      # All control buttons and panels
└── moves.css         # Moves panel styles

## JavaScript Design
├── main.js           # Main initialization and global variables
├── board.js          # Chess board creation and piece management
├── game.js           # Game logic, move validation, game state
├── controls.js       # All control button functionality
├── navigation.js     # Move navigation and history
└── utils.js          # Utility functions and helpers

## Communications

### Standalone Mode (No Raspberry Pi Required)
Browser (JS GUI)
   ↓
Laptop Flask app (/api/move)
   ↓
Local Stockfish engine processes + updates board
   ↓
Laptop Flask app returns data to browser
   ↓
GUI updates pieces on screen

### Original Mode (With Raspberry Pi)
Browser (JS GUI)
   ↓
Laptop Flask app (/api/move)
   ↓
Raspberry Pi Flask server (/api/move)
   ↓
Stockfish processes + updates board
   ↓
Pi sends updated board + status
   ↓
Laptop Flask app returns data to browser
   ↓
GUI updates pieces on screen

## When it is Engine Turn
**Standalone Mode:** Browser → /api/engine-move → Local Stockfish → Browser
**Original Mode:** Browser → /api/engine-move → Pi → Stockfish → Pi → Laptop → Browser

## Standalone Setup (No Pi Required)

The app now works standalone without a Raspberry Pi connection! To use it:

1. **Install Stockfish:**
   - macOS: `brew install stockfish`
   - Linux: `sudo apt-get install stockfish`
   - Or download from: https://stockfishchess.org/download/
   - If Stockfish is in a custom location, set the `STOCKFISH_PATH` environment variable

2. **Install Python dependencies:**
   ```bash
   pip install flask chess
   ```

3. **Run the server:**
   ```bash
   python GUI/app.py
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5001`

The app will automatically detect Stockfish and run locally - no Pi connection needed!
