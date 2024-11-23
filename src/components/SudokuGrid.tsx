import React, { useEffect, useState } from 'react';
import Cell from './Cell';
import { solveSudoku, generateSudoku, getHint } from '../utils/sudokuGenerator';
import { initOCRWorker, extractSudokuFromImage } from '../utils/ocr';

/**
 * SudokuGrid Component
 *
 * This component represents the main Sudoku game grid and manages the game's state, logic, and interactions.
 * It provides functionality for solving, generating, validating, and uploading Sudoku puzzles.
 *
 * @returns {JSX.Element} The rendered Sudoku grid and game controls.
 */
const SudokuGrid: React.FC = () => {
  /** State Management */
  const [grid, setGrid] = useState<(number | null)[][]>(
    Array(9).fill(null).map(() => Array(9).fill(null))
  ); // The 9x9 Sudoku grid.
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null); // Currently selected cell.
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy'); // Current difficulty level.
  const [timer, setTimer] = useState(600); // Timer value in seconds.
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Whether the timer is running.
  const [hintsRemaining, setHintsRemaining] = useState(3); // Number of hints left.
  const [solved, setSolved] = useState(false); // Whether the puzzle is solved.
  const [highlightedCells, setHighlightedCells] = useState<{ row: number; col: number }[]>([]); // Highlighted cells (row and column).
  const [invalidCells, setInvalidCells] = useState<{ row: number; col: number }[]>([]); // Invalid cells in the grid.

  /** Timer durations based on difficulty */
  const difficultyTimers = {
    easy: 600,
    medium: 900,
    hard: 1200,
  };

  /** Initialize OCR on component mount */
  useEffect(() => {
    const initializeOCR = async () => {
      try {
        await initOCRWorker();
      } catch (error) {
        console.error('Failed to initialize OCR worker:', error);
      }
    };
    initializeOCR();
  }, []);

  /** Timer functionality */
  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isTimerRunning, timer]);

  /**
   * Format the timer into minutes and seconds.
   *
   * @param {number} seconds - Time in seconds.
   * @returns {string} Formatted time as `MM:SS`.
   */
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Validate the grid to check for invalid cells.
   *
   * @param {(number | null)[][]} grid - The Sudoku grid to validate.
   */
  const validateGrid = (grid: (number | null)[][]) => {
    const invalidCells: { row: number; col: number }[] = [];

    // Check each cell for row, column, and subgrid conflicts
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = grid[row][col];
        if (value === null) continue;

        // Row and column validation
        for (let i = 0; i < 9; i++) {
          if ((i !== col && grid[row][i] === value) || (i !== row && grid[i][col] === value)) {
            invalidCells.push({ row, col });
          }
        }

        // Subgrid validation
        const subgridRowStart = Math.floor(row / 3) * 3;
        const subgridColStart = Math.floor(col / 3) * 3;
        for (let i = subgridRowStart; i < subgridRowStart + 3; i++) {
          for (let j = subgridColStart; j < subgridColStart + 3; j++) {
            if (i !== row && j !== col && grid[i][j] === value) {
              invalidCells.push({ row, col });
            }
          }
        }
      }
    }

    // Deduplicate invalid cells
    const uniqueInvalidCells = invalidCells.filter(
      (cell, index, self) => index === self.findIndex((c) => c.row === cell.row && c.col === cell.col)
    );

    setInvalidCells(uniqueInvalidCells);
  };

  /**
   * Update a cell value and validate the grid.
   *
   * @param {number} row - Row index of the cell.
   * @param {number} col - Column index of the cell.
   * @param {number | null} value - New value for the cell.
   */
  const updateCell = (row: number, col: number, value: number | null) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((r) => [...r]);
      newGrid[row][col] = value;
      validateGrid(newGrid);
      return newGrid;
    });
  };

  /**
   * Solve the Sudoku puzzle using a solver algorithm.
   */
  const solveBoard = () => {
    const gridCopy = grid.map((row) => [...row]);
    if (solveSudoku(gridCopy)) {
      setGrid(gridCopy);
      setSolved(true);
      setTimeout(() => setSolved(false), 2000);
    } else {
      alert('The puzzle cannot be solved.');
    }
  };

  /**
   * Generate a new puzzle based on the selected difficulty.
   */
  const generatePuzzle = () => {
    const newGrid = generateSudoku(difficulty);
    setGrid(newGrid);
    setHintsRemaining(3);
    setTimer(difficultyTimers[difficulty]);
    setIsTimerRunning(true);
    setHighlightedCells([]);
    setSelectedCell(null);
    validateGrid(newGrid);
  };

  /**
   * Provide a hint for the puzzle.
   */
  const provideHint = () => {
    if (hintsRemaining <= 0) {
      alert('No hints remaining!');
      return;
    }
    const hint = getHint(grid);
    if (hint) {
      const { row, col, value } = hint;
      updateCell(row, col, value);
      setHintsRemaining((prev) => prev - 1);
    } else {
      alert('No hints available.');
    }
  };

  /**
   * Render the Sudoku grid.
   *
   * @returns {JSX.Element} The rendered grid.
   */
  const renderSudokuGrid = () => (
    <div className="grid grid-cols-9 gap-0 border-4" style={{ borderColor: solved ? 'green' : 'gray' }}>
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Cell
            key={`${rowIndex}-${colIndex}`}
            value={cell}
            onChange={(value) => updateCell(rowIndex, colIndex, value)}
            isSelected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
            onClick={() => setSelectedCell({ row: rowIndex, col: colIndex })}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-semibold">Timer: {formatTime(timer)}</div>
      <button onClick={generatePuzzle}>Generate Puzzle</button>
      <button onClick={solveBoard}>Solve Puzzle</button>
      <button onClick={provideHint}>Hint ({hintsRemaining} remaining)</button>
      {renderSudokuGrid()}
    </div>
  );
};

export default SudokuGrid;
