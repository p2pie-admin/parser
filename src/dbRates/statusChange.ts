
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

async function statusChange(fromStatus: Status, toStatus: Status, exchangerId?: string | null) {

    const graphQLClient = new GraphQLClient(
      process.env.PORT ? config.STRAPI : config.LOCAL_STRAPI,
      {
          headers: {
            authorization: `Bearer ${config.EXCHANGER_TOKEN}`,
          },
        }
    );
    let exchangerIds = []
    if(exchangerId){
      exchangerIds = [exchangerId]
      console.log(`\u001b[1;34m ${exchangerId} wants to be active again`)
    } else { // апдейтим всех
      const data = await graphQLClient.request(getAllExchangerIds, {status: fromStatus})
      exchangerIds = normalize(data).exchangers.map(({id}: {id: string}) => id)
      console.log(exchangerIds);
    }

    exchangerIds.map(async (exchangerId: string) => await graphQLClient.request(updateExchanger, {exchangerId, status: toStatus}))
    

}

export default statusChange