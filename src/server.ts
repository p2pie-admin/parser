import { mylog } from "./helper";
import startWorkers from "./workers";

const startServer = async () => {
  try {
    //чтобы почистить базу : redis-cli FLUSHALL
    startWorkers();
  } catch (error) {
    mylog(String(error), "error");
    process.exit(1);
  }
};

startServer();
