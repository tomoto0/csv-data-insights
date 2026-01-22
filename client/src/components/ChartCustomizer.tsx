import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Palette, Type, BarChart3, LineChart, PieChart, Circle, Save, RotateCcw } from 'lucide-react';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'multiBar';
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  colorPalette: string;
  showLegend: boolean;
  showGrid: boolean;
}

interface ChartCustomizerProps {
  chartIndex: number;
  initialConfig: ChartConfig;
  onConfigChange: (index: number, config: ChartConfig) => void;
  availableTypes?: ('bar' | 'line' | 'pie' | 'doughnut' | 'multiBar')[];
}

// Predefined color palettes
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
  forest: {
    name: 'Forest',
    colors: [
      'rgba(34, 197, 94, 0.8)',
      'rgba(22, 163, 74, 0.8)',
      'rgba(21, 128, 61, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(132, 204, 22, 0.8)',
      'rgba(163, 230, 53, 0.8)',
      'rgba(74, 222, 128, 0.8)',
      'rgba(134, 239, 172, 0.8)',
    ],
    borderColors: [
      'rgba(34, 197, 94, 1)',
      'rgba(22, 163, 74, 1)',
      'rgba(21, 128, 61, 1)',
      'rgba(20, 184, 166, 1)',
      'rgba(132, 204, 22, 1)',
      'rgba(163, 230, 53, 1)',
      'rgba(74, 222, 128, 1)',
      'rgba(134, 239, 172, 1)',
    ],
  },
  monochrome: {
    name: 'Monochrome',
    colors: [
      'rgba(30, 41, 59, 0.8)',
      'rgba(51, 65, 85, 0.8)',
      'rgba(71, 85, 105, 0.8)',
      'rgba(100, 116, 139, 0.8)',
      'rgba(148, 163, 184, 0.8)',
      'rgba(203, 213, 225, 0.8)',
      'rgba(226, 232, 240, 0.8)',
      'rgba(241, 245, 249, 0.8)',
    ],
    borderColors: [
      'rgba(30, 41, 59, 1)',
      'rgba(51, 65, 85, 1)',
      'rgba(71, 85, 105, 1)',
      'rgba(100, 116, 139, 1)',
      'rgba(148, 163, 184, 1)',
      'rgba(203, 213, 225, 1)',
      'rgba(226, 232, 240, 1)',
      'rgba(241, 245, 249, 1)',
    ],
  },
  vibrant: {
    name: 'Vibrant',
    colors: [
      'rgba(168, 85, 247, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(14, 165, 233, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(99, 102, 241, 0.8)',
      'rgba(6, 182, 212, 0.8)',
    ],
    borderColors: [
      'rgba(168, 85, 247, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(14, 165, 233, 1)',
      'rgba(34, 197, 94, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(99, 102, 241, 1)',
      'rgba(6, 182, 212, 1)',
    ],
  },
};

export const getColorPalette = (paletteName: string) => {
  return colorPalettes[paletteName] || colorPalettes.default;
};

const chartTypeIcons: Record<string, React.ReactNode> = {
  bar: <BarChart3 className="w-4 h-4" />,
  line: <LineChart className="w-4 h-4" />,
  pie: <PieChart className="w-4 h-4" />,
  doughnut: <Circle className="w-4 h-4" />,
  multiBar: <BarChart3 className="w-4 h-4" />,
};

const chartTypeLabels: Record<string, string> = {
  bar: 'Bar Chart',
  line: 'Line Chart',
  pie: 'Pie Chart',
  doughnut: 'Doughnut Chart',
  multiBar: 'Multi-Series Bar',
};

export default function ChartCustomizer({
  chartIndex,
  initialConfig,
  onConfigChange,
  availableTypes = ['bar', 'line', 'pie', 'doughnut', 'multiBar'],
}: ChartCustomizerProps) {
  const [config, setConfig] = useState<ChartConfig>(initialConfig);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleSave = () => {
    onConfigChange(chartIndex, config);
    setIsOpen(false);
  };

  const handleReset = () => {
    setConfig(initialConfig);
  };

  const updateConfig = (key: keyof ChartConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white/80 hover:bg-white border-slate-200"
        >
          <Settings className="w-4 h-4 text-slate-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Customize Chart
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Chart Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Chart Type
            </Label>
            <Select
              value={config.type}
              onValueChange={(value) => updateConfig('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      {chartTypeIcons[type]}
                      {chartTypeLabels[type]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chart Title */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500" />
              Chart Title
            </Label>
            <Input
              value={config.title}
              onChange={(e) => updateConfig('title', e.target.value)}
              placeholder="Enter chart title"
            />
          </div>

          {/* Axis Labels (only for bar/line charts) */}
          {(config.type === 'bar' || config.type === 'line' || config.type === 'multiBar') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>X-Axis Label</Label>
                <Input
                  value={config.xAxisLabel}
                  onChange={(e) => updateConfig('xAxisLabel', e.target.value)}
                  placeholder="X-Axis"
                />
              </div>
              <div className="space-y-2">
                <Label>Y-Axis Label</Label>
                <Input
                  value={config.yAxisLabel}
                  onChange={(e) => updateConfig('yAxisLabel', e.target.value)}
                  placeholder="Y-Axis"
                />
              </div>
            </div>
          )}

          {/* Color Palette */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-slate-500" />
              Color Palette
            </Label>
            <Select
              value={config.colorPalette}
              onValueChange={(value) => updateConfig('colorPalette', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(colorPalettes).map(([key, palette]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {palette.colors.slice(0, 5).map((color, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span>{palette.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Color Preview */}
            <div className="flex gap-1 mt-2 p-2 bg-slate-50 rounded-lg">
              {getColorPalette(config.colorPalette).colors.map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-md shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <Label>Display Options</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showLegend}
                  onChange={(e) => updateConfig('showLegend', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Show Legend</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGrid}
                  onChange={(e) => updateConfig('showGrid', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700">Show Grid</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
