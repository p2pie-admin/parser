import db from "../db"
import dbRates from "../dbRates"
import lockExchangersWithErrors from "./cleaners/lockExchangersWithErrors"
import getDirTops from "./Tops"
import { DirRates, DirTops } from "src/types/rates"
import initialLoader from "../initialLoader"
import {restartRatesHandlerIn} from "./timeouts"



const runDelayedRatesHandler = () => {

    console.log(`\u001b[1;34m Анализ курсов начнется через ${restartRatesHandlerIn / 1000}c`)
   
    setTimeout(() => {
        const allDirsRates = dbRates.getData(".allDirsRates") as {[key: string] : DirRates}
        const allDirsTops = getDirTops(allDirsRates) as {[key: string] : DirTops}

        lockExchangersWithErrors()
        //checkIfAllExchangersLooped()

        dbRates.push(".allDirsTops", allDirsTops)
        dbRates.save()
        db.save()
    
        initialLoader()

        runDelayedRatesHandler()
    }, restartRatesHandlerIn)    
}


export default runDelayedRatesHandler
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
