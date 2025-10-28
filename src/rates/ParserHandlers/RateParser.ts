// ParserHandlers/RateParser.ts
import axios from "axios";
import { mylog } from "../../utils/logger.ts";
import { waitSec, xmlToJson } from "../../reload/helper";
import { sendExchangerError, sendExchangerInfo } from "../ErrorHandler";
import {
  IErrorCode,
  IExchanger,
  IExchangerParsingError,
} from "../../types/exchanger";
import { IGeneralData } from "../../types/rates";
import RateFormatter from "./RateFormatter";
import { getData } from "../../utils/redis";
import { ICity } from "../../types";

export default class RatesParser {
  exchanger: IExchanger;
  generalData: IGeneralData;

  constructor(exchanger: IExchanger, generalData: IGeneralData) {
    this.exchanger = exchanger;
    this.generalData = generalData;
  }

  // Main method to get rates (awaitable)
  async getExchangerRates(): Promise<void> {
    try {
      // small pre-wait if exchanger asks for delay (optional)

      const timeout = Number(20_000);
      const response = await axios.get(this.exchanger.rates_link, { timeout });

      await this.handleResponse(response.data);
    } catch (err: any) {
      // Normalize code and message
      let code = "" as IErrorCode | undefined;
      if (err?.code) code = err.code;
      else if (err?.response?.status)
        code = String(err.response.status) as IErrorCode | undefined;
      else if (err?.message) code = err.message.match(/\d+/)?.[0] || "";

      const error: IExchangerParsingError = {
        code,
        autoMessage: err?.message ?? String(err),
      };
      // sendExchangerError is best-effort (logs + metrics)
      try {
        sendExchangerError(this.exchanger, error);
      } catch (e) {
        mylog(
          `Failed to send exchanger error for ${this.exchanger.id}: ${String(
            e
          )}`,
          "error"
        );
      }
    }
  }

  // Method to handle the response
  private async handleResponse(data: any): Promise<void> {
    // xmlToJson may throw or return error wrapper
    let JSONres: any;
    try {
      JSONres = xmlToJson(data);
    } catch (e) {
      const error: IExchangerParsingError = {
        autoMessage: String((e as Error).message),
        comment: "XML parsing threw an exception",
      };
      sendExchangerError(this.exchanger, error);
      return;
    }

    if (!JSONres || JSONres.error || !JSONres.rates?.item?.length) {
      const error: IExchangerParsingError = {
        autoMessage: JSONres?.error?._text || "Empty or invalid XML response",
        comment: "Не смог распарсить XML",
      };
      sendExchangerError(this.exchanger, error);
      return;
    }

    const total_rates = JSONres.rates?.item.length ?? 0;
    try {
      sendExchangerInfo(this.exchanger, total_rates);
      // clear previous error if any
      sendExchangerError(this.exchanger, undefined);
    } catch (e) {
      mylog(
        `Warning: failed to send info/error for exchanger ${
          this.exchanger.id
        }: ${String(e)}`,
        "hidden"
      );
    }

    // load cities setting for matching
    const parserSetting = (await getData("parser_setting")) || {};
    const cities: ICity[] = parserSetting?.cities || [];

    const rateFormatter = new RateFormatter(
      this.exchanger,
      this.generalData,
      cities
    );

    try {
      // ensure we await formatting & matching (could be async)
      await rateFormatter.formatAndMatchRatesWithDirs(
        JSONres.rates?.item || []
      );
    } catch (e) {
      const err: IExchangerParsingError = {
        autoMessage: String((e as Error).message),
        comment: "Error during formatting/matching rates",
      };
      sendExchangerError(this.exchanger, err);
      mylog(
        `Error formatting rates for exchanger ${this.exchanger.id}: ${String(
          e
        )}`,
        "error"
      );
    }
  }
}
