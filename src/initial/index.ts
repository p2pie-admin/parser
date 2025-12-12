import auth from "../gql/auth";
import reload from "../reload";

import { mylog } from "../utils/logger";
import statusChange from "../utils/statusChange";

export const runInitialization = async () => {
  await auth();
  mylog("Transfering: Suspended -> Active", "info");
  // DISABLED это те, которые никак не попадают в парсер вовсе. Им запрещено листиться.
  // SUSPENDED это те, которые не дают курсов по какой-то причине, но ожидается, что дадут. (skip > 2)
  // ACTIVE это те, которые опрашиваются стабильно и отдают курсы. (skip ≤ 2)
  //await statusChange("active", "suspended");
  //await statusChange("active", "paused");

  // await statusChange("draft", "active");
  // await statusChange("paused", "active");
  //await statusChange("suspended", "active");
  // await statusChange("draft", "active");
  // при старте парсера сперва всех переводим в active
  await reload();
  mylog("✅ Initialization completed successfully", "success");
  // перезагружаем обменники
};
