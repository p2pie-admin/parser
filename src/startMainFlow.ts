import { mylog } from "./helper";
import reload from "./loops/reload";
import { getData } from "./redis";

import slowLoop from "./loops/slow";
import startWorkers from "./workers";

let loopIdx = 1;

const startMainFlow = async () => {
  // initial
  await reload();

  const pauseBetweenLoops = await getData("parser_setting:pause_between_loops");
  mylog(`Pause between loops: ${pauseBetweenLoops}s`, "info");
  await startWorkers();
  runLoops();

  setInterval(async () => {
    runLoops();
  }, pauseBetweenLoops * 1000);
};

const runLoops = async () => {
  // REPEATING >>>
  if (loopIdx % 7 === 0) {
    await slowLoop();
  }
  if (loopIdx % 83 === 0) {
    await reload();
  }
  mylog(`Loop #${loopIdx}`, "success");
  loopIdx += 1;
};

export default startMainFlow;
