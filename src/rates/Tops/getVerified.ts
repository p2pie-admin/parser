
import { VerificationResult, Violation } from "../../types";
import { DirRate } from "../../types/rates.json";
import db from "../../db";
import ErrorCreator from "../ParserHandlers/ErrorHandler";

const { SD_applied_from, SD_best_dirRates, SD_worst_dirRates } = db.getData(".parser_setting");

const getVerified = (dirRates: DirRate[], dir: string): DirRate[] => {
  const [average, SD] = getAverageAndSD(dirRates);
  return dirRates.reduce((okDirRates: DirRate[], rate: DirRate) => {
    const { rateErrors, rateWarnings } = verifyOneDirRate(rate, average, SD, dir);
    if (rateWarnings.length) addToProblematic(rate, "warnings", rateWarnings, dir);
    if (rateErrors.length) addToProblematic(rate, "errors", rateErrors, dir);
    if (!rateErrors.length) okDirRates.push(rate);
    return okDirRates;
  }, []);
};

const verifyOneDirRate = (
  rate: DirRate,
  average: number,
  SD: number,
  dir: string
): VerificationResult => {
  const { reserve, min, max } = rate; // course = GET/GIVE
  const rateErrors: string[] = [];
  const rateWarnings: string[] = [];
  const [minCourse, maxCourse] = [
    // for errors
    average - SD * SD_worst_dirRates,
    average + SD * SD_best_dirRates,
  ];
  const [lowCourse, highCourse] = [
    // for warnings
    average - SD * (SD_worst_dirRates > 2 ? SD_worst_dirRates - 1 : 2),
    average + SD * (SD_best_dirRates  > 2 ? SD_best_dirRates  - 1 : 2),
  ];

  const deviation = +((rate.course / average) * 100).toFixed(0);

  const errors: Violation[] = [
    [min.give <= 0, `Минимум должен быть больше нуля в ${dir}`],
    [reserve.give < min.give, `Резерв ${rate.reserve.give} меньше минималки ${rate.min.give} в ${dir}`],
    [max.give < min.give, `Максималка ${rate.max.give} меньше минималки ${rate.min.give} в ${dir}`],
    [
      rate.course < minCourse,
      `Курс составляет ${deviation}% от среднего, MIN: ${minCourse} в ${dir}`,
    ],
    [
      rate.course > maxCourse,
      `Курс составляет ${deviation}% от среднего, MAX: ${maxCourse} в ${dir}`,
    ],
  ];

  const warnings: Violation[] = [
    [
      rate.course < lowCourse && rate.course > minCourse,
      `Курс составляет ${deviation}% от среднего, близко к MIN: ${minCourse} в ${dir}`,
    ],
    [
      rate.course > highCourse && rate.course < maxCourse,
      `Курс составляет ${deviation}% от среднего, близко к MAX: ${maxCourse} в ${dir}`,
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

const getAverageAndSD = (dirRates: DirRate[]): [number, number] => {
  // чтобы не мутировать dirRates, копируем курсы
  const courses = dirRates.map((rate) => rate.course);
  const length = courses.length;
  // если мало курсов, отображаем все
  if (length <= SD_applied_from) return [0, Infinity];
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

const addToProblematic = (
  dirRate: DirRate,
  type: "warnings" | "errors",
  texts: string[],
  dir: string
) => {
  const problematicDirRateExists = db.exists(
    `.${type}.${dir}.${dirRate.id}`
  );
  if (!problematicDirRateExists){
    const errorCreator = new ErrorCreator(dirRate.id, type)
    errorCreator.saveError("data-error", JSON.stringify(texts))
  }    
};

export default getVerified;
