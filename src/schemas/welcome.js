/** @format */

const { model, Schema } = require("mongoose");

module.exports = model(
	"Welcome",
	new Schema({
		guild: {
			type: String,
			
			required: true,
		},
		data: {
			type: Object,
		},
	})
);
