import * as SQLite from 'expo-sqlite';

import type { DiagnosisResult } from '@/lib/plantVision';

/** Mirrors plantscope_app/db.py's schema and shape - one local file, no server. */

const db = SQLite.openDatabaseSync('plantscope.db');

let initPromise: Promise<void> | null = null;

export function initScanHistory(): Promise<void> {
  if (!initPromise) {
    initPromise = db.execAsync(
      `CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT NOT NULL,
        predicted_class TEXT NOT NULL,
        confidence REAL NOT NULL,
        alternatives_json TEXT NOT NULL,
        uncertain INTEGER NOT NULL DEFAULT 0
      );`
    );
  }
  return initPromise;
}

export async function recordScan(result: DiagnosisResult): Promise<void> {
  await initScanHistory();
  await db.runAsync(
    'INSERT INTO scans (ts, predicted_class, confidence, alternatives_json, uncertain) VALUES (?, ?, ?, ?, ?)',
    new Date().toISOString(),
    result.primaryClassId,
    result.primaryConfidence,
    JSON.stringify(result.alternatives),
    result.uncertain ? 1 : 0
  );
}

export type ClassCount = { predicted_class: string; c: number; avg_conf: number };
export type DayCount = { day: string; c: number };

export type ScanStats = {
  total: number;
  byClass: ClassCount[];
  byDay: DayCount[];
  uncertainCount: number;
  healthyCount: number;
};

export async function getScanStats(): Promise<ScanStats> {
  await initScanHistory();

  const totalRow = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM scans');
  const byClass = await db.getAllAsync<ClassCount>(
    `SELECT predicted_class, COUNT(*) as c, AVG(confidence) as avg_conf
     FROM scans GROUP BY predicted_class ORDER BY c DESC`
  );
  const byDay = await db.getAllAsync<DayCount>(
    `SELECT substr(ts, 1, 10) as day, COUNT(*) as c FROM scans
     GROUP BY day ORDER BY day ASC`
  );
  const uncertainRow = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM scans WHERE uncertain = 1'
  );
  const healthyRow = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) as c FROM scans WHERE predicted_class = 'healthy'"
  );

  return {
    total: totalRow?.c ?? 0,
    byClass,
    byDay,
    uncertainCount: uncertainRow?.c ?? 0,
    healthyCount: healthyRow?.c ?? 0,
  };
}

export async function clearScanHistory(): Promise<void> {
  await initScanHistory();
  await db.runAsync('DELETE FROM scans');
}
