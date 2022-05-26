import { DirRates } from "../../types/rates.json";

interface Best {
  combinedSegment: Segment;
  dirRates: DirRates;
}

class Segment {
  min: number | null;
  max: number | null;
  constructor(min: number | null, max: number | null) {
    this.min = typeof min === "number" ? min : null;
    this.max = typeof max === "number" ? max : null;
  }

  covers = (segment: Segment) => {
    if (!this.min || !this.max) return false;
    if (!segment.min || !segment.max) return false;
    if (this.min <= segment.min && this.max >= segment.max) return true;
    return false;
    // _____
    //  ___
  };

  intersects = (segment: Segment) => {
    if (!this.min || !this.max) return true;
    if (!segment.min || !segment.max) return true;
    if (this.min <= segment.min && this.max >= segment.min) return true;
    // __
    //  __
    if (this.min >= segment.min && this.min <= segment.max) return true;
    //  __
    // __
    if (this.min >= segment.min && this.max <= segment.max) return true;
    //  __
    // ____
    return false;
  };

  combine = (segment: Segment): Segment => {
    if (!this.min || !this.max) return segment;
    if (this.intersects(segment)) {
      const min =
        segment.min && segment.min < this.min ? segment.min : this.min;
      const max =
        segment.max && segment.max > this.max ? segment.max : this.max;
      return new Segment(min, max);
    }
    return this;
  };
}

const findBestDirRates = (dirRates: DirRates): DirRates => {

  const bestCourseAsc = [...Object.entries(dirRates)].sort((r1, r2) => r1[1].course - r2[1].course);
  // ASC - малое к большему
  const best = bestCourseAsc.reduce(
    (best: Best, [id, rate]) => {
      const rateSegment = new Segment(
        rate.min.give,
        rate.max.give
      );
      if (best.combinedSegment.covers(rateSegment)) return best;
      return {
        combinedSegment: best.combinedSegment.combine(rateSegment),
        dirRates: {...best.dirRates, [id]: rate}
      };
      
    },
    { combinedSegment: new Segment(null, null), dirRates: {} }
  );
  return best.dirRates
};

export default findBestDirRates;
