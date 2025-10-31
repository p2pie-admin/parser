import { IExchanger } from "../types/exchanger";
import { mylog } from "../utils/logger";
import { getData, setData } from "../utils/redis";
import statusChange from "../utils/statusChange";

export async function updateStatusesBySkip(exchangersObj: {
  [key: string]: IExchanger;
}) {
  const entries = Object.entries(exchangersObj);
  const THRESHOLD = 2;
  const STATUS_CACHE_TTL =
    Number(process.env.STATUS_CACHE_TTL ?? 60 * 60) || 60 * 60;

  const toSuspend: string[] = [];
  const toActivate: string[] = [];
  const cacheSync: Array<{ id: string; status: IExchanger["status"] }> = [];

  for (const [exID, exchanger] of entries) {
    const skipVal = Number(
      (await getData(`exchanger_stats:${exID}:skip`)) || 0
    );
    const desiredStatus: IExchanger["status"] =
      skipVal > THRESHOLD ? "suspended" : "active";
    const currentStatus = exchanger.status;
    const cachedStatus =
      ((await getData(`exchanger_stats:${exID}:status`)) as
        | IExchanger["status"]
        | null) ?? null;

    if (currentStatus === desiredStatus) {
      if (cachedStatus !== desiredStatus) {
        cacheSync.push({ id: exID, status: desiredStatus });
      }
      continue;
    }

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
