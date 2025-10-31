import { updateStatusesBySkip } from "../reload/updateStatuses";
import { IExchanger } from "../types/exchanger";

export const finishPrimaryLoop = async (exchangersObj: {
  [key: string]: IExchanger;
}) => {
  await updateStatusesBySkip(exchangersObj);
  // verification
};
