const express = require("express");
require("express-async-errors");

const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

require("dotenv").config(); //load  .env variables before using them

 // npm package (middleware for Express that lets you store per-user session data on the server)
const session = require("express-session");
// npm package to store Express session data in MongoDB
// bridge between express-session and MongoDB
const MongoDBStore = require("connect-mongodb-session")(session);

const url = process.env.MONGO_URL;
// MongoDB Session Store (creating a new collection in MongoDB)
const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: url,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

// Session Configuration used with Express sessions (express-session)
const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

// make the session cookies production-safe 
if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));

// Create the flash middleware
app.use(require("connect-flash")()); // The second parentheses immediately call that function

// Tell Passport to authenticate users and retrieve them from the database
const passport = require("passport");
const passportInit = require("./passport/passportInit");
passportInit();

// Sets up Passport to work with Express and sessions
app.use(passport.initialize());
// Express middleware that runs on ALL REQUESTS, checks the session cookie for a user id, and if it finds one, deserializes and attaches it to the req.user property
app.use(passport.session());

app.use(require("./middleware/storeLocals"));
// Render the index.ejs templ
app.get("/", (req, res) => {
  res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));

// secret word handling
const secretWordRouter = require("./routes/secretWord");
// the authentication middleware runs before the secretWordRouter, and it redirects if any requests are made for those routes before logon
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URL);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();