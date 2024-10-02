import axios from "axios";
import { mylog } from "../../helper";
import { xmlToJson } from "../../loops/helper";
import { IExchangerData, IParsingError, IStats } from "../../types/statistics";
import { sendParsingError, sendStats } from "../Statistics/stats";

export default class RatesParser {
  id: string;
  name: string;
  ratesLink: string;

  constructor(id: string, name: string, ratesLink: string) {
    this.id = id;
    this.name = name;
    this.ratesLink = ratesLink;
  }

  // Main method to get rates
  async getExchangerRates(): Promise<void> {
    try {
      const response = await axios.get(this.ratesLink, { timeout: 120000 });
      this.handleResponse(response.data);
    } catch (err: any) {
      const numberCode = err.message.match(/\d+/)?.[0] || "";
      const code = err?.code || err?.status || numberCode;
      sendParsingError({
        code,
        exchangerId: this.id,
        url: this.ratesLink,
        exchangerName: this.name,
        autoMessage: err.message,
        devMessage: "Не удалось получить курсы",
      } as IParsingError);
    }
  }

  // Method to handle the response
  private handleResponse(data: any): void {
    //const rateFormatter = new RateFormatter(this.id);
    let exchangerData = {
      exchangerId: this.id,
      ratesLink: this.ratesLink,
      exchangerName: this.name,
    } as IExchangerData;

    const JSONres = xmlToJson(data);
    if (!JSONres || JSONres.error || !JSONres.rates?.item?.length) {
      const error = exchangerData as IParsingError;
      error.autoMessage = JSONres?.error?._text;
      error.comment = "Не смог распарсить XML";
      sendParsingError(error);
      return;
    }
    const stats = exchangerData as IStats;
    stats.comment = `Курсов получено : ${JSONres.rates?.item.length}`;
    sendStats(stats);

    //rateFormatter.formatAndMatchRatesWithDirs(JSONres.rates?.item);
  }

  // Method to handle errors
}
