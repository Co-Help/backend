const valid_data = (BLK, dependencies) => {
  for (let i = 0; i < dependencies.length; i++) {
    if (!BLK.hasOwnProperty(dependencies[i].prop)) {
      return false;
    } else {
      if (typeof BLK[dependencies[i].prop] != dependencies[i].type) {
        return false;
      }
    }
  }
  return true;
};

const string_prop = (key) => {
  return { prop: key, type: "string" };
};

const number_prop = (key) => {
  return { prop: key, type: "number" };
};

const boolean_prop = (key) => {
  return { prop: key, type: "boolean" };
};

const object_prop = (key) => {
  return { prop: key, type: "object" };
};

module.exports = {
  valid_data,
  string_prop,
  number_prop,
  boolean_prop,
  object_prop,
};
