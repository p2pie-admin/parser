// const _getPmCode = ({ pm: { pm_group, currency, subitem_short_name } }) => {
//   if (subitem_short_name) {
//     return subitem_short_name;
//   } else if (currency?.name) {
//     return pm_group.short_name
//       ? pm_group.short_name + currency.name
//       : currency.name;
//   } else {
//     return pm_group.options[0]?.currency?.name;
//   }
// };

// const _getDirCode = ({ both_ways, pms }) => {
//   const [give, get] = pms;
//   const giveCode = _getPmCode(give);
//   const getCode = _getPmCode(get);
//   if (giveCode && getCode) {
//     const [GIVE, GET] = [giveCode.toUpperCase(), getCode.toUpperCase()];
//     return both_ways
//       ? [`${GIVE}_${GET}`, `${GET}_${GIVE}`]
//       : [`${GIVE}_${GET}`];
//   } else {
//     return [];
//   }
// };

// const convertDirs = (popularDirections) => {
//   const dirs = popularDirections.reduce(
//     (res, dir) => res.concat(_getDirCode(dir)),
//     []
//   );
//   return dirs;
// };
