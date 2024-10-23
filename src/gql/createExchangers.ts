import callStrapi from "./callStrapi";
import { CreateExchangersMutation } from "./queries";
import exchangerLinks from "./exchangerLinks.json";

// чтобы не создавать обменники вручную, данная функция заполняет их сама из exchangerLinks.json
async function createExchangers() {
  Object.entries(exchangerLinks).map(async ([name, rates_link]) => {
    await callStrapi(CreateExchangersMutation, {
      name,
      rates_link,
      status: "active",
    });
  });
}

export default createExchangers;
