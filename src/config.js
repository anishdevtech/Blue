module.exports = {
    bot:{
      version:"2.0.1",
      c:"#5100ef",
      f:{
        text:"© Milanio-2024"
      }
    },
    client: {
        token: "Your Bot token (USE .env FOR SAFETY)",
        id: "Your Bot ID (USE .env FOR SAFETY)",
    },
    handler: {
        prefix: "?",
        deploy: true,
        commands: {
            prefix: true,
            slash: true,
            user: true,
            message: true,
        },
        mongodb: {
            enabled:true,
            uri: "mongodb+srv://Milanio-C-1:milanio-c-1@cluster0.fjvibpn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
        },
    },
    users: {
        developers: ["707066042563821569"],
    },
    development: { 
        enabled: true,
        guild: "707070867087294537",
    }, 
    messageSettings: {
        nsfwMessage: "The current channel is not a NSFW channel.",
        developerMessage: "You are not authorized to use this command.",
        cooldownMessage: "Slow down buddy! You're too fast to use this command ({cooldown}s).",
        globalCooldownMessage: "Slow down buddy! This command is on a global cooldown ({cooldown}s).",
        notHasPermissionMessage: "You do not have the permission to use this command.",
        notHasPermissionComponent: "You do not have the permission to use this component.",
        missingDevIDsMessage: "This is a developer only command, but unable to execute due to missing user IDs in configuration file."
    }
};
