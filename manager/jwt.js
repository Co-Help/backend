const jwt = require("jsonwebtoken");
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;

const getAccessToken = (payload, secret = ACCESS_TOKEN_SECRET) => {
  const { id, name, role } = payload;
  return jwt.sign({ id, name, role }, secret, { expiresIn: "1h" });
};

const getRefreshToken = (payload, secret = REFRESH_TOKEN_SECRET) => {
  const { id, name, role } = payload;
  return jwt.sign({ id, name, role }, secret);
};

const verifyToken = (token, secret = ACCESS_TOKEN_SECRET) => {
  return jwt.verify(token, secret, (error, payload) => {
    return error ? null : payload;
  });
};

module.exports = {
  getAccessToken,
  getRefreshToken,
  verifyToken,
};
