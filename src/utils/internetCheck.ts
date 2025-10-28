import dns from "dns";
import { mylog } from "./logger.ts";
import { waitSec } from "../reload/helper";

export const checkInternetConnection = () =>
  new Promise<boolean>((resolve) =>
    dns.lookup("google.com", (err) => resolve(!err))
  );

export function isNetworkError(error: any) {
  return (
    error.code === "ENOTFOUND" ||
    error.code === "ECONNREFUSED" ||
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT" ||
    error.message?.includes("network") ||
    error.message?.includes("getaddrinfo")
  );
}

export async function withRetry(
  fn: () => Promise<void>,
  retries = 5,
  delay = 5000
) {
  for (let i = 0; i < retries; i++) {
    try {
      await fn();
      return;
    } catch (error: any) {
      if (isNetworkError(error)) {
        mylog(
          `Network error. Retry ${i + 1}/${retries} in ${delay / 1000}s`,
          "warning"
        );
        await waitSec(delay / 1000);
      } else {
        throw error;
      }
    }
  }
  mylog("Max retries reached. Giving up.", "error");
}
