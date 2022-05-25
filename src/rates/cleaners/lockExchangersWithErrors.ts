import { ErrorCode } from 'src/types/exchangerResp';
import  config  from "../../config.json";
import { GraphQLClient } from "graphql-request";
import { gql } from "graphql-request";
import db from "../../db";
import { Errors } from '../../types/rates.json';
import { ExchangerError } from "../../types/exchangerResp";
import ErrorHandler from '../ParserHandlers/ErrorHandler';


const mutation = gql`
    mutation UpdateExchangerStatus($exchangerId: ID!, $status: ENUM_EXCHANGER_STATUS) {
    updateExchanger(id: $exchangerId, data: {   status: $status}) {
          data {
            id
          }
      }
    }
`

const codesToDisable: ErrorCode[] = ["ECONNREFUSED", "EPERM", "404", "403", "unknown-error","data-error", "json-parsing-error"]

async function lockExchangersWithErrors() {

      const errors = db.getData(".errors") as Errors

      const graphQLClient = new GraphQLClient(
        process.env.PORT ? config.STRAPI : config.LOCAL_STRAPI,
        {
            headers: {
              authorization: `Bearer ${config.EXCHANGER_TOKEN}`,
            },
          }
      );

      
      Object.entries(errors).map(async ([exchangerId, error] : [string, ExchangerError]) => {
            if(error.isStatusChanged) return
            const status = codesToDisable.find(code => code === error.code) ? "disabled"  : "suspended"
            console.log(status === "disabled" ? `\u001b[1;31m disabling ${exchangerId}` : `\u001b[1;33m suspending ${exchangerId}`)
            try{             
                await graphQLClient.request(mutation, {exchangerId, status});
                const errorHandler = new ErrorHandler(exchangerId)
                errorHandler.setErrorStatusChanged(true) 
                return
            } catch (err){
                console.error("Exchanger locker failed: ", err.message)
                return
            }


      })
}

  
  export default lockExchangersWithErrors;