// rates/exchangerProcessor.ts
import { getData, setData } from "../utils/redis";
import { emoji, mylog } from "../utils/logger.ts";
import RatesParser from "./ParserHandlers/RateParser";
import { IExchanger } from "../types/exchanger";
import { IGeneralData } from "../types/rates";
import { prepareGeneralData } from "./generalDataLoader";

const MAX_SKIP = 64;

export const processSingleExchanger = async (
  exchanger: IExchanger,
  loopsDone: number,
  idx: number
): Promise<void> => {
  const { id, name } = exchanger;
  const redisKey = `exchanger_stats:${id}:skip`;

  try {
    const redisSkip = Number(await getData(redisKey)) || 0;

    // странные/устаревшие значения чистим
    if (redisSkip > 1024) {
      await setData(redisKey, 0);
    }

    // корректная семантика: выполняем ТОЛЬКО на циклах, кратных skip
    // skip=0|1 → каждый цикл, skip=2 → каждый 2-й, и т.д.
    const s = Math.max(1, Number(await getData(redisKey)) || 0);
    if (s > 1 && loopsDone % s !== 0) {
      mylog(
        ` ~ ${emoji(
          idx
        )} #${id} ${name} skipping (skip=${s}, loop=${loopsDone})`,
        "hidden"
      );
      return;
    }

    // --- парсинг ---
    const generalData: IGeneralData = await prepareGeneralData();
    const parser = new RatesParser(exchanger, generalData);
    await parser.getExchangerRates();

    // успех → сбрасываем skip
    await setData(redisKey, 0);
    mylog(` ✓ ${emoji(idx)} #${id} ${name} parsed successfully`, "success");
  } catch (err: any) {
    const prev = Number(await getData(redisKey)) || 0;
    const next = Math.min(prev > 0 ? prev * 2 : 2, MAX_SKIP);
    await setData(redisKey, next);

    mylog(
      `❌ ${emoji(idx)} #${exchanger.id} ${exchanger.name} failed (${String(
        err?.message || err
      )}) → skip=${next}`,
      "error"
    );
    throw err;
  }
};
