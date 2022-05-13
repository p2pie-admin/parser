
import  config  from "../config.json";
import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import normalize from "../normalizer";

const updateExchanger = gql`
    mutation UpdateExchangerStatus($exchangerId: ID!, $status: ENUM_EXCHANGER_STATUS) {
    updateExchanger(id: $exchangerId, data: {   status: $status}) {
          data {
            id
          }
      }
    }
`

const getAllExchangerIds = gql`
    query getAllExchangerIds($status: String){
    exchangers(filters: {status: {eq: $status}} pagination: { start: 1, limit: 1000 }) {
        data{
        id
        }
    }
    }
`

type Status = "active" | "suspended" | "disabled"

async function bulkStatusChange(fromStatus: Status, toStatus: Status) {

    const graphQLClient = new GraphQLClient(
      process.env.PORT ? config.STRAPI : config.LOCAL_STRAPI,
      {
          headers: {
            authorization: `Bearer ${config.EXCHANGER_TOKEN}`,
          },
        }
    );

    const data = await graphQLClient.request(getAllExchangerIds, {status: fromStatus})
    const exchangerIds = normalize(data).exchangers.map(({id}: {id: string}) => id)
    console.log(exchangerIds);
    exchangerIds.map(async (exchangerId: string) => await graphQLClient.request(updateExchanger, {exchangerId, status: toStatus}))
    

}

export default bulkStatusChange