import { IRate } from "../../types/rates";

interface Best {
  combinedSegment: Segment;
  dirRates: { [key: string]: IRate };
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

  smallerThan = (segment: Segment) => {
    if (!this.min || !this.max) return true;
    if (!segment.min || !segment.max) return false;
    if (segment.max - segment.min > this.max - this.min) return true;
    return false;
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
    if (this.smallerThan(segment)) return segment;
    return this;
  };
}

const findBestDirRates = (dirRates: {
  [key: string]: IRate;
}): { [key: string]: IRate } => {
  const bestCoursesAsc = [...Object.entries(dirRates)]
    .sort((r1, r2) => +r2[1].course - +r1[1].course)
    .reverse();
  // ASC - малое к большему
  const best = bestCoursesAsc.reduce(
    (best: Best, [id, rate]) => {
      const rateSegment = new Segment(rate.min.give, rate.max.give);
      // console.log(`${best.combinedSegment.min?.toFixed(4) || 0}_${best.combinedSegment.max?.toFixed(4) || 0} |  ${rateSegment.min?.toFixed(4)}_${rateSegment.max?.toFixed(4)}`);
      if (best.combinedSegment.covers(rateSegment)) return best;
      // console.log(Object.values(best.dirRates).map((r) => r.min?.give?.toFixed(4) + "_" + r.max?.give?.toFixed(4));
      // console.log(`added: ${rateSegment.min?.toFixed(4)}_${rateSegment.max?.toFixed(4)}`);
      return {
        combinedSegment: best.combinedSegment.combine(rateSegment),
        dirRates: { ...best.dirRates, [id]: rate },
      };
    },
    { combinedSegment: new Segment(null, null), dirRates: {} }
  );
  return best.dirRates;
};

export default findBestDirRates;
