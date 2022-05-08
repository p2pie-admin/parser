import CitiesHandler from "../rates/ParserHandlers/CitiesHandler";
import db from "../db"

const cityCodes = db.getData(".parser_setting.cities")
const citiesHandler = new CitiesHandler()

test('formatting cities', () => {
  expect(citiesHandler.formatCities("EKB/GRZ", cityCodes)).toStrictEqual({
    "Россия": ["Екатеринбург", "Грозный"]
  });
});

const ExampleRatesData = [
  {
    from: {_text: "BTC"},
    to: {_text: "USDT"},
    in: {_text: "5"},
    out: {_text: "12"},
    amount: {_text: "12"},
    minamount: {_text: "12"},
    maxamount: {_text: "12"},
    minfee: {_text: "12"},
    fromfee: {_text: "12"},
    tofee: {_text: "12"},
    param: {_text: "test"},
    city: {_text: "SPB"}
  },
  {
    from: {_text: "BTC"},
    to: {_text: "USDT"},
    in: {_text: "5"},
    out: {_text: "12"},
    amount: {_text: "12"},
    minamount: {_text: "12"},
    maxamount: {_text: "12"},
    minfee: {_text: "12"},
    fromfee: {_text: "12"},
    tofee: {_text: "12"},
    param: {_text: "test"},
    city: {_text: "MSK"}
  }
]

const ExpectedRatesData = [
  {
    from: {_text: "BTC"},
    to: {_text: "USDT"},
    in: {_text: "5"},
    out: {_text: "12"},
    amount: {_text: "12"},
    minamount: {_text: "12"},
    maxamount: {_text: "12"},
    minfee: {_text: "12"},
    fromfee: {_text: "12"},
    tofee: {_text: "12"},
    param: {_text: "test"},
    city: {_text: "SPB/MSK"}
  }
]

test("group cities" , () => {
  expect(citiesHandler.groupRatesDataCities(ExampleRatesData)).toStrictEqual(ExpectedRatesData);
})

// function sum(a, b) {
//   return a + b;
// }
// test('adds 1 + 2 to equal 3', () => {
//   expect(sum(1, 2)).toBe(3);
// });