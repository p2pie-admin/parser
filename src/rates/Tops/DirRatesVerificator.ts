import db from "../../db";
import { VerificationResult, Violation } from "../../types";
import { DirRates, Rate } from "../../types/rates";

export class DirRatesVerificator {
  dir: string;
  SD_applied_from: number;
  SD_best: number;
  SD_worst: number;

  constructor(dir: string) {
    const { SD_applied_from, SD_best, SD_worst } = await db.getData(
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
          await db.push(
            `.dirs.${this.dir}.warnings.${exchangerId}`,
            rateWarnings
          );
        if (rateErrors.length)
          await db.push(`.dirs.${this.dir}.errors.${exchangerId}`, rateErrors); //
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
    const { min, max } = rate; // course = GET/GIVE
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

    const deviation = +((rate.course / average - 1) * 100).toFixed(0);

    const rate_errors: Violation[] = [
      [min.give <= 0, ` Минимум должен быть больше нуля`],
      [
        max.give < min.give,
        ` Максималка ${round(rate.max.give)} ${
          this.dir.split("_")[0]
        } меньше минималки ${round(rate.min.give)} ${this.dir.split("_")[0]}`,
      ],
      [
        rate.course < minCourse,
        ` Курс ${round(rate.course)} на ${deviation}% меньше среднего ${round(
          average
        )} от ${ratesAmount} предложений, MIN: ${round(minCourse)} `,
      ],
      [
        rate.course > maxCourse,
        ` Курс ${round(rate.course)} на ${deviation}% больше среднего ${round(
          average
        )} от ${ratesAmount} предложений, MAX: ${round(maxCourse)} `,
      ],
    ];

    const warnings: Violation[] = [
      // [!rate.p2pRatio && !rate.ref_link, `Отсутствует рефералка`],
      [
        rate.course < lowCourse && rate.course > minCourse,
        ` Курс ${round(rate.course)} на ${deviation}% меньше среднего ${round(
          average
        )} от ${round(ratesAmount)} предложений, близко к MIN границе: ${round(
          minCourse
        )} `,
      ],
      [
        rate.course > highCourse && rate.course < maxCourse,
        ` Курс ${round(rate.course)} на ${deviation}% больше среднего ${round(
          average
        )} от ${round(ratesAmount)} предложений, близко к MAX границе: ${round(
          maxCourse
        )} `,
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

export const round = (amount: number) => {
  const factor = 4;
  if (!amount) return 0; // тут иногда каким-то образом прилетает null
  const orderOfMagnitude = -Math.floor(Math.log10(amount / 10 ** factor));
  return +amount.toFixed(orderOfMagnitude < 0 ? 0 : orderOfMagnitude || 0);
};
