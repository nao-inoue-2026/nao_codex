import { promises as fs } from "node:fs";
import path from "node:path";
import { historyListSchema, type HistoryRecord, type InputPayload, type OutputPayload } from "@/lib/schema";

const dataDir = path.join(process.cwd(), "data");
const historyPath = path.join(dataDir, "history.json");

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(historyPath);
  } catch {
    await fs.writeFile(historyPath, "[]", "utf8");
  }
}

export async function readHistory(): Promise<HistoryRecord[]> {
  await ensureDataFile();
  const raw = await fs.readFile(historyPath, "utf8");
  const parsed = JSON.parse(raw);
  return historyListSchema.parse(parsed);
}

export async function saveRecord(input: InputPayload, output: OutputPayload): Promise<HistoryRecord> {
  const records = await readHistory();
  const record: HistoryRecord = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    input,
    output
  };
  records.unshift(record);
  await fs.writeFile(historyPath, JSON.stringify(records, null, 2), "utf8");
  return record;
}

export async function getRecord(id: string): Promise<HistoryRecord | undefined> {
  const records = await readHistory();
  return records.find((record) => record.id === id);
}
