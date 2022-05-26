import db from "../db"
import dbRates from "../dbRates"
import lockExchangersWithErrors from "./cleaners/lockExchangersWithErrors"
import getDirTops from "./Tops"
import { DirRates, DirTops } from "src/types/rates.json"
import initialLoader from "../initialLoader"


export default () => {

    const allDirRates = dbRates.getData(".allDirRates") as {[key: string] : DirRates}
    const allDirsTops = getDirTops(allDirRates) as {[key: string] : DirTops}
    lockExchangersWithErrors()
    initialLoader()
    dbRates.push(".allDirsTops", allDirsTops)
    dbRates.save()
    db.save()
    //const timeout = db.getData(".parser_setting.restart_after_sec")
    //const timesRatesRequested = db.getData(".times_rates_requested") as number
    // setTimeout(getAllRates, timeout * 1000);
    // if(timesRatesRequested % 2 === 0){
    //   console.log(`reloading settings...`)
    //   lockExchangersWithErrors()
    //   initialLoader()
    // }
    // if(timesRatesRequested % 8 === 0){
    //   //checkSuspiciousCourses()
    // }
    //console.log(`All exchangers requested, restarting in ${timeout} sec`)
}