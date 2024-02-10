import dbRates from "./dbRates";

export const handleDirRequest = (
  send: Function,
  dirId: string,
  type: string
) => {
  const dirTopsExist = dbRates.exists(`.allDirsTops.${dirId}`);
  const dirRatesExist = dbRates.exists(`.allDirsRates.${dirId}`);
  const dirP2PExist = dbRates.exists(`.allDirsP2P.${dirId}`);

  switch (type) {
    case "p2p":
      dirP2PExist ? send(dbRates.getData(`.allDirsP2P.${dirId}`)) : send([]);
      break;
    case "tops":
      dirTopsExist ? send(dbRates.getData(`.allDirsTops.${dirId}`)) : send([]);
      break;
    case "tops+p2p":
      if (!dirP2PExist && !dirTopsExist) send([]);
      const dirP2P = dirP2PExist ? dbRates.getData(`.allDirsP2P.${dirId}`) : [];
      const dirTops = dirTopsExist
        ? dbRates.getData(`.allDirsTops.${dirId}`)
        : [];
      send([...dirTops, ...dirP2P]);
      break;
    default:
      dirRatesExist
        ? send(dbRates.getData(`.allDirsRates.${dirId}`))
        : send([]);
  }
};
