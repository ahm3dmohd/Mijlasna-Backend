const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: Number,
      unique: true,
      trim: true,
      min: 19999999,
      max: 69999999
    },
    hashedPassword: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["customer", "owner", "admin"],
      default: "customer"
    }
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.hashedPassword;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
