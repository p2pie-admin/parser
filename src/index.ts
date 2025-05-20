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
    //getExchangersRatesLinks(); // эта хуйня опасная, создает обменники
  } catch (error) {
    mylog(String(error), "error");
    process.exit(1);
  }
};

const startWorkers = async () => {
  // стартуем все воркеры
  if (cluster.isPrimary) {
    await startMainWorker();
  } else {
    const idx = parseInt(process.env.IDX || "");
    setTimeout(async () => {
      processExchangers();
    }, idx * 1500); // изначально немного сдвигаем по времени
  }
};

const startMainWorker = async () => {
  // логика главного воркера
  await auth();
  mylog("Transfering: Suspended -> Active", "info");
  await statusChange("suspended", "active");
  // всех в active сперва
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
  } // далее выполняется startWorkers else

  mylog(`Main worker started`, "success");
  cluster.on("exit", (worker) => {
    mylog(`! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !`, "error");
    mylog(`! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !`, "error");
    mylog(`- - - - W O R K E R   D I E D - - - -`, "error");
    mylog(`! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !`, "error");
    mylog(`! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! ! !`, "error");
  });
};

start();
