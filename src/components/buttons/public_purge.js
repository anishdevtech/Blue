const { ButtonInteraction } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');

module.exports = {
    customId: 'public_purge',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
      let {amount,user} = await client.temdb.get(`purge_${interaction.guild.id}`);
      
              await interaction.channel.bulkDelete(amount);
               var msg = await interaction.channel.send(`Successfully deleted ${amount} message(s) on the command of <@${user.id}>`);
                await setTimeout(async () => {
                      
                  await msg?.delete();
                },10000);
  

    }
};