import dotenv from "dotenv";
import { createClient, RedisClientType } from "redis";
import { mylog } from "./helper";

type RedisValue = string | number | object;
type IDBName = "main" | "rates";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const port = process.env.REDIS_PORT;
const host =
  env === "production"
    ? process.env.PROD_REDIS_HOST
    : process.env.DEV_REDIS_HOST;

const createRedisClient = (
  dbIndex: number,
  dbName: string
): RedisClientType => {
  const client = createClient({
    url: `redis://${host}:${port}/${dbIndex}`,
    socket: {
      reconnectStrategy: (retries) => {
        mylog(`Redis ${dbName} reconnect attempt ${retries}`, "info");
        return Math.min(retries * 100, 30000); // Exponential backoff, up to 30 seconds
      },
    },
  }) as RedisClientType;

  client.on("connect", () => {
    mylog(
      `Redis ${dbName} connected successfully at redis://${host}:${port}/${dbIndex}`,
      "info"
    );
  });

  client.on("error", (error) => {
    mylog(`Redis ${dbName} encountered an error: ${error.message}`, "error");
  });

  client.on("reconnecting", () => {
    mylog(`Redis ${dbName} attempting to reconnect...`, "warning");
  });

  return client;
};

const mainDB = createRedisClient(0, "Main DB");
const ratesDB = createRedisClient(1, "Rates DB");

const initializeRedis = async () => {
  await mainDB.connect();
  await ratesDB.connect();
};

initializeRedis();

export const setData = async (
  key: string,
  value: RedisValue,
  dbName: IDBName = "main",
  NX: boolean = false,
  loopsSkipBeforeExpire?: number
) => {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;
    const strValue = JSON.stringify(value);

    const options: any = {};
    if (NX) options.NX = true;
    if (loopsSkipBeforeExpire) options.EX = loopsSkipBeforeExpire;

    await db.set(key, strValue, options);
  } catch (error) {
    console.error(`Error setting data for ${dbName}:`, error);
  }
};

export async function setObject(
  key: string,
  object: Object,
  loopsSkipBeforeExpire?: number
) {
  try {
    const db = mainDB;
    const redisData: { [key: string]: string } = {};

    const pause = (await getData("parser_setting").then(
      (data) => data?.pause_between_loops || 10
    )) as number;

    function flattenObject(obj: any, parentKey: string) {
      for (const [k, v] of Object.entries(obj)) {
        const newKey = parentKey ? `${parentKey}:${k}` : k;

        if (v === null || v === undefined) continue;
        if (Array.isArray(v)) {
          redisData[newKey] = JSON.stringify(v);
        } else if (typeof v === "object") {
          flattenObject(v, newKey);
        } else {
          redisData[newKey] = String(v);
        }
      }
    }

    flattenObject(object, key);
    await db.mSet(redisData);

    // Apply TTL to each key if needed
    if (loopsSkipBeforeExpire) {
      const promises = Object.keys(redisData).map((k) =>
        db.expire(k, loopsSkipBeforeExpire * pause + 10)
      );
      await Promise.all(promises);
    }
  } catch (error) {
    console.error(`Error setting multiple data:`, error);
  }
}

export async function getObject(key: string): Promise<Object | null> {
  try {
    const db = mainDB;

    // Use the KEYS command to get all keys matching the given key prefix
    const redisKeys = await db.keys(`${key}:*`);

    // If no keys found, return null
    if (redisKeys.length === 0) {
      return null;
    }

    // Get all values for the keys
    const redisData = await db.mGet(redisKeys);

    // Filter out null values and create a corresponding keys array
    const filteredRedisData = redisData.filter(
      (value): value is string => value !== null
    );
    const filteredRedisKeys = redisKeys.slice(0, filteredRedisData.length);

    const result: { [key: string]: any } = {};

    // Helper function to parse JSON strings safely
    function parseJSON(value: string) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value; // If parsing fails, return the original string
      }
    }

    // Helper function to reconstruct the object structure
    function reconstructObject(keys: string[], values: string[]) {
      for (let i = 0; i < keys.length; i++) {
        const fullKey = keys[i];
        const value = values[i];
        const keyParts = fullKey.split(":");

        // Build the nested structure
        let currentLevel = result;

        for (let j = 0; j < keyParts.length; j++) {
          const part = keyParts[j];

          // If we're at the last part, assign the parsed value
          if (j === keyParts.length - 1) {
            currentLevel[part] = parseJSON(value); // Parse the JSON here
          } else {
            // If the part doesn't exist yet, create an object
            if (!currentLevel[part]) {
              currentLevel[part] = {};
            }
            currentLevel = currentLevel[part]; // Move deeper into the object
          }
        }
      }
    }

    // Reconstruct the object using the retrieved keys and filtered values
    reconstructObject(filteredRedisKeys, filteredRedisData);

    return result[key]; // Return the reconstructed object
  } catch (error) {
    console.error(`Error retrieving data:`, error);
    return null;
  }
}

export async function getData(key: string) {
  try {
    const db = mainDB;
    const value = await db.get(key);
    if (value === null) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error(`Error getting data:`, error);
    return null;
  }
}

// Graceful shutdown for Redis connections
process.on("SIGINT", async () => {
  await mainDB.quit();
  await ratesDB.quit();
  console.log("Redis connections closed");
  process.exit(0);
});
