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
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from "mongoose-findorcreate"
import { Strategy as FacebookStrategy } from 'passport-facebook';


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

const userSchema = new mongoose.Schema({email:{type:String, required:false, index:{unique:false}}, password: String, googleId: {type:String, required:false, index:{unique:false}}, facebookId: {type:String, required:false, index:{unique:false}}, secret:String});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, { id: user.id, username: user.username });
  });
});
 
passport.deserializeUser((user, cb) => {
  process.nextTick(() => {
    return cb(null, user);
  });
});  
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  const googleUsername = profile.displayName || profile.emails[0].value;

  User.findOrCreate({ googleId: profile.id, username: googleUsername }, function (err, user) {
    return cb(err, user);
  });
}
));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/callback",

},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ facebookId: profile.id, username:profile.displayName }, function (err, user) {
    return cb(err, user);
  });
}
));




app.get("/", (req, res) => {
	res.render("home");
});

app.get("/login", (req, res) => {
	res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register")
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

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});


  



app.get('/auth/google',
passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
  res.redirect('/secrets');
});


app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
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
