const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection
} = require("discord.js");
const chalk = require("chalk");
const setupMusicBridge = require(".././Adaptor/music-bridge.js")
const { LavalinkManager } = require("lavalink-client");
const config = require("../config");
const webSocket = require("ws");
const commands = require("../handlers/commands");
const lavalink = require("../handlers/lavalink.js");
const events = require("../handlers/events");
const deploy = require("../handlers/deploy");
const mongoose = require("../handlers/mongoose");
const components = require("../handlers/components");
const Functions = require("../handlers/Functions.js");
const { disableAllButtons } = require("../Functions/Utility.js");
const preview = require("../handlers/preview.js");

module.exports = class extends Client {
    config = config.bot;
    emoji = require("../emoji.js");
    emojiid = require("../emojiId.js");
    // websocket = new webSocket('ws://128.254.225.82:2640'); //
    temdb = new Collection();
    buttonDisable = disableAllButtons;
    collection = {
        interactioncommands: new Collection(),
        prefixcommands: new Collection(),
        prefixCat: new Collection(),
        slashCat: new Collection(),
        aliases: new Collection(),
        components: {
            buttons: new Collection(),
            selects: new Collection(),
            modals: new Collection(),
            autocomplete: new Collection()
        }
    };
    applicationcommandsArray = [];

    constructor() {
        super({
            intents: Object.keys(GatewayIntentBits),
            partials: Object.keys(Partials),
            presence: {
                activities: [
                    {
                        name: "something goes here",
                        type: 4,
                        state: "This is for u"
                    }
                ]
            }
        });

        // Initialize Lavalink Manager
        this.lavalink = new LavalinkManager({
            nodes: [
                {
                    authorization: "Bluebutterfly",
                    host: "localhost",
                    port: 8080,
                    secure: false,
                    id: "India(Mumbai)"
                }
          /*      {
                    authorization: "Bluebutterfly",
                    host: "sg.heavencloud.in",
                    port: 2399,
                    secure: false,
                    id: "singapore-1"
                }*//*,

                {
                    authorization: "alfari",
                    host: "pool-us.alfari.id",
                    port: 443,
                    secure: true,
                    id: "US-1"
                },
                {
                    authorization: "https://dsc.gg/ajidevserver",
                    host: "lavalinkv4.serenetia.com",
                    port: 443,
                    secure: true,
                    id: "serenetia"
                },
                {
                    authorization: "PASSWORDIDK",
                    host: "sg.heavencloud.in",
                    port: 2399,
                    secure: false,
                    id: "Singapore-1"
                }
           */ ],
            sendToShard: (guildId, payload) =>
                this.guilds.cache.get(guildId)?.shard?.send(payload),
            client: {
                id: process.env.CLIENT_ID || config.client.id,
                username: process.env.CLIENT_USERNAME || "YourBotUsername"
                // avatar: process.env.CLIENT_AVATAR // optional
            },
            autoSkip: true,
            requestTimeoutMS: 30000,
            playerOptions: {
                clientBasedPositionUpdateInterval: 150,
                defaultSearchPlatform: "ytmsearch", // Or "ytsearch" if you prefer
                volumeDecrementer: 0.75,
                initialVolume: 70,
                selfDeaf: true,
                onDisconnect: {
                    autoReconnect: true,
                    destroyPlayer: false,
                    retryAmount: 5,
                    retryDelay: 5*60*1000
                },
                onEmptyQueue: {
                    destroyAfterMs: 60000,
                    notifyOnEmpty: true
                },
                onEnd: {
                    leaveOnEnd: false
                },
                highWaterMark: 1 << 25
            },
            queueOptions: {
                maxPreviousTracks: 50,
                maxQueueSize: 250,
                preventDuplicates: true
            },
            reconnectTries: 10,
            userAgent: "MelodyBoardBot/1.0 (+https://your.bot.site)"
        });

        /*  this.lavalink = new LavalinkManager({
            nodes: [
                {
                    authorization: "https://dsc.gg/ajidevserver",
                    host: "lava-v4.ajieblogs.eu.org",
                    port: 443,
                    secure: true,
                    id: "ajieblogs"
                },
                {
                    authorization: "https://dsc.gg/ajidevserver",
                    host: "lavalinkv4.serenetia.com",
                    port: 443,
                    secure: true,
                    id: "serenetia"
                }
            ],
            sendToShard: (guildId, payload) =>
                this.guilds.cache.get(guildId)?.shard?.send(payload),
            client: {
                id: process.env.CLIENT_ID || config.client.id,
                username: "YourBotUsername"
            },
            autoSkip: true,
            playerOptions: {
                clientBasedPositionUpdateInterval: 150,
                defaultSearchPlatform: "ytmsearch",
                volumeDecrementer: 0.75,
                onDisconnect: {
                    autoReconnect: true,
                    destroyPlayer: false
                },
                onEmptyQueue: {
                    destroyAfterMs: 30000
                }
            },
            queueOptions: {
                maxPreviousTracks: 25
            }
        });*/

        this.on("raw", d => this.lavalink.sendRawData(d));

        this.on("clientReady", async () => {
            await this.lavalink.init(this.user);
            setupMusicBridge(this, { port: 2003, token: process.env.MUSIC_BRIDGE_TOKEN, allowOrigins: [] });
});
            

    }

    start = async () => {
        preview(this);
        lavalink(this);

        commands(this);
        events(this);
        components(this);
        Functions(this);

        if (config.handler.mongodb.enabled) mongoose();

        await this.login(process.env.CLIENT_TOKEN || config.client.token);

        if (config.handler.deploy) deploy(this, config);
    };
};
