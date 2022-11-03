"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSame = void 0;
const removeSame = (snapshot, // has snapshot of dirs
dirs // has new dirs and used dirs
) => {
    const newSnapshot = {};
    for (let key of Object.keys(dirs)) {
        if (snapshot[key] !== dirs[key]) {
            newSnapshot[key] = dirs[key];
        }
    }
    return newSnapshot;
};
exports.removeSame = removeSame;
