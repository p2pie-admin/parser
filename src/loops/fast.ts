import { mylog } from "../helper";
import RatesParser from "../rates/ParserHandlers/RateParser";
import { getData } from "../redis";
import { IExchanger } from "../types/exchanger";
import { cpus } from "os";
import cluster from "cluster";
import { splitToNChunks, findAvailablePort } from "./helper";
import auth from "../gql/auth";
import reload from "./reload";
import dotenv from "dotenv";

dotenv.config();

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
    }, i * 1000); // Delay between each worker fork
  }
  mylog(`Main worker started`, "success");
  cluster.on("exit", (worker) => {
    mylog(`Worker ${worker.process.pid} died`, "warning");
  });
};

const startWorkers = async () => {
  if (cluster.isPrimary) {
    console.log("cluster.isPrimary", cluster.isPrimary);
    await startMainWorker();
  } else {
    startSecondaryWorkers();
  }
};

const startSecondaryWorkers = async () => {
  const numCPUs = cpus().length;
  const exchangers = (await getData("exchangers")) as IExchanger[];
  const chunkedExchangers = splitToNChunks(exchangers, numCPUs);

  const idx = parseInt(process.env.IDX || "");
  const exchangersChunk = chunkedExchangers[idx];

  mylog(
    `Worker #${idx} pid #${process.pid} started with ${exchangersChunk?.length} chunk `,
    "success"
  );

  // Process the chunk of exchangers
  processExchangers(exchangersChunk, idx);
};

const processExchangers = (exchangersChunk: IExchanger[], idx: number) => {
  exchangersChunk.map(async (exchanger, index) => {
    await new Promise((resolve) => setTimeout(resolve, index * 200)); // pause between parsing
    const leftToParse = exchangersChunk.length - index;
    !(leftToParse % 10) &&
      mylog(
        `--- Ядро ${idx + 1}: oсталось зациклить ${leftToParse}  ---`,
        "warning"
      );
    leftToParse === 0 &&
      mylog(`--- Ядро ${idx + 1}: парсинг завершен ---`, "success");
    const { id, rates_link, name } = exchanger;
    const exchangerParser = new RatesParser(id, name, rates_link);
    exchangerParser.getExchangerRates();
  });
};

export default startWorkers;
