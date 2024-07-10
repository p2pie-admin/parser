import { memoryUsage } from "process";
import db from "../db";
import dbRates from "../dbRates";
import callStrapi from "../gql/callStrapi";
import { ExchangersQuery } from "../gql/queries";
import { mylog } from "../helper";
import { IExchanger, IExchangerWithId } from "../types/exchanger";

import Loop from "./fast";

const slowLoop = async () => {
  const exchangers = (await db.getData(".exchangers")) as IExchangerWithId[];
  mylog("Running slow loop...", "info");
  const unloopedIdLinks = exchangers.reduce((res, ex) => {
    const { rates_link, id, loopId } = ex;
    return loopId ? res : [...res, { id, rates_link }];
  }, [] as { id: string; rates_link: string }[]);

  {
    unloopedIdLinks.map(async (unloopedIdLink, index) => {
      await new Promise((resolve) => setTimeout(resolve, index * 333));
      const leftToLoop = exchangers.length - index;
      !(leftToLoop % 10) && mylog(`Left to loop: ${leftToLoop}`, "info");
      leftToLoop < 2 && mylog(`All looped!`, "success");
      // const exchangerLoop = new Loop(
      //   unloopedIdLink,
      //   333 * exchangers.length + 8_000
      // );
      // exchangerLoop.startLoop();
    });
  }
  memoryUsage();
};
export default slowLoop;
