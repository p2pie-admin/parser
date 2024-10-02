/**
 * Model definition for exchanger
 */
export type Logo = {
  alternativeText: string;
  url: string;
};

export type IExchangerStatus = "active" | "suspended" | "disabled";

export type IExchanger = {
  name: string;
  id: string;
  status: IExchangerStatus;
  rates_link: string;
  ref_link?: string;
  tag?: string | null;
  logo?: Logo;
  total_rates?: number;
  admin_rating?: number;
  loopId?: number | NodeJS.Timeout;
};
