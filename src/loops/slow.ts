import { memoryUsage } from "process";
import { mylog } from "../helper";
import { IExchanger } from "../types/exchanger";

import { getData } from "../redis";

const slowLoop = async () => {
  mylog("Slow loop started", "info");
  memoryUsage();
};
export default slowLoop;
