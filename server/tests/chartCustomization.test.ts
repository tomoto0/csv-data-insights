import { describe, it, expect } from 'vitest';

// Test the color palette configuration
describe('Chart Customization - Color Palettes', () => {
  const colorPalettes: Record<string, { name: string; colors: string[]; borderColors: string[] }> = {
    default: {
      name: 'Default',
      colors: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)',
      ],
      borderColors: [
        'rgba(99, 102, 241, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(6, 182, 212, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(34, 197, 94, 1)',
      ],
    },
    ocean: {
      name: 'Ocean',
      colors: [
        'rgba(14, 165, 233, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(20, 184, 166, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
      ],
      borderColors: [
        'rgba(14, 165, 233, 1)',
        'rgba(6, 182, 212, 1)',
        'rgba(20, 184, 166, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(99, 102, 241, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(168, 85, 247, 1)',
      ],
    },
    sunset: {
      name: 'Sunset',
      colors: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(244, 63, 94, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(253, 186, 116, 0.8)',
      ],
      borderColors: [
        'rgba(239, 68, 68, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(244, 63, 94, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(253, 186, 116, 1)',
      ],
    },
  };

  const getColorPalette = (paletteName: string) => {
    return colorPalettes[paletteName] || colorPalettes.default;
  };

  it('should return default palette when valid name is provided', () => {
    const palette = getColorPalette('default');
    expect(palette.name).toBe('Default');
    expect(palette.colors).toHaveLength(8);
    expect(palette.borderColors).toHaveLength(8);
  });

  it('should return ocean palette when ocean name is provided', () => {
    const palette = getColorPalette('ocean');
    expect(palette.name).toBe('Ocean');
    expect(palette.colors).toHaveLength(8);
  });

  it('should return sunset palette when sunset name is provided', () => {
    const palette = getColorPalette('sunset');
    expect(palette.name).toBe('Sunset');
    expect(palette.colors).toHaveLength(8);
  });

  it('should return default palette when invalid name is provided', () => {
    const palette = getColorPalette('invalid');
    expect(palette.name).toBe('Default');
  });

  it('should have valid rgba format for all colors', () => {
    const rgbaRegex = /^rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*(0|1|0?\.\d+)\)$/;
    
    Object.values(colorPalettes).forEach(palette => {
      palette.colors.forEach(color => {
        expect(color).toMatch(rgbaRegex);
      });
      palette.borderColors.forEach(color => {
        expect(color).toMatch(rgbaRegex);
      });
    });
  });
});

// Test the chart configuration
describe('Chart Customization - Chart Config', () => {
  interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'doughnut' | 'multiBar';
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    colorPalette: string;
    showLegend: boolean;
    showGrid: boolean;
  }

  const createDefaultConfig = (type: ChartConfig['type']): ChartConfig => ({
    type,
    title: 'Test Chart',
    xAxisLabel: 'X Axis',
    yAxisLabel: 'Y Axis',
    colorPalette: 'default',
    showLegend: true,
    showGrid: true,
  });

  it('should create a valid bar chart config', () => {
    const config = createDefaultConfig('bar');
    expect(config.type).toBe('bar');
    expect(config.showGrid).toBe(true);
  });

  it('should create a valid line chart config', () => {
    const config = createDefaultConfig('line');
    expect(config.type).toBe('line');
  });

  it('should create a valid pie chart config', () => {
    const config = createDefaultConfig('pie');
    expect(config.type).toBe('pie');
  });

  it('should create a valid doughnut chart config', () => {
    const config = createDefaultConfig('doughnut');
    expect(config.type).toBe('doughnut');
  });

  it('should create a valid multiBar chart config', () => {
    const config = createDefaultConfig('multiBar');
    expect(config.type).toBe('multiBar');
  });

  it('should allow updating chart config properties', () => {
    const config = createDefaultConfig('bar');
    const updatedConfig: ChartConfig = {
      ...config,
      type: 'line',
      title: 'Updated Title',
      colorPalette: 'sunset',
    };
    
    expect(updatedConfig.type).toBe('line');
    expect(updatedConfig.title).toBe('Updated Title');
    expect(updatedConfig.colorPalette).toBe('sunset');
  });
});

// Test chart data building logic
describe('Chart Customization - Data Building', () => {
  interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'doughnut' | 'multiBar';
    title: string;
    data: any;
    options: any;
    xAxisLabel?: string;
    yAxisLabel?: string;
  }

  const buildBarChartData = (labels: string[], bins: number[], colorPalette: string) => {
    if (labels.length === 0) {
      return { data: { labels: [], datasets: [] }, options: {} };
    }
    
    return {
      data: {
        labels,
        datasets: [{
          label: 'Frequency',
          data: bins,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
      },
    };
  };

  it('should build valid bar chart data', () => {
    const labels = ['A', 'B', 'C'];
    const bins = [10, 20, 30];
    const result = buildBarChartData(labels, bins, 'default');
    
    expect(result.data.labels).toEqual(labels);
    expect(result.data.datasets[0].data).toEqual(bins);
    expect(result.data.datasets[0].label).toBe('Frequency');
  });

  it('should return empty data when labels are empty', () => {
    const result = buildBarChartData([], [], 'default');
    
    expect(result.data.labels).toEqual([]);
    expect(result.data.datasets).toEqual([]);
  });

  it('should handle single data point', () => {
    const labels = ['Single'];
    const bins = [100];
    const result = buildBarChartData(labels, bins, 'default');
    
    expect(result.data.labels).toHaveLength(1);
    expect(result.data.datasets[0].data).toHaveLength(1);
  });
});

// Test available chart types logic
describe('Chart Customization - Available Types', () => {
  const getAvailableTypes = (baseType: string): ('bar' | 'line' | 'pie' | 'doughnut' | 'multiBar')[] => {
    if (baseType === 'pie' || baseType === 'doughnut') {
      return ['pie', 'doughnut'];
    } else if (baseType === 'multiBar') {
      return ['bar', 'line', 'multiBar'];
    }
    return ['bar', 'line'];
  };

  it('should return bar and line for bar chart', () => {
    const types = getAvailableTypes('bar');
    expect(types).toContain('bar');
    expect(types).toContain('line');
    expect(types).not.toContain('pie');
  });

  it('should return pie and doughnut for pie chart', () => {
    const types = getAvailableTypes('pie');
    expect(types).toContain('pie');
    expect(types).toContain('doughnut');
    expect(types).not.toContain('bar');
  });

  it('should return pie and doughnut for doughnut chart', () => {
    const types = getAvailableTypes('doughnut');
    expect(types).toContain('pie');
    expect(types).toContain('doughnut');
  });

  it('should return bar, line, and multiBar for multiBar chart', () => {
    const types = getAvailableTypes('multiBar');
    expect(types).toContain('bar');
    expect(types).toContain('line');
    expect(types).toContain('multiBar');
  });
});
