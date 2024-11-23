import React from 'react';

interface CellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const Cell: React.FC<CellProps> = ({ value, onChange, isSelected, onClick, className }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numberValue = parseInt(inputValue, 10);

    if (inputValue === '' || (numberValue >= 1 && numberValue <= 9)) {
      onChange(numberValue || null);
    }
  };

  return (
    <input
      type="text"
      value={value || ''}
      onChange={handleChange}
      onClick={onClick}
      maxLength={1}
      className={`w-10 h-10 border-2 text-center text-xl focus:outline-none ${className} ${isSelected ? 'bg-blue-100' : ''}`}
    />
  );
};

export default Cell;
