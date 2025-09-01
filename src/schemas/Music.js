const mongoose = require("mongoose");

const FavouriteTrackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  platform: { type: String, default: "youtube" },
  addedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  favourites: [FavouriteTrackSchema]
});

module.exports = mongoose.model("User", UserSchema);