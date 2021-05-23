const passport = require("passport");
const googleOAuth = require("passport-google-oauth20");
const cookieSession = require("cookie-session");
const { CLIENT_ID, CLIENT_SECRET, SESSION_KEY } = process.env;

const UserModel = require("../db/models/user");

const init = (use) => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    const user = await UserModel.findById(id);
    if (user) {
      done(null, user.id);
    }
  });

  passport.use(
    new googleOAuth(
      {
        callbackURL: "/auth/process",
        clientID: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      },
      async (accessToken, refreshToken, profile, done) => {
        const { name, email, picture, email_verified } = profile._json;

        if (!email_verified) {
          // Do Something
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
          // User Not Found adding new user
          const newUser = new UserModel({
            name,
            email,
            avatar: picture,
          });
          await newUser.save();
          done(null, newUser);
        } else {
          done(null, user);
        }
      }
    )
  );

  // Express MiddleWares
  use(
    cookieSession({
      maxAge: 24 * 60 * 60 * 1000,
      keys: [SESSION_KEY],
    })
  );

  use(passport.initialize());
  use(passport.session());
};

module.exports = init;
