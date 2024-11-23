/**
 * Validates whether a given Sudoku grid satisfies the rules of the game.
 *
 * @param {(number | null)[][]} grid - A 9x9 Sudoku grid where numbers represent the puzzle's current state.
 * @returns {boolean} True if the grid is valid, false otherwise.
 */
export const isValidSudoku = (grid: (number | null)[][]): boolean => {
  /**
   * Checks if a group of numbers (row, column, or sub-grid) contains duplicates.
   *
   * @param {(number | null)[]} numbers - An array of numbers from a Sudoku row, column, or sub-grid.
   * @returns {boolean} True if the group is valid (no duplicates), false otherwise.
   */
  const isValidGroup = (numbers: (number | null)[]) => {
    const filtered = numbers.filter((num) => num !== null); // Remove null values.
    return new Set(filtered).size === filtered.length; // Ensure no duplicates.
  };

  // Validate rows and columns
  for (let i = 0; i < 9; i++) {
    const row = grid[i];
    const col = grid.map((row) => row[i]); // Extract column.

    if (!isValidGroup(row) || !isValidGroup(col)) {
      return false; // Return false if any row or column is invalid.
    }
  }

  // Validate 3x3 sub-grids
  for (let rowStart = 0; rowStart < 9; rowStart += 3) {
    for (let colStart = 0; colStart < 9; colStart += 3) {
      const box = [];
      for (let r = rowStart; r < rowStart + 3; r++) {
        for (let c = colStart; c < colStart + 3; c++) {
          box.push(grid[r][c]);
        }
      }
      if (!isValidGroup(box)) {
        return false; // Return false if any 3x3 sub-grid is invalid.
      }
    }
  }

  return true; // Return true if all checks pass.
};

/**
 * Identifies all conflicting cells in a Sudoku grid that violate the game's rules.
 *
 * @param {(number | null)[][]} grid - A 9x9 Sudoku grid.
 * @returns {boolean[][]} A 2D array (same dimensions as the grid) where `true` marks a conflicting cell.
 */
export const findConflicts = (grid: (number | null)[][]) => {
  // Initialize the conflicts grid with false values.
  const conflicts = Array(9)
    .fill(null)
    .map(() => Array(9).fill(false));

  /**
   * Marks cells as conflicting in the conflicts grid.
   *
   * @param {[number, number][]} indices - An array of `[row, col]` pairs indicating conflicting cells.
   */
  const markConflicts = (indices: [number, number][]) => {
    indices.forEach(([row, col]) => {
      conflicts[row][col] = true;
    });
  };

  // Check rows and columns for conflicts.
  for (let i = 0; i < 9; i++) {
    const rowConflicts = new Map<number, number>();
    const colConflicts = new Map<number, number>();

    for (let j = 0; j < 9; j++) {
      const rowValue = grid[i][j]; // Current value in the row.
      const colValue = grid[j][i]; // Current value in the column.

      if (rowValue !== null) {
        if (rowConflicts.has(rowValue)) {
          markConflicts([[i, rowConflicts.get(rowValue) as number], [i, j]]);
        } else {
          rowConflicts.set(rowValue, j);
        }
      }

      if (colValue !== null) {
        if (colConflicts.has(colValue)) {
          markConflicts([[colConflicts.get(colValue) as number, i], [j, i]]);
        } else {
          colConflicts.set(colValue, j);
        }
      }
    }
  }

  // Check 3x3 sub-grids for conflicts.
  for (let rowStart = 0; rowStart < 9; rowStart += 3) {
    for (let colStart = 0; colStart < 9; colStart += 3) {
      const subGridConflicts = new Map<number, [number, number]>();

      for (let r = rowStart; r < rowStart + 3; r++) {
        for (let c = colStart; c < colStart + 3; c++) {
          const value = grid[r][c];

          if (value !== null) {
            if (subGridConflicts.has(value)) {
              const [prevRow, prevCol] = subGridConflicts.get(value) as [number, number];
              markConflicts([
                [prevRow, prevCol],
                [r, c],
              ]);
            } else {
              subGridConflicts.set(value, [r, c]);
            }
          }
        }
      }
    }
  }

  return conflicts; // Return the conflicts grid.
};
