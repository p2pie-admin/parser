

import db from "../db";
// import dbRates from "../dbRates"
// import convertAllRates from "./conversion";
// import { AllConvertedRates } from "src/types";
import Parser from "./ParserHandlers/Parser";
import { IExchanger } from "src/types/exchanger.json";


const getAllRates = () => {
    console.log("-= Rates Requested =-")
    const timesRatesRequested = db.getData(".times_rates_requested") as number
    const statusToRequest = timesRatesRequested % 37 === 0 ? 'suspended' : 'active'
    const exchangers = db.getData(`.exchangers.${statusToRequest}`) as IExchanger[]
    const exchangerDataForParser = exchangers.map(({rates_link, id}) => ({ratesLink: rates_link, exchangerId: id}))
    const parser = new Parser(exchangerDataForParser)
    parser.requestAllXMLs()
    db.push(".times_rates_requested", timesRatesRequested + 1)
    // getting all exchanger's rates_links and trying to request rates then sorting it by dirs..
    // if error - adding it to errors list
}




export default getAllRates