import dotenv from "dotenv";
import { createClient, RedisClientType } from "redis";
import { mylog } from "./helper";

type RedisValue = string | number | object;

dotenv.config();

const env = process.env.NODE_ENV || "development";
const port = "6379";
const host = env === "production" ? "redis-server" : "localhost";

const mainDB = createClient({
  url: `redis://${host}:${port}/0`,
}) as RedisClientType;

const ratesDB = createClient({
  url: `redis://${host}:${port}/1`,
}) as RedisClientType;

mainDB.connect().catch(() => mylog("Redis not responding!", "error"));
ratesDB.connect().catch(console.error);

export const setData = async (
  key: string,
  value: RedisValue,
  dbName: "main" | "rates" = "main"
) => {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;
    const strValue = JSON.stringify(value);
    await db.set(key, strValue);
  } catch (error) {
    console.error(`Error setting data for ${dbName}:`, error);
  }
};

export async function setObject(
  key: string,
  object: Object, // Object containing keys and values
  dbName: "main" | "rates" = "main"
) {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;

    const redisData: { [key: string]: string } = {}; // Object for MSET

    for (const [k, v] of Object.entries(object)) {
      if (Array.isArray(v) || typeof v === "object") {
        // Stringify arrays and objects to store them in Redis
        redisData[`${key}:${k}`] = JSON.stringify(v);
      } else {
        // Handle primitive values directly
        redisData[`${key}:${k}`] = String(v);
      }
    }

    // Use MSET to store all key-value pairs at once
    await db.mSet(redisData);
  } catch (error) {
    console.error(`Error setting multiple data for ${dbName}:`, error);
  }
}

export async function getData(key: string, dbName: "main" | "rates" = "main") {
  try {
    const db = dbName === "rates" ? ratesDB : mainDB;
    const value = await db.get(key);
    if (value === null) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error(`Error getting data for ${dbName}:`, error);
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
