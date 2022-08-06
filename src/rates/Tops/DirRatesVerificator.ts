import { VerificationResult, Violation } from "../../types";
import { DirRates, Rate } from "../../types/rates";
import db from "../../db";

export class DirRatesVerificator {
  dir: string;
  SD_applied_from: number;
  SD_best: number;
  SD_worst: number;

  constructor(dir: string) {
    const { SD_applied_from, SD_best, SD_worst } = db.getData(
      ".parser_setting"
    );
    this.dir = dir;
    this.SD_applied_from = SD_applied_from;
    this.SD_best = SD_best;
    this.SD_worst = SD_worst;
  }

  getVerified = (dirRates: DirRates): DirRates => {
    const [average, SD] = this._getAverageAndSD(dirRates);

    const okDirRates = Object.entries(dirRates).reduce(
      (okDirRates: DirRates, [exchangerId, rate]) => {
        const { rateErrors, rateWarnings } = this._verifyRate(
          rate,
          average,
          SD,
          Object.keys(dirRates).length
        );
        if (rateWarnings.length)
          db.push(`.dirs.${this.dir}.warnings.${exchangerId}`, rateWarnings);
        if (rateErrors.length)
          db.push(`.dirs.${this.dir}.errors.${exchangerId}`, rateErrors); //
        //dbRates.delete(`.dirRates.${this.dir}.${exchangerId}`);
        if (!rateErrors.length) okDirRates[exchangerId] = rate;
        return okDirRates;
      },
      {}
    );

    return okDirRates;

    // this._addToProblematic("warnings", w, exchangerId);
    // this._addToProblematic("rate_errors", e, exchangerId);
  };

  _verifyRate = (
    rate: Rate,
    average: number,
    SD: number,
    ratesAmount: number
  ): VerificationResult => {
    const { reserve, min, max } = rate; // course = GET/GIVE
    let rateErrors: string[] = [];
    let rateWarnings: string[] = [];
    const [minCourse, maxCourse] = [
      // for errors
      average - SD * this.SD_worst,
      average + SD * this.SD_best,
    ];
    const [lowCourse, highCourse] = [
      // for warnings
      average - SD * (this.SD_worst > 2 ? this.SD_worst - 1 : 2),
      average + SD * (this.SD_best > 2 ? this.SD_best - 1 : 2),
    ];

    const deviation = +((rate.course / average) * 100).toFixed(0);

    const rate_errors: Violation[] = [
      [min.give <= 0, ` Минимум должен быть больше нуля`],
      [
        reserve.give < min.give,
        ` Резерв ${rate.reserve.give} меньше минималки ${rate.min.give} `,
      ],
      [
        max.give < min.give,
        ` Максималка ${rate.max.give} меньше минималки ${rate.min.give} `,
      ],
      [
        rate.course < minCourse,
        ` Курс ${rate.course} составляет ${deviation}% от среднего ${average} среди ${ratesAmount} предложений, MIN: ${minCourse} `,
      ],
      [
        rate.course > maxCourse,
        ` Курс ${rate.course} составляет ${deviation}% от среднего ${average} среди ${ratesAmount} предложений, MAX: ${maxCourse} `,
      ],
    ];

    const warnings: Violation[] = [
      [
        rate.course < lowCourse && rate.course > minCourse,
        ` Курс ${rate.course} составляет ${deviation}% от среднего ${average} среди ${ratesAmount} предложений, слишком близко к MIN: ${minCourse} `,
      ],
      [
        rate.course > highCourse && rate.course < maxCourse,
        ` Курс ${rate.course} составляет ${deviation}% от среднего ${average} среди ${ratesAmount} предложений, слишком близко к MAX: ${maxCourse} `,
      ],
    ];

    for (let rate_error of rate_errors) {
      const [errorCondition, message] = rate_error;
      if (errorCondition) {
        rateErrors = [...rateErrors, message];
      }
    }

    for (let warning of warnings) {
      const [warningCondition, message] = warning;
      if (warningCondition) {
        rateWarnings = [...rateWarnings, message];
      }
    }

    return {
      rateErrors,
      rateWarnings,
    };
  };

  _getAverageAndSD = (dirRates: DirRates): [number, number] => {
    // чтобы не мутировать dirRates, копируем курсы
    const courses = Object.values(dirRates).map((rate) => rate.course);
    const length = courses.length;
    // если мало курсов, отображаем все
    if (length <= this.SD_applied_from) return [0, Infinity];
    // столько обрежем с обеих сторон, чтобы убрать сильнейшие отклонения от среднего
    const toCropp = Math.round(Math.pow(length, 0.5) - Math.pow(length, 0.2));
    // сортируем массив и обрезаем хвосты
    const sorted = courses.sort((a, b) => a - b);
    const cropped = sorted.splice(toCropp, length - toCropp * 2);
    // считаем среднее и стандартное отклонение
    const average =
      cropped.reduce((sum, i) => (sum = sum + i), 0) / cropped.length;
    const SD = Math.sqrt(
      cropped.reduce((sum, i) => (sum = sum + (i - average) ** 2), 0) /
        (cropped.length - 1)
    );
    return [average, SD];
  };

  _addToProblematic = () => {};
}
