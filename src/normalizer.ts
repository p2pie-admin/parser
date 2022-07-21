// костыль против матрешки из data , attributes

const normalizer = (data: any) => {
  const isObject = (data: any) =>
    Object.prototype.toString.call(data) === "[object Object]";
  const isArray = (data: any) =>
    Object.prototype.toString.call(data) === "[object Array]";

  const flatten = (data: any) => {
    if (!data.attributes) return data;

    return {
      id: data.id,
      ...data.attributes,
    };
  };

  if (isArray(data)) {
    return data.map((item: any) => normalizer(item));
  }

  if (isObject(data)) {
    if (isArray(data.data)) {
      data = [...data.data];
    } else if (isObject(data.data)) {
      data = flatten({ ...data.data });
    } else if (data.data === null) {
      data = null;
    } else {
      data = flatten(data);
    }

    for (const key in data) {
      data[key] = normalizer(data[key]);
    }

    return data;
  }

  return data;
};

export default normalizer;
