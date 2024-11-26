import callStrapi from "./gql/callStrapi";
import { getAllExchangerIds, updateExchangerStatus } from "./gql/queries";
import { waitSec } from "./loops/helper";

type Status = "active" | "suspended" | "disabled";

async function statusChange(
  fromStatus: Status,
  toStatus: Status,
  exchangerId?: string | null
) {
  let exchangerIds = [];
  if (exchangerId) {
    exchangerIds = [exchangerId];
    console.log(`📘 \u001b[1;34m ${exchangerId} wants to be active again`);
  } else {
    // апдейтим всех
    const data = await callStrapi(getAllExchangerIds, {
      status: fromStatus,
    });
    !data &&
      console.error(
        `📙 \u001b[1;33m No exchangers received! fromStatus: ${fromStatus} / toStatus: ${toStatus} / exchangerId: ${exchangerId}. JWT token might be outdated!`
      );
    exchangerIds = data.exchangers.map(({ id }: { id: string }) => id);
    exchangerIds.length
      ? console.log(
          `📘 \u001b[1;34m Changed statuses from ${fromStatus} to ${toStatus} for exhangers: ${exchangerIds}`
        )
      : console.error(`📙 \u001b[1;33m No exchanger statuses to be changed! `);
  }

  exchangerIds.map(async (exchangerId: string) => {
    await callStrapi(updateExchangerStatus, {
      exchangerId,
      status: toStatus,
    });
  });
}

export default statusChange;
