import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { 
  Loader2, Upload, Sparkles, BarChart3, TrendingUp, AlertCircle, 
  Brain, FileText, Zap, CheckCircle, AlertTriangle, Info, Download,
  LineChart, PieChart, Activity, Target, Shield, Lightbulb
} from "lucide-react";

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface Insight {
  id: number;
  title: string;
  content: string;
  insightType: string;
  confidence: number;
}

const categoryIcons: Record<string, any> = {
  overview: <BarChart3 className="w-5 h-5" />,
  quality: <Shield className="w-5 h-5" />,
  statistics: <Activity className="w-5 h-5" />,
  trends: <TrendingUp className="w-5 h-5" />,
  anomalies: <AlertTriangle className="w-5 h-5" />,
  insights: <Lightbulb className="w-5 h-5" />,
  recommendations: <Target className="w-5 h-5" />,
  risks: <AlertCircle className="w-5 h-5" />
};

const categoryColors: Record<string, string> = {
  overview: "bg-blue-50 border-blue-200 text-blue-900",
  quality: "bg-green-50 border-green-200 text-green-900",
  statistics: "bg-purple-50 border-purple-200 text-purple-900",
  trends: "bg-amber-50 border-amber-200 text-amber-900",
  anomalies: "bg-red-50 border-red-200 text-red-900",
  insights: "bg-cyan-50 border-cyan-200 text-cyan-900",
  recommendations: "bg-indigo-50 border-indigo-200 text-indigo-900",
  risks: "bg-orange-50 border-orange-200 text-orange-900"
};

