import React from 'react';

/**
 * Props interface for the Cell component.
 * 
 * @property {number | null} value - The value to display in the cell. Can be a number (1-9) or null for an empty cell.
 * @property {(value: number | null) => void} onChange - Callback function triggered when the cell's value changes. 
 *           It passes the updated value (number or null) to the parent component.
 * @property {boolean} [isSelected] - Optional flag to indicate if the cell is selected. If true, the cell gets a specific style.
 * @property {() => void} [onClick] - Optional callback function triggered when the cell is clicked.
 * @property {string} [className] - Optional additional CSS classes for styling the cell.
 */
interface CellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Cell Component
 * 
 * A reusable and customizable React component representing a single cell in a Sudoku grid.
 * It allows the user to input numbers (1-9) or leave the cell empty. Handles validation for input
 * and calls the parent-provided callback functions for value changes or clicks.
 * 
 * @param {CellProps} props - The properties passed to the component.
 * @returns {JSX.Element} The rendered Cell component.
 */
const Cell: React.FC<CellProps> = ({ value, onChange, isSelected, onClick, className }) => {
  /**
   * Handles the input change event for the cell.
   * Validates that the input is a number between 1 and 9, or allows the cell to be empty.
   * Calls the `onChange` function with the new value.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event from the input element.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value; // Get the current input value as a string
    const numberValue = parseInt(inputValue, 10); // Attempt to convert the input value to a number

    // Check if the input is empty or within the valid range (1-9)
    if (inputValue === '' || (numberValue >= 1 && numberValue <= 9)) {
      // Call the onChange function with the number or null (for empty cells)
      onChange(numberValue || null);
    }
  };

  /**
   * Renders the input field representing the Sudoku cell.
   * Includes styling for size, alignment, and selected state.
   */
  return (
    <input
      type="text" // Render as a text input for single-character entry
      value={value || ''} // Display the cell value or an empty string if null
      onChange={handleChange} // Handle value changes
      onClick={onClick} // Handle cell click events, if provided
      maxLength={1} // Limit input to a single character
      className={`
        w-10 h-10 border-2 text-center text-xl focus:outline-none 
        ${className} 
        ${isSelected ? 'bg-blue-100' : ''}
      `} // Add styling and conditional selected background
    />
  );
};

export default Cell;
