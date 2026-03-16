require("dotenv").config(); // Load .env variables first

const express = require("express");
require("express-async-errors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const passport = require("passport");
const csrf = require("host-csrf");
const flash = require("connect-flash");
const helmet = require("helmet"); 
const xssClean = require("xss-clean"); 
const rateLimit = require("express-rate-limit"); 


const app = express();

app.use(helmet());
app.use(xssClean());

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
});
app.use(limiter);

// ===== BODY PARSER =====
app.use(express.urlencoded({ extended: true }));

// ===== COOKIE PARSER =====
app.use(cookieParser(process.env.SESSION_SECRET));

// ===== SESSION STORE =====
const store = new MongoDBStore({
  uri: process.env.MONGO_URL,
  collection: "mySessions",
});

store.on("error", (error) => console.log("MongoDB Session Store Error:", error));

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "lax" }, 
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1);
  sessionParms.cookie.secure = true; 
}

app.use(session(sessionParms));

// ===== FLASH =====
app.use(flash());

// ===== PASSPORT =====
const passportInit = require("./passport/passportInit");
passportInit();
app.use(passport.initialize());
app.use(passport.session());

// ===== CSRF MIDDLEWARE =====
// 
app.use(csrf.csrf({
  cookie: {
    signed: true
  }
}));

// ===== EXPOSE CSRF TOKEN TO TEMPLATES =====
app.use((req, res, next) => {
  res.locals.user = req.user;            // Passport sets req.user after login
  res.locals.info = req.flash("info");   // flash messages
  res.locals.errors = req.flash("error");
	res.locals.csrfToken = csrf.getToken(req, res); // matches your EJS input name
	next(); // Passes control to next middleware
});


// ===== CUSTOM MIDDLEWARE =====
app.use(require("./middleware/storeLocals"));

// ===== VIEW ENGINE =====
app.set("view engine", "ejs");

// ===== ROUTES =====
app.get("/", (req, res) => res.render("index"));
app.use("/sessions", require("./routes/sessionRoutes"));

// Secret Word Routes (protected)
const auth = require("./middleware/auth");
const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", auth, secretWordRouter);

// Protects and mounts jobs routes
app.use("/jobs", auth, require("./routes/jobs")); 

app.post("/sessions/logoff", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ===== ERROR HANDLING =====
app.use((req, res) => res.status(404).send(`Page ${req.url} not found`));

app.use((err, req, res, next) => {
  if (err.name === "CSRFError") {
    console.log("CSRF Error:", err.message);
    return res.status(403).send("CSRF token validation failed");
  }
  console.log(err);
  res.status(500).send(err.message);
});

// ===== START SERVER =====
const port = process.env.PORT || 3000;
const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URL);
    app.listen(port, () => console.log(`Server listening on port ${port}...`));
  } catch (err) {
    console.log(err);
  }
};

start();