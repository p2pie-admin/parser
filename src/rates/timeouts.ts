import db from "../db";
import { Exchanger } from "../types/exchanger";

const exchangers = db.getData(".exchangers") as { [key: string]: Exchanger };
const exchangersLength = Object.keys(exchangers).length;
// для 100 обменников
const timeout =
  exchangersLength * 300 > 12_000 ? exchangersLength * 300 : 12_000;
// опрос первого в очереди обменника начнется через 30 сек, минимально 12 секунд
const expireIn = timeout * 2 - 2_000;
// и ожидание ответа первого прекратится через 28 сек
const restartRatesHandlerIn = timeout + 4_000;
// каждые 34 сек будет производиться обработка урожая
export { timeout, expireIn, restartRatesHandlerIn };