const categoryBorders: Record<string, string> = {
  overview: "border-l-blue-600",
  quality: "border-l-green-600",
  statistics: "border-l-purple-600",
  trends: "border-l-amber-600",
  anomalies: "border-l-red-600",
  insights: "border-l-cyan-600",
  recommendations: "border-l-indigo-600",
  risks: "border-l-orange-600"
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [csvData, setCsvData] = useState<ParsedData | null>(null);
  const [fileName, setFileName] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCleaningDialog, setShowCleaningDialog] = useState(false);
  const [cleaningResult, setCleaningResult] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  const datasetsQuery = trpc.csv.list.useQuery(undefined, { enabled: isAuthenticated });
  const uploadMutation = trpc.csv.upload.useMutation();
  const generateInsightsMutation = trpc.insights.generate.useMutation();
  const cleanDataMutation = trpc.cleaning.clean.useMutation();
  const [datasetId, setDatasetId] = useState<number | null>(null);
  const insightsQuery = trpc.insights.list.useQuery(
    { datasetId: datasetId || 0 },
    { enabled: !!datasetId }
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
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvData || !fileName) return;

    try {
      setIsAnalyzing(true);
      const rawCsv = csvData.headers.join(',') + '\n' + 
                     csvData.rows.map(r => r.join(',')).join('\n');
      
      const payloadSize = new Blob([rawCsv]).size;
      if (payloadSize > 10 * 1024 * 1024) {
        alert('CSV file is too large (>10MB). Please upload a smaller file.');
        return;
      }
      
      const uploadResult = await uploadMutation.mutateAsync({
        fileName,
        csvContent: rawCsv,
        headers: csvData.headers,
        rowCount: csvData.rows.length,
      });

      const newDatasetId = (uploadResult as any)?.insertId || (uploadResult as any)?.lastInsertRowid || 1;
      setDatasetId(newDatasetId);

      // Generate insights with Manus LLM
      try {
        await generateInsightsMutation.mutateAsync({
          datasetId: newDatasetId,
          csvContent: rawCsv,
          headers: csvData.headers,
        });

        // Fetch insights after generation
        setTimeout(async () => {
          const result = await insightsQuery.refetch();
          if (result.data) {
            setInsights(result.data as any);
          }
        }, 1000);
      } catch (insightError) {
        console.warn("Insights generation failed", insightError);
      }

      setShowUploadDialog(false);
      setCsvData(null);
      setFileName("");
      
      datasetsQuery.refetch();
    } catch (error) {
      console.error("Upload failed:", error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-4000"></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Brain className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">{APP_TITLE}</h1>
              <p className="text-lg text-slate-300">Professional Data Intelligence Platform</p>
            </div>

            <Card className="bg-slate-800 border-slate-700 shadow-2xl">
              <CardContent className="pt-8 space-y-6">
                <p className="text-slate-300 text-center">
                  Upload your CSV files and unlock comprehensive AI-driven insights. Advanced statistical analysis, trend detection, and professional recommendations.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Comprehensive statistical analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Multi-faceted AI insights</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span>Professional visualizations</span>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  Sign in to get started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{APP_TITLE}</h1>
              <p className="text-xs text-slate-500">Professional Data Intelligence</p>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            {user?.name || "User"}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {insights.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Upload Card */}
            <div className="lg:col-span-1">
              <Card className="shadow-lg h-full">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Upload Data
                  </CardTitle>
                  <CardDescription>
                    Start your analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    onClick={() => setShowUploadDialog(true)}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose CSV File
                  </Button>

                  {datasetsQuery.data && datasetsQuery.data.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Recent Datasets</p>
                      <div className="space-y-2">
                        {datasetsQuery.data.slice(-3).map((dataset) => (
                          <button
                            key={dataset.id}
                            onClick={async () => {
                              console.log('Dataset clicked:', { fileName: dataset.fileName, rowCount: dataset.rowCount });
                              const parsed = parseCSV(dataset.rawCsv);
                              console.log('Parsed CSV:', { headers: parsed.headers.length, rows: parsed.rows.length });
                              setCsvData(parsed);
                              setFileName(dataset.fileName);
                              setDatasetId(dataset.id);
                              console.log('State updated:', { csvDataHeaders: parsed.headers.length, datasetId: dataset.id });
                              setIsAnalyzing(true);
                              try {
                                const result = await insightsQuery.refetch();
                                if (result.data && result.data.length > 0) {
                                  setInsights(result.data as any);
                                } else {
                                  const rawCsv = dataset.rawCsv;
                                  await generateInsightsMutation.mutateAsync({
                                    datasetId: dataset.id,
                                    csvContent: rawCsv,
                                    headers: dataset.headers,
                                  });
                                  setTimeout(async () => {
                                    const newResult = await insightsQuery.refetch();
                                    if (newResult.data) {
                                      setInsights(newResult.data as any);
                                    }
                                  }, 1000);
                                }
                              } catch (error) {
                                console.error("Error:", error);
                              } finally {
                                setIsAnalyzing(false);
                              }
                            }}
                            className="w-full text-left p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
                          >
                            <p className="font-medium text-sm text-slate-900 truncate">{dataset.fileName}</p>
                            <p className="text-xs text-slate-500">{dataset.rowCount} rows</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Info Cards */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg border-l-4 border-l-blue-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Professional Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-slate-600">
                  <p>Our advanced AI engine performs comprehensive data analysis across multiple dimensions:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Activity className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>Statistical analysis (mean, median, std dev, quartiles)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Trend detection and temporal patterns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span>Anomaly and outlier detection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Data quality assessment</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-l-4 border-l-purple-600">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Analysis Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-slate-600">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span>Overview & Structure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span>Data Quality</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                      <span>Statistics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
                      <span>Trends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span>Anomalies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-600 rounded-full"></div>
                      <span>Insights</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Analysis Results View */
          <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Comprehensive Analysis</h2>
                <p className="text-slate-600 mt-1">{fileName}</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  setInsights([]);
                }}
              >
                New Analysis
              </Button>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                All Insights
              </button>
              {Object.keys(categoryColors).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                    selectedCategory === cat
                      ? `${categoryColors[cat]} border border-current`
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 gap-4">
              {insights
                .filter(insight => !selectedCategory || insight.insightType === selectedCategory)
                .map((insight) => (
                  <Card 
                    key={insight.id} 
                    className={`shadow-lg border-l-4 ${categoryBorders[insight.insightType] || 'border-l-slate-600'}`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${categoryColors[insight.insightType] || 'bg-slate-50'}`}>
                          {categoryIcons[insight.insightType] || <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg text-slate-900">{insight.title}</h3>
                              <p className="text-xs text-slate-500 capitalize mt-1">{insight.insightType}</p>
                            </div>
                            <span className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap">
                              {insight.confidence}%
                            </span>
                          </div>
                          <p className="text-slate-700 mt-3 leading-relaxed">{insight.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Data Cleaning Section */}
            <Card className="shadow-lg border-l-4 border-l-indigo-600">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  AI Data Cleaning
                </CardTitle>
                <CardDescription>Automatically fix data quality issues, standardize formats, and clean your dataset</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Our AI engine will:</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Identify and fix data quality issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Standardize data formats and types</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Handle missing values appropriately</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Improve column labels and structure</span>
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold mt-4"
                    onClick={async () => {
                      console.log('Clean & Fix Data clicked', { csvData, datasetId, fileName });
                      
                      if (!csvData || !csvData.headers || csvData.headers.length === 0) {
                        console.error('CSV data is missing or invalid', { csvData });
                        alert('Please upload a CSV file first');
                        return;
                      }
                      if (!datasetId) {
                        alert('Please select a dataset');
                        return;
                      }
                      setIsCleaning(true);
                      try {
                        // Construct CSV content with headers and data rows
                        const csvLines = [csvData.headers.join(','), ...csvData.rows.map(row => row.join(','))];
                        const csvContent = csvLines.join('\n');
                        
                        console.log('Sending cleaning request:', { datasetId, csvLength: csvContent.length, headersLength: csvData.headers.length });
                        
                        const result = await cleanDataMutation.mutateAsync({
                          datasetId,
                          csvContent,
                          headers: csvData.headers,
                        });
                        console.log('Cleaning result:', result);
                        setCleaningResult(result);
                        setShowCleaningDialog(true);
                      } catch (error) {
                        console.error('Cleaning error:', error);
                        alert('Error during data cleaning: ' + (error instanceof Error ? error.message : 'Unknown error'));
                      } finally {
                        setIsCleaning(false);
                      }
                    }}
                    disabled={isCleaning}
                  >
                    {isCleaning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cleaning Data...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Clean & Fix Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export Section */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                <CardTitle className="text-lg">Export Results</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Button className="bg-slate-600 hover:bg-slate-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Copy Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
            <DialogDescription>
              Select a CSV file for professional AI analysis
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
                <p className="text-xs text-blue-700">{csvData?.rows.length || 0} rows, {csvData?.headers.length || 0} columns</p>
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
                disabled={!csvData || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Data Cleaning Results Dialog */}
      <Dialog open={showCleaningDialog} onOpenChange={setShowCleaningDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Cleaning Results</DialogTitle>
            <DialogDescription>
              Review the cleaning report and download the cleaned CSV file
            </DialogDescription>
          </DialogHeader>

          {cleaningResult && (
            <div className="space-y-6">
              {/* Cleaning Report */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Issues Found & Fixed</h3>
                  <ul className="space-y-1 text-sm text-green-800">
                    {cleaningResult.report?.issuesFound?.map((issue: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Fixes Applied</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    {cleaningResult.report?.fixesApplied?.map((fix: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Rows Affected</p>
                    <p className="text-2xl font-bold text-slate-900">{cleaningResult.report?.rowsAffected || 0}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Columns Affected</p>
                    <p className="text-2xl font-bold text-slate-900">{cleaningResult.report?.columnsAffected || 0}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-1">Quality Improvement</p>
                    <p className="text-2xl font-bold text-green-600">{cleaningResult.report?.dataQualityImprovement || 0}%</p>
                  </div>
                </div>
              </div>

              {/* Preview of cleaned data */}
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Cleaned Data Preview</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words">
                    {cleaningResult.cleanedCsv?.split('\n').slice(0, 10).join('\n')}
                  </pre>
                </div>
              </div>

              {/* Download button */}
              <div className="flex gap-3">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(cleaningResult.cleanedCsv));
                    element.setAttribute('download', `cleaned_${fileName || 'data'}.csv`);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Cleaned CSV
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCleaningDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

