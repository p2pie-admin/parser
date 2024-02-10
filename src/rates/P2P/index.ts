import { IOrder } from "src/types/p2p";
import callStrapi from "../../gql/callStrapi";
import addP2PDirs from "./addP2PDirs";
import { ordersQuery } from "./queries";
import dbRates from "../../dbRates";

const addP2PRates = async () => {
  const data = await callStrapi(ordersQuery);
  const orders = data?.p2Ps;
  dbRates.push(".allDirsP2P", {}); // чистим, затем заполняем с нуля
  if (orders && orders.length) {
    orders.map((order: IOrder) => addP2PDirs(order));
    //dbRates.save();
    console.log("📗 \u001b[1;32m Added P2P rates");
    return;
  }

  console.log("📕 \u001b[1;31m Failed to load P2P rates");
};

export default addP2PRates;
