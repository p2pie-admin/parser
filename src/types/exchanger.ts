/**
 * Model definition for exchanger
 */
export type ExchangerStatus = "active" | "suspended" | "disabled";

export type Exchanger = {
  name: string;
  status: ExchangerStatus;
  rates_link: string;
  isLooped?: boolean;
}

export interface ExchangerWithId extends Exchanger {
  id: string
}

