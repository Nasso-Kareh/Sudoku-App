export const isValidSudoku = (grid: (number | null)[][]): boolean => {
    const isValidGroup = (numbers: (number | null)[]) => {
      const filtered = numbers.filter((num) => num !== null);
      return new Set(filtered).size === filtered.length;
    };
  
    // Validate rows and columns
    for (let i = 0; i < 9; i++) {
      const row = grid[i];
      const col = grid.map((row) => row[i]);
  
      if (!isValidGroup(row) || !isValidGroup(col)) {
        return false;
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
          return false;
        }
      }
    }
  
    return true;
  };
  
  export const findConflicts = (grid: (number | null)[][]) => {
    const conflicts = Array(9)
      .fill(null)
      .map(() => Array(9).fill(false));
  
    const markConflicts = (indices: [number, number][]) => {
      indices.forEach(([row, col]) => {
        conflicts[row][col] = true;
      });
    };
  
    // Check rows and columns
    for (let i = 0; i < 9; i++) {
      const rowConflicts = new Map();
      const colConflicts = new Map();
  
      for (let j = 0; j < 9; j++) {
        const rowValue = grid[i][j];
        const colValue = grid[j][i];
  
        if (rowValue !== null) {
          if (rowConflicts.has(rowValue)) {
            markConflicts([[i, rowConflicts.get(rowValue)], [i, j]]);
          } else {
            rowConflicts.set(rowValue, j);
          }
        }
  
        if (colValue !== null) {
          if (colConflicts.has(colValue)) {
            markConflicts([[colConflicts.get(colValue), i], [j, i]]);
          } else {
            colConflicts.set(colValue, j);
          }
        }
      }
    }
  
    // Check 3x3 sub-grids
    for (let rowStart = 0; rowStart < 9; rowStart += 3) {
      for (let colStart = 0; colStart < 9; colStart += 3) {
        const subGridConflicts = new Map();
        for (let r = rowStart; r < rowStart + 3; r++) {
          for (let c = colStart; c < colStart + 3; c++) {
            const value = grid[r][c];
            if (value !== null) {
              if (subGridConflicts.has(value)) {
                markConflicts([
                  [subGridConflicts.get(value)[0], subGridConflicts.get(value)[1]],
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
  
    return conflicts;
  };
  