const express = require("express");
const session = require("express-session");
const cors = require("cors");
const csurf = require("csurf");
const morgan = require("morgan");

const TWO_HOUR = 1000 * 60 * 60 * 2;
const HTTPS_ONLY = false;

const users = [
  {
    id: 1,
    name: "minh",
    email: "minh@gmail.com",
    password: "minh",
  },
  {
    id: 2,
    name: "chi",
    email: "chi@gmail.com",
    password: "chi",
  },
  {
    id: 3,
    name: "trinh",
    email: "trinh@gmail.com",
    password: "trinh",
  },
];

const {
  PORT = 3000,
  NODE_ENV = "development",
  SEES_NAME = "sid", // session name = Set ID
  SESS_LIFETIME = TWO_HOUR,
  SESS_SECRET = "secret",
} = process.env;

const { CSRF_KEY = "_csrf", CSRF_LIFETIME = TWO_HOUR } = process.env;

const IN_PROD = NODE_ENV === "production";

const app = express();
app.use(morgan("tiny"));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "HEAD", "OPTIONS"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: SEES_NAME,
    resave: false,
    secret: SESS_SECRET,
    saveUninitialized: false,
    cookie: {
      httpOnly: HTTPS_ONLY,
      maxAge: SESS_LIFETIME,
      secure: IN_PROD,
    },
  })
);
// app.use(csurf({ cookie: false }));

function redirectLogin(req, res, next) {
  const { userId } = req.session;
  if (userId) {
    next();
  } else {
    res.redirect("/login");
  }
}

function redirectHome(req, res, next) {
  const { userId } = req.session;
  if (userId) {
    res.redirect("/home");
  } else {
    next();
  }
}

app.get("/", (req, res) => {
  const { userId } = req.session;
  res.send(`
    <h1>Welcome!</h1>
    ${
      !userId
        ? `
        <a href="/login">- Login -</a>
        <a href="/register">- Register -</a>
      `
        : `
        <a href="/home">- Home -</a>
        <form method="post" action="/logout">
          <button>Logout</button>
        </form>
      `
    }
  `);
});

app.get("/home", redirectLogin, (req, res) => {
  const user = users.find((user) => user.id === req.session.userId);
  res.send(`
    <h1>Home</h1>
    <a href="/">Main</a>
    <ul>
      <li>Name: ${user.name}</li>
      <li>Email: ${user.email}</li>
    </ul>
  `);
});

app.get("/login", redirectHome, (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="post" action="/login">
      <input type="email" name="email" placeholder="Email" require />
      <input type="password" name="password" placeholder="Password" require />
      <button>Submit</button>
    <form>
    <a href="/register">Register</a>
  `);
});

app.get("/register", redirectHome, (req, res) => {
  res.send(`
    <form method="post" action="/register">
      <input type="text" name="name" placeholder="Name" require />
      <input type="email" name="email" placeholder="Email" require />
      <input type="password" name="password" placeholder="Password" require />
      <button>Submit</button>
    <form>
  `);
});

app.post("/login", redirectHome, (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    const user = users.find(
      (user) => user.email === email && user.password === password
    );
    if (user) {
      req.session.userId = user.id;
      return res.redirect("/home");
    }
    res.status(204).json({ message: "Password or email not found" });
  }
  res.status(204).json({ message: "Invalid" });
});

app.post("/register", redirectHome, (req, res) => {
  const { name, email, password } = req.body;
  if (name && email && password) {
    const user = { id: users.length + 1, name, email, password };
    users.push(user);
    req.session.userId = user.id;
    res.redirect("/home");
  }
  res.json(req.session);
});

app.post("/logout", (req, res) => {
  delete req.session.userId;
  res.redirect("/");
});

app.use((err, req, res, next) => {
  if (err.code !== "EBADCSRFTOKEN") {
    return next(err);
  }
  res.status(403);
  res.send("session has expired or form tampered with");
});

app.listen(PORT, () => {
  console.log("listening on port " + PORT);
});
