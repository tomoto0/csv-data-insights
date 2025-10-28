import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /**
   * Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user.
   * This mirrors the Manus account and should be used for authentication lookups.
   */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * CSV Dataset table - stores uploaded CSV files and their metadata
 */
export const csvDatasets = mysqlTable("csvDatasets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  rawCsv: text("rawCsv").notNull(),
  headers: json("headers").$type<string[]>().notNull(),
  rowCount: int("rowCount").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CsvDataset = typeof csvDatasets.$inferSelect;
export type InsertCsvDataset = typeof csvDatasets.$inferInsert;

/**
 * Chart Configuration table - stores chart settings and visualizations
 */
export const chartConfigs = mysqlTable("chartConfigs", {
  id: int("id").autoincrement().primaryKey(),
  datasetId: int("datasetId").notNull(),
  chartType: varchar("chartType", { length: 50 }).notNull(), // bar, line, pie, doughnut
  labelColumn: int("labelColumn").notNull(),
  datasets: json("datasets").$type<number[]>().notNull(),
  datasetColors: json("datasetColors").$type<Record<string, string>>().notNull(),
  palette: varchar("palette", { length: 50 }).default("vibrant").notNull(),
  baseColor: varchar("baseColor", { length: 7 }).default("#6b76ff").notNull(),
  canvasBg: varchar("canvasBg", { length: 7 }).default("#0b0f20").notNull(),
  textColor: varchar("textColor", { length: 7 }).default("#f1f3ff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChartConfig = typeof chartConfigs.$inferSelect;
export type InsertChartConfig = typeof chartConfigs.$inferInsert;

/**
 * Data Insights table - stores AI-generated insights about datasets
 */
export const dataInsights = mysqlTable("dataInsights", {
  id: int("id").autoincrement().primaryKey(),
  datasetId: int("datasetId").notNull(),
  insightType: varchar("insightType", { length: 100 }).notNull(), // summary, trends, anomalies, recommendations
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  confidence: int("confidence").default(0).notNull(), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataInsight = typeof dataInsights.$inferSelect;
export type InsertDataInsight = typeof dataInsights.$inferInsert;



/**
 * Data Cleaning Results table - stores AI-cleaned CSV data and cleaning details
 */
export const dataCleaningResults = mysqlTable("dataCleaningResults", {
  id: int("id").autoincrement().primaryKey(),
  datasetId: int("datasetId").notNull(),
  originalCsv: text("originalCsv").notNull(),
  cleanedCsv: text("cleanedCsv").notNull(),
  cleaningReport: json("cleaningReport").$type<any>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataCleaningResult = typeof dataCleaningResults.$inferSelect;
export type InsertDataCleaningResult = typeof dataCleaningResults.$inferInsert;

