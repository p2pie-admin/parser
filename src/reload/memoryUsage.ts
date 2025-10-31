import { memoryUsage } from "process";
import { mylog } from "../utils/logger";
import { setData } from "../utils/redis";

export const logMemoryUsage = async () => {
  const memoryData = memoryUsage();

  const stats = {
    rss: Math.round(memoryData.rss / 1024 / 1024),
    heapTotal: Math.round(memoryData.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryData.heapUsed / 1024 / 1024),
    external: Math.round(memoryData.external / 1024 / 1024),
    arrayBuffers: memoryData.arrayBuffers
      ? Math.round(memoryData.arrayBuffers / 1024 / 1024)
      : null,
    timestamp: Date.now(),
  };

  mylog("_________________________", "important");
  mylog(`RSS: ${stats.rss} MB`, "hidden");
  mylog(`Heap Total: ${stats.heapTotal} MB`, "important");
  mylog(`Heap Used: ${stats.heapUsed} MB`, "important");
  mylog(`External: ${stats.external} MB`, "important");
  if (stats.arrayBuffers !== null) {
    mylog(`Array Buffers: ${stats.arrayBuffers} MB`, "important");
  }
  mylog("_________________________", "important");

  await setData("stats:memory_usage", JSON.stringify(stats));
};
