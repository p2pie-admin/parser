import { IPmPointer, IPopularDirs } from "src/types/pms";
import { IOption, IPm, IPmGroup } from "src/types/selector";

export const capitalize = (s: string | undefined) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const getOptionCode = (option: IOption, prefix?: string): string => {
  return (
    (option?.code && option?.code.toUpperCase()) || // USDTERC
    (prefix &&
      prefix.toUpperCase() !== option?.currency?.code.toUpperCase() &&
      prefix.toUpperCase() + option?.currency?.code.toUpperCase()) || // SBERRUB
    option?.currency?.code.toUpperCase()
  ); // BTC
};

export const allPmsHaveUnmetPairs = (pms: IPm[], possiblePairs?: string[]) => {
  if (!possiblePairs || !possiblePairs.length) return false;
  if (pms.find((pm) => possiblePairs.find((pair) => pm.code === pair)))
    return false;
  return true;
};

export const singlePmHasUnmetPairs = (pm: IPm, possiblePairs?: string[]) => {
  if (!possiblePairs || !possiblePairs.length) return false;
  if (possiblePairs.find((pair) => pm.code === pair)) return false;
  return true;
};

export const getPmsFromPmGroup = (
  pm_group: IPmGroup,
  popular_as?: string
): IPm[] => {
  return pm_group.options.map((option) => {
    const code = getOptionCode(option, pm_group?.prefix);
    const subgroup_name = option.name && option.name.toUpperCase();
    const tag =
      pm_group.options.length > 1
        ? option.code?.toLocaleUpperCase() || option.currency.code.toUpperCase()
        : undefined;
    const en_name = pm_group.en_name + " " + option?.currency?.code;
    const ru_name = pm_group.ru_name
      ? pm_group.ru_name + " " + option?.currency?.code
      : "";
    return {
      code, // USDTERC20
      en_name, // Tether ERC-20
      ru_name,
      subgroup_name, // ERC-20
      currency: option?.currency, // USDT
      icon: pm_group.icon,
      color: pm_group.color,
      tag,
      popular_as,
    };
  });
};

export const pmPointerToPm = (pointer: IPmPointer): IPm | undefined => {
  // from frontend
  const { code, pm_group, popular_as } = pointer;
  if (!pm_group?.options) return;
  const pms = getPmsFromPmGroup(pm_group, popular_as);
  if (!code) return pms[0];
  return pms.find((pm) => pm.code.toLowerCase() == code.toLowerCase());
};

export const pmsToDirs = (pms: (IPm | undefined)[]): IPopularDirs => {
  if (!pms || !pms.length || pms.find((pm) => !pm)) return {};
  const cryptoCodes = pms
    .filter((pm) => pm!.popular_as === "crypto")
    .map((pm) => pm!.code);
  const fiatCodes = pms
    .filter((pm) => pm!.popular_as === "fiat")
    .map((pm) => pm!.code);
  return cryptoCodes.reduce((dirs: IPopularDirs, cryptoCode) => {
    const c2f = fiatCodes.map((fiatCode) => `${cryptoCode}_${fiatCode}`);
    const f2c = fiatCodes.map((fiatCode) => `${fiatCode}_${cryptoCode}`);
    return { ...dirs, [cryptoCode]: { buy: [...f2c], sell: [...c2f] } };
  }, {});
};
