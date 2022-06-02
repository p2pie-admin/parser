import { Exchanger } from "src/types/exchanger";
import db from "../db";
import Loop from "./Loop";
import runDelayedRatesHandler from "./runDelayedRatesHandler";


type IdRateLinkPairs = {exchangerId: string; rates_link: string}[]


const getAllRates = () => {
    const exchangers = db.getData('.exchangers') as {[key: string]: Exchanger}
    const idRateLinkPairs = Object.entries(exchangers).map(([exchangerId, exchangerData]) => ({exchangerId, rates_link: exchangerData.rates_link})) as IdRateLinkPairs

    // время паузы между стартом запросов захардкожено как 300мс, все прочее автоматом подстраивается
    const gap = 300
    let leftToLoop = idRateLinkPairs.length
    runDelayedRatesHandler()
  
    idRateLinkPairs.map(async ({exchangerId, rates_link}, index) => {
        await new Promise(resolve => setTimeout(resolve, index * gap)); 
        // промежутки во времени между ∞ циклами четверть секунды
        leftToLoop -= 1
        console.log(`\u001b[1;34m ⓘ ${exchangerId} : Цикл опроса запущен, осталось запустить ${leftToLoop}`)
        const loop = new Loop(exchangerId, rates_link)
        loop.run()
    }
  )

}

export default getAllRates