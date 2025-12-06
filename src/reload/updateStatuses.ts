import { IExchanger, IExchangerStats } from "../types/exchanger";
import { mylog } from "../utils/logger";
import { getObject, setData } from "../utils/redis";
import statusChange from "../utils/statusChange";

type ExchangerStatsSnapshot = Record<
  string,
  IExchangerStats & { status?: IExchanger["status"] }
>;

export async function updateStatusesBySkip(exchangersObj: {
  [key: string]: IExchanger;
}) {
  /**
   * Быстро синхронизирует статусы обменников:
   *  - читает все exchanger_stats одним запросом
   *  - вешает "suspended", если skip > THRESHOLD
   *  - снимает "suspended" только если есть курсы и skip <= THRESHOLD
   *  - кеширует запрошенный статус в Redis, чтобы не слать лишние запросы в Strapi
   */
  const entries = Object.entries(exchangersObj);
  if (!entries.length) return;

  const THRESHOLD = 2;
  const STATUS_CACHE_TTL =
    Number(process.env.STATUS_CACHE_TTL ?? 60 * 60) || 60 * 60;
  const exchangerStats =
    ((await getObject("exchanger_stats")) as
      | ExchangerStatsSnapshot
      | null) ?? {};

  const toSuspend: string[] = [];
  const toActivate: string[] = [];
  const cacheSync: Array<{ id: string; status: IExchanger["status"] }> = [];

  for (const [exID, exchanger] of entries) {
    const stats = exchangerStats?.[exID] ?? {};
    const skipVal = Number.isFinite(stats.skip) ? Number(stats.skip) : 0;
    const totalRatesRaw = stats.total_rates;
    const totalRatesVal = Number.isFinite(totalRatesRaw)
      ? Number(totalRatesRaw)
      : 0;
    const hasRates = Number.isFinite(totalRatesVal) && totalRatesVal > 0;
    const desiredStatus: IExchanger["status"] =
      skipVal > THRESHOLD ? "suspended" : "active";
    const currentStatus = exchanger.status;
    const cachedStatus = (stats.status as IExchanger["status"] | undefined) ?? null;

    if (currentStatus === desiredStatus) {
      if (cachedStatus !== desiredStatus) {
        cacheSync.push({ id: exID, status: desiredStatus });
      }
      continue;
    }

    // Do not try to re-activate an exchanger until we've observed actual rates.
    if (desiredStatus === "active" && !hasRates) {
      continue;
    }

    // We already requested this status earlier and cache hasn't expired yet.
    if (cachedStatus === desiredStatus) {
      continue;
    }

    if (desiredStatus === "suspended") {
      toSuspend.push(exID);
    } else {
      toActivate.push(exID);
    }
  }

  if (cacheSync.length) {
    await Promise.all(
      cacheSync.map(({ id, status }) =>
        setData(`exchanger_stats:${id}:status`, status, STATUS_CACHE_TTL)
      )
    );
  }

  if (toSuspend.length) {
    await statusChange("active", "suspended", toSuspend);
    await Promise.all(
      toSuspend.map((id) =>
        setData(`exchanger_stats:${id}:status`, "suspended", STATUS_CACHE_TTL)
      )
    );
  }
  if (toActivate.length) {
    mylog(
      `✅ Activating ${
        toActivate.length
      } exchangers (skip<=${THRESHOLD}): ${toActivate.join(", ")}`,
      "success"
    );
    await statusChange("suspended", "active", toActivate);
    await Promise.all(
      toActivate.map((id) =>
        setData(`exchanger_stats:${id}:status`, "active", STATUS_CACHE_TTL)
      )
    );
  }
}
