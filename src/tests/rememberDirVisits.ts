import db from "../db";
import { DirData } from "src/types";

export default (dirId: string) => {
  try {
    const dirDataExists = db.exists(`.dirs.${dirId}`);
    if (!dirDataExists) return;
    const dirData = db.getData(`.dirs.${dirId}`) as DirData;
    const visits = dirData.times_visited ? dirData.times_visited : 0;
    db.push(`.dirs.${dirId}.times_visited`, visits + 1);
  } catch (e) {
    console.log(e);
  }
};
