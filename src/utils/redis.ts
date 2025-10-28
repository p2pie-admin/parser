import dotenv from "dotenv";
import { createClient, RedisClientType } from "redis";
import { mylog } from "./logger.ts";

type RedisValue = string | number | object;
type IDBName = "main" | "rates";

export type SetDataOptions = {
  db?: IDBName;
  NX?: boolean;
  EX?: number;
  PX?: number;
  EXAT?: number;
  PXAT?: number;
  KEEPTTL?: boolean;
};

dotenv.config();

const env = process.env.NODE_ENV || "development";
const port = process.env.REDIS_PORT || "6379";
const host =
  env === "production"
    ? process.env.PROD_REDIS_HOST
    : process.env.DEV_REDIS_HOST;

// ---------- создание клиента ----------
const createRedisClient = (
  dbIndex: number,
  dbName: string
): RedisClientType => {
  const client = createClient({
    url: `redis://${host}:${port}/${dbIndex}`,
    socket: {
      reconnectStrategy: (retries) => {
        mylog(`Redis ${dbName} reconnect attempt ${retries}`, "warning");
        return Math.min(retries * 500, 30000);
      },
    },
  }) as RedisClientType;

  client.on("connect", () =>
    mylog(
      `✅ Redis ${dbName} connected at redis://${host}:${port}/${dbIndex}`,
      "info"
    )
  );
  client.on("error", (error) =>
    mylog(`❌ Redis ${dbName} error: ${error.message}`, "error")
  );
  client.on("end", () =>
    mylog(`⚠️ Redis ${dbName} connection closed`, "warning")
  );
  client.on("reconnecting", () =>
    mylog(`↻ Redis ${dbName} reconnecting...`, "hidden")
  );

  return client;
};

// ---------- клиенты ----------
export const mainDB = createRedisClient(0, "Main DB");
export const ratesDB = createRedisClient(1, "Rates DB");

// ---------- безопасная инициализация ----------
async function initializeRedis() {
  for (let i = 1; i <= 5; i++) {
    try {
      await mainDB.connect();
      await ratesDB.connect();
      mylog("✅ Redis initialization successful", "info");
      return;
    } catch (e: any) {
      mylog(`Redis connect attempt ${i} failed: ${e.message}`, "warning");
      if (i === 5) throw e;
      await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
}

// --- Автоматическая инициализация ---
(async () => {
  try {
    await initializeRedis();
  } catch (e) {
    mylog(`❌ Failed to initialize Redis: ${String(e)}`, "error");
    process.exit(1);
  }
})();

// ---------- безопасный JSON-парсер ----------
function safeParse<T = any>(value: string): T | string {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// ---------- setData ----------
export const setData = async (
  key: string,
  value: RedisValue,
  options: SetDataOptions = {}
) => {
  try {
    const { db: dbName = "main", NX, EX, PX, EXAT, PXAT, KEEPTTL } = options;
    const db = dbName === "rates" ? ratesDB : mainDB;
    const strValue = JSON.stringify(value);
    const redisOptions: Record<string, number | boolean> = {};

    if (NX) redisOptions.NX = true;
    if (typeof EX === "number") redisOptions.EX = EX;
    if (typeof PX === "number") redisOptions.PX = PX;
    if (typeof EXAT === "number") redisOptions.EXAT = EXAT;
    if (typeof PXAT === "number") redisOptions.PXAT = PXAT;
    if (KEEPTTL) redisOptions.KEEPTTL = true;
    if (Object.keys(redisOptions).length) {
      await db.set(key, strValue, redisOptions as any);
    } else {
      await db.set(key, strValue);
    }
  } catch (error: any) {
    mylog(`❌ Redis setData failed for ${key}: ${error.message}`, "error");
  }
};

// ---------- setObject ----------
export async function setObject(key: string, object: Record<string, any>) {
  try {
    const db = mainDB;
    const redisData: Record<string, string> = {};

    function flatten(obj: any, parent: string) {
      for (const [k, v] of Object.entries(obj)) {
        const newKey = parent ? `${parent}:${k}` : k;
        if (v == null) continue;
        if (typeof v === "object" && !Array.isArray(v)) flatten(v, newKey);
        else redisData[newKey] = JSON.stringify(v);
      }
    }

    flatten(object, key);
    await db.mSet(redisData);
  } catch (error: any) {
    mylog(`❌ setObject failed: ${error.message}`, "error");
  }
}

// ---------- getObject ----------
export async function getObject(
  key: string
): Promise<Record<string, any> | null> {
  try {
    const db = mainDB;
    const keys: string[] = [];

    let cursor = 0;
    do {
      const res = await db.scan(cursor, { MATCH: `${key}:*`, COUNT: 1000 });
      cursor = Number(res.cursor);
      keys.push(...res.keys);
    } while (cursor !== 0);

    if (keys.length === 0) return null;

    const values = await db.mGet(keys);
    const result: Record<string, any> = {};

    function reconstruct(keys: string[], vals: (string | null)[]) {
      for (let i = 0; i < keys.length; i++) {
        const val = vals[i];
        if (!val) continue;
        const parts = keys[i].split(":");
        let level = result;
        for (let j = 0; j < parts.length; j++) {
          const p = parts[j];
          if (j === parts.length - 1) level[p] = safeParse(val);
          else level[p] = level[p] || {};
          level = level[p];
        }
      }
    }

    reconstruct(keys, values);
    return result[key];
  } catch (error: any) {
    mylog(`❌ getObject failed: ${error.message}`, "error");
    return null;
  }
}

// ---------- getData ----------
export async function getData(key: string) {
  try {
    const db = mainDB;
    const value = await db.get(key);
    if (value == null) return null;
    return safeParse(value);
  } catch (error: any) {
    mylog(`❌ getData failed for ${key}: ${error.message}`, "error");
    return null;
  }
}

// ---------- renameKey ----------
export async function renameKey(
  oldKey: string,
  newKey: string,
  dbName: IDBName = "main"
) {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;
    if (!(await db.exists(oldKey))) {
      mylog(`⚠️ Cannot rename: key ${oldKey} not found`, "warning");
      return false;
    }
    await db.rename(oldKey, newKey);
    mylog(`🔄 Redis key renamed: ${oldKey} → ${newKey}`, "info");
    return true;
  } catch (error: any) {
    mylog(`❌ renameKey failed: ${error.message}`, "error");
    return false;
  }
}

// ---------- graceful shutdown ----------
async function closeRedis() {
  try {
    await mainDB.quit();
    await ratesDB.quit();
    mylog("🛑 Redis connections closed gracefully", "info");
  } catch (e) {
    mylog(`Redis quit failed: ${String(e)}`, "error");
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", closeRedis);
process.on("SIGTERM", closeRedis);
