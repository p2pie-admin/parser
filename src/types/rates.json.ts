
type Sides = "give" | "get";
type Limit = { [key in Sides]: number };

interface Rate {
    id: string;
    min_fee: string;
    from_fee: string;
    to_fee: string;
    course: number;
    min_amount: Limit;
    max_amount: Limit;
    reserve: Limit;
    param: string;
    cities: { [key: string]: string[] };
  }
  

interface ConvertedDirRates {
    rates: Rate[];
    uniqueRates: { [key: string]: Rate | null }; // это уникальные свойства
    bestRates: Rate[]; // это задачка с дождем, чтобы в зависимости от суммы выдавался результат
  }


interface ProblematicRates {
    [key: string]: { [key: string]: object };
  }
  
  
interface AllConvertedRates {
    [key: string]: ConvertedDirRates;
}

export {
    AllConvertedRates,
    ProblematicRates,
    Rate,
    ConvertedDirRates
}
  