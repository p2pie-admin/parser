import { Exchanger } from "src/types/exchanger";
import db from "../db";
import mainLoopLogic from "./MainLoopLogic";
import Loop from "./Loop";

type IdRateLinkPairs = {exchangerId: string; rates_link: string}[]

const getAllRates = () => {
    const exchangers = db.getData('.exchangers') as {[key: string]: Exchanger}
    const idRateLinkPairs = Object.entries(exchangers).map(([exchangerId, exchangerData]) => ({exchangerId, rates_link: exchangerData.rates_link})) as IdRateLinkPairs

    const {timeout = 30_000} = db.getData(".parser_setting")

    const gap = +(timeout / idRateLinkPairs.length).toFixed(0)
    console.log(`will restart main loop in:  ${timeout / 1000 + 2}s with gap ${gap / 1000}s`)
  
    setInterval(() => {
      mainLoopLogic()
      console.log("MAIN LOOP RESTARTED")
    }, timeout + 2000)

    
    let leftToLoop = idRateLinkPairs.length
  
    idRateLinkPairs.map(async ({exchangerId, rates_link}, index) => {
        await new Promise(resolve => setTimeout(resolve, index * gap)); 
        // промежутки во времени между ∞ циклами четверть секунды
        leftToLoop -= 1
        console.log(`Loop for ${exchangerId} was started, ${leftToLoop} left`)
        const loop = new Loop(exchangerId, rates_link)
        loop.run()
    }
  )

}

export default getAllRates