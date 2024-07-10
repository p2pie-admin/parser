import axios from "axios";

import { mylog } from "../helper";
import getDirTops from "../rates/Tops";
import { AllDirsRates, DirRates, FullRate } from "../types/rates";
import db from "../db";
import dbRates from "../dbRates";
import ErrorHandler from "../rates/ParserHandlers/ErrorHandler";
import RateFormatter from "../rates/ParserHandlers/RateFormatter";
import { xmlToJson } from "./helper";

export default class Loop {
  id: string;
  rates_link: string;
  restartIn: number;
  intervalId?: number | NodeJS.Timeout;

  constructor(
    { id, rates_link }: { id: string; rates_link: string },
    restartIn: number
  ) {
    this.id = id;
    this.rates_link = rates_link;
    this.restartIn = restartIn;
  }
  startLoop = () => {
    this.intervalId = setInterval(() => {
      this._getRates();
    }, 1000); // Runs every second
  };

  _getRates = async () => {
    const { id, rates_link } = this; // хз как this передать в then()
    const expireIn = await db.getData(".timeouts.expireIn");
    axios
      .get(rates_link, { timeout: expireIn })
      .then(function (response) {
        const errorHandler = new ErrorHandler(id);
        //const citiesHandler = new CitiesHandler();
        const rateFormatter = new RateFormatter(id);
        //  //  //  //  //  //  //  //
        let JSONres = xmlToJson(errorHandler, response?.data);
        //  //  //  //  //  //  //  //
        const wereRatesReceived = rateFormatter.checkForErrors(JSONres);

        if (wereRatesReceived && JSONres.rates?.item) {
          //status === "suspended" && statusChange("suspended", "active", id)
          console.log(
            `\u001b[1;32m ✔ ${id} : Курсов получено : ${JSONres.rates?.item.length}`
          );
          // let ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(
          //   id,
          //   JSONres.rates?.item
          // );
          rateFormatter.formatAndMatchRatesWithDirs(JSONres.rates?.item); // пишет в JSОN файл
        }
      })
      .catch(function (err) {
        const { message, code, status } = err;
        const numberCode = message.match(/\d+/) && message.match(/\d+/)[0];
        const errorHandler = new ErrorHandler(id);
        errorHandler.saveError(code || status || numberCode, message);
      });
  };

  _clearAllAssociatedRates = async () => {
    const allDirsRates = (await dbRates.getData(
      ".allDirsRates"
    )) as AllDirsRates;
    Object.entries(allDirsRates).map(
      ([_, dirRates]) => delete dirRates[this.id]
    );
    dbRates.push(".dirRates", allDirsRates);
  };
}
/////////////// + helper:

const calculateTops = async () => {
  mylog(`Поиск лучших курсов...`);
  const allDirsRates = (await dbRates.getData(".allDirsRates")) as {
    [key: string]: DirRates;
  };
  const allDirsTops = getDirTops(allDirsRates) as { [key: string]: FullRate[] };
  dbRates.push(".allDirsTops", allDirsTops);
};
