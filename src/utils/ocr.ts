import Tesseract, { Worker } from 'tesseract.js';

// Types
type SudokuGrid = number[][];

interface OCRResult {
  grid: SudokuGrid | null;
  error?: string;
}

// Constants
const GRID_SIZE = 9;
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// OCR Worker Management
let worker: Worker | null = null;

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

export const cleanupOCRWorker = async (): Promise<void> => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
};

// OCR Processing
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

const cleanOCRText = (text: string): string[] => {
  return text
    .replace(/[^\d\n\s]/g, '') // Remove non-numeric, non-newline, non-space characters
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0); // Remove empty lines
};

const validateSudokuGrid = (grid: number[][]): boolean => {
  if (grid.length !== GRID_SIZE) return false;
  return grid.every(row => 
    row.length === GRID_SIZE && 
    row.every(cell => Number.isInteger(cell) && cell >= 0 && cell <= 9)
  );
};

const parseGridRows = (rows: string[]): number[][] => {
  return rows.map(row => 
    row
      .split(/\s+/)
      .map(cell => {
        const num = parseInt(cell, 10);
        return isNaN(num) ? 0 : num;
      })
  );
};

export const extractSudokuFromImage = async (image: HTMLImageElement): Promise<OCRResult> => {
  try {
    const ocrText = await performOCR(image);
    const cleanedRows = cleanOCRText(ocrText);
    
    if (cleanedRows.length < GRID_SIZE) {
      return {
        grid: null,
        error: `Invalid grid size: found ${cleanedRows.length} rows, expected ${GRID_SIZE}`
      };
    }

    const grid = parseGridRows(cleanedRows.slice(0, GRID_SIZE));
    
    if (!validateSudokuGrid(grid)) {
      return {
        grid: null,
        error: 'Invalid Sudoku grid structure detected'
      };
    }

    return { grid };
  } catch (error) {
    return {
      grid: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

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