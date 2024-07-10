import dotenv from "dotenv";
import { createClient, RedisClientType } from "redis";

type RedisValue = string | number | object;

dotenv.config();

const env = process.env.NODE_ENV || "development";
const redisConnection = env === "production" ? "redis-server" : "localhost";

const redis = createClient({
  url: `redis://${redisConnection}:6379`, // Use 'redis://localhost:6379' if not using Docker
}) as RedisClientType;

// Connect to Redis
redis.connect().catch(console.error);

// Handle errors
redis.on("error", (err) => {
  console.error("Redis Client Error", err);
});

export const setData = async (key: string, value: RedisValue) => {
  const serializedValue = JSON.stringify(value);
  await redis.set(key, serializedValue);
};

export async function getData(key: string) {
  const value = await redis.get(key);
  if (value === null) return null;
  return JSON.parse(value);
}
