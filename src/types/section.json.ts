/**
 * Model definition for section
 */
export interface PmGroup {
  prefix?: string;
  options: {
    code?: string;
    currency: {
      code: string;
    }
  }[]
}

export interface Section {
  pm_groups: PmGroup[];
}