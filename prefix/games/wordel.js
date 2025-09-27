const { Wordle } = require('discord-gamecord');

const { Message, PermissionFlagBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const database = require("../../../schemas/Wordel.js")
module.exports = {
    structure: {
        name: 'wordel',
        description: '',
        aliases: [],
        permissions: null
    },
    /**
     * @param {ExtendedClient} client 
     * @param {Message} message 
     * @param {[String]} args 
     */
    run: async (client, message, args) => {
        
const Game = new Wordle({
  message: message,
  isSlashGame: false,
  embed: {
    title: 'Wordle',
    color: '#5865F2',
  },
  customWord: null,
  timeoutTime: 60000,
  winMessage: 'You won! The word was **{word}**.',
  loseMessage: 'You lost! The word was **{word}**.',
  playerOnlyMessage: 'Only {player} can use these buttons.'
});

Game.startGame();
Game.on('gameOver', result => {
  /*
let data; 
data = database.findOne({
    guild:message.guild.id,
    user:message.author.id
  });
  if(!data){
   data = new database({
      guild:message.guild.id,
      user:message.author.id,
      data:{
        TotalGames:"0"
      }
    });
  }
  data.data.TotalGames = String(Number(data.data.TotalGames)+1)
  if(result.result === "win"){
  data.data.TotalWins = String(Number(data.data.TotalWins)+1)
  }
  */
});
}}