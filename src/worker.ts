import  CitiesHandler  from './rates/ParserHandlers/CitiesHandler';
import { ExchangerResponse } from "./types/exchangerResp";
import XML2JSON from "xml-js";

import XMLConverter from "./rates/ParserHandlers/XMLConverter";



export default async ({ xml, exchangerId }) => {

  const options = {
    compact: true,
    ignoreComment: true,
    alwaysChildren: true,
  }; 

  const res = JSON.parse(XML2JSON.xml2json(xml, options)) as ExchangerResponse
  const citiesHandler = new CitiesHandler()
  const xmlConverter = new XMLConverter(exchangerId)
  const wereRatesReceived = xmlConverter.checkForErrors(res)

  if(wereRatesReceived && res.rates?.item) {
    console.log(`Succeded ${exchangerId}`)
    const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(res.rates?.item)
    xmlConverter.matchXMLRatesWithDirs(ratesDataWithGroupedCities)
  }
};