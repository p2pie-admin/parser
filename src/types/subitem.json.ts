/**
 * Model definition for Subitem
 */
export interface ISubitem {
  id: string;
  short_name: string;
  name?: string;
  currency?: relation;
}