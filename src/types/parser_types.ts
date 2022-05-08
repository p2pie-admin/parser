interface ExchangerDataErrors {
  networkError: string | null;
  notEnoughData: boolean;
  respondedWithError: string | null;
}

interface ExchangerDataFromXML {
  from: string;
  to: string;
  in: string;
  out: string;
  amount: string;
  param: string;
  minamount: string;
  maxamount: string;
}

interface DBXML {
  xmlData: { [key: string]: ExchangerDataFromXML | ExchangerDataErrors };
}

export { DBXML };
