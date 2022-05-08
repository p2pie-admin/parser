import { GraphQLClient } from "graphql-request";
import config from "../config.json";
import { gql } from "graphql-request";
import exchangerLinks from "./exchangerLinks.json"

const mutation = gql`
mutation CreateExchanger($name:String, $rates_link:String){
  createExchanger(data: {name: $name, rates_link: $rates_link}){
    data{
      id
    }
  }
}
`
// чтобы не создавать обменники вручную, данная функция заполняет их сама из exchangerLinks.json 
async function createExchangers() {

      const graphQLClient = new GraphQLClient(
        process.env.PORT ? config.STRAPI : config.LOCAL_STRAPI,
        {
            headers: {
              authorization: `Bearer ${config.EXCHANGER_TOKEN}`,
            },
          }
      );
      //await graphQLClient.request(mutation, {name: "test5", rates_link: "http://hey.com"});

      Object.entries(exchangerLinks).map(async ([name, rates_link]) => {
          try{
            await graphQLClient.request(mutation, {name, rates_link});
          } catch (err){
            console.error(err)
          }

      })
    }

  
  export default createExchangers;