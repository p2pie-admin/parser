import cluster from "cluster";
import { cpus } from "os";

import auth from "./gql/auth";
import { mylog } from "./helper";
import startWorkers from "./loops/fast";
import { findAvailablePort } from "./loops/helper";
import reload from "./loops/reload";

const startServer = async () => {
  try {
    startWorkers();
  } catch (error) {
    mylog(String(error), "error");
    process.exit(1);
  }
};

startServer();
