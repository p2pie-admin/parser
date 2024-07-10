import db from "./db";

import { mylog } from "./helper";

import reload from "./loops/reload";
import slowLoop from "./loops/slow";

import { IExchangerWithId } from "./types/exchanger";

let globalLoopsDone = 0;

const startMainFlow = async () => {
  // initial
  await reload();
  const exchangers = (await db.getData(".exchangers")) as IExchangerWithId[];
  const restartIn = 333 * exchangers.length + 8_000;
  mylog(`Parsing process will last ~ ${(restartIn / 1000).toFixed(0)}s`);
  runLoops();

  setInterval(async () => {
    runLoops();
  }, restartIn);
};

const runLoops = async () => {
  // REPEATING >>>
  if (!globalLoopsDone) {
    // initial, need return because 0 % 7 === 0 true
    await slowLoop();
    globalLoopsDone += 1;
    return;
  }
  if (globalLoopsDone % 7 === 0) {
    await slowLoop();
  }
  if (globalLoopsDone % 83 === 0) {
    await reload();
  }
  mylog(`Loops completed: ${globalLoopsDone}`, "success");
  globalLoopsDone += 1;
};

export default startMainFlow;
