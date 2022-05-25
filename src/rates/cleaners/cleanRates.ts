import dbRates from "../../dbRates"
import { DirRate } from "../../types/rates.json"

export const cleanRates = (exchangerId: string) => {
    const dirRates = dbRates.getData(".dirRates") as {[key: string]: DirRate[]}
    const cleanDirRates = Object.entries(dirRates).reduce((newDirRates, [dir, rates]) => ({...newDirRates, [dir]: rates.filter(rate => rate.id !== exchangerId)}), {})
    dbRates.push(".dirRates", cleanDirRates)
  }