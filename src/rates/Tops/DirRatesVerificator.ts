import { IRate } from "../../types/rates";
import { sendExchangerWarning } from "../ErrorHandler";

export class DirRatesVerificator {
  dir: string;
  SD_applied_from: number;
  SD_best: number;
  SD_worst: number;

  constructor(
    dir: string,
    SD_applied_from: number,
    SD_best: number,
    SD_worst: number
  ) {
    this.dir = dir;
    this.SD_applied_from = SD_applied_from;
    this.SD_best = SD_best;
    this.SD_worst = SD_worst;
  }

  getVerified = (dirRates: {
    [key: string]: IRate;
  }): { [key: string]: IRate } => {
    const [average, SD] = this._getAverageAndSD(dirRates);

    const okDirRates = Object.entries(dirRates).reduce(
      (res: { [key: string]: IRate }, [exchangerId, rate]) => {
        const hasWarnings = this._verifyRate(
          rate,
          average,
          SD,
          Object.keys(dirRates).length
        );

        if (!hasWarnings) return { ...res, [exchangerId]: rate };
        return res;
      },
      {}
    );

    return okDirRates;
  };

  _verifyRate = (
    rate: IRate,
    average: number,
    SD: number,
    ratesAmount: number
  ): boolean => {
    const { min, max } = rate;
    let hasWarnings = false;
    const [fromCurrency] = this.dir.split("_");

    const [minCourse, maxCourse] = [
      average - SD * this.SD_worst,
      average + SD * this.SD_best,
    ];
    const [lowCourse, highCourse] = [
      average - SD * (this.SD_worst * 0.85),
      average + SD * (this.SD_best * 0.85),
    ];

    const deviation =
      average === 0 ? 0 : +((rate.course / average - 1) * 100).toFixed(0);

    const warnings: [boolean, string][] = [
      [rate.course === 0, ` Курс не может быть нулевым`],
      [min.give <= 0, ` Минимум должен быть больше нуля`],
      [
        max.give < min.give,
        `🔴 Максималка ${round(
          rate.max.give
        )} ${fromCurrency} меньше минималки ${round(
          rate.min.give
        )} ${fromCurrency}`,
      ],
      [
        rate.course < minCourse,
        `🔴 Курс забанен, ${round(
          rate.course
        )} на ${deviation}% выгоднее среднего ${round(
          average
        )} от ${ratesAmount} предложений, MIN: ${round(minCourse)} `,
      ],
      [
        rate.course > maxCourse,
        `🔴 Курс забанен, ${round(
          rate.course
        )} на ${deviation}% невыгоднее среднего ${round(
          average
        )} от ${ratesAmount} предложений, MAX: ${round(maxCourse)} `,
      ],
    ];

    const easyWarnings: [boolean, string][] = [
      [
        rate.course < lowCourse && rate.course > minCourse,
        `🟡 Курс ${round(
          rate.course
        )} на ${deviation}% выгоднее среднего ${round(average)} от ${round(
          ratesAmount
        )} предложений, близко к MIN границе: ${round(minCourse)} `,
      ],
      [
        rate.course > highCourse && rate.course < maxCourse,
        `🟡 Курс ${round(
          rate.course
        )} на ${deviation}% невыгоднее среднего ${round(average)} от ${round(
          ratesAmount
        )} предложений, близко к MAX границе: ${round(maxCourse)} `,
      ],
    ];

    for (let [condition, message] of warnings) {
      if (condition && rate.exchangerId) {
        sendExchangerWarning(rate.exchangerId, this.dir, message);
        hasWarnings = true;
      }
    }

    for (let [condition, message] of easyWarnings) {
      if (condition && rate.exchangerId) {
        sendExchangerWarning(rate.exchangerId, this.dir, message);
      }
    }

    return hasWarnings;
  };

  _getAverageAndSD = (dirRates: { [key: string]: IRate }): [number, number] => {
    const courses = Object.values(dirRates)
      .map((rate) => rate.course)
      .filter((c) => c > 0);

    const length = courses.length;
    if (length <= this.SD_applied_from) {
      // fallback: return wide threshold
      const avg =
        courses.reduce((sum, c) => sum + c, 0) / (courses.length || 1);
      return [avg, Infinity];
    }

    const toCrop = Math.round(Math.pow(length, 0.5) - Math.pow(length, 0.2));
    const sorted = courses.slice().sort((a, b) => a - b);
    const cropped = sorted.slice(toCrop, length - toCrop);

    const average = cropped.reduce((sum, val) => sum + val, 0) / cropped.length;

    const SD =
      cropped.length > 1
        ? Math.sqrt(
            cropped.reduce((sum, val) => sum + (val - average) ** 2, 0) /
              (cropped.length - 1)
          )
        : 0;

    return [average, SD];
  };
}

export const round = (amount: number): number => {
  if (!amount) return 0;

  if (amount > 1000) return +amount.toFixed(0);
  if (amount > 10) return +amount.toFixed(2);
  if (amount > 1) return +amount.toFixed(4);
  return +amount.toFixed(6);
};
