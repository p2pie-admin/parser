"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testBest = void 0;
const testBest = (rates, dir) => {
    const sorted = Object.values(rates).sort((a, b) => a.course - b.course);
    let failed = 0;
    for (let i in sorted) {
        const current = sorted[+i];
        const worse = sorted[+i + 1];
        if (current && worse) {
            const condition = current.min.give >= worse.min.give ||
                current.max.give <= worse.max.give;
            if (condition)
                continue;
            failed += 1;
        }
    }
    if (failed) {
        console.log("Best rates have a few extra rates.. The total amount: ", Object.keys(rates).length, "failed to pass test: ", failed, " dir: ", dir);
    }
};
exports.testBest = testBest;
//# sourceMappingURL=testBest.js.map