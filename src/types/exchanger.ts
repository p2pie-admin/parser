/**
 * Model definition for exchanger
 */
export type Logo = {
  alternativeText: string;
  url: string;
};

export type ExchangerStatus = "active" | "suspended" | "disabled";

export type Exchanger = {
  name: string;
  status: ExchangerStatus;
  rates_link: string;
  ref_link?: string;
  tag: string | null;
  logo: Logo;
  total_rates: number;
  admin_rating: number;
};

export interface ExchangerWithId extends Exchanger {
  id: string;
}
