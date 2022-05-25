

import Parser from "./ParserHandlers/Parser";
import { Exchanger } from "src/types/exchanger.json";
import db from "../db";
import mainLoopLogic from "./MainLoopLogic";

const getAllRates = () => {
    console.log("-= Rates Requested =-")
    const exchangers = db.getData('.exchangers') as {[key: string]: Exchanger}

    const {timeout = 30_000, gap = 250} = db.getData(".parser_setting")

    const restartMainLoopIn = gap * Object.keys(exchangers).length + timeout + 2000
  
    setInterval(() => {
      mainLoopLogic()
      console.log("MAIN LOOP RESTARTED")
    }, restartMainLoopIn)

    const parser = new Parser(exchangers)
    parser.pollExchangerLinks(gap)
    console.log("will restart main loop in: ", restartMainLoopIn)
    // getting all exchanger's rates_links and trying to request rates then sorting it by dirs..
    // if error - adding it to errors list
}




export default getAllRates