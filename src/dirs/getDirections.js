// const GraphQLClient = require("graphql-request").GraphQLClient;
// const convertDirs = require("./convertDirs");
// const fs = require("fs");

// async function getDirections() {
//   return
//   try {
//     const endpoint = "https://cotletastrapi.herokuapp.com/graphql";

//     const graphQLClient = new GraphQLClient(endpoint);

//     const popularDirsQuery = require("./query");

//     const { popularDirections } = await graphQLClient.request(popularDirsQuery);

//     const dirs = await convertDirs(popularDirections);

//     fs.writeFile("dirs.json", JSON.stringify(dirs), function (err) {
//       if (err) return console.log(err);
//     });
//   } catch (err) {
//     console.error("--ERROR--", err);
//     return {};
//   }
// }
