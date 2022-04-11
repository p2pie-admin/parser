// const calculateFeeGive = (from_fee: string, to_fee: string, course: number) => (
//     amount: number
//   ) => {
//     const [givePm, getPm] = db.getData(".lastDir").split("_");
//     let res = amount;
//     for (let fee of [from_fee, to_fee]) {
//       if (fee.includes("%") && parseFloat(fee)) {
//         res = res * (1 + parseFloat(fee) / 100);
//       } else if (fee !== "0") {
//         const [feeVal, feeCur] = fee.split(" ");
//         res = givePm.includes(feeCur)
//           ? res + +feeVal
//           : getPm.includes(feeCur)
//           ? res + +feeVal * course
//           : res;
//       }
//     }
//     return res;
//   };

//   const calculateFeeGet = (from_fee: string, to_fee: string, course: number) => (
//     amount: number
//   ) => {
//     const [givePm, getPm] = db.getData(".lastDir").split("_");
//     let res = amount;
//     for (let fee of [from_fee, to_fee]) {
//       if (fee.includes("%") && parseFloat(fee)) {
//         res = res * (1 - parseFloat(fee) / 100);
//       } else if (fee !== "0") {
//         const [feeVal, feeCur] = fee.split(" ");
//         res = givePm.includes(feeCur)
//           ? res - +feeVal / course
//           : getPm.includes(feeCur)
//           ? res - +feeVal
//           : res;
//       }
//     }
//     return res;
//   };

// // пример курса
// const exampleRate = {
//     "from": "YAMRUB",
//     "to": "GBP",
//     "fromfee": "5 %",
//     "tofee": "100 RUB",
//     "course": 0.01,
//             "in": 100,
//     "out": 1
//             // ...
// }
// // customAmount введена в калькуляторе в одно из полей отдаю/получаю
// // ограничить поле ввода до 8 знаков
// const customAmount = {side: "out", value: 15}

// const calculateFees = (rate, customAmount) => {
// const {side, value} = customAmount
// const {fromfee, tofee, from, to, course} = rate
// if(side === "in" && value){
//       if(!fromfee && !tofee) return [value, value * course]
//         // вычитаем fromfee из in
//         const inMinusFromFee = removeFromFee(rate, value)
//         // вычитаем  tofee из out
//   return [value, removeToFee(rate, inMinusFromFee * course)]
// }
// if (side === "out" && value){
//     if(!fromfee && !tofee) return [value / course, value]
//         // прибавляем tofee к out
//         const outPlusToFee = addToFee(rate, value)
//         // прибавляем fromfee к in
//   return [addFromFee(rate, outPlusToFee / course), value]
// }
// return rate.course < 1 ? [1, 1/rate.course] : [rate.course, 1]
// }
// // далее идут 4 схожие функции вычисления fee

// const addFromFee = (rate, customIn) => {
// const {fromfee, from, to, course} = rate
// if(!fromfee) return customIn // если fee null, оставляем как есть
// const [feeStr, symbol] = fromfee.split(" ")
// const fee = +feeStr
// if(symbol && symbol === "%") return customIn / (1 - fee / 100)
// if(from.includes(symbol)) return customIn + fee //совпала валюта
// if(to.includes(symbol)) return customIn + fee / course
// return customIn //не указана ни валюта ни %, возвращаем исходную сумму
// }

// const addToFee = (rate, customOut) => {
// const {tofee, from, to, course} = rate
// if(!tofee) return customOut // если fee null, оставляем как есть
// const [feeStr, symbol] = tofee.split(" ")
// const fee = +feeStr
// if(symbol && symbol === "%") return customOut / (1 - fee / 100)
// if(to.includes(symbol)) return customOut + fee //совпала валюта
// if(from.includes(symbol)) return customOut + fee * course
// return customOut //не указана ни валюта ни %, возвращаем исходную сумму
// }

// const removeFromFee = (rate, customIn) => {
// const {fromfee, from, to, course} = rate
// if(!fromfee) return customIn // если fee null, оставляем как есть
// const [feeStr, symbol] = fromfee.split(" ")
// const fee = +feeStr
// if(symbol && symbol === "%") return customIn * (1 - fee / 100)
// if(from.includes(symbol)) return fee > customIn ? 0 : customIn - fee //совпала валюта
// if(to.includes(symbol)) return fee / course > customIn ? 0 : customIn - fee / course
// return customIn //не указана ни валюта ни %, возвращаем исходную сумму
// }

// const removeToFee = (rate, customOut) => {
// const {tofee, from, to, course} = rate
// if(!tofee) return customOut // если fee null, оставляем как есть
// const [feeStr, symbol] = tofee.split(" ")
// const fee = +feeStr
// if(symbol && symbol === "%") return customOut * (1 - fee / 100)
// if(to.includes(symbol)) return fee > customOut ? 0 : customOut - fee //совпала валюта
// if(from.includes(symbol)) return fee * course > customOut ? 0 : customOut - fee * course
// return customOut //не указана ни валюта ни %, возвращаем исходную сумму
// }

// console.log(calculateFees(exampleRate, customAmount))



// const extractAmountsFromCourse = (course: number): [number, number] => {
//     const [give, get] = course < 1 ? [1, 1 / course] : [course, 1];
//     return [roundAmount(give), roundAmount(get)];
//   };
  
//   const roundAmount = (amount: number, factor = 3) => {
//     // в логарифм нули не вставляем
//     if (amount === 0) return 0;
//     // нахожу минимальный значимый порядок числа
//     // это такое число, в которое нужно возвести десятку, чтобы получить тысячную долю amount
//     const orderOfMagnitude = -Math.floor(Math.log10(amount / 10 ** factor));
//     //  округляем только часть после точки до порядка равного orderOfMagnitude
//     return +amount.toFixed(orderOfMagnitude < 0 ? 0 : orderOfMagnitude);
//   };