// redis-store.ts
import dotenv from "dotenv";
import { createClient, RedisClientType } from "redis";
import { mylog } from "./logger";

dotenv.config();

type RedisValue = string | number | object;

const env = process.env.NODE_ENV || "development";
const port = process.env.REDIS_PORT || "6379";
const host =
  env === "production"
    ? process.env.PROD_REDIS_HOST
    : process.env.DEV_REDIS_HOST;

// ——— single DB / single client ———
const db: RedisClientType = createClient({
  url: `redis://${host}:${port}/0`,
  socket: {
    reconnectStrategy: (retries) => {
      mylog(`Redis reconnect attempt ${retries}`, "info");
      return Math.min(retries * 100, 30_000);
    },
  },
}) as RedisClientType;

let shuttingDown = false;
let pendingOperations = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const trackOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
  pendingOperations++;
  try {
    return await operation();
  } finally {
    pendingOperations--;
  }
};

db.on("connect", () => {
  mylog(`Redis connected at redis://${host}:${port}/0`, "info");
});
db.on("error", (err) => {
  if (shuttingDown && err?.code === "ECONNRESET") return;
  mylog(`Redis error: ${err.message}`, "error");
});
db.on("reconnecting", () => {
  mylog(`Redis reconnecting...`, "warning");
});

export async function initializeRedis() {
  if (!db.isOpen) await db.connect();
}

// автоинициализацию можно убрать, если хотите вызывать initializeRedis вручную
initializeRedis();

/* ================= helpers ================= */

const toJSONString = (v: any): string =>
  v === undefined
    ? "null"
    : typeof v === "string"
    ? v
    : typeof v === "number"
    ? String(v)
    : v === null
    ? "null"
    : JSON.stringify(v);

const tryParseJSON = (v: string) => {
  if (v === "null") return null;
  try {
    return JSON.parse(v);
  } catch {
    return v; // не JSON — вернём как строку
  }
};

// Неблокирующий сбор ключей по паттерну через SCAN
async function scanKeys(pattern: string, count = 500): Promise<string[]> {
  const found: string[] = [];
  for await (const key of db.scanIterator({ MATCH: pattern, COUNT: count })) {
    found.push(key);
  }
  return found;
}
/* ================= 1) setObject =================
 * Записывает "коллекцию" и раскидывает её на один уровень по ключам:
 *  setObject("exchangers", { "123": {...}, "456": {...} })
 *  создаст:
 *   - exchangers:123 -> JSON(value)
 *   - exchangers:456 -> JSON(value)
 * Параметры:
 *  - expireIn (default: 1000) — TTL сек на каждый созданный ключ
 */
export async function setObject(
  key: string,
  object: Record<string, any>,
  expireIn?: number
) {
  try {
    if (shuttingDown) return;
    if (!object || typeof object !== "object") {
      console.error("setObject: 'object' must be a plain object");
      return;
    }

    await trackOperation(async () => {
      const multi = db.multi();
      const ttl = expireIn && expireIn > 0 ? expireIn : 1000;
      const options = ttl ? { EX: ttl } : undefined;

      for (const [subKey, val] of Object.entries(object)) {
        const fullKey = `${key}:${subKey}`;
        const strVal = toJSONString(val);

        multi.set(fullKey, strVal, options);
      }

      multi.set(key, toJSONString(object), options);

      await multi.exec();
    });
  } catch (error: any) {
    if (shuttingDown && error?.code === "ECONNRESET") return;
    console.error(`Error in setObject:`, error);
  }
}

/* ================= 2) setData =================
 * Универсальная запись ключ:значение как строку.
 * Использование: setData("some_key", data, expireIn?).
 * По умолчанию expireIn=1000. Передайте 0, чтобы записать без истечения.
 */
export const setData = async (
  key: string,
  value: RedisValue,
  expireIn?: number // seconds
) => {
  try {
    if (shuttingDown) return;
    await trackOperation(async () => {
      const strValue = toJSONString(value);
      const DEFAULT_TTL = 1000;
      const ttl =
        expireIn === undefined || expireIn === null ? DEFAULT_TTL : expireIn;

      if (ttl > 0) {
        await db.set(key, strValue, { EX: ttl });
      } else {
        await db.set(key, strValue);
      }
    });
  } catch (error: any) {
    if (shuttingDown && error?.code === "ECONNRESET") return;
    console.error(`Error in setData:`, error);
  }
};

/* ================= 3) getObject / getData =================
 * getObject:
 *  - если key вида "exchangers:123" — вернёт один элемент (JSON.parse)
 *  - если key = "exchangers" — вернёт всю коллекцию как объект { "123": val, "456": val, ... }
 * getData:
 *  - читает произвольный ключ строкой и пытается распарсить JSON
 */

export async function getObject(key: string): Promise<object | null> {
  try {
    // если это точечный ключ (есть ':') — читаем один элемент
    if (key.includes(":")) {
      const val = await db.get(key);
      return val === null ? null : tryParseJSON(val);
    }

    const snapshot = await db.get(key);
    if (snapshot !== null) {
      return tryParseJSON(snapshot) as object;
    }

    // иначе считаем, что это «корневой» ключ коллекции — соберём все key:*
    const keys = await scanKeys(`${key}:*`);
    if (keys.length === 0) return null;

    // MGET пачками для скорости
    const result: Record<string, any> = {};
    const chunkSize = 500;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const batch = keys.slice(i, i + chunkSize);
      const values = await db.mGet(batch);

      for (let j = 0; j < batch.length; j++) {
        const fullKey = batch[j];
        const raw = values[j];
        if (raw === null) continue;
        // subKey — хвост после "root:"
        const subKey = fullKey.slice(key.length + 1);
        const parts = subKey.split(":");

        let node: Record<string, any> = result;
        for (let k = 0; k < parts.length; k++) {
          const segment = parts[k];
          if (k === parts.length - 1) {
            node[segment] = tryParseJSON(raw);
          } else {
            node[segment] = node[segment] ?? {};
            node = node[segment];
          }
        }
      }
    }
    return result;
  } catch (error) {
    console.error(`Error in getObject:`, error);
    return null;
  }
}

export async function getData(key: string) {
  try {
    const value = await db.get(key);
    if (value === null) return null;
    return tryParseJSON(value);
  } catch (error: any) {
    if (shuttingDown && error?.code === "ECONNRESET") return null;
    console.error(`Error in getData:`, error);
    return null;
  }
}

/* ================ shutdown ================ */
const waitForPendingOperations = async (timeoutMs = 7000) => {
  const start = Date.now();
  while (pendingOperations > 0 && Date.now() - start < timeoutMs) {
    await sleep(50);
  }
  if (pendingOperations > 0) {
    mylog(
      `Redis shutdown proceeded with ${pendingOperations} pending operations`,
      "warning"
    );
  }
};

const handleShutdown = async () => {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await waitForPendingOperations();
    if (db.isOpen) await db.quit();
    console.log("Redis connection closed");
  } catch (error) {
    console.error("Error while closing Redis connection", error);
  } finally {
    process.exit(0);
  }
};

process.once("SIGINT", handleShutdown);
process.once("SIGTERM", handleShutdown);
