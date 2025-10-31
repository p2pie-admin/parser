import { IExchanger } from "../types/exchanger";
import { mylog } from "../utils/logger";
import { getData } from "../utils/redis";
import statusChange from "../utils/statusChange";

export async function updateStatusesBySkip(exchangersObj: {
  [key: string]: IExchanger;
}) {
  const entries = Object.entries(exchangersObj);
  const THRESHOLD = 8;

  const toSuspend: string[] = [];
  const toActivate: string[] = [];

  for (const [exID, exchanger] of entries) {
    const skipVal = Number(
      (await getData(`exchanger_stats:${exID}:skip`)) || 0
    );

    if (skipVal > THRESHOLD && exchanger.status === "active") {
      toSuspend.push(exID);
    } else if (skipVal <= THRESHOLD && exchanger.status === "suspended") {
      toActivate.push(exID);
    }
  }

  if (toSuspend.length) {
    mylog(
      `⚠️ Suspending ${toSuspend.length} exchangers (skip>${THRESHOLD}): ${toSuspend.join(
        ", "
      )}`,
      "warning"
    );
  }
  if (toActivate.length) {
    mylog(
      `✅ Activating ${toActivate.length} exchangers (skip<=${THRESHOLD}): ${toActivate.join(
        ", "
      )}`,
      "success"
    );
  }

  const tasks: Promise<void>[] = [];
  if (toSuspend.length) {
    tasks.push(statusChange("active", "suspended", toSuspend));
  }
  if (toActivate.length) {
    tasks.push(statusChange("suspended", "active", toActivate));
  }

  await Promise.all(tasks);
}
