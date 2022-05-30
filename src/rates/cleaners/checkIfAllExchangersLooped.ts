import { Exchanger } from "src/types/exchanger"
import db from "../../db"
import Loop from "../Loop"



export default () => {
     const allExchangers = db.getData(".exchangers") as {[key: string]: Exchanger}
     Object.entries(allExchangers).map(([exchangerId, exchangerData]) => {
         if(!exchangerData.isLooped) {
            const loop = new Loop(exchangerId)
            loop.run()
         }
     })
}