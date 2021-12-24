"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFunctionToObjectValues = void 0;
const applyFunctionToObjectValues = (func, obj) => {
    return Object.keys(obj).reduce((resObj, key) => {
        resObj[key] = func(obj[key]);
        return resObj;
    }, {});
};
exports.applyFunctionToObjectValues = applyFunctionToObjectValues;
//# sourceMappingURL=helper.js.map