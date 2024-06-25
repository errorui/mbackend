const mongoose = require("mongoose");
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
