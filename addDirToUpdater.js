// const fs = require("fs");

// const addDirToUpdater = (dir) => {
//   if (typeof dir === "string" && dir.includes("_")) {
//     const dirs = fs.readFileSync("./dirs.json", "utf8");
//     const currentDirs = JSON.parse(dirs);
//     console.log("currentDirs", currentDirs);
//     const dirExists = currentDirs.length && currentDirs.find((d) => d === dir);
//     !dirExists &&
//       fs.writeFile(
//         "dirs.json",
//         JSON.stringify(currentDirs.concat([dir])),
//         function (err) {
//           if (err) return console.log(err);
//         }
//       );
//   }
// };

// module.exports = addDirToUpdater;
