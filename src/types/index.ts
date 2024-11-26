import { IExchanger } from "./exchanger";
import { IRate } from "./rates";

export interface ICity {
  codes: string[];
  en_name: string;
  ru_name: string;
  population: number;
  coordinates: number[];
  preposition: string;
  closest_cities: string[];
  en_country_name: string;
  ru_country_name: string;
}

export interface IParserSetting {
  dirs_disabled: string;
  cities: ICity[];
  pause_between_loops: number;
  SD_applied_from: number;
  SD_best: number;
  SD_worst: number;
}
