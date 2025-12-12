import callStrapi from "../gql/callStrapi";
import { getAllExchangerIds, updateExchangerStatus } from "../gql/queries";
import { waitSec } from "../reload/helper";
import { mylog } from "./logger";

type Status =
  | "active"
  | "suspended"
  | "disabled"
  | "draft"
  | "draft2"
  | "paused"
  | "blacklist";

async function statusChange(
  fromStatus: Status,
  toStatus: Status,
  exchangerIdOrIds?: string | string[] | null
) {
  let exchangerIds: string[] = [];

  if (Array.isArray(exchangerIdOrIds)) {
    exchangerIds = exchangerIdOrIds;
  } else if (typeof exchangerIdOrIds === "string" && exchangerIdOrIds) {
    exchangerIds = [exchangerIdOrIds];
  } else {
    // получаем всех
    const data = await callStrapi(getAllExchangerIds, { status: fromStatus });

    if (!data) {
      mylog(
        `No exchangers received! fromStatus: ${fromStatus} / toStatus: ${toStatus}. JWT token might be outdated!`,
        "error"
      );
      return;
    }

    exchangerIds = data.exchangers.map(({ id }: { id: string }) => id);

    if (!exchangerIds.length) {
      mylog(`No exchanger statuses to be changed!`);
      return;
    }
  }

  if (!exchangerIds.length) {
    mylog(`No exchanger statuses to be changed!`);
    return;
  }

  console.log(
    `📘 \u001b[1;34m Changing statuses from ${fromStatus} → ${toStatus} for exchangers: ${exchangerIds.join(
      ", "
    )}`
  );

  for (const id of exchangerIds) {
    let attempt = 0;
    const maxAttempts = 2;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        await callStrapi(updateExchangerStatus, {
          exchangerId: id,
          status: toStatus,
        });
        break;
      } catch (err) {
        console.log(`📕 \u001b[1;31m failed ${id} attempt ${attempt}`);
        if (attempt >= maxAttempts) {
          break;
        }
        await waitSec(5);
      }
    }

    const delay = 0.1;
    await waitSec(delay);
  }
}

export default statusChange;
