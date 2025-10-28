import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";

// Helper function to calculate statistics
function calculateStatistics(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  return { mean, median, stdDev, min, max, q1, q3, iqr, variance };
}

// Helper function to analyze data structure
function analyzeDataStructure(headers: string[], rows: string[][]) {
  const analysis: any = {
    totalRows: rows.length,
    totalColumns: headers.length,
    columns: []
  };

  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    const values = rows.map(r => r[colIdx]).filter(v => v && v.trim());
    const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    const column: any = {
      name: headers[colIdx],
      type: numericValues.length > values.length * 0.7 ? 'numeric' : 'categorical',
      uniqueCount: new Set(values).size,
      missingCount: rows.length - values.length,
      missingPercent: ((rows.length - values.length) / rows.length * 100).toFixed(2)
    };

    if (column.type === 'numeric' && numericValues.length > 0) {
      column.statistics = calculateStatistics(numericValues);
    }

    analysis.columns.push(column);
  }

  return analysis;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // CSV Dataset operations
  csv: router({
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        csvContent: z.string(),
        headers: z.array(z.string()),
        rowCount: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createCsvDataset(
          ctx.user.id,
          input.fileName,
          input.csvContent,
          input.headers,
          input.rowCount
        );
        return result;
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserCsvDatasets(ctx.user.id);
      }),

    get: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .query(async ({ input }) => {
        const dataset = await db.getCsvDataset(input.datasetId);
        if (!dataset) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return dataset;
      }),

    delete: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCsvDataset(input.datasetId);
        return { success: true };
      }),
  }),

  // Chart Configuration operations
  chart: router({
    create: protectedProcedure
      .input(z.object({
        datasetId: z.number(),
        chartType: z.string(),
        labelColumn: z.number(),
        datasets: z.array(z.number()),
        datasetColors: z.record(z.any(), z.any()),
        palette: z.string(),
        baseColor: z.string(),
        canvasBg: z.string(),
        textColor: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createChartConfig(
          input.datasetId,
          input.chartType,
          input.labelColumn,
          input.datasets,
          input.datasetColors as any,
          input.palette,
          input.baseColor,
          input.canvasBg,
          input.textColor
        );
        return result;
      }),

    listByDataset: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDatasetChartConfigs(input.datasetId);
      }),

    get: protectedProcedure
      .input(z.object({ configId: z.number() }))
      .query(async ({ input }) => {
        const config = await db.getChartConfig(input.configId);
        if (!config) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return config;
      }),

    update: protectedProcedure
      .input(z.object({
        configId: z.number(),
        chartType: z.string().optional(),
        labelColumn: z.number().optional(),
        datasets: z.array(z.number()).optional(),
        datasetColors: z.record(z.any(), z.any()).optional(),
        palette: z.string().optional(),
        baseColor: z.string().optional(),
        canvasBg: z.string().optional(),
        textColor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { configId, ...updates } = input;
        const typedUpdates = updates as Partial<Omit<any, 'id' | 'datasetId' | 'createdAt'>>;
        await db.updateChartConfig(configId, typedUpdates);
        return { success: true };
      }),
  }),

  // AI Insights generation with detailed analysis
  insights: router({
    generate: protectedProcedure
      .input(z.object({
        datasetId: z.number(),
        csvContent: z.string(),
        headers: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        try {
          // Delete existing insights for this dataset
          await db.deleteDatasetInsights(input.datasetId);

          // Parse CSV data
          const lines = input.csvContent.trim().split('\n');
          const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

          // Analyze data structure
          const dataStructure = analyzeDataStructure(input.headers, rows);

          // Prepare comprehensive data summary for LLM
          const dataSample = lines.slice(0, 21).join('\n'); // First 20 data rows
          
          // Generate comprehensive analysis using LLM
          const response = await invokeLLM({
            messages: [
              {
                role: "system" as const,
                content: `You are a professional data analyst and business intelligence expert. 
Analyze the provided CSV data comprehensively and generate detailed, multi-faceted insights.

Provide analysis in the following categories:
1. OVERVIEW: Dataset structure, size, and composition
2. DATA QUALITY: Missing values, outliers, data consistency
3. STATISTICAL ANALYSIS: Key metrics, distributions, correlations
4. TRENDS & PATTERNS: Temporal trends, seasonal patterns, cycles
5. ANOMALIES: Unusual values, outliers, data inconsistencies
6. BUSINESS INSIGHTS: Actionable insights for decision-making
7. RECOMMENDATIONS: Specific, actionable next steps
8. RISKS & CONSIDERATIONS: Data quality issues, limitations

For each insight, provide:
- A clear, professional title
- Detailed explanation with specific numbers and percentages
- Business relevance and impact
- Confidence level (0-100) based on data completeness
- Recommended action

Format your response as a JSON array with objects containing:
{ title, content, category, confidence, actionable }

Categories: overview, quality, statistics, trends, anomalies, insights, recommendations, risks`
              },
              {
                role: "user" as const,
                content: `Analyze this CSV data comprehensively:

Headers: ${input.headers.join(', ')}
Total Rows: ${rows.length}
Total Columns: ${input.headers.length}

Data Structure Analysis:
${JSON.stringify(dataStructure, null, 2)}

Data Sample (first 20 rows):
${dataSample}

Provide 8-12 detailed, professional insights covering all analysis categories.`
              }
            ] as any,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "comprehensive_data_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          content: { type: "string" },
                          category: { 
                            type: "string", 
                            enum: ["overview", "quality", "statistics", "trends", "anomalies", "insights", "recommendations", "risks"]
                          },
                          confidence: { type: "integer", minimum: 0, maximum: 100 },
                          actionable: { type: "boolean" }
                        },
                        required: ["title", "content", "category", "confidence", "actionable"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["insights"],
                  additionalProperties: false
                }
              }
            } as any
          });

          // Parse the response
          const content = response.choices[0]?.message?.content as string;
          if (!content) {
            throw new Error("No content in LLM response");
          }

          const parsed = JSON.parse(content);
          const insights = parsed.insights || [];

          // Store insights in database
          for (const insight of insights) {
            await db.createDataInsight(
              input.datasetId,
              insight.category,
              insight.title,
              insight.content,
              insight.confidence
            );
          }

          return { success: true, count: insights.length };
        } catch (error) {
          console.error("Error generating insights:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate insights'
          });
        }
      }),

    list: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDatasetInsights(input.datasetId);
      }),
  }),

  // Data Cleaning operations
  cleaning: router({
    clean: protectedProcedure
      .input(z.object({
        datasetId: z.number(),
        csvContent: z.string(),
        headers: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        try {
          // Parse CSV data
          const lines = input.csvContent.trim().split('\n');
          const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

          // Use Manus LLM to clean and fix the data
          const response = await invokeLLM({
            messages: [
              {
                role: "system" as const,
                content: `You are a professional data cleaning expert. Analyze the provided CSV data and:
1. Identify data quality issues (missing values, inconsistent formatting, duplicates, outliers)
2. Suggest fixes for column/row positioning issues
3. Improve column labels if needed
4. Handle missing values appropriately
5. Standardize data formats

Provide a cleaned CSV output and a detailed report of all changes made.

Output format:
CLEANED_CSV_START
[cleaned CSV content here]
CLEANED_CSV_END

REPORT_START
[JSON report here]
REPORT_END`
              },
              {
                role: "user" as const,
                content: `Clean this CSV data:

Headers: ${input.headers.join(', ')}

Data (first 20 rows):
${lines.slice(0, 21).join('\n')}

Total rows: ${rows.length}
Total columns: ${input.headers.length}`
              }
            ] as any,
          });

          // Parse the response
          const content = response.choices[0]?.message?.content as string;
          if (!content) {
            throw new Error("No content in LLM response");
          }

          // Extract cleaned CSV and report
          const csvMatch = content.match(/CLEANED_CSV_START\n([\s\S]*?)\nCLEANED_CSV_END/);
          const reportMatch = content.match(/REPORT_START\n([\s\S]*?)\nREPORT_END/);

          if (!csvMatch || !reportMatch) {
            throw new Error("Invalid response format from LLM");
          }

          const cleanedCsv = csvMatch[1];
          const reportStr = reportMatch[1];
          const cleaningReport = JSON.parse(reportStr);

          // Store cleaning result in database
          await db.createCleaningResult(
            input.datasetId,
            input.csvContent,
            cleanedCsv,
            cleaningReport
          );

          return {
            success: true,
            cleanedCsv,
            report: cleaningReport
          };
        } catch (error) {
          console.error("Error cleaning data:", error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to clean data'
          });
        }
      }),

    getResult: protectedProcedure
      .input(z.object({ datasetId: z.number() }))
      .query(async ({ input }) => {
        return await db.getLatestCleaningResult(input.datasetId);
      }),
  }),
});

export type AppRouter = typeof appRouter;

