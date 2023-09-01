import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import {dirname} from "path";
import ejs from "ejs";
import {fileURLToPath} from "url";
import mongoose, {model} from "mongoose";

import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import LocalStrategy from "passport-local"

const saltRounds = 10;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
	secret: "Our little secret",
	resave: false,
	saveUninitialized: true,
	cookie: {}
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({email: String, password: String});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
	res.render("home");
});

app.get("/login", (req, res) => {
	res.render("login");
});

app.get("/register", (req, res) => {
	res.render("register");
});

app.get("/secrets", (req, res) => {
	if (req.isAuthenticated()) {
		res.render("secrets");
	} else {
		res.redirect("/login");
	}
});

app.get("/logout", (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post("/register", (req, res) => {
	console.log(req.body.username);
	User.register({
		username: req.body.username
	}, req.body.password, function (err, user) {
		if (err) {
			console.log(err);
			res.redirect("/register");
		} else {
			passport.authenticate("local")(req, res, function () {
				res.redirect("/secrets");
			});
		}
	});
});

app.post("/login", async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
  const user = new User({
    username: username, password: password
  });

  req.login(user, function(err){
    if (err){
      console.log(err)
    }
    else{
      res.redirect("/secrets");
      passport.authenticate("local")
    }
  })
});


// Start the server
app.listen(3000, () => {
	console.log("Server listening on port 3000");
});
