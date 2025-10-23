import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { Loader2, Upload, Sparkles, BarChart3, TrendingUp, AlertCircle } from "lucide-react";

interface ParsedData {
  headers: string[];
  rows: string[][];
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [csvData, setCsvData] = useState<ParsedData | null>(null);
  const [fileName, setFileName] = useState("");
  const [chartType, setChartType] = useState("line");
  const [labelColumn, setLabelColumn] = useState(0);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const datasetsQuery = trpc.csv.list.useQuery(undefined, { enabled: isAuthenticated });
  const uploadMutation = trpc.csv.upload.useMutation();
  const generateInsightsMutation = trpc.insights.generate.useMutation();
  const insightsQuery = trpc.insights.list.useQuery(
    { datasetId: selectedDataset || 0 },
    { enabled: !!selectedDataset }
  );

  const parseCSV = (text: string): ParsedData => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
    return { headers, rows };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCSV(content);
      setCsvData(parsed);
      setLabelColumn(0);
      setSelectedColumns(parsed.headers.length > 1 ? [1] : [0]);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvData || !fileName) return;

    try {
      const rawCsv = csvData.headers.join(',') + '\n' + 
                     csvData.rows.map(r => r.join(',')).join('\n');
      
      await uploadMutation.mutateAsync({
        fileName,
        csvContent: rawCsv,
        headers: csvData.headers,
        rowCount: csvData.rows.length,
      });

      // Refetch datasets to get the newly created one
      const datasets = await datasetsQuery.refetch();
      if (datasets.data && datasets.data.length > 0) {
        setSelectedDataset(datasets.data[datasets.data.length - 1].id);
      }
      setShowUploadDialog(false);
      setCsvData(null);
      setFileName("");
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleGenerateInsights = async () => {
    if (!selectedDataset || !csvData) return;

    try {
      const rawCsv = csvData.headers.join(',') + '\n' + 
                     csvData.rows.map(r => r.join(',')).join('\n');
      
      await generateInsightsMutation.mutateAsync({
        datasetId: selectedDataset,
        csvContent: rawCsv,
        headers: csvData.headers,
      });

      insightsQuery.refetch();
    } catch (error) {
      console.error("Insights generation failed:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
            <CardDescription>AI-Powered Data Visualization & Insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Upload your CSV files, create beautiful visualizations, and get AI-powered insights about your data.
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Sign in to get started
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{APP_TITLE}</h1>
              <p className="text-xs text-slate-500">Data Visualization & AI Insights</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Welcome, {user?.name || "User"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Your Datasets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </Button>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {datasetsQuery.data?.map((dataset) => (
                    <button
                      key={dataset.id}
                      onClick={() => {
                        setSelectedDataset(dataset.id);
                        // Load CSV data
                        const parsed = parseCSV(dataset.rawCsv);
                        setCsvData(parsed);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedDataset === dataset.id
                          ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-900 truncate">{dataset.fileName}</p>
                      <p className="text-xs text-slate-500">{dataset.rowCount} rows</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {selectedDataset && csvData ? (
              <>
                {/* Chart Configuration */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Chart Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                          Chart Type
                        </label>
                        <Select value={chartType} onValueChange={setChartType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="line">Line</SelectItem>
                            <SelectItem value="bar">Bar</SelectItem>
                            <SelectItem value="pie">Pie</SelectItem>
                            <SelectItem value="doughnut">Doughnut</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-2">
                          Label Column
                        </label>
                        <Select value={String(labelColumn)} onValueChange={(v) => setLabelColumn(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {csvData.headers.map((header, idx) => (
                              <SelectItem key={idx} value={String(idx)}>
                                {header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-2">
                        Data Columns
                      </label>
                      <div className="space-y-2">
                        {csvData.headers.map((header, idx) => (
                          idx !== labelColumn && (
                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedColumns.includes(idx)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedColumns([...selectedColumns, idx]);
                                  } else {
                                    setSelectedColumns(selectedColumns.filter(i => i !== idx));
                                  }
                                }}
                                className="rounded border-slate-300"
                              />
                              <span className="text-sm text-slate-700">{header}</span>
                            </label>
                          )
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Insights */}
                <Card className="shadow-md border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      AI Insights
                    </CardTitle>
                    <CardDescription>
                      Get AI-powered analysis of your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={handleGenerateInsights}
                      disabled={generateInsightsMutation.isPending}
                    >
                      {generateInsightsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Insights
                        </>
                      )}
                    </Button>

                    {insightsQuery.data && insightsQuery.data.length > 0 && (
                      <div className="space-y-3">
                        {insightsQuery.data.map((insight) => (
                          <div key={insight.id} className="p-3 bg-white rounded-lg border border-purple-100">
                            <div className="flex items-start gap-2 mb-2">
                              {insight.insightType === 'trends' && <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />}
                              {insight.insightType === 'anomalies' && <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />}
                              {insight.insightType === 'summary' && <BarChart3 className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />}
                              <div className="flex-1">
                                <p className="font-medium text-sm text-slate-900">{insight.title}</p>
                                <p className="text-xs text-slate-500 capitalize">{insight.insightType}</p>
                              </div>
                              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                {insight.confidence}%
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">{insight.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="shadow-md">
                <CardContent className="py-12 text-center">
                  <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium mb-2">No dataset selected</p>
                  <p className="text-sm text-slate-500">Upload a CSV file or select one from your datasets to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
            <DialogDescription>
              Select a CSV file to upload and visualize
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-medium text-slate-900">Click to select file</p>
              <p className="text-sm text-slate-500">or drag and drop</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {fileName && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">{fileName}</p>
                <p className="text-xs text-blue-700">{csvData?.rows.length || 0} rows</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowUploadDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleUpload}
                disabled={!csvData || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

