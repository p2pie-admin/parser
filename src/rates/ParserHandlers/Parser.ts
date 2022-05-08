import  CitiesHandler  from '../../rates/ParserHandlers/CitiesHandler';

import axios from "axios";
import { ExchangerResponse } from "src/types/exchangerResp";
import XML2JSON from "xml-js";
import dbRates from "../../dbRates"
import ErrorCreator from "./ErrorCreator";
import XMLConverter from "./XMLConverter";
import Piscina from 'piscina';
import {resolve} from "path"


const pool = new Piscina({
  filename: resolve('./dist/worker.js'),
  maxQueue: 'auto'
})


type LinkAndID = {
  exchangerId: string;
  ratesLink: string;
}

export default class Parser {

  ratesLinks: LinkAndID[];

  constructor(ratesLinks: LinkAndID[]) {
    this.ratesLinks = ratesLinks;
  }



  async _requestXML(ratesLink: string, exchangerId: string) {


    return axios
          .get(ratesLink)
          .then(function (response) {
            const leftToParse = dbRates.getData(".left_to_parse")
            dbRates.push(".left_to_parse", leftToParse - 1) 
            console.log('leftToParse', leftToParse)
            pool.run({xml: response.data, exchangerId})
          })
          .catch(function (error){
            const leftToParse = dbRates.getData(".left_to_parse")
            dbRates.push(".left_to_parse", leftToParse - 1) 
            const errorCreator = new ErrorCreator(exchangerId)
            errorCreator.saveError("404", error.message)
          })
  }

  requestAllXMLs() {
    dbRates.push(".left_to_parse", this.ratesLinks.length - 1)
    try {
      this.ratesLinks.map(async ({exchangerId, ratesLink}) => await this._requestXML(ratesLink, exchangerId))
      //Promise.all([this.ratesLinks.map(({exchangerId, ratesLink}, id) => this._requestXML(ratesLink, exchangerId, id))])
    } catch (err) {
        console.log('Fail');
    }
  }


}


