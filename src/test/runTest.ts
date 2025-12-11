import { existsSync, readFileSync } from "fs";
import path from "path";
import { parseRatesFromXml } from "../reload/helper";
import RateFormatter from "../rates/ParserHandlers/RateFormatter";
import exchangerExample from "./exchangerExample";
import { IExchanger } from "../types/exchanger";
import { IGeneralData } from "../types/rates";
import { prepareGeneralData } from "../rates/generalDataLoader";

let loopRunning = false;
const GENERAL_DATA_TTL_MS = Number(process.env.GENERAL_DATA_TTL_MS ?? 300_000);

export const runTest = async () => {
  const examplePathCandidates = [
    path.resolve(process.cwd(), "test/example.xml"),
    path.resolve(__dirname, "../test/example.xml"),
  ];

  const examplePath =
    examplePathCandidates.find((p) => existsSync(p)) ||
    examplePathCandidates[0];

  const xml = readFileSync(examplePath, "utf8");
  const json = parseRatesFromXml(xml) as any;

  const { rates, errors: parsingErrors } = parseRatesFromXml(json);

  let generalDataCache: {
    data: IGeneralData;
    expiresAt: number;
  } | null = null;

  const getGeneralData = async (): Promise<IGeneralData> => {
    const now = Date.now();
    if (generalDataCache && generalDataCache.expiresAt > now) {
      return generalDataCache.data;
    }

    const data = await prepareGeneralData();
    generalDataCache = {
      data,
      expiresAt: now + GENERAL_DATA_TTL_MS,
    };
    return data;
  };

  const generalData: IGeneralData = await getGeneralData();

  const exchanger = exchangerExample as IExchanger;
  const rateFormatter = new RateFormatter(
    exchanger,
    generalData,
    generalData.cities
  );

  await rateFormatter.formatAndMatchRatesWithDirs(rates);
};
