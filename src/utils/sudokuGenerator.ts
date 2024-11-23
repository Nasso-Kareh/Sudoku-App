/**
 * Generates a Sudoku puzzle based on the specified difficulty level.
 *
 * @param {'easy' | 'medium' | 'hard'} difficulty - The difficulty level of the Sudoku puzzle.
 * @returns {(number | null)[][]} A 9x9 grid representing the Sudoku puzzle.
 */
export const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard'): (number | null)[][] => {
  /**
   * Creates a fully solved Sudoku board.
   *
   * @returns {(number | null)[][]} A completed 9x9 Sudoku grid.
   */
  const createSolvedBoard = (): (number | null)[][] => {
    const board = Array(9)
      .fill(null)
      .map(() => Array(9).fill(null));
    solveSudoku(board); // Solves the grid to create a complete solution.
    return board;
  };

  /**
   * Removes numbers from the solved Sudoku board to create a puzzle.
   *
   * @param {(number | null)[][]} board - The Sudoku board.
   * @param {number} count - The number of cells to remove.
   */
  const removeNumbers = (board: (number | null)[][], count: number) => {
    let removed = 0;
    while (removed < count) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

      if (board[row][col] !== null) {
        board[row][col] = null; // Remove the number by setting it to null.
        removed++;
      }
    }
  };

  const difficultyMapping = { easy: 36, medium: 27, hard: 18 }; // Number of filled cells for each difficulty.
  const solvedBoard = createSolvedBoard(); // Generate a complete Sudoku solution.
  const puzzleBoard = solvedBoard.map((row) => [...row]); // Clone the solved board.
  removeNumbers(puzzleBoard, 81 - difficultyMapping[difficulty]); // Remove numbers to create the puzzle.

  return puzzleBoard;
};

/**
 * Solves a given Sudoku board using backtracking.
 *
 * @param {(number | null)[][]} board - The Sudoku board to solve.
 * @returns {boolean} True if the board is solvable, false otherwise.
 */
export const solveSudoku = (board: (number | null)[][]): boolean => {
  /**
   * Finds the first empty cell in the Sudoku board.
   *
   * @returns {{ row: number; col: number } | null} The coordinates of an empty cell, or null if the board is complete.
   */
  const findEmptyCell = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === null) return { row, col }; // Return the first empty cell found.
      }
    }
    return null; // No empty cells found.
  };

  const emptyCell = findEmptyCell();
  if (!emptyCell) return true; // The board is complete.

  const { row, col } = emptyCell;
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num; // Place the number.
      if (solveSudoku(board)) return true; // Continue solving.
      board[row][col] = null; // Backtrack if the placement fails.
    }
  }

  return false; // No valid solution found.
};

/**
 * Checks if placing a number in a specific cell is valid.
 *
 * @param {(number | null)[][]} board - The Sudoku board.
 * @param {number} row - The row index of the cell.
 * @param {number} col - The column index of the cell.
 * @param {number} num - The number to place.
 * @returns {boolean} True if the placement is valid, false otherwise.
 */
export const isValidPlacement = (
  board: (number | null)[][],
  row: number,
  col: number,
  num: number
): boolean => {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false; // Check row and column.

    // Check 3x3 subgrid.
    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (board[boxRow][boxCol] === num) return false;
  }
  return true;
};

/**
 * Provides a hint by solving the puzzle and returning a single valid value for an empty cell.
 *
 * @param {(number | null)[][]} grid - The current Sudoku grid.
 * @returns {{ row: number; col: number; value: number } | null} A hint containing the coordinates and value, or null if no hints are possible.
 */
export const getHint = (grid: (number | null)[][]): { row: number; col: number; value: number } | null => {
  const emptyCells: { row: number; col: number }[] = [];
  
  // Collect all empty cells.
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) return null; // No empty cells left.

  // Select a random empty cell.
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const { row, col } = randomCell;

  // Attempt to solve the grid.
  const tempGrid = grid.map((r) => [...r]); // Clone the grid.
  if (solveSudoku(tempGrid)) {
    const value = tempGrid[row][col]; // Extract the solved value.
    if (value !== null) {
      return { row, col, value }; // Return the hint.
    }
  }

  return null; // Could not generate a valid hint.
};
