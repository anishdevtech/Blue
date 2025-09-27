/** @format */

const { model, Schema } = require("mongoose");

module.exports = model(
	"Wordel",
	new Schema({
		guild: {
			type: String,

			required: true,
		},
		User: {
			type: String,

			required: true,
		},
		data: {
			TotalWins:{
			  type:String,
			},
			TotalGames:{
			  type:String
			},
			GlobalRank:{
			  type:String
			},
			GuildRank:{
			  type:String
			}
		},
	})
);

/*

{
  result: 'win',                                                  player: User {                                                    id: '707066042563821569',                                     bot: false,                                                   system: false,                                                flags: UserFlagsBitField { bitfield: 4194368 },               username: 'anish_sharma',
    globalName: 'Anish Sharma',                                discriminator: '0',
      avatar: 'a7cd5c64e81b49aa7bb5687ce19ea3cb',            banner: undefined,
    accentColor: undefined,                                         avatarDecoration: null                                        },                                                   word: 'slime',
  guessed: [ 'games', 'lakes', 'miles', 'smile', 'slime' ]      }

*/
