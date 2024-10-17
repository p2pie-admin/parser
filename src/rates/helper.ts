import { Limit } from "../types/rates";

export const transformLimit = (
  limit: string,
  course: number,
  dir: string
): Limit => {
  // валюта минималки и максималки - это или валюта, указанная в поле или валюта отдаю
  // (если это просто число)
  const limitCurrencyFromXML = limit.split(" ")[1];
  const limitValue = parseFloat(limit);
  const [givePm, getPm] = dir.split("_");
  let [give, get] = [0, 0];

  [give, get] = !limitCurrencyFromXML
    ? [limitValue, limitValue / course] // если не указаны валюты в лимитах, то предполагаем, что это в валюте give
    : givePm.includes(limitCurrencyFromXML)
    ? [limitValue, limitValue / course]
    : getPm.includes(limitCurrencyFromXML)
    ? [limitValue * course, limitValue]
    : [0, 0];

  return { give, get };
};
