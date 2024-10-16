import { mylog } from "./helper";
import RatesParser from "./rates/ParserHandlers/RateParser";
import { getData, getObject } from "./redis";
import { IExchanger } from "./types/exchanger";
import { cpus } from "os";
import cluster from "cluster";
import { splitToNChunks, findAvailablePort } from "./loops/helper";
import auth from "./gql/auth";
import reload from "./loops/reload";
import dotenv from "dotenv";
import { processExchangers } from "./rates";

dotenv.config();

const startWorkers = async () => {
  if (cluster.isPrimary) {
    console.log("cluster.isPrimary", cluster.isPrimary);
    await startMainWorker();
  } else {
    startSecondaryWorkers();
  }
};

const startMainWorker = async () => {
  await auth();
  await reload();

  const port = parseInt(process.env.PARSER_PORT || "5005");
  const numCPUs = cpus().length;
  const availablePorts = await Promise.all(
    Array.from({ length: numCPUs }, (_, i) => findAvailablePort(port + i))
  );

  for (let i = 0; i < numCPUs; i++) {
    setTimeout(() => {
      mylog(`Forking worker #${i} on port ${availablePorts[i]}`, "info");
      cluster.fork({
        WORKER_PORT: availablePorts[i],
        IDX: i,
      });
    }, (i + 1) * 1000); // Delay between each worker fork
  }
  mylog(`Main worker started`, "success");
  cluster.on("exit", (worker) => {
    mylog(`Worker ${worker.process.pid} died`, "warning");
  });
};

const startSecondaryWorkers = async () => {
  const numCPUs = cpus().length;
  const exchangers = (await getObject("exchangers")) as {
    [key: string]: IExchanger;
  };

  const chunkedExchangers = splitToNChunks(Object.values(exchangers), numCPUs);

  const idx = parseInt(process.env.IDX || "");
  const exchangersChunk = chunkedExchangers[idx];

  mylog(
    `Worker #${idx} pid #${process.pid} started with ${exchangersChunk?.length} chunk `,
    "success"
  );
  // Process the chunk of exchangers
  processExchangers(exchangersChunk);
};

export default startWorkers;
