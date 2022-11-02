import { DirRates } from "./../../types/rates";
import axios from "axios";
import db from "../../db";
import XML2JSON from "xml-js";
import dbRates from "../../dbRates";
import { AllDirsRates } from "../../types/rates";
import ErrorHandler from "../ParserHandlers/ErrorHandler";
import CitiesHandler from "../ParserHandlers/CitiesHandler";
import RateFormatter from "../ParserHandlers/RateFormatter";
import { ExchangerResponse } from "../../types/exchangerResp";

export default class Loop {
  exchangerId: string;
  rates_link: string;

  constructor(exchangerId: string, rates_link: string) {
    this.exchangerId = exchangerId;
    this.rates_link = rates_link;
  }

  run = () => {
    const getRatesIn = db.getData(".timeouts.getRatesIn");
    setTimeout(() => {
      if (!db.exists(`.exchangers.${this.exchangerId}`)) {
        // либо потому что автоматом сменился статус, либо вручную
        console.log(
          `\u001b[1;34m ⓘ ${this.exchangerId} : Перестанет опрашиваться!`
        );
        this._clearAllAssociatedRates();
        return;
      }
      this._getRates();
      this.run();
    }, getRatesIn);
  };

  _getRates = () => {
    const { exchangerId, rates_link } = this; // хз как this передать в then()
    const expireIn = db.getData(".timeouts.expireIn");
    axios
      .get(rates_link, { timeout: expireIn })
      .then(function (response) {
        const errorHandler = new ErrorHandler(exchangerId);
        const citiesHandler = new CitiesHandler();
        const rateFormatter = new RateFormatter(exchangerId);
        //  //  //  //  //  //  //  //
        const JSONres = xmlToJson(errorHandler, response?.data);
        //  //  //  //  //  //  //  //
        const wereRatesReceived = rateFormatter.checkForErrors(JSONres);

        if (wereRatesReceived && JSONres.rates?.item) {
          //status === "suspended" && statusChange("suspended", "active", exchangerId)
          console.log(
            `\u001b[1;32m ✔ ${exchangerId} : Курсов получено : ${JSONres.rates?.item.length}`
          );
          const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(
            exchangerId,
            JSONres.rates?.item
          );
          rateFormatter.formatAndMatchRatesWithDirs(ratesDataWithGroupedCities); // пишет в JSОN файл
        }
      })
      .catch(function (err) {
        const { message, code, status } = err;
        const numberCode = message.match(/\d+/) && message.match(/\d+/)[0];
        const errorHandler = new ErrorHandler(exchangerId);
        errorHandler.saveError(code || status || numberCode, message);
      });
  };

  _clearAllAssociatedRates = () => {
    const allDirsRates = dbRates.getData(".allDirsRates") as AllDirsRates;
    Object.entries(allDirsRates).map(
      ([_, dirRates]) => delete dirRates[this.exchangerId]
    );
    dbRates.push(".dirRates", allDirsRates);
  };
}
/////////////// + helper:

const xmlToJson = (
  errorHandler: ErrorHandler,
  data: any
): ExchangerResponse => {
  const options = {
    compact: true,
    ignoreComment: true,
    alwaysChildren: true,
  };
  let res = {} as ExchangerResponse;
  try {
    res = JSON.parse(XML2JSON.xml2json(data, options)) as ExchangerResponse;
  } catch ({ message }) {
    errorHandler.saveError("json-parsing-error", (message as any) || "...");
  }
  return res;
};
