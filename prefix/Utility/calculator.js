
const { Message, PermissionFlagBits } = require('discord.js');
const ExtendedClient = require('../../../class/ExtendedClient');
const {Calculator} = require('@m3rcena/weky');
module.exports = {
    structure: {
        name: 'calculator',
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
        await Calculator({
			message: message,
			embed: {
				title: 'Calculator',
				color: '#5865F2',
				footer: "♥️",
				timestamp: true,
			},
			disabledQuery: 'Calculator is disabled!',
			invalidQuery: 'The provided equation is invalid!',
			othersMessage: 'Only <@{{author}}> can use the buttons!',
		});
    }
};
