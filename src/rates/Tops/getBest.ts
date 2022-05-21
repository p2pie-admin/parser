import { DirRate } from "../../types/rates.json";

interface Best {
  combinedSegment: Segment;
  rates: DirRate[];
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

const findBestRates = (rates: DirRate[]) => {
  const bestCourseAsc = [...rates].sort((r1, r2) => r1.course - r2.course);
  // ASC - малое к большему
  const bestRates = bestCourseAsc.reduce(
    (best: Best, rate: DirRate) => {
      const rateSegment = new Segment(
        rate.min.give,
        rate.max.give
      );
      if (best.combinedSegment.covers(rateSegment)) return best;
      return {
        combinedSegment: best.combinedSegment.combine(rateSegment),
        rates: [...best.rates, rate],
      };
    },
    { combinedSegment: new Segment(null, null), rates: [] }
  );
  return bestRates.rates;
};

export default findBestRates;
