"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CitiesHandler_1 = __importDefault(require("../rates/ParserHandlers/CitiesHandler"));
const db_1 = __importDefault(require("../db"));
const cityCodes = db_1.default.getData(".parser_setting.cities");
const citiesHandler = new CitiesHandler_1.default();
test('formatting cities', () => {
    expect(citiesHandler.formatCities("EKB/GRZ", cityCodes)).toStrictEqual({
        "Россия": ["Екатеринбург", "Грозный"]
    });
});
const ExampleRatesData = [
    {
        from: { _text: "BTC" },
        to: { _text: "USDT" },
        in: { _text: "5" },
        out: { _text: "12" },
        amount: { _text: "12" },
        minamount: { _text: "12" },
        maxamount: { _text: "12" },
        minfee: { _text: "12" },
        fromfee: { _text: "12" },
        tofee: { _text: "12" },
        param: { _text: "test" },
        city: { _text: "SPB" }
    },
    {
        from: { _text: "BTC" },
        to: { _text: "USDT" },
        in: { _text: "5" },
        out: { _text: "12" },
        amount: { _text: "12" },
        minamount: { _text: "12" },
        maxamount: { _text: "12" },
        minfee: { _text: "12" },
        fromfee: { _text: "12" },
        tofee: { _text: "12" },
        param: { _text: "test" },
        city: { _text: "MSK" }
    }
];
const ExpectedRatesData = [
    {
        from: { _text: "BTC" },
        to: { _text: "USDT" },
        in: { _text: "5" },
        out: { _text: "12" },
        amount: { _text: "12" },
        minamount: { _text: "12" },
        maxamount: { _text: "12" },
        minfee: { _text: "12" },
        fromfee: { _text: "12" },
        tofee: { _text: "12" },
        param: { _text: "test" },
        city: { _text: "SPB/MSK" }
    }
];
test("group cities", () => {
    expect(citiesHandler.groupRatesDataCities(ExampleRatesData)).toStrictEqual(ExpectedRatesData);
});
//# sourceMappingURL=rates.test.js.map