const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, JAGUAR_TOKEN_SECRET } =
  process.env;

const getAccessToken = (payload, secret = ACCESS_TOKEN_SECRET) => {
  const { id, name, email, role } = payload;
  return jwt.sign({ id, name, email, role }, secret, { expiresIn: "365d" });
};

const getRefreshToken = (payload, secret = REFRESH_TOKEN_SECRET) => {
  const { id, name, email, role } = payload;
  return jwt.sign({ id, name, email, role }, secret);
};

const verifyToken = (token, secret = ACCESS_TOKEN_SECRET) => {
  return jwt.verify(token, secret, (error, payload) => {
    return error ? null : payload;
  });
};

const verifyLoginToken = (token, secret = JAGUAR_TOKEN_SECRET) => {
  return jwt.verify(token, secret, (error, payload) => {
    return error ? null : payload;
  });
};

module.exports = {
  getAccessToken,
  getRefreshToken,
  verifyToken,
  verifyLoginToken,
};
