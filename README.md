Sudoku Game
A fully-featured Sudoku game built with React and TypeScript, featuring puzzle generation, solution validation, conflict detection, and hints.

Features
Puzzle Generation: Generate Sudoku puzzles at varying difficulty levels (easy, medium, hard).
Solution Validation: Ensure the current grid satisfies all Sudoku rules.
Conflict Detection: Highlight cells that violate the rules of the game.
Hints: Get hints for solving the puzzle.
Customizable UI: Dynamic and interactive Sudoku grid with support for user input.

Installation
Clone the repository:

git clone https://github.com/your-username/sudoku-game.git
cd sudoku-game

Install dependencies:
npm install

Start the development server:
npm start

Open the application in your browser:
http://localhost:3000

Project Structure

Components
Cell.tsx: Handles the rendering of individual Sudoku cells.
SudokuGrid.tsx: Renders the entire Sudoku grid and manages user interactions.

Utils
sudokuGenerator.ts: Logic for generating Sudoku puzzles and solving them.
sudokuValidator.ts: Includes functions for validating Sudoku grids and detecting conflicts.
ocr.ts: (Optional) Logic for integrating OCR functionalities for importing puzzles.

Contact
For any questions or feedback, feel free to reach out:

Email: nassifmemakareh@gmail.com
GitHub: Nasso-Kareh
