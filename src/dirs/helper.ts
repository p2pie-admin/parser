const removeSame = (
  snapshot: { [key: string]: number }, // has snapshot of dirs
  dirs: { [key: string]: number } // has new dirs and used dirs
) => {
  const newSnapshot: { [key: string]: number } = {};

  for (let key of Object.keys(dirs)) {
    if (snapshot[key] !== dirs[key]) {
      newSnapshot[key] = dirs[key];
    }
  }
  return newSnapshot;
};

export { removeSame };
