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
  tag: string | null;
  logo: Logo;
  total_rates: number;
  // rating: Rating; потом добавим
};

export interface ExchangerWithId extends Exchanger {
  id: string;
}
