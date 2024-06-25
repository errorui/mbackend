const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user = require("./models/user");
const post = require("./models/post");
const multerconfig = require("./config/multerconfig");
require('dotenv').config()
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/register", async (req, res) => {
  let { username, name, age, password, email } = req.body;

  let acc = await user.findOne({ email });
  if (acc) return res.status(500).send("account already exists");

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return res.send("err");
    bcrypt.hash(password, salt, async (err, result) => {
      let data = await user.create({
        username,
        name,
        email,
        password: result,
        age,
      });
      console.log(data);
      let token = jwt.sign({ email: email, userid: data._id }, "secret");
      res.cookie("token", token);
      res.redirect("/profile");
       // for hearder based authorization
    // res.json({token})
    });
  });
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let acc = await user.findOne({ email });
  if (!acc) return res.send("no user");
  bcrypt.compare(password, acc.password, (err, result) => {
    if (!result) return res.send("wrong password");
    let token = jwt.sign({ email: email, userid: acc._id }, "secret");
    res.cookie("token", token);
    res.redirect("/profile");
    // for hearder based authorization
    // res.json({token})
  });
});
app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  let userdata = await user.findOne({ email: req.user.email });
  //   to show data in posts array from database

  await userdata.populate("posts");

  res.render("profile", { userdata });
});
app.post("/post", isLoggedIn, async (req, res) => {
  let userdata = await user.findOne({ email: req.user.email });
  let postdata = await post.create({
    user: userdata._id,
    content: req.body.content,
  });
  userdata.posts.push(postdata._id);
  await userdata.save();

  return res.redirect("/profile");
});
app.get("/like/:postid", isLoggedIn, async (req, res) => {
  let postdata = await post
    .findOne({ _id: req.params.postid })
    .populate("user");
  if (postdata.likes.indexOf(req.user.userid) === -1) {
    postdata.likes.push(req.user.userid);
  } else {
    postdata.likes.splice(postdata.likes.indexOf(req.user.userid, 1));
  }

  await postdata.save();

  res.redirect("/profile");
});
app.get("/edit/:postid", isLoggedIn, async (req, res) => {
  let postdata = await post.findOne({ _id: req.params.postid });

  res.render("edit", { postdata });
});
app.post("/edit/:postid", isLoggedIn, async (req, res) => {
  let { content } = req.body;
  let postdata = await post.findOneAndReplace(
    { _id: req.params.postid },
    { content }
  );

  res.redirect("/profile");
});
function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).redirect("/login");

  try {
    let data = jwt.verify(token, "secret");

    req.user = data;
   
    next();
  } catch (err) {
    return res.status(401).send("Invalid token");
  }
}
function isLoggedInUseheaders(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log(authHeader); // This should print the authorization header

  if (!authHeader) return res.status(401).redirect("/login");

  try {
    const token = authHeader.split(' ')[1]; // Split on space and get the token part
    const data = jwt.verify(token, "secret");

    req.user = data;

    next();
  } catch (err) {
    return res.status(401).send("Invalid token");
  }
}

app.get("/uploadimg", isLoggedIn, (req, res) => {
  res.render("profileimg");
});
app.post(
  "/upload",
  isLoggedIn,
  multerconfig.single("image"),

  async (req, res) => {
    let id = req.user.email;
    let userdata = await user.findOne({ email: id });
    userdata.userprofile = `images/uploads/${req.file.filename}`;
    await userdata.save();
    console.log(userdata);
    res.redirect("/profile");
  }
);
const port=process.env.PORT

app.listen(port, () => console.log("listening at 3000"));
