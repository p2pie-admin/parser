type RateField = {
    _text: string;
}

interface RateData {
    from: RateField;
    to: RateField;
    in: RateField;
    out: RateField;
    amount: RateField;
    minamount: RateField;
    maxamount: RateField;
    minfee?: RateField;
    fromfee?: RateField;
    tofee?: RateField; 
    param?: RateField;
    city?: RateField;
}

interface ExchangerResponse {
    _declaration?: {
        _attributes: {
            "version": string;
            "encoding": string;
        };
    };
    error?: {
        _text: string;
    };
    rates?: {
        item: RateData[];
    }
}

type ID = string;

interface AllExchangerResponses {
    [key: ID] : ExchangerResponse
}

type ErrorCode = "no-internet" | "404" | "data-error" | "no-rates" | "error-response" | "no-permission" | "unknown-error"


type ExchangerError = {
    devMessage: string;
    serverRespMessage: string | undefined;
    ratesLink: string;
}


export {AllExchangerResponses, ExchangerResponse, RateData, RateField, ErrorCode, ExchangerError}