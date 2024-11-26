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
import { setData } from "../../redis";
import statusChange from "../../statusChange";

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
      this.handleResponse(response.data);
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
  private handleResponse(data: any): void {
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
    const rateFormatter = new RateFormatter(this.exchanger, this.generalData);
    rateFormatter.formatAndMatchRatesWithDirs(JSONres.rates?.item);
    //statusChange("suspended", "active", this.exchanger.id);
  }

  // Method to handle errors
}
