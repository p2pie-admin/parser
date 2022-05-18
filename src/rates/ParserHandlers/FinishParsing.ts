import db from "../../db"
import dbRates from "../../dbRates"
import initialLoader from "../../initialLoader"
import getAllRates from "../getAllRates"
import lockExchangersWithErrors from "./lockExchangersWithErrors"
import filterRates from "../FilterHandlers/Filter"


export default () => {
    console.log("saving rates...")
    dbRates.save()
    db.save()
    const timeout = db.getData(".parser_setting.update_time_sec")
    const timesRatesRequested = db.getData(".times_rates_requested") as number
    setTimeout(getAllRates, timeout * 1000);
    if(timesRatesRequested % 3 === 0){
      console.log(`reloading settings...`)
      initialLoader()
      lockExchangersWithErrors()
      filterRates()
    } 
    console.log(`All exchangers requested, restarting in ${timeout} sec`)
}