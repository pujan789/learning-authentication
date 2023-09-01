import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import {dirname} from "path";
import ejs from "ejs"; // Import EJS package
import {fileURLToPath} from "url";
import mongoose, {model} from "mongoose";
import md5 from "md5";
import bcrypt from "bcrypt";

const saltRounds = 10;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({email: String, password: String});

const User = new mongoose.model("User", userSchema);

// Define a GET route for the root path
app.get("/", (req, res) => {
	res.render("home");
});

app.get("/login", (req, res) => {
	res.render("login");
});

app.get("/register", (req, res) => {
	res.render("register");
});

app.post("/register", (req, res) => {
	const email = req.body.username;
	const password = req.body.password;

	bcrypt.hash(password, saltRounds, function (err, hash) {
		const user = new User({email: email, password: hash});
		user.save();
		res.render("secrets");
	});
});

app.post("/login", async (req, res) => {
	const username = req.body.username;
	const password = req.body.password;
	const foundUser = await User.findOne({email: username}).exec();

	if (foundUser) {
		bcrypt.compare(password, foundUser.password, function (err, result) {
			if (result == true) {
				res.render("secrets");
			} else {
				res.redirect("/")
			}
		});
	} else {
		res.redirect("/");
	}
});

// Start the server
app.listen(3000, () => {
	console.log("Server listening on port 3000");
});
