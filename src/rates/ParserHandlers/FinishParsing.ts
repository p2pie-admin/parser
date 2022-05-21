import db from "../../db"
import dbRates from "../../dbRates"
import initialLoader from "../../initialLoader"
import getAllRates from "../getAllRates"
import lockExchangersWithErrors from "./lockExchangersWithErrors"
import getDirTops from "../Tops"
import { DirRate } from "src/types/rates.json"


export default () => {
    console.log("saving rates...")
    const dirTops = getDirTops(dbRates.getData(".dirRates") as {[key: string]: DirRate[]})
    dbRates.push(".dirTops", dirTops)
    dbRates.save()
    db.save()
    const timeout = db.getData(".parser_setting.restart_after_sec")
    const timesRatesRequested = db.getData(".times_rates_requested") as number
    setTimeout(getAllRates, timeout * 1000);
    if(timesRatesRequested % 2 === 0){
      console.log(`reloading settings...`)
      lockExchangersWithErrors()
      initialLoader()
    }
    if(timesRatesRequested % 8 === 0){
      //checkSuspiciousCourses()
    }
    console.log(`All exchangers requested, restarting in ${timeout} sec`)
}