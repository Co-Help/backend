const { verifyToken } = require("../manager/jwt");
const { REFRESH_TOKEN_SECRET } = process.env;

const verify_roles = (res, next, userRole, roles = []) => {
  if (!userRole) {
    return res.status(400).json({
      message: `User not provided`,
    });
  }
  const found = roles.find((role) => role === userRole);

  if (!found) {
    return res.status(400).json({
      message: `${userRole ?? "User"} not allowed in this route.`,
    });
  }

  next();
};

const check_for_access_token = (req, res, next) => {
  const authHeader = req?.headers["authorization"] ?? null;

  if (!authHeader) {
    return res.status(400).json({ message: "Authorization Header not found" });
  }
  const token = authHeader.split(" ")[1];

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(400).json({ message: "Invalid token" });
  }

  req.user = payload;
  next();
};

const check_for_refresh_token = (req, res, next) => {
  const token = req?.body?.refresh_token ?? null;

  if (!token) {
    return res.status(400).json({
      message: "Refresh Token (refresh_token) not found in json/body",
    });
  }

  const payload = verifyToken(token, REFRESH_TOKEN_SECRET);
  if (!payload) {
    return res.status(400).json({ message: "Invalid token" });
  }

  req.user = payload;
  next();
};

const allowAdmin = (req, res, next) => {
  verify_roles(res, next, req.user.role, ["admin"]);
};

const allowOrg = (req, res, next) => {
  verify_roles(res, next, req.user.role, ["org"]);
};

const allowUser = (req, res, next) => {
  verify_roles(res, next, req.user.role, ["user"]);
};

const allowAdminOrg = (req, res, next) => {
  verify_roles(res, next, req.user.role, ["admin", "org"]);
};

const allowAll = (req, res, next) => {
  verify_roles(res, next, req.user.role, ["admin", "org", "user"]);
};

module.exports = {
  check_for_access_token,
  check_for_refresh_token,
  allowAdmin,
  allowOrg,
  allowUser,
  allowAdminOrg,
  allowAll,
};
