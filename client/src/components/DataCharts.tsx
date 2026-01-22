import { useMemo, useState, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Image } from 'lucide-react';
import ChartCustomizer, { ChartConfig, getColorPalette } from './ChartCustomizer';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface DataChartsProps {
  data: ParsedData;
  insights?: any[];
}

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'multiBar';
  title: string;
  data: any;
  options: any;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function DataCharts({ data, insights }: DataChartsProps) {
  // Store customization configs for each chart
  const [chartConfigs, setChartConfigs] = useState<Record<number, ChartConfig>>({});
  const chartRefs = useRef<Record<number, any>>({});

  // Export chart as PNG image
  const exportChartAsImage = useCallback((chartIndex: number, title: string) => {
    const chartRef = chartRefs.current[chartIndex];
    if (chartRef) {
      const canvas = chartRef.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_chart.png`;
      link.href = url;
      link.click();
    }
  }, []);

  // Analyze data to determine chart types
  const baseChartData = useMemo(() => {
    if (!data || !data.headers || !data.rows || data.rows.length === 0) {
      return null;
    }

    const { headers, rows } = data;
    
    // Identify numeric and categorical columns
    const columnTypes: { index: number; name: string; type: 'numeric' | 'categorical'; values: (string | number)[] }[] = [];
    
    headers.forEach((header, idx) => {
      const values = rows.map(row => row[idx]).filter(v => v && v.trim() !== '');
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      const isNumeric = numericValues.length > values.length * 0.7;
      
      columnTypes.push({
        index: idx,
        name: header,
        type: isNumeric ? 'numeric' : 'categorical',
        values: isNumeric ? numericValues : values,
      });
    });

    const numericColumns = columnTypes.filter(c => c.type === 'numeric');
    const categoricalColumns = columnTypes.filter(c => c.type === 'categorical');

    // Generate chart configurations
    const charts: ChartData[] = [];

    // 1. Bar chart for first numeric column distribution
    if (numericColumns.length > 0) {
      const numCol = numericColumns[0];
      const values = numCol.values as number[];
      
      // Create histogram bins
      const min = Math.min(...values);
      const max = Math.max(...values);
      const binCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
      const binSize = (max - min) / binCount || 1;
      const bins = Array(binCount).fill(0);
      
      values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binSize), binCount - 1);
        bins[binIndex]++;
      });

      const labels = Array(binCount).fill(0).map((_, i) => {
        const start = (min + i * binSize).toFixed(1);
        const end = (min + (i + 1) * binSize).toFixed(1);
        return `${start}-${end}`;
      });

      charts.push({
        type: 'bar',
        title: `Distribution of ${numCol.name}`,
        xAxisLabel: numCol.name,
        yAxisLabel: 'Count',
        data: { labels, bins },
        options: {},
      });
    }

    // 2. Line chart for numeric trends (if multiple numeric columns)
    if (numericColumns.length >= 2) {
      const xCol = numericColumns[0];
      const yCol = numericColumns[1];
      
      // Sort by x values and take sample
      const points = rows
        .map((row, idx) => ({
          x: parseFloat(row[xCol.index]),
          y: parseFloat(row[yCol.index]),
          idx,
        }))
        .filter(p => !isNaN(p.x) && !isNaN(p.y))
        .sort((a, b) => a.x - b.x)
        .slice(0, 50); // Limit to 50 points

      if (points.length > 5) {
        charts.push({
          type: 'line',
          title: `${yCol.name} vs ${xCol.name}`,
          xAxisLabel: xCol.name,
          yAxisLabel: yCol.name,
          data: { points, xCol: xCol.name, yCol: yCol.name },
          options: {},
        });
      }
    }

    // 3. Pie chart for categorical distribution
    if (categoricalColumns.length > 0) {
      const catCol = categoricalColumns[0];
      const valueCounts: Record<string, number> = {};
      
      (catCol.values as string[]).forEach(v => {
        const key = v.toString().substring(0, 30); // Truncate long labels
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });

      // Sort by count and take top 8
      const sortedEntries = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      if (sortedEntries.length > 1) {
        charts.push({
          type: 'pie',
          title: `Distribution of ${catCol.name}`,
          data: { entries: sortedEntries, colName: catCol.name },
          options: {},
        });
      }
    }

    // 4. Doughnut chart for data quality metrics
    if (insights && insights.length > 0) {
      const qualityInsight = insights.find(i => i.insightType === 'quality');
      if (qualityInsight) {
        const confidence = qualityInsight.confidence || 80;
        charts.push({
          type: 'doughnut',
          title: 'Data Quality Score',
          data: { confidence },
          options: {},
        });
      }
    }

    // 5. Multi-series bar chart for comparing numeric columns
    if (numericColumns.length >= 2) {
      const sampleSize = Math.min(10, rows.length);
      const sampleRows = rows.slice(0, sampleSize);
      
      charts.push({
        type: 'multiBar',
        title: 'Numeric Columns Comparison',
        xAxisLabel: 'Row',
        yAxisLabel: 'Value',
        data: { sampleRows, numericColumns: numericColumns.slice(0, 4) },
        options: {},
      });
    }

    return { charts, columnTypes, numericColumns, categoricalColumns };
  }, [data, insights]);

  // Get config for a specific chart
  const getChartConfig = useCallback((index: number, baseChart: ChartData): ChartConfig => {
    if (chartConfigs[index]) {
      return chartConfigs[index];
    }
    return {
      type: baseChart.type,
      title: baseChart.title,
      xAxisLabel: baseChart.xAxisLabel || '',
      yAxisLabel: baseChart.yAxisLabel || '',
      colorPalette: 'default',
      showLegend: baseChart.type === 'pie' || baseChart.type === 'doughnut' || baseChart.type === 'multiBar',
      showGrid: baseChart.type === 'bar' || baseChart.type === 'line' || baseChart.type === 'multiBar',
    };
  }, [chartConfigs]);

  // Handle config change
  const handleConfigChange = useCallback((index: number, config: ChartConfig) => {
    setChartConfigs(prev => ({ ...prev, [index]: config }));
  }, []);

  // Build chart data with customization
  const buildChartData = useCallback((baseChart: ChartData, config: ChartConfig) => {
    const palette = getColorPalette(config.colorPalette);
    
    switch (config.type) {
      case 'bar': {
        const labels = baseChart.data.labels || [];
        const bins = baseChart.data.bins || [];
        if (labels.length === 0) {
          return { data: { labels: [], datasets: [] }, options: {} };
        }
        return {
          data: {
            labels,
            datasets: [{
              label: 'Frequency',
              data: bins,
              backgroundColor: palette.colors[0],
              borderColor: palette.borderColors[0],
              borderWidth: 1,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: config.showLegend },
              title: { display: false },
            },
            scales: {
              y: { 
                beginAtZero: true, 
                title: { display: true, text: config.yAxisLabel || 'Count' },
                grid: { display: config.showGrid },
              },
              x: { 
                title: { display: true, text: config.xAxisLabel || '' },
                grid: { display: config.showGrid },
              },
            },
          },
        };
      }
      
      case 'line': {
        // Handle both bar->line conversion and native line chart data
        if (baseChart.data.points) {
          const { points } = baseChart.data;
          return {
            data: {
              labels: points.map((p: any) => p.x.toFixed(2)),
              datasets: [{
                label: config.yAxisLabel || baseChart.data.yCol,
                data: points.map((p: any) => p.y),
                borderColor: palette.borderColors[1],
                backgroundColor: palette.colors[1].replace('0.8', '0.1'),
                fill: true,
                tension: 0.4,
              }],
            },
            options: {
              responsive: true,
              plugins: {
                legend: { display: config.showLegend },
                title: { display: false },
              },
              scales: {
                y: { 
                  title: { display: true, text: config.yAxisLabel || '' },
                  grid: { display: config.showGrid },
                },
                x: { 
                  title: { display: true, text: config.xAxisLabel || '' },
                  grid: { display: config.showGrid },
                },
              },
            },
          };
        }
        // Convert bar data to line chart
        const { labels, bins } = baseChart.data;
        return {
          data: {
            labels: labels || [],
            datasets: [{
              label: config.yAxisLabel || 'Value',
              data: bins || [],
              borderColor: palette.borderColors[1],
              backgroundColor: palette.colors[1].replace('0.8', '0.1'),
              fill: true,
              tension: 0.4,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: config.showLegend },
              title: { display: false },
            },
            scales: {
              y: { 
                title: { display: true, text: config.yAxisLabel || '' },
                grid: { display: config.showGrid },
              },
              x: { 
                title: { display: true, text: config.xAxisLabel || '' },
                grid: { display: config.showGrid },
              },
            },
          },
        };
      }
      
      case 'pie': {
        const entries = baseChart.data.entries || [];
        if (entries.length === 0) {
          return { data: { labels: [], datasets: [] }, options: {} };
        }
        return {
          data: {
            labels: entries.map((e: any) => e[0]),
            datasets: [{
              data: entries.map((e: any) => e[1]),
              backgroundColor: palette.colors.slice(0, entries.length),
              borderColor: palette.borderColors.slice(0, entries.length),
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'right' as const, display: config.showLegend },
              title: { display: false },
            },
          },
        };
      }
      
      case 'doughnut': {
        const confidence = baseChart.data.confidence ?? 0;
        const qualityColor = confidence >= 80 ? palette.colors[1] : 
                           confidence >= 60 ? palette.colors[2] : palette.colors[3];
        const qualityBorder = confidence >= 80 ? palette.borderColors[1] : 
                            confidence >= 60 ? palette.borderColors[2] : palette.borderColors[3];
        return {
          data: {
            labels: ['Quality Score', 'Remaining'],
            datasets: [{
              data: [confidence, 100 - confidence],
              backgroundColor: [qualityColor, 'rgba(229, 231, 235, 0.5)'],
              borderColor: [qualityBorder, 'rgba(229, 231, 235, 1)'],
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            cutout: '70%',
            plugins: {
              legend: { display: config.showLegend },
              title: { display: false },
            },
          },
          confidence,
        };
      }
      
      case 'multiBar': {
        const sampleRows = baseChart.data.sampleRows || [];
        const numericColumns = baseChart.data.numericColumns || [];
        if (sampleRows.length === 0 || numericColumns.length === 0) {
          return { data: { labels: [], datasets: [] }, options: {} };
        }
        const labels = sampleRows.map((_: any, i: number) => `Row ${i + 1}`);
        const datasets = numericColumns.map((col: any, idx: number) => ({
          label: col.name,
          data: sampleRows.map((row: any) => parseFloat(row[col.index]) || 0),
          backgroundColor: palette.colors[idx],
          borderColor: palette.borderColors[idx],
          borderWidth: 1,
        }));
        return {
          data: { labels, datasets },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'top' as const, display: config.showLegend },
              title: { display: false },
            },
            scales: {
              y: { 
                beginAtZero: true,
                title: { display: true, text: config.yAxisLabel || 'Value' },
                grid: { display: config.showGrid },
              },
              x: {
                title: { display: true, text: config.xAxisLabel || 'Row' },
                grid: { display: config.showGrid },
              },
            },
          },
        };
      }
      
      default:
        return { data: {}, options: {} };
    }
  }, []);

  // Render chart based on type
  const renderChart = useCallback((chartData: any, config: ChartConfig, chartIndex: number) => {
    const setRef = (ref: any) => {
      if (ref) {
        chartRefs.current[chartIndex] = ref;
      }
    };

    switch (config.type) {
      case 'bar':
      case 'multiBar':
        return <Bar ref={setRef} data={chartData.data} options={chartData.options} />;
      case 'line':
        return <Line ref={setRef} data={chartData.data} options={chartData.options} />;
      case 'pie':
        return <Pie ref={setRef} data={chartData.data} options={chartData.options} />;
      case 'doughnut':
        return (
          <div className="relative">
            <Doughnut ref={setRef} data={chartData.data} options={chartData.options} />
            {chartData.confidence !== undefined && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-700">
                  {chartData.confidence}%
                </span>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  }, []);

  if (!baseChartData || baseChartData.charts.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Data Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-8">
            No suitable data found for visualization. Upload a CSV with numeric or categorical data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Interactive Data Visualizations
        <span className="text-sm font-normal text-slate-500 ml-2">(Hover over charts to customize)</span>
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {baseChartData.charts.map((baseChart, idx) => {
          const config = getChartConfig(idx, baseChart);
          const chartData = buildChartData(baseChart, config);
          
          // Determine available types based on original chart type
          let availableTypes: ('bar' | 'line' | 'pie' | 'doughnut' | 'multiBar')[] = ['bar', 'line'];
          if (baseChart.type === 'pie' || baseChart.type === 'doughnut') {
            availableTypes = ['pie', 'doughnut'];
          } else if (baseChart.type === 'multiBar') {
            availableTypes = ['bar', 'line', 'multiBar'];
          }
          
          return (
            <Card 
              key={idx} 
              className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative"
            >
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <ChartCustomizer
                  chartIndex={idx}
                  initialConfig={config}
                  onConfigChange={handleConfigChange}
                  availableTypes={availableTypes}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-white/80 hover:bg-white border-slate-200"
                  onClick={() => exportChartAsImage(idx, config.title)}
                  title="Export chart as PNG"
                >
                  <Image className="h-4 w-4 text-slate-600" />
                </Button>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-700">{config.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 flex items-center justify-center">
                  {renderChart(chartData, config, idx)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Summary */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-indigo-800">Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-indigo-600">{data.rows.length}</div>
              <div className="text-slate-600">Total Rows</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{data.headers.length}</div>
              <div className="text-slate-600">Total Columns</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-600">{baseChartData.numericColumns.length}</div>
              <div className="text-slate-600">Numeric Columns</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{baseChartData.categoricalColumns.length}</div>
              <div className="text-slate-600">Categorical Columns</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
