import React, { useEffect, useState } from 'react';
import Cell from './Cell';
import { solveSudoku, generateSudoku, getHint } from '../utils/sudokuGenerator';
import { initOCRWorker, extractSudokuFromImage } from '../utils/ocr';

const SudokuGrid: React.FC = () => {
  const [grid, setGrid] = useState<(number | null)[][]>(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [timer, setTimer] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [solved, setSolved] = useState(false);
  const [highlightedCells, setHighlightedCells] = useState<{ row: number; col: number }[]>([]);
  const [invalidCells, setInvalidCells] = useState<{ row: number; col: number }[]>([]);

  const difficultyTimers = {
    easy: 600,
    medium: 900,
    hard: 1200,
  };

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

  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTimerRunning, timer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const validateGrid = (grid: (number | null)[][]) => {
    const invalidCells: { row: number; col: number }[] = [];
    
    // Check each cell
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = grid[row][col];
        if (value === null) continue;
        
        // Check row
        for (let i = 0; i < 9; i++) {
          if (i !== col && grid[row][i] === value) {
            invalidCells.push({ row, col });
            invalidCells.push({ row, col: i });
          }
        }
        
        // Check column
        for (let i = 0; i < 9; i++) {
          if (i !== row && grid[i][col] === value) {
            invalidCells.push({ row, col });
            invalidCells.push({ row: i, col });
          }
        }
        
        // Check 3x3 subgrid
        const subgridRowStart = Math.floor(row / 3) * 3;
        const subgridColStart = Math.floor(col / 3) * 3;
        
        for (let i = subgridRowStart; i < subgridRowStart + 3; i++) {
          for (let j = subgridColStart; j < subgridColStart + 3; j++) {
            if (i !== row && j !== col && grid[i][j] === value) {
              invalidCells.push({ row, col });
              invalidCells.push({ row: i, col: j });
            }
          }
        }
      }
    }
    
    // Remove duplicates from invalidCells
    const uniqueInvalidCells = invalidCells.filter((cell, index, self) =>
      index === self.findIndex(c => c.row === cell.row && c.col === cell.col)
    );
    
    setInvalidCells(uniqueInvalidCells);
  };
  
  // Update the updateCell function to immediately validate after setting a new value
  const updateCell = (row: number, col: number, value: number | null) => {
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(r => [...r]);
      newGrid[row][col] = value;
      validateGrid(newGrid);
      return newGrid;
    });
  };

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    try {
      const image = new Image();
      const reader = new FileReader();
  
      await new Promise<void>((resolve, reject) => {
        reader.onload = (e) => {
          if (e.target?.result) {
            image.src = e.target.result as string;
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Failed to load image'));
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
  
      const result = await extractSudokuFromImage(image);
      
      if (result.grid) {
        // Convert the grid from number[][] to (number | null)[][]
        const convertedGrid = result.grid.map(row =>
          row.map(cell => cell === 0 ? null : cell)
        );
        setGrid(convertedGrid);
        setIsTimerRunning(true); // Start the timer for the new puzzle
        setHintsRemaining(3); // Reset hints for the new puzzle
        setHighlightedCells([]); // Clear any highlighted cells
        setSelectedCell(null); // Clear selected cell
        validateGrid(convertedGrid); // Validate the new grid
      } else {
        alert(result.error || 'Failed to extract a valid Sudoku grid from the image');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred while processing the image');
    }
  };
  
  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      if (e.target instanceof HTMLInputElement) {
        handleImageUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    };
    input.click();
  };

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
    // Highlight the entire row and column
    const highlightedCells = [];
    // Add all cells in the same row
    for (let i = 0; i < 9; i++) {
      if (i !== col) {
        highlightedCells.push({ row, col: i });
      }
    }
    // Add all cells in the same column
    for (let i = 0; i < 9; i++) {
      if (i !== row) {
        highlightedCells.push({ row: i, col });
      }
    }
    setHighlightedCells(highlightedCells);
  };

  const getCellClassName = (rowIndex: number, colIndex: number) => {
    const classes = ['border'];

    // Add highlighting for selected row/column
    if (highlightedCells.some((c) => c.row === rowIndex && c.col === colIndex)) {
      classes.push('bg-blue-100');
    }

    // Add error highlighting
    if (invalidCells.some((c) => c.row === rowIndex && c.col === colIndex)) {
      classes.push('bg-red-300');
    }

    // Add selected cell highlighting
    if (selectedCell?.row === rowIndex && selectedCell?.col === colIndex) {
      classes.push('bg-blue-300');
    }

    // Add border styling for subgrid
    if (colIndex % 3 === 0) {
      classes.push('border-l-4');
    }
    if (rowIndex % 3 === 0) {
      classes.push('border-t-4');
    }
    if (colIndex === 8) {
      classes.push('border-r-4');
    }
    if (rowIndex === 8) {
      classes.push('border-b-4');
    }

    return classes.join(' ');
  };

  const renderSudokuGrid = () => {
    return (
      <div className="grid grid-cols-9 gap-0 border-4" style={{ borderColor: solved ? 'green' : 'gray' }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              onChange={(value) => updateCell(rowIndex, colIndex, value)}
              isSelected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              className={getCellClassName(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl font-semibold">Timer: {formatTime(timer)}</div>
      <div className="flex gap-2 mb-4">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
          className="px-4 py-2 border rounded-md"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button
          onClick={generatePuzzle}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
        >
          Generate Puzzle
        </button>
        <button
          onClick={handleFileSelect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Upload Image
        </button>
      </div>

      {renderSudokuGrid()}

      <div className="flex flex-col items-center mt-4 gap-2">
        <button
          onClick={solveBoard}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Solve Puzzle
        </button>
        <button
          onClick={provideHint}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-700"
        >
          Hint ({hintsRemaining} remaining)
        </button>
      </div>
    </div>
  );
};

export default SudokuGrid;