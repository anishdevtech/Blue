const { Schema, model } = require("mongoose");

const melodyBoardSchema = new Schema({
  guildId:   { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  panelMessageId:{ type:String, required:false}
});

module.exports = model("MelodyBoard", melodyBoardSchema, "melodyboards");
