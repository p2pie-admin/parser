import { mylog } from "./utils/logger";
import { cpus } from "os";
import cluster from "cluster";
import { findAvailablePort, waitSec } from "./reload/helper";
import dotenv from "dotenv";
import { loop } from "./1_loop";
import { runInitialization } from "./initial";

dotenv.config();

const start = async () => {
  try {
    if (cluster.isPrimary) {
      await startMainWorker();
    } else {
      const idx = parseInt(process.env.IDX || "0");
      await waitSec(idx * 0.5); // небольшая пауза для распределения старта
      // -----------------------------------
      await loop();
      // -----------------------------------
    }
  } catch (error) {
    mylog(String(error), "error");
    process.exit(1);
  }
};
const startMainWorker = async () => {
  await runInitialization();

  const port = parseInt(process.env.PARSER_PORT || "5005");
  const numCPUs = cpus().length;
  const availablePorts = await Promise.all(
    Array.from({ length: numCPUs }, (_, i) => findAvailablePort(port + i))
  );

  // карта для учёта количества рестартов
  const restartCount: Record<number, number> = {};

  const forkWorker = (i: number) => {
    const env = {
      ...process.env,
      WORKER_PORT: availablePorts[i],
      IDX: i.toString(),
    };
    mylog(`🚀 Forking worker #${i} on port ${availablePorts[i]}`, "hidden");
    const worker = cluster.fork(env);
    restartCount[i] = restartCount[i] ?? 0;

    worker.on("exit", (code, signal) => {
      mylog(
        `❌ Worker #${i} (pid ${worker.process.pid}) exited (code=${code}, signal=${signal})`,
        "error"
      );

      // ограничиваем количество рестартов (например, 5 раз)
      if (restartCount[i] >= 5) {
        mylog(
          `⚠️ Worker #${i} restart limit reached — not restarting`,
          "warning"
        );
        return;
      }

      restartCount[i]++;
      const backoff = Math.min(30000, 2000 * restartCount[i]); // до 30 секунд задержки
      mylog(`↻ Restarting worker #${i} in ${backoff / 1000}s…`, "info");

      setTimeout(() => forkWorker(i), backoff);
    });
  };

  for (let i = 0; i < numCPUs; i++) {
    forkWorker(i);
  }
};

start();
