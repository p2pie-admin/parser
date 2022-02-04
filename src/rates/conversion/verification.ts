import { Rate, Violation, VerificationResult } from "../../types";
import db from "../../db";

const { SD_applied_from, SD_best_rates, SD_worst_rates } = db.getData(
  ".preferences"
);

const verifyRates = (rates: Rate[], dir: string): Rate[] => {
  const [average, SD] = getAverageSD(rates);
  return rates.reduce((passedRates: Rate[], rate: Rate) => {
    const { rateErrors, rateWarnings } = verifyOneRate(rate, average, SD);
    if (rateWarnings.length)
      addToProblematic(rate, "warnings", rateWarnings, dir);
    if (rateErrors.length) addToProblematic(rate, "errors", rateErrors, dir);
    if (!rateErrors.length) passedRates.push(rate);
    return passedRates;
  }, []);
};

const verifyOneRate = (
  rate: Rate,
  average: number,
  SD: number
): VerificationResult => {
  const { reserve, min_amount, max_amount } = rate; // course = GET/GIVE
  const rateErrors: string[] = [];
  const rateWarnings: string[] = [];
  const [minCourse, maxCourse] = [
    // for errors
    average - SD * SD_worst_rates,
    average + SD * SD_best_rates,
  ];
  const [lowCourse, highCourse] = [
    // for warnings
    average - SD * (SD_worst_rates > 2 ? SD_worst_rates - 1 : 2),
    average + SD * (SD_best_rates > 2 ? SD_best_rates - 1 : 2),
  ];

  const deviation = +((rate.course / average) * 100).toFixed(0);

  const errors: Violation[] = [
    [min_amount.give <= 0, "The MIN must be bigger than null!"],
    [reserve.give < min_amount.give, "The RESERVE is too low!"],
    [max_amount.give < min_amount.give, "The MAX is too low!"],
    [
      rate.course < minCourse,
      `Course is ${deviation}% of average, MIN is: ${minCourse}`,
    ],
    [
      rate.course > maxCourse,
      `Course is ${deviation}% of average, MAX is: ${maxCourse}`,
    ],
  ];

  const warnings: Violation[] = [
    [
      rate.course < lowCourse && rate.course > minCourse,
      `Course is ${deviation}% of average, too close to MIN: ${minCourse}`,
    ],
    [
      rate.course > highCourse && rate.course < maxCourse,
      `Course is ${deviation}% of average, too close to MAX: ${maxCourse}`,
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

const getAverageSD = (rates: Rate[]): [number, number] => {
  // чтобы не мутировать rates, копируем курсы
  const courses = rates.map((rate) => rate.course);
  const length = courses.length;
  // если мало курсов, отображаем все
  if (length <= SD_applied_from) return [-Infinity, Infinity];
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

  // console.log("обрезанный массив: ", cropped);
  // console.log("среднее: ", average);
  // console.log("стандартное отклонение:", SD);

  return [average, SD];
};

const addToProblematic = (
  rate: Rate,
  type: "warnings" | "errors",
  texts: string[],
  dir: string
) => {
  const problematicRateExists = db.exists(
    `.${type}.${dir}.${rate.exchanger.name}`
  );
  if (!problematicRateExists)
    db.push(`.${type}.${dir}.${rate.exchanger.name}`, {
      rate,
      texts,
    });
};

export default verifyRates;
