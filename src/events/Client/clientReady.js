const { log } = require("../../functions");
const ExtendedClient = require('../../class/ExtendedClient');

module.exports = {
    event: 'clientReady',
    once: true,
    /**
     * 
     * @param {ExtendedClient} _ 
     * @param {import('discord.js').Client<true>} client 
     * @returns 
     */
    run: (_, client) => {

        log('Logged in as: ' + client.user.tag, 'done');

    }
};