export type IErrorCode =
  | "no-rates"
  | "ENOTFOUND"
  | "ECONNREFUSED"
  | "ECONNRESET"
  | "ETIMEDOUT"
  | "EPERM"
  | "ECONNABORTED"
  | "CERT_HAS_EXPIRED"
  | "ERR_FR_TOO_MANY_REDIRECTS"
  | "307"
  | "403"
  | "404"
  | "500"
  | "503"
  | "522"
  | "json-parsing-error"
  | "data-error"
  | "exchanger-custom-error"
  | "unknown";
/**
 * Model definition for exchanger
 */
export type Logo = {
  name?: string | null;
  alternativeText?: string | null;
  url?: string | null;
};

export type Icon = {
  name?: string | null;
  alternativeText?: string | null;
  url?: string | null;
};

export interface ITopParameterDetails {
  en_description?: string | null;
  ru_description?: string | null;
  icon?: Icon | null;
}

export interface ITopParameterDescriptor {
  code: string;
  en_name?: string | null;
  ru_name?: string | null;
  parameter?: ITopParameterDetails | null;
}

export interface IExchangerParameterRule {
  top_parameter?: ITopParameterDescriptor | null;
  include?: string | null;
  exclude?: string | null;
}

export interface IExchangerOffice {
  visible?: boolean | null;
}

export type IExchangerStatus = "active" | "suspended" | "disabled" | "draft";

export interface IExchangerParsingError {
  comment?: string;
  autoMessage?: string;
  code?: IErrorCode;
  codeExplanation?: string;
}

export interface IExchangerParsingInfo {
  rates: number;
  comment?: string;
}

export type IExchanger = {
  name: string;
  display_name?: string | null;
  id: string;
  status: IExchangerStatus;
  rates_link: string;
  ref_link?: string;
  logo?: Logo | null;
  total_rates?: number;
  admin_rating?: number;
  // Trust level from Strapi (unknown | caution | verified | reliable), carried into every rate.
  trust_level?: string | null;
  skip?: number;
  parameters?: IExchangerParameterRule[] | null;
  offices?: IExchangerOffice[] | null;
};

export interface IDataForExchangerCreation {
  rates_link: string;
  ref_link: string;
  name: string;
  admin_rating: number;
}

export interface IExchangerStats {
  skip?: number;
  error?: string;
  total_rates?: number;
  warning?: string[];
  time?: number;
}
