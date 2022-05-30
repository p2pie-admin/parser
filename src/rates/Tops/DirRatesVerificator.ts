import dbRates  from '../../dbRates';

import { VerificationResult, Violation } from "../../types";
import { DirRates, Rate } from "../../types/rates";
import db from "../../db";
import ErrorCreator from "../ParserHandlers/ErrorHandler";


export class DirRatesVerificator {

    dir: string;
    SD_applied_from: number;
    SD_best_dirRates: number;
    SD_worst_dirRates: number;

    constructor(dir: string){
        const { SD_applied_from, SD_best_dirRates, SD_worst_dirRates } = db.getData(".parser_setting");
        this.dir = dir
        this.SD_applied_from = SD_applied_from
        this.SD_best_dirRates = SD_best_dirRates
        this.SD_worst_dirRates = SD_worst_dirRates
        
    }

    

    getVerified = (dirRates: DirRates): DirRates => {
        const [average, SD] = this._getAverageAndSD(dirRates);
        return Object.entries(dirRates).reduce((okDirRates: DirRates, [exchangerId, rate]) => {
            const { rateErrors, rateWarnings } = this._verifyRate(rate, average, SD);
            if (rateWarnings.length) this._addToProblematic("warnings", rateWarnings, exchangerId);
            if (rateErrors.length) this._addToProblematic("errors", rateErrors, exchangerId);
            if (!rateErrors.length) okDirRates[exchangerId] = rate;
            return okDirRates;
        }, {});
    };

    _verifyRate = (
        rate: Rate,
        average: number,
        SD: number,
      ): VerificationResult => {
        const { reserve, min, max } = rate; // course = GET/GIVE
        const rateErrors: string[] = [];
        const rateWarnings: string[] = [];
        const [minCourse, maxCourse] = [
          // for errors
          average - SD * this.SD_worst_dirRates,
          average + SD * this.SD_best_dirRates,
        ];
        const [lowCourse, highCourse] = [
          // for warnings
          average - SD * (this.SD_worst_dirRates > 2 ? this.SD_worst_dirRates - 1 : 2),
          average + SD * (this.SD_best_dirRates  > 2 ? this.SD_best_dirRates  - 1 : 2),
        ];
      
        const deviation = +((rate.course / average) * 100).toFixed(0);
      
        const errors: Violation[] = [
          [min.give <= 0, `Минимум должен быть больше нуля`],
          [reserve.give < min.give, `Резерв ${rate.reserve.give} меньше минималки ${rate.min.give} `],
          [max.give < min.give, `Максималка ${rate.max.give} меньше минималки ${rate.min.give} `],
          [
            rate.course < minCourse,
            `Курс составляет ${deviation}% от среднего, MIN: ${minCourse}`,
          ],
          [
            rate.course > maxCourse,
            `Курс составляет ${deviation}% от среднего, MAX: ${maxCourse}`,
          ],
        ];
      
        const warnings: Violation[] = [
          [
            rate.course < lowCourse && rate.course > minCourse,
            `Курс составляет ${deviation}% от среднего, близко к MIN: ${minCourse} `,
          ],
          [
            rate.course > highCourse && rate.course < maxCourse,
            `Курс составляет ${deviation}% от среднего, близко к MAX: ${maxCourse} `,
          ],
        ];
      
        for (let error of errors) {
          const [errorCondition, message] = error;
          if (errorCondition) {
            rateErrors.push(message);
          }
        }
      
        for (let warning of warnings) {
          const [warningCondition, message] = warning;
          if (warningCondition) {
            rateWarnings.push(message);
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

      _addToProblematic = (
        type: "warnings" | "errors",
        texts: string[],
        exchangerId: string
      ) => {
          const errorCreator = new ErrorCreator(exchangerId, type)
          errorCreator.saveError("data-error", JSON.stringify(texts)) 
          dbRates.delete(`.dirRates.${this.dir}.${exchangerId}`)
      };



}