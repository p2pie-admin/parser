import axios from "axios";
import { mylog } from "../../helper";
import { waitSec, xmlToJson } from "../../loops/helper";
import { sendExchangerError, sendExchangerInfo } from "../ErrorHandler";
import {
  IExchanger,
  IExchangerParsingError,
  IExchangerParsingInfo,
} from "../../types/exchanger";
import { IGeneralData } from "../../types/rates";
import RateFormatter from "./RateFormatter";
import { getData, setData } from "../../redis";
import { ICity } from "../../types";

export default class RatesParser {
  exchanger: IExchanger;
  generalData: IGeneralData;

  constructor(exchanger: IExchanger, generalData: IGeneralData) {
    this.exchanger = exchanger;
    this.generalData = generalData;
  }

  // Main method to get rates
  async getExchangerRates(): Promise<void> {
    try {
      // setData(`started:${this.exchanger.id}`, Date.now());
      const response = await axios.get(this.exchanger.rates_link, {
        timeout: 50000,
      });
      await this.handleResponse(response.data);
      // setData(`finished:${this.exchanger.id}`, Date.now());
    } catch (err: any) {
      const code =
        err?.code || err?.status || err.message.match(/\d+/)?.[0] || "";
      const error = {
        code,
        autoMessage: err.message,
      } as IExchangerParsingError;
      sendExchangerError(this.exchanger, error);
    }
  }

  // Method to handle the response
  private async handleResponse(data: any) {
    //const rateFormatter = new RateFormatter(this.id);
    const JSONres = xmlToJson(data);
    if (!JSONres || JSONres.error || !JSONres.rates?.item?.length) {
      const error = {
        autoMessage: JSONres?.error?._text,
        comment: "Не смог распарсить XML",
      } as IExchangerParsingError;

      sendExchangerError(this.exchanger, error);
      return;
    }

    const total_rates = JSONres.rates?.item.length;
    sendExchangerInfo(this.exchanger, total_rates);
    const cities = (await getData("parser_setting"))?.cities || ([] as ICity[]);
    const rateFormatter = new RateFormatter(
      this.exchanger,
      this.generalData,
      cities
    );
    rateFormatter.formatAndMatchRatesWithDirs(JSONres.rates?.item);
  }

  // Method to handle errors
}
