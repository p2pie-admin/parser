import { cpus } from "os";

export const isPrimary = !parseInt(process.env.IDX || "0");
export const idx = parseInt(process.env.IDX || "0");
export const numCPUs = cpus().length;

// кол-во циклов, через которое потеряют актуальность обменники
export const shortExpiration = 3;
// кол-во циклов, через которое потеряют актуальность курсы

export const bigTTL = +(process.env.BIG_TTL || 12) * 60;
export const smallTTL = +(process.env.SMALL_TTL || 5) * 60;
