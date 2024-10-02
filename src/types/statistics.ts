export type ErrorCode =
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

export type Violation = [boolean, string];

export interface VerificationResult {
  rateErrors: string[];
  rateWarnings: string[];
}

export interface IExchangerData {
  exchangerId: string;
  exchangerName?: string;
  ratesLink?: string;
}

export interface IParsingError extends IExchangerData {
  comment?: string;
  autoMessage?: string;
  code?: ErrorCode;
  codeExplanation?: string;
}

export interface IViolation {
  type: "warning" | "error";
  comment?: string;
  dir?: string;
}

export interface IStats extends IExchangerData {
  exchangerId: string;
  rates: number; // надо глянуть какие есть но не добавлены dir
  violations: IViolation[];
  comment?: string;
  exchangerName?: string;
  ratesLink?: string;
}
