import callStrapi from "../gql/callStrapi";
import { IDataForExchangerCreation } from "../types/exchanger";
import { CreateExchangerMutation } from "./queries";

export function isAlmostMatching(str1?: string, str2?: string): boolean {
  if (!str1 || !str2) return false;
  // If the lengths differ by more than one, they cannot be almost matching
  if (Math.abs(str1.length - str2.length) > 1) {
    return false;
  }

  let mismatchCount = 0;
  let i = 0;
  let j = 0;

  // Traverse both strings and count mismatches
  while (i < str1.length && j < str2.length) {
    if (str1[i] !== str2[j]) {
      mismatchCount++;
      if (mismatchCount > 1) {
        return false;
      }

      // If strings are of different lengths, increment the pointer of the longer string
      if (str1.length > str2.length) {
        i++;
      } else if (str1.length < str2.length) {
        j++;
      } else {
        i++;
        j++;
      }
    } else {
      i++;
      j++;
    }
  }

  // If there's one extra character at the end of either string
  if (i < str1.length || j < str2.length) {
    mismatchCount++;
  }

  return mismatchCount <= 1;
}

export const createExchangers = async (
  exchangers: IDataForExchangerCreation[]
) => {
  for (let exchanger of exchangers) {
    try {
      callStrapi(CreateExchangerMutation, exchanger);
      await pause(1);
    } catch (e) {
      console.log(e);
    }
  }
};

export function pause(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
