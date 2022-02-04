"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Segment {
    constructor(min, max) {
        this.covers = (segment) => {
            if (!this.min || !this.max)
                return false;
            if (!segment.min || !segment.max)
                return false;
            if (this.min <= segment.min && this.max >= segment.max)
                return true;
            return false;
        };
        this.intersects = (segment) => {
            if (!this.min || !this.max)
                return true;
            if (!segment.min || !segment.max)
                return true;
            if (this.min <= segment.min && this.max >= segment.min)
                return true;
            if (this.min >= segment.min && this.min <= segment.max)
                return true;
            if (this.min >= segment.min && this.max <= segment.max)
                return true;
            return false;
        };
        this.combine = (segment) => {
            if (!this.min || !this.max)
                return segment;
            if (this.intersects(segment)) {
                const min = segment.min && segment.min < this.min ? segment.min : this.min;
                const max = segment.max && segment.max > this.max ? segment.max : this.max;
                return new Segment(min, max);
            }
            return this;
        };
        this.min = typeof min === "number" ? min : null;
        this.max = typeof max === "number" ? max : null;
    }
}
const filterByAmount = (rates) => {
    const bestCourseAsc = [...rates].sort((r1, r2) => r1.course - r2.course);
    const topRates = bestCourseAsc.reduce((best, rate) => {
        const rateSegment = new Segment(rate.min_amount.give, rate.max_amount.give);
        if (best.combinedSegment.covers(rateSegment))
            return best;
        return {
            combinedSegment: best.combinedSegment.combine(rateSegment),
            rates: [...best.rates, rate],
        };
    }, { combinedSegment: new Segment(null, null), rates: [] });
    return topRates;
};
exports.default = filterByAmount;
//# sourceMappingURL=filterByAmount.js.map