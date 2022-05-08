/**
 * Model definition for exchanger
 */
export interface IExchanger {
  id: string;
  name: string;
  description?: string;
  logo?: Blob;
  status: "active" | "suspended" | "disabled";
  tag?: "pro" | "p2p" | "new";
  contacts?: any;
  date_listed?: string;
  rates_link: string;
  ref_link?: string;
  admin_comment?: string;
}