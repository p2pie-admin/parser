/**
 * Model definition for section
 */
export interface ISection {
  id: string;
  rows?: number;
  columns?: number;
  ru_title?: string;
  en_title: string;
  pm_groups?: relation;
}