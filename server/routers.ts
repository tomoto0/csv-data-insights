import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { TRPCError } from "@trpc/server";

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
          input.datasetColors,
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

  // AI Insights generation
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

          // Prepare data summary for LLM
          const lines = input.csvContent.trim().split('\n').slice(0, 11); // First 10 data rows
          const dataSample = lines.join('\n');

          // Generate insights using LLM
          const response = await invokeLLM({
            messages: [
              {
                role: "system" as const,
                content: `You are a data analyst expert. Analyze the provided CSV data and generate 3-4 key insights.
                
For each insight, provide:
1. A clear, concise title
2. A detailed explanation of what the data shows
3. A confidence level (0-100) based on data completeness

Format your response as JSON array with objects containing: { title, content, type, confidence }
Types: summary, trends, anomalies, recommendations`
              },
              {
                role: "user" as const,
                content: `Analyze this CSV data:\n\nHeaders: ${input.headers.join(', ')}\n\nData sample:\n${dataSample}`
              }
            ] as any,
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "data_insights",
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
                          type: { type: "string", enum: ["summary", "trends", "anomalies", "recommendations"] },
                          confidence: { type: "integer", minimum: 0, maximum: 100 }
                        },
                        required: ["title", "content", "type", "confidence"],
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
              insight.type,
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
});

export type AppRouter = typeof appRouter;

