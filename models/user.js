const mongoose = require("mongoose");
require('dotenv').config()
mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("connected to  mongodb server");
});
const userschema = mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  userprofile: {
    type: String,
    default: "images/uploads/default.png",
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
});
const usermodel = mongoose.model("user", userschema);
module.exports = usermodel;
