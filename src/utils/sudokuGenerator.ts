export const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard'): (number | null)[][] => {
  const createSolvedBoard = (): (number | null)[][] => {
    const board = Array(9)
      .fill(null)
      .map(() => Array(9).fill(null));
    solveSudoku(board);
    return board;
  };

  const removeNumbers = (board: (number | null)[][], count: number) => {
    let removed = 0;
    while (removed < count) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

      if (board[row][col] !== null) {
        board[row][col] = null;
        removed++;
      }
    }
  };

  const difficultyMapping = { easy: 36, medium: 27, hard: 18 };
  const solvedBoard = createSolvedBoard();
  const puzzleBoard = solvedBoard.map((row) => [...row]);
  removeNumbers(puzzleBoard, 81 - difficultyMapping[difficulty]);

  return puzzleBoard;
};

export const solveSudoku = (board: (number | null)[][]): boolean => {
  const findEmptyCell = () => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === null) return { row, col };
      }
    }
    return null;
  };

  const emptyCell = findEmptyCell();
  if (!emptyCell) return true; // Solved

  const { row, col } = emptyCell;
  for (let num = 1; num <= 9; num++) {
    if (isValidPlacement(board, row, col, num)) {
      board[row][col] = num;
      if (solveSudoku(board)) return true;
      board[row][col] = null; // Backtrack
    }
  }

  return false;
};

export const isValidPlacement = (
  board: (number | null)[][],
  row: number,
  col: number,
  num: number
): boolean => {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;

    const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
    const boxCol = 3 * Math.floor(col / 3) + (i % 3);
    if (board[boxRow][boxCol] === num) return false;
  }
  return true;
};

export const getHint = (grid: (number | null)[][]): { row: number; col: number; value: number } | null => {
  const emptyCells: { row: number; col: number }[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) return null; // No empty cells left

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const { row, col } = randomCell;

  const tempGrid = grid.map((r) => [...r]);
  if (solveSudoku(tempGrid)) {
    const value = tempGrid[row][col];
    if (value !== null) {
      return { row, col, value };
    }
  }

  return null; // Could not generate a valid hint
};
