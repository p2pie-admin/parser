import { mylog } from "./helper";
import { cpus } from "os";
import cluster from "cluster";
import { findAvailablePort } from "./loops/helper";
import auth from "./gql/auth";
import reload from "./loops/reload";
import dotenv from "dotenv";
import { processExchangers } from "./rates";
import { getExchangersRatesLinks } from "./create/getExchangers";
import test from "./test";
import statusChange from "./statusChange";

dotenv.config();

const start = async () => {
  try {
    startWorkers();
  } catch (error) {
    mylog(String(error), "error");
    process.exit(1);
  }
};

const startWorkers = async () => {
  if (cluster.isPrimary) {
    await startMainWorker();
  } else {
    const idx = parseInt(process.env.IDX || "0");
    setTimeout(async () => {
      await processExchangers();
    }, idx * 1500);
  }
};

const startMainWorker = async () => {
  await auth();
  mylog("Transfering: Suspended -> Active", "info");
  await statusChange("suspended", "active");
  await reload();

  const port = parseInt(process.env.PARSER_PORT || "5005");
  const numCPUs = cpus().length;
  const availablePorts = await Promise.all(
    Array.from({ length: numCPUs }, (_, i) => findAvailablePort(port + i))
  );

  for (let i = 0; i < numCPUs; i++) {
    mylog(`Forking worker #${i} on port ${availablePorts[i]}`, "info");
    cluster.fork({
      WORKER_PORT: availablePorts[i],
      IDX: i,
    });
  }

  mylog("Main worker started", "success");

  cluster.on("exit", (worker, code, signal) => {
    mylog(`❌ Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`, "error");
  });
};

start();