import React from 'react';
import SudokuGrid from './components/SudokuGrid';

const App: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div>
        <h1 className="text-2xl font-bold text-center mb-4">Sudoku Game</h1>
        <SudokuGrid />
      </div>
    </div>
  );
};

export default App;
