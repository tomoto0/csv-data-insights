import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, csvDatasets, chartConfigs, dataInsights, dataCleaningResults, CsvDataset, ChartConfig, DataInsight, DataCleaningResult } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// CSV Dataset queries
export async function createCsvDataset(userId: number, fileName: string, rawCsv: string, headers: string[], rowCount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(csvDatasets).values({
    userId,
    fileName,
    rawCsv,
    headers,
    rowCount,
  });

  return result;
}

export async function getCsvDataset(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(csvDatasets).where(eq(csvDatasets.id, datasetId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserCsvDatasets(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(csvDatasets).where(eq(csvDatasets.userId, userId));
}

export async function deleteCsvDataset(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(csvDatasets).where(eq(csvDatasets.id, datasetId));
}

// Chart Configuration queries
export async function createChartConfig(
  datasetId: number,
  chartType: string,
  labelColumn: number,
  datasets: number[],
  datasetColors: Record<string, string>,
  palette: string,
  baseColor: string,
  canvasBg: string,
  textColor: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chartConfigs).values({
    datasetId,
    chartType,
    labelColumn,
    datasets,
    datasetColors,
    palette,
    baseColor,
    canvasBg,
    textColor,
  });

  return result;
}

export async function getChartConfig(configId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(chartConfigs).where(eq(chartConfigs.id, configId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getDatasetChartConfigs(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(chartConfigs).where(eq(chartConfigs.datasetId, datasetId));
}

export async function updateChartConfig(
  configId: number,
  updates: Partial<Omit<ChartConfig, 'id' | 'datasetId' | 'createdAt'>>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(chartConfigs).set(updates).where(eq(chartConfigs.id, configId));
}

// Data Insights queries
export async function createDataInsight(
  datasetId: number,
  insightType: string,
  title: string,
  content: string,
  confidence: number = 0
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dataInsights).values({
    datasetId,
    insightType,
    title,
    content,
    confidence,
  });

  return result;
}

export async function getDatasetInsights(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(dataInsights).where(eq(dataInsights.datasetId, datasetId));
}

export async function deleteDatasetInsights(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.delete(dataInsights).where(eq(dataInsights.datasetId, datasetId));
}



// Data Cleaning Results queries
export async function createCleaningResult(
  datasetId: number,
  originalCsv: string,
  cleanedCsv: string,
  cleaningReport: any
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(dataCleaningResults).values({
    datasetId,
    originalCsv,
    cleanedCsv,
    cleaningReport,
  });

  return result;
}

export async function getCleaningResult(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(dataCleaningResults).where(eq(dataCleaningResults.datasetId, datasetId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getLatestCleaningResult(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(dataCleaningResults).where(eq(dataCleaningResults.datasetId, datasetId)).orderBy(desc(dataCleaningResults.createdAt)).limit(1);
  return result.length > 0 ? result[0] : null;
}

