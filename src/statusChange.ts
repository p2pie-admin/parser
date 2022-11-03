import { gql } from "graphql-request";
import callStrapi from "./gql/callStrapi";

const updateExchanger = gql`
  mutation UpdateExchangerStatus(
    $exchangerId: ID!
    $status: ENUM_EXCHANGER_STATUS
  ) {
    updateExchanger(id: $exchangerId, data: { status: $status }) {
      data {
        id
      }
    }
  }
`;

const getAllExchangerIds = gql`
  query getAllExchangerIds($status: String) {
    exchangers(
      filters: { status: { eq: $status } }
      pagination: { start: 1, limit: 1000 }
    ) {
      data {
        id
      }
    }
  }
`;

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

    exchangerIds = data.exchangers.map(({ id }: { id: string }) => id);
    exchangerIds.length &&
      console.log(
        `📘 \u001b[1;34m Changed statuses from ${fromStatus} to ${toStatus} for exhangers: ${exchangerIds}`
      );
  }

  exchangerIds.map(
    async (exchangerId: string) =>
      await callStrapi(updateExchanger, {
        exchangerId,
        status: toStatus,
      })
  );
}

export default statusChange;
