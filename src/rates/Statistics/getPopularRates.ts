import { IPopularDirs } from "../../types/pms";

const findBestRateByDir = async (dir: string, fiatIndex: number) => {
  const dirRatesExist = dbRates.exists(`.allDirtyRates.${dir}`);
  if (!dirRatesExist) return;
  const dirRates = (await dbRates.getData(`.allDirtyRates.${dir}`)) as DirRates;
  const [exchangerId, rate] = [...Object.entries(dirRates)].sort(
    (r1, r2) => r1[1].course - r2[1].course
  )[0];
  return {
    exchangerId,
    course: fiatIndex ? 1 / rate.course : rate.course,
    fiat: dir.split("_")[fiatIndex],
  };
};

const findBestCourseByDir = async (dir: string) => {
  const dirRatesExist = await dbRates.exists(`.allDirtyRates.${dir}`);
  if (!dirRatesExist) return;
  const dirRates = (await dbRates.getData(`.allDirtyRates.${dir}`)) as DirRates;
  const [exchangerId, rate] = [...Object.entries(dirRates)].sort(
    (r1, r2) => r1[1].course - r2[1].course
  )[0];
  return [rate.course, Object.keys(dirRates).length];
};

export const getSimilarRates = (dirs: string[]) => {
  return dirs.map((dir) => findBestCourseByDir(dir));
};

export const getPopularRates = async () => {
  const popularDirs = (await db.getData(".popular_dirs")) as IPopularDirs;
  return Object.entries(popularDirs).reduce((res, [cryptoCode, sides]) => {
    const [buyCourses, sellCourses] = [
      sides.buy.map((dir) => findBestRateByDir(dir, 0)),
      sides.sell.map((dir) => findBestRateByDir(dir, 1)),
    ];
    return { ...res, [cryptoCode]: { buy: buyCourses, sell: sellCourses } };
  }, {});
};
