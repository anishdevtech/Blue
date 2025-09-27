
  
  const { ButtonInteraction } = require('discord.js');
const ExtendedClient = require('../../class/ExtendedClient');

module.exports = {
    customId: 'user_specific_purge',
    /**
     * 
     * @param {ExtendedClient} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
     let db = client.temdb.get(`purge_${interaction.guild.id}`)
      
        // Create a interaction  collector for the buttons
       
        // Create a interaction  collector for the buttons
      
         await interaction.reply('Please mention the user whose messages you want to delete.');

                const filter = (response) => {
                    return response.mentions.users.size > 0;
                };

                const userCollector = interaction.channel.createMessageCollector({ filter, time: 15000 });

                userCollector.on('collect', async (userMessage) => {
                    const targetUser = userMessage.mentions.users.first();
                if (interaction.member.permissions.has("ManageMessages")||db.user.id === targetUser.id ) {   
                    const userMessages = await interaction.channel.messages.fetch({ limit: db.amount })
                        .then(messages => messages.filter(msg => msg.author.id === targetUser.id));
                    
                    await interaction.channel.bulkDelete(userMessages);
                    await interaction.editReply(`Successfully deleted ${db.amount} messages from ${targetUser.tag}.`);
                    userCollector.stop();
                             }else {
    // Send embed indicating lack of permission
                const embed = new EmbedBuilder()
                   .setDescription("You don't have Manage Messages permission.");
                  interaction.channel.send(embed);
                             }
                             userCollector.stop();
                });

                userCollector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        interaction.followUp('Time limit exceeded. Operation canceled.');
                    }
                });
            }
    }