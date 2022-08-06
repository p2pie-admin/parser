import { Exchanger } from "src/types/exchanger";
import db from "./db";
import dbRates from "./dbRates";
import statusChange from "./dbRates/statusChange";
import initialLoader from "./initialLoader";
import Loop from "./rates/Loop";

import getDirTops from "./rates/Tops";
import { DirRates, DirTops } from "./types/rates";

type InewIDLinkPairs = {
  exchangerId: string;
  rates_link: string;
}[];
type Exchangers = { [key: string]: Exchanger };

const startMainFlow = () => {
  const firstTimeExchangers = db.getData(".exchangers") as Exchangers;
  const { restartRatesHandlerIn } = initTimeouts(firstTimeExchangers);
  console.log(
    `\u001b[1;34m Анализ курсов начнется через ${restartRatesHandlerIn / 1000}c`
  );
  db.push(".looped", {});
  loopNewExchangers(firstTimeExchangers); // первичный
  let globalLoopsDone = 1;

  setInterval(async () => {
    const exchangers = db.getData(".exchangers") as Exchangers;
    globalLoopsDone += 1;
    if (globalLoopsDone % 5 === 0) {
      console.log("Suspended -> Active");
      await statusChange("suspended", "active");
      await initialLoader();
    }

    //initTimeouts(exchangers);
    loopNewExchangers(exchangers);
    calculateTops();

    dbRates.save();
    db.save();
  }, restartRatesHandlerIn);
};

const loopNewExchangers = (exchangers: Exchangers) => {
  // лупим только те, которые еще не в лупе
  const newIDLinkPairs = Object.entries(exchangers).reduce(
    (pairs: InewIDLinkPairs, [exchangerId, exchangerData]): InewIDLinkPairs => {
      if (
        db.exists(`.looped.${exchangerId}`) &&
        db.getData(`.looped.${exchangerId}`)
      )
        return pairs;
      return [
        ...pairs,
        {
          exchangerId,
          rates_link: exchangerData.rates_link,
        },
      ];
    },
    []
  );
  // время паузы между стартом запросов захардкожено как 300мс, все прочее автоматом подстраивается
  const gap = 300;
  let leftToLoop = newIDLinkPairs.length;

  newIDLinkPairs.map(async ({ exchangerId, rates_link }, index) => {
    await new Promise((resolve) => setTimeout(resolve, index * gap));
    // промежутки во времени между ∞ циклами четверть секунды
    leftToLoop -= 1;
    console.log(
      `\u001b[1;34m ⓘ ${exchangerId} : Цикл опроса запущен, осталось запустить ${leftToLoop}`
    );
    db.push(`.looped.${exchangerId}`, true);
    const loop = new Loop(exchangerId, rates_link);
    loop.run();
  });
};

const calculateTops = () => {
  console.log(`\u001b[1;34m Поиск лучших курсов...`);
  const allDirsRates = dbRates.getData(".allDirsRates") as {
    [key: string]: DirRates;
  };
  const allDirsTops = getDirTops(allDirsRates) as { [key: string]: DirTops };
  dbRates.push(".allDirsTops", allDirsTops);
};

const initTimeouts = (exchangers: Exchangers) => {
  const exchangersLength = Object.keys(exchangers).length;
  // для 100 обменников
  const getRatesIn =
    exchangersLength * 300 > 12_000 ? exchangersLength * 300 : 12_000;
  // опрос первого в очереди обменника начнется через 30 сек, минимально 12 секунд
  const expireIn = getRatesIn - 2_000;
  // и ожидание ответа первого прекратится через 28 сек
  const restartRatesHandlerIn = getRatesIn + 8_000;
  db.push(".timeouts", {
    getRatesIn, // time between first and last exchanger rates call
    expireIn,
    restartRatesHandlerIn,
  });
  return { getRatesIn, expireIn, restartRatesHandlerIn };
  // каждые 38 сек будет производиться обработка урожая
};

export default startMainFlow;
