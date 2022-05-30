import db from "../db"
import dbRates from "../dbRates"
import lockExchangersWithErrors from "./cleaners/lockExchangersWithErrors"
import getDirTops from "./Tops"
import { DirRates, DirTops } from "src/types/rates"
import initialLoader from "../initialLoader"
//import checkIfAllExchangersLooped from "./cleaners/checkIfAllExchangersLooped"


export default () => {

    const allDirsRates = dbRates.getData(".allDirsRates") as {[key: string] : DirRates}
    const allDirsTops = getDirTops(allDirsRates) as {[key: string] : DirTops}
    lockExchangersWithErrors()
    //checkIfAllExchangersLooped()
    dbRates.push(".allDirsTops", allDirsTops)
    dbRates.save()
    db.save()

    initialLoader()
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