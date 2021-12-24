const applyFunctionToObjectValues = (
  func: (arg0: string[]) => object,
  obj: { [key: string]: any }
) => {
  return Object.keys(obj).reduce(
    (resObj: { [key: string]: any }, key: string) => {
      resObj[key] = func(obj[key]);
      return resObj;
    },
    {}
  );
};

// const _stringSort = (a: string, b: string) => a.localeCompare(b);
// const _numberSort = (a: number, b: number) => a - b;

export { applyFunctionToObjectValues };
