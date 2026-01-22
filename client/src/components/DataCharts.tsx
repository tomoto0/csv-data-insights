import { useMemo } from 'react';
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

// Color palette for charts
const chartColors = [
  'rgba(99, 102, 241, 0.8)',   // Indigo
  'rgba(16, 185, 129, 0.8)',   // Emerald
  'rgba(245, 158, 11, 0.8)',   // Amber
  'rgba(239, 68, 68, 0.8)',    // Red
  'rgba(139, 92, 246, 0.8)',   // Violet
  'rgba(6, 182, 212, 0.8)',    // Cyan
  'rgba(236, 72, 153, 0.8)',   // Pink
  'rgba(34, 197, 94, 0.8)',    // Green
];

const chartBorderColors = [
  'rgba(99, 102, 241, 1)',
  'rgba(16, 185, 129, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
  'rgba(139, 92, 246, 1)',
  'rgba(6, 182, 212, 1)',
  'rgba(236, 72, 153, 1)',
  'rgba(34, 197, 94, 1)',
];

export default function DataCharts({ data, insights }: DataChartsProps) {
  // Analyze data to determine chart types
  const chartData = useMemo(() => {
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
    const charts: any[] = [];

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
        data: {
          labels,
          datasets: [{
            label: 'Frequency',
            data: bins,
            backgroundColor: chartColors[0],
            borderColor: chartBorderColors[0],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: false },
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Count' } },
            x: { title: { display: true, text: numCol.name } },
          },
        },
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
          data: {
            labels: points.map(p => p.x.toFixed(2)),
            datasets: [{
              label: yCol.name,
              data: points.map(p => p.y),
              borderColor: chartBorderColors[1],
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: true },
              title: { display: false },
            },
            scales: {
              y: { title: { display: true, text: yCol.name } },
              x: { title: { display: true, text: xCol.name } },
            },
          },
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
          data: {
            labels: sortedEntries.map(e => e[0]),
            datasets: [{
              data: sortedEntries.map(e => e[1]),
              backgroundColor: chartColors.slice(0, sortedEntries.length),
              borderColor: chartBorderColors.slice(0, sortedEntries.length),
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'right' as const },
              title: { display: false },
            },
          },
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
          data: {
            labels: ['Quality Score', 'Remaining'],
            datasets: [{
              data: [confidence, 100 - confidence],
              backgroundColor: [
                confidence >= 80 ? 'rgba(16, 185, 129, 0.8)' : 
                confidence >= 60 ? 'rgba(245, 158, 11, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                'rgba(229, 231, 235, 0.5)',
              ],
              borderColor: [
                confidence >= 80 ? 'rgba(16, 185, 129, 1)' : 
                confidence >= 60 ? 'rgba(245, 158, 11, 1)' : 'rgba(239, 68, 68, 1)',
                'rgba(229, 231, 235, 1)',
              ],
              borderWidth: 2,
            }],
          },
          options: {
            responsive: true,
            cutout: '70%',
            plugins: {
              legend: { display: false },
              title: { display: false },
            },
          },
        });
      }
    }

    // 5. Multi-series bar chart for comparing numeric columns
    if (numericColumns.length >= 2) {
      const sampleSize = Math.min(10, rows.length);
      const sampleRows = rows.slice(0, sampleSize);
      const labels = sampleRows.map((_, i) => `Row ${i + 1}`);
      
      const datasets = numericColumns.slice(0, 4).map((col, idx) => ({
        label: col.name,
        data: sampleRows.map(row => parseFloat(row[col.index]) || 0),
        backgroundColor: chartColors[idx],
        borderColor: chartBorderColors[idx],
        borderWidth: 1,
      }));

      charts.push({
        type: 'multiBar',
        title: 'Numeric Columns Comparison',
        data: { labels, datasets },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' as const },
            title: { display: false },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }

    return { charts, columnTypes, numericColumns, categoricalColumns };
  }, [data, insights]);

  if (!chartData || chartData.charts.length === 0) {
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
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData.charts.map((chart, idx) => (
          <Card key={idx} className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-700">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 flex items-center justify-center">
                {chart.type === 'bar' && <Bar data={chart.data} options={chart.options} />}
                {chart.type === 'line' && <Line data={chart.data} options={chart.options} />}
                {chart.type === 'pie' && <Pie data={chart.data} options={chart.options} />}
                {chart.type === 'doughnut' && (
                  <div className="relative">
                    <Doughnut data={chart.data} options={chart.options} />
                    {chart.title === 'Data Quality Score' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-700">
                          {chart.data.datasets[0].data[0]}%
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {chart.type === 'multiBar' && <Bar data={chart.data} options={chart.options} />}
              </div>
            </CardContent>
          </Card>
        ))}
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
              <div className="text-2xl font-bold text-amber-600">{chartData.numericColumns.length}</div>
              <div className="text-slate-600">Numeric Columns</div>
            </div>
            <div className="bg-white/60 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{chartData.categoricalColumns.length}</div>
              <div className="text-slate-600">Categorical Columns</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
