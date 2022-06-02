import db from "../db"
import { Exchanger } from "../types/exchanger"

export default () => {
    const exchangers = db.getData('.exchangers') as {[key: string]: Exchanger}
    const exchangersLength = Object.keys(exchangers).length
    const timeout = exchangersLength * 300 > 12_000 ? exchangersLength * 300 : 12_000
    const expireIn = timeout - 2_000
    const restartRatesHandlerIn = timeout + 4_000
    return {timeout, expireIn, restartRatesHandlerIn}
}