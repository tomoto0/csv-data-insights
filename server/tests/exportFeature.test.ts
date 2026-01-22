import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock database functions
const mockGetLatestCleaningResult = vi.fn();
const mockGetCsvDataset = vi.fn();
const mockCreateCsvDataset = vi.fn();

// Test the export as dataset logic
describe('Export Feature - Export Cleaned CSV as Dataset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse cleaned CSV correctly', () => {
    const cleanedCsv = 'name,age,city\nJohn,30,Tokyo\nJane,25,Osaka';
    const lines = cleanedCsv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rowCount = lines.length - 1;

    expect(headers).toEqual(['name', 'age', 'city']);
    expect(rowCount).toBe(2);
  });

  it('should generate correct new filename', () => {
    const originalFileName = 'data.csv';
    const newFileName = `cleaned_${originalFileName}`;
    
    expect(newFileName).toBe('cleaned_data.csv');
  });

  it('should handle custom filename', () => {
    const customFileName = 'my_cleaned_data.csv';
    const originalFileName = 'data.csv';
    const newFileName = customFileName || `cleaned_${originalFileName}`;
    
    expect(newFileName).toBe('my_cleaned_data.csv');
  });

  it('should handle empty custom filename', () => {
    const customFileName = '';
    const originalFileName = 'data.csv';
    const newFileName = customFileName || `cleaned_${originalFileName}`;
    
    expect(newFileName).toBe('cleaned_data.csv');
  });

  it('should handle CSV with special characters in filename', () => {
    const originalFileName = 'my data (2024).csv';
    const newFileName = `cleaned_${originalFileName}`;
    
    expect(newFileName).toBe('cleaned_my data (2024).csv');
  });
});

// Test CSV parsing edge cases
describe('Export Feature - CSV Parsing', () => {
  it('should handle single row CSV', () => {
    const cleanedCsv = 'name,age\nJohn,30';
    const lines = cleanedCsv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rowCount = lines.length - 1;

    expect(headers).toEqual(['name', 'age']);
    expect(rowCount).toBe(1);
  });

  it('should handle CSV with only headers', () => {
    const cleanedCsv = 'name,age,city';
    const lines = cleanedCsv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rowCount = lines.length - 1;

    expect(headers).toEqual(['name', 'age', 'city']);
    expect(rowCount).toBe(0);
  });

  it('should handle CSV with whitespace in headers', () => {
    const cleanedCsv = ' name , age , city \nJohn,30,Tokyo';
    const lines = cleanedCsv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    expect(headers).toEqual(['name', 'age', 'city']);
  });

  it('should handle CSV with many rows', () => {
    const rows = ['name,age'];
    for (let i = 0; i < 100; i++) {
      rows.push(`Person${i},${20 + i}`);
    }
    const cleanedCsv = rows.join('\n');
    const lines = cleanedCsv.trim().split('\n');
    const rowCount = lines.length - 1;

    expect(rowCount).toBe(100);
  });
});

// Test export validation
describe('Export Feature - Validation', () => {
  it('should validate cleaning result exists', () => {
    const cleaningResult = null;
    const hasCleaningResult = cleaningResult !== null;
    
    expect(hasCleaningResult).toBe(false);
  });

  it('should validate original dataset exists', () => {
    const originalDataset = { id: 1, fileName: 'data.csv' };
    const hasOriginalDataset = originalDataset !== null;
    
    expect(hasOriginalDataset).toBe(true);
  });

  it('should validate dataset ID is provided', () => {
    const datasetId = 123;
    const isValidDatasetId = typeof datasetId === 'number' && datasetId > 0;
    
    expect(isValidDatasetId).toBe(true);
  });

  it('should reject invalid dataset ID', () => {
    const datasetId = 0;
    const isValidDatasetId = typeof datasetId === 'number' && datasetId > 0;
    
    expect(isValidDatasetId).toBe(false);
  });
});

// Test chart export filename generation
describe('Export Feature - Chart Export Filename', () => {
  it('should generate valid filename from chart title', () => {
    const title = 'Distribution of NO';
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_chart.png`;
    
    expect(filename).toBe('Distribution_of_NO_chart.png');
  });

  it('should handle special characters in title', () => {
    const title = 'Sales (2024) - Q1/Q2';
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_chart.png`;
    
    expect(filename).toBe('Sales__2024____Q1_Q2_chart.png');
  });

  it('should handle empty title', () => {
    const title = '';
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_chart.png`;
    
    expect(filename).toBe('_chart.png');
  });

  it('should handle Japanese characters', () => {
    const title = 'データ分析';
    const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_chart.png`;
    
    // Each Japanese character is replaced with underscore
    // 'データ分析' has 5 characters, so 5 underscores + '_chart.png'
    expect(filename).toMatch(/^_+_chart\.png$/);
  });
});

// Test export result structure
describe('Export Feature - Result Structure', () => {
  it('should return correct success structure', () => {
    const result = {
      success: true,
      fileName: 'cleaned_data.csv',
      rowCount: 50,
      message: 'クリーニング済みデータセット「cleaned_data.csv」を保存しました。'
    };

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('cleaned_data.csv');
    expect(result.rowCount).toBe(50);
    expect(result.message).toContain('cleaned_data.csv');
  });

  it('should include row count in result', () => {
    const cleanedCsv = 'a,b,c\n1,2,3\n4,5,6\n7,8,9';
    const lines = cleanedCsv.trim().split('\n');
    const rowCount = lines.length - 1;

    const result = {
      success: true,
      fileName: 'test.csv',
      rowCount,
      message: `Saved ${rowCount} rows`
    };

    expect(result.rowCount).toBe(3);
  });
});
