import axios from "axios";
import db from "../../db"
import ErrorHandler from "./ErrorHandler";
// import Piscina from 'piscina';
// import {resolve} from "path"
import { LinkAndID } from 'src/types/rates.json';
import finishParsing from "./FinishParsing";
import { ExchangerResponse } from "src/types/exchangerResp";
import CitiesHandler from "./CitiesHandler";
import XMLConverter from "./XMLConverter";
import XML2JSON from "xml-js";




// const pool = new Piscina({
//   filename: resolve(__dirname, "worker.js"),
//   maxQueue: 'auto'
// })

const afterExchangerParsing = () => {
  const leftToParse = db.getData(".left_to_parse")
  db.push(".left_to_parse", leftToParse - 1) 
  console.log(leftToParse, " left")

  if(leftToParse <= 0) {
    finishParsing()
  }
}

export default class Parser {

  ratesLinks: LinkAndID[];

  constructor(ratesLinks: LinkAndID[]) {
    this.ratesLinks = ratesLinks;
  }

  async _requestXML(ratesLink: string, exchangerId: string) {

    return axios
          .get(ratesLink, {timeout: 1000 * 150})
          .then(function (response) {
            afterExchangerParsing()
            const options = {
              compact: true,
              ignoreComment: true,
              alwaysChildren: true,
            }; 
          
            const errorHandler = new ErrorHandler(exchangerId)
            let res = {} as ExchangerResponse
            try{
              res = JSON.parse(XML2JSON.xml2json(response.data, options)) as ExchangerResponse
            }catch({message}){
              errorHandler.saveError("json-parsing-error", message)
            }
          
            const citiesHandler = new CitiesHandler()
            const xmlConverter = new XMLConverter(exchangerId)
            const wereRatesReceived = xmlConverter.checkForErrors(res)
          
            if(wereRatesReceived && res.rates?.item) {
              console.log(`Succeeded: ${exchangerId}`)
              errorHandler.deleteError()
              const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(exchangerId, res.rates?.item)
              xmlConverter.matchXMLRatesWithDirs(ratesDataWithGroupedCities)
            }
            //pool.run({xml: response.data, exchangerId})
          })
          .catch(function (err){
            afterExchangerParsing()
            const {message, code, status} = err
            const numberCode = message.match(/\d+/) && message.match(/\d+/)[0]
            const errorHandler = new ErrorHandler(exchangerId)           
            errorHandler.saveError(code || status || numberCode, message)
          })
  }

  requestAllXMLs() {
    // инициализируем сколько осталось
    db.push(".left_to_parse", this.ratesLinks.length - 1)
    try {
      this.ratesLinks.map(async ({exchangerId, ratesLink}) => await this._requestXML(ratesLink, exchangerId))
    } catch (err) {
        console.log('Fail');
    }
  }

}


