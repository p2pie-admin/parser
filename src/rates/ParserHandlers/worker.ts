// import  CitiesHandler  from './CitiesHandler';
// import { ExchangerResponse } from "../../types/exchangerResp";
// import XML2JSON from "xml-js";

// import XMLConverter from "./XMLConverter";
// import ErrorHandler from './ErrorHandler';



// export default async ({ xml, exchangerId }: {xml: any, exchangerId: string}) => {

//   const options = {
//     compact: true,
//     ignoreComment: true,
//     alwaysChildren: true,
//   }; 

//   const errorHandler = new ErrorHandler(exchangerId)
//   let res = {} as ExchangerResponse
//   try{
//     const response = JSON.parse(XML2JSON.xml2json(xml, options)) as ExchangerResponse
//     res = response
//   }catch({message}){
//     errorHandler.saveError("json-parsing-error", message)
//   }

//   const citiesHandler = new CitiesHandler()
//   const xmlConverter = new XMLConverter(exchangerId)
//   const wereRatesReceived = xmlConverter.checkForErrors(res)

//   if(wereRatesReceived && res.rates?.item) {
//     console.log(`Succeeded: ${exchangerId}`)
//     errorHandler.deleteError()
//     const ratesDataWithGroupedCities = citiesHandler.groupRatesDataCities(exchangerId, res.rates?.item)
//     xmlConverter.matchXMLRatesWithDirs(ratesDataWithGroupedCities)
//   }
// };