class NOTFOUND extends Error {
  constructor(itemName) {
    super(`${itemName} not found`);
    this.status = 404;
  }
}

class EXISTS extends Error {
  constructor(itemName) {
    super(`${itemName} already exists`);
    this.status = 409;
  }
}

class INVALID extends Error {
  constructor(itemName) {
    super(`Invalid ${itemName}`);
    this.status = 422;
  }
}

class BAD extends Error {
  constructor(itemName) {
    super(`Bad ${itemName}`);
    this.status = 400;
  }
}

class ERROR extends Error {
  constructor(errMsg, status = 400) {
    super(`${errMsg}`);
    this.status = status;
  }
}

const HandleError = (err, res) => {
  switch (true) {
    case err instanceof NOTFOUND ||
      err instanceof EXISTS ||
      err instanceof INVALID ||
      err instanceof BAD ||
      err instanceof ERROR:
      return res.status(err.status).json({ msg: err.message });
    default:
      return res.status(500).json({ msg: err?.message ?? err });
  }
};

module.exports = { NOTFOUND, EXISTS, INVALID, BAD, ERROR, HandleError };
