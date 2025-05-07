"use strict";
// import db from "../db";
// import { DirData } from "../types";
// export default (dirId: string) => {
//   try {
//     const dirDataExists = await db.exists(`.dirs.${dirId}`);
//     if (!dirDataExists) return;
//     const dirData = (await db.getData(`.dirs.${dirId}`)) as DirData;
//     const visits = dirData.times_visited ? dirData.times_visited : 0;
//     await db.push(`.dirs.${dirId}.times_visited`, visits + 1);
//   } catch (e) {
//     console.log(e);
//   }
// };
