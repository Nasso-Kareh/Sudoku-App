import Tesseract, { Worker } from 'tesseract.js';

/**
 * Types
 */
type SudokuGrid = number[][]; // Represents a 9x9 Sudoku grid.

interface OCRResult {
  grid: SudokuGrid | null; // Extracted Sudoku grid or null if extraction failed.
  error?: string; // Optional error message if extraction fails.
}

/**
 * Constants
 */
const GRID_SIZE = 9; // Standard Sudoku grid size.
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']; // Allowed file types for image upload.

/**
 * OCR Worker Management
 * The worker is used for asynchronous OCR (Optical Character Recognition) processing.
 */
let worker: Worker | null = null;

/**
 * Initializes the Tesseract.js OCR worker.
 * Ensures the worker is loaded with the English language model for text recognition.
 *
 * @returns {Promise<Worker>} The initialized Tesseract worker instance.
 * @throws {Error} If worker initialization fails.
 */
export const initOCRWorker = async (): Promise<Worker> => {
  try {
    if (!worker) {
      worker = await Tesseract.createWorker();
      await worker.load('eng');
      await worker.reinitialize('eng');
    }
    return worker;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`OCR worker initialization failed: ${errorMessage}`);
  }
};

/**
 * Cleans up the OCR worker by terminating it and resetting the reference.
 */
export const cleanupOCRWorker = async (): Promise<void> => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
};

/**
 * Performs OCR on the given image and extracts text.
 *
 * @param {HTMLImageElement} image - The image to process.
 * @returns {Promise<string>} The recognized text from the image.
 * @throws {Error} If OCR processing fails.
 */
const performOCR = async (image: HTMLImageElement): Promise<string> => {
  const currentWorker = await initOCRWorker();

  try {
    const result = await currentWorker.recognize(image);
    return result.data.text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`OCR processing failed: ${errorMessage}`);
  }
};

/**
 * Cleans and processes OCR text output by removing unwanted characters and empty lines.
 *
 * @param {string} text - The OCR text output.
 * @returns {string[]} An array of cleaned lines from the text.
 */
const cleanOCRText = (text: string): string[] => {
  return text
    .replace(/[^\d\n\s]/g, '') // Remove non-numeric, non-newline, non-space characters.
    .split('\n') // Split text into lines.
    .map((line) => line.trim()) // Trim whitespace from each line.
    .filter((line) => line.length > 0); // Remove empty lines.
};

/**
 * Validates if the given grid adheres to the standard 9x9 Sudoku structure.
 *
 * @param {number[][]} grid - The grid to validate.
 * @returns {boolean} True if the grid is valid, false otherwise.
 */
const validateSudokuGrid = (grid: number[][]): boolean => {
  if (grid.length !== GRID_SIZE) return false; // Check row count.
  return grid.every(
    (row) =>
      row.length === GRID_SIZE && // Check column count.
      row.every((cell) => Number.isInteger(cell) && cell >= 0 && cell <= 9) // Check cell values.
  );
};

/**
 * Converts cleaned OCR text rows into a 2D grid of numbers.
 *
 * @param {string[]} rows - The cleaned rows of text.
 * @returns {number[][]} A 2D array representing the Sudoku grid.
 */
const parseGridRows = (rows: string[]): number[][] => {
  return rows.map((row) =>
    row.split(/\s+/).map((cell) => {
      const num = parseInt(cell, 10);
      return isNaN(num) ? 0 : num; // Replace invalid values with 0.
    })
  );
};

/**
 * Extracts a Sudoku grid from an image using OCR.
 *
 * @param {HTMLImageElement} image - The image containing the Sudoku puzzle.
 * @returns {Promise<OCRResult>} The extracted grid or an error message.
 */
export const extractSudokuFromImage = async (image: HTMLImageElement): Promise<OCRResult> => {
  try {
    const ocrText = await performOCR(image);
    const cleanedRows = cleanOCRText(ocrText);

    if (cleanedRows.length < GRID_SIZE) {
      return {
        grid: null,
        error: `Invalid grid size: found ${cleanedRows.length} rows, expected ${GRID_SIZE}`,
      };
    }

    const grid = parseGridRows(cleanedRows.slice(0, GRID_SIZE));

    if (!validateSudokuGrid(grid)) {
      return {
        grid: null,
        error: 'Invalid Sudoku grid structure detected',
      };
    }

    return { grid };
  } catch (error) {
    return {
      grid: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Handles image uploads, extracts Sudoku grids, and provides callbacks for success or error.
 *
 * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
 * @param {(grid: SudokuGrid) => void} onSuccess - Callback to execute when extraction succeeds.
 * @param {(error: string) => void} onError - Callback to execute when extraction fails.
 */
export const handleImageUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  onSuccess: (grid: SudokuGrid) => void,
  onError: (error: string) => void
): Promise<void> => {
  const file = event.target.files?.[0];

  if (!file) {
    onError('No file selected');
    return;
  }

  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    onError(`Unsupported file type. Please upload: ${SUPPORTED_IMAGE_TYPES.join(', ')}`);
    return;
  }

  const image = new Image();
  const reader = new FileReader();

  try {
    const imageLoadPromise = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to load image'));
      reader.onload = (e) => {
        if (e.target?.result) {
          image.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });

    reader.readAsDataURL(file);
    await imageLoadPromise;

    const { grid, error } = await extractSudokuFromImage(image);

    if (grid) {
      onSuccess(grid);
    } else {
      onError(error || 'Failed to extract Sudoku grid');
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
};
