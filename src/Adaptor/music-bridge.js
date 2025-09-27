// music-bridge.js (final, patched)
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const rateLimit = require("@fastify/rate-limit");
const { PermissionFlagsBits, ChannelType } = require("discord.js");

// Helper: read Bearer token
function getBearerToken(req) {
  const h = req.headers["authorization"];
  if (!h || typeof h !== "string") return null;
  const [type, val] = h.split(" ");
  if (type?.toLowerCase() !== "bearer" || !val) return null;
  return val.trim();
}

module.exports = function setupMusicBridge(client, opts = {}) {
  const {
    port = Number(process.env.MUSIC_BRIDGE_PORT || 4001),
    token = process.env.MUSIC_BRIDGE_TOKEN || "change-me",
    allowOrigins = [],
    globalRPS = 20,
    burst = 40,
  } = opts;

  const app = Fastify({ logger: true });

  // CORS allowlist
  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowOrigins.length > 0 && allowOrigins.includes(origin)) return cb(null, true);
      if (allowOrigins.length === 0) return cb(new Error("Not allowed"), false);
      return cb(new Error("Not allowed"), false);
    },
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Adapter-Token"],
    exposedHeaders: [],
  });

  // Global rate limiting
  app.register(rateLimit, {
    max: globalRPS,
    timeWindow: "1 second",
    ban: 0,
    keyGenerator: (req) => req.headers["x-forwarded-for"] || req.ip,
  });

  // Auth for REST (SSE does its own check)
  app.addHook("onRequest", async (req, rep) => {
    if (req.routerPath && req.routerPath.startsWith("/v1/stream")) return;
    const bearer = getBearerToken(req);
    const xhdr = req.headers["x-adapter-token"];
    if (!token || (bearer !== token && xhdr !== token)) {
      return rep.code(401).send({ ok: false, error: "Unauthorized" });
    }
  });

  function getPlayer(guildId) {
    return (
      client.lavalink?.getPlayer?.(guildId) ||
      client.lavalink?.players?.get?.(guildId) ||
      null
    );
  }

  async function ensurePlayer({ guildId, voiceChannelId, textChannelId, volume = 100 }) {
    const player =
      getPlayer(guildId) ||
      (await client.lavalink.createPlayer({
        guildId,
        voiceChannelId,
        textChannelId,
        selfDeaf: true,
        selfMute: false,
        volume,
        instaUpdateFiltersFix: true,
        applyVolumeAsFilter: false,
      }));
    if (!player.connected) await player.connect();
    return player;
  }

function trackToLite(t) {
  if (!t) return null;
  const info = t.info || {};
  const id = info.identifier ?? t.identifier ?? null;
  const src = info.sourceName ?? t.sourceName ?? null;
  const fromNode = t.artworkUrl ?? t.pluginInfo?.artworkUrl ?? info.artworkUrl ?? null;
const yt = src === "youtube" && id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null; // artworkUrl fallback

  const artwork = fromNode || yt;
  return {
    title: info.title ?? t.title ?? "Unknown",
    author: info.author ?? t.author ?? "Unknown",
    uri: info.uri ?? t.uri ?? null,
    artwork,
    artworkUrl: artwork,
    duration: Number(info.length ?? t.duration ?? 0),
    sourceName: src,
    identifier: id,
  };
}

  function snapshot(player) {
    const q = player?.queue;
    const cur = q?.current || null;
    return {
      guildId: player?.guildId ?? null,
      nowPlaying: trackToLite(cur),
      position: Number(player?.position ?? player?.lastPosition ?? 0),
      paused: Boolean(player?.paused ?? false),
      volume: Number(player?.volume ?? 100),
      filters: player?.filterManager?.data ?? {},
      queue: Array.isArray(q?.tracks) ? q.tracks.slice(0, 50).map(trackToLite) : [],
      queueSize: Number(q?.tracks?.length ?? 0),
      previousSize: Number(q?.previous?.length ?? 0),
      voiceChannelId: player?.voiceChannelId ?? null,
      connected: Boolean(player?.connected ?? false),
    };
  }

  async function doSearch({ query, source, requester }) {
    if (typeof client.lavalink.search === "function") {
      const res = await client.lavalink.search(source ? { query, source } : { query }, requester || null);
      return res;
    }
    const mockGuildId = "search-" + Date.now().toString(36);
    const player = await client.lavalink.createPlayer({ guildId: mockGuildId });
    const res = await player.search(source ? { query, source } : { query }, requester || null);
    try { client.lavalink.deletePlayer?.(mockGuildId); } catch {}
    return res;
  }

  // Single doPlay with NOT_CONNECTED guard
  async function doPlay({ guildId, query, trackId, requester, voiceChannelId, textChannelId, source }) {
    const existing = getPlayer(guildId);
    const mustHaveVc = !existing || !existing.connected;
    if (mustHaveVc && !voiceChannelId) {
      return { ok: false, code: "NOT_CONNECTED", error: "Join a voice channel first" };
    }
    const player = await ensurePlayer({ guildId, voiceChannelId, textChannelId });

    let tracks = [];
    if (trackId) {
      const res2 = await player.search({ query: trackId }, requester || null);
      tracks = res2?.tracks || [];
    } else {
      const res = await player.search(source ? { query, source } : { query }, requester || null);
      tracks = res?.tracks || [];
    }

    if (!tracks.length) return { ok: false, error: "No tracks found" };
    await player.queue.add(tracks[0]);
    if (!player.playing) await player.play();
    return { ok: true, state: snapshot(player) };
  }

  async function doControl({ guildId, action, args = {} }) {
    const player = getPlayer(guildId);
    if (!player) return { ok: false, error: "No player" };
    switch (action) {
      case "pause": await player.pause(true); break;
      case "resume": await player.pause(false); break;
      case "seek": await player.seek(Math.max(0, Number(args.positionMs ?? args.position ?? 0))); break;
      case "volume": await player.setVolume(Math.max(0, Math.min(1000, Number(args.volume ?? 100)))); break;
      case "skip":
        if (typeof player.skip === "function") await player.skip();
        else { await player.stop(); await player.play(); }
        break;
      case "stop":
        if (player.queue?.clear) player.queue.clear();
        await player.stop();
        break;
      case "disconnect": await player.disconnect(); break;
      case "destroy": await player.destroy(); client.lavalink.deletePlayer?.(guildId); break;
      default: return { ok: false, error: "Unknown action" };
    }
    return { ok: true, state: snapshot(player) };
  }

  async function doFilters({ guildId, filters }) {
    const player = getPlayer(guildId);
    if (!player) return { ok: false, error: "No player" };
    player.filterManager.data = { ...(player.filterManager.data || {}), ...(filters || {}) };
    if (!player.paused && typeof player.position === "number") await player.seek(player.position);
    return { ok: true, state: snapshot(player) };
  }

  async function doStatus({ guildId }) {
    const player = getPlayer(guildId);
    if (!player) return { ok: true, state: null };
    return { ok: true, state: snapshot(player) };
  }

  // Permission + VC checks for join
  async function checkJoin({ guildId, userId, voiceChannelId }) {
    const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId));
    if (!guild) return { ok: false, code: "GUILD_NOT_FOUND", message: "Guild not found" };

    let member = guild.members.cache.get(userId);
    if (!member) { try { member = await guild.members.fetch(userId); } catch {} }
    if (!member) return { ok: false, code: "USER_NOT_FOUND", message: "User not found" };

    const userVcId = voiceChannelId || member.voice?.channelId;
    if (!userVcId) return { ok: false, code: "USER_NOT_IN_VC", message: "Join a voice channel first" };

    const channel = guild.channels.cache.get(userVcId) || (await guild.channels.fetch(userVcId));
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      return { ok: false, code: "NOT_VOICE_CHANNEL", message: "Target is not a voice channel" };
    }

    const me = guild.members.me || (await guild.members.fetch(client.user.id));
    const perms = channel.permissionsFor(me);
    if (!perms?.has(PermissionFlagsBits.Connect)) {
      return { ok: false, code: "NO_CONNECT", message: "Bot lacks Connect permission" };
    }
    if (!perms?.has(PermissionFlagsBits.Speak)) {
      return { ok: false, code: "NO_SPEAK", message: "Bot lacks Speak permission" };
    }

    const player = getPlayer(guildId);
    if (player?.connected && player.voiceChannelId && player.voiceChannelId !== userVcId) {
      return {
        ok: false,
        code: "BUSY_OTHER_VC",
        message: "Bot is active in another voice channel",
        voiceChannelId: player.voiceChannelId,
      };
    }

    return { ok: true, guildId, voiceChannelId: userVcId };
  }

  // ---- REST ROUTES ----
  const playLimitConf = { config: { rateLimit: { max: 5, timeWindow: "10s" } } };
  const controlLimitConf = { config: { rateLimit: { max: 10, timeWindow: "5s" } } };
  const searchLimitConf = { config: { rateLimit: { max: 10, timeWindow: "5s" } } };

  // Detect voice + permissions for UX “Connect”
  app.get("/v1/detect-voice", async (req, rep) => {
    const userId = req.query?.userId;
    if (!userId) return rep.code(400).send({ ok: false, error: "userId required" });

    const out = { ok: true, options: [] };
    for (const [guildId, guild] of client.guilds.cache) {
      let member = guild.members.cache.get(userId);
      if (!member) { try { member = await guild.members.fetch(userId); } catch { continue; } }
      const chId = member?.voice?.channelId;
      if (!chId) continue;

      const channel = guild.channels.cache.get(chId) || (await guild.channels.fetch(chId));
      if (!channel || channel.type !== ChannelType.GuildVoice) continue;

      const me = guild.members.me || (await guild.members.fetch(client.user.id));
      const perms = channel.permissionsFor(me);
      const canConnect = !!perms?.has(PermissionFlagsBits.Connect);
      const canSpeak = !!perms?.has(PermissionFlagsBits.Speak);

      const player = getPlayer(guildId);
      if (player?.connected && player.voiceChannelId && player.voiceChannelId !== chId) {
        out.playingElsewhere = {
          guildId, channelId: player.voiceChannelId,
          guildName: guild.name, channelName: channel.name,
        };
      }

      const canJoin = canConnect && canSpeak;
      out.options.push({
        guildId,
        guildName: guild.name,
        channelId: chId,
        channelName: channel.name,
        canJoin,
        reason: canJoin ? undefined : !canConnect ? "Missing Connect" : !canSpeak ? "Missing Speak" : "Blocked",
      });

      if (canJoin && (!player || !player.connected)) out.auto = { guildId, channelId: chId };
    }

    if (!out.options.length) out.reason = "No voice states found";
    return rep.send(out);
  });

  // Join VC
  app.post("/v1/join", controlLimitConf, async (req, rep) => {
    const { guildId, userId, voiceChannelId, textChannelId, volume } = req.body || {};
    if (!guildId || !userId) return rep.code(400).send({ ok: false, error: "guildId and userId required" });

    const chk = await checkJoin({ guildId, userId, voiceChannelId });
    if (!chk.ok) {
      const status = chk.code === "BUSY_OTHER_VC" ? 409 : 403;
      return rep.code(status).send({ ok: false, ...chk });
    }
    const player = await ensurePlayer({
      guildId,
      voiceChannelId: chk.voiceChannelId,
      textChannelId,
      volume: Math.max(0, Math.min(1000, Number(volume ?? 100))),
    });
    return rep.send({ ok: true, state: snapshot(player) });
  });

  // Suggestions
  app.get("/v1/suggest", searchLimitConf, async (req, rep) => {
    const q = req.query?.q || "";
    if (!q) return rep.send([]);
    const res = await doSearch({ query: q, source: null, requester: null });
    const tracks = res?.tracks || [];
    const out = tracks.slice(0, 12).map((t) => ({
      title: t.info?.title || t.title || "Unknown",
      author: t.info?.author || t.author || "",
      value: t.info?.identifier || t.info?.uri || t.uri || "",
    }));
    return rep.send(out);
  });

  // Paged search
  app.get("/v1/search", searchLimitConf, async (req, rep) => {
    const q = req.query?.q || "";
    const page = Math.max(1, Number(req.query?.page || "1"));
    const limit = Math.min(25, Math.max(1, Number(req.query?.limit || "10")));
    if (!q) return rep.code(400).send({ ok: false, error: "q required" });
    const res = await doSearch({ query: q, source: null, requester: null });
    const tracks = res?.tracks || [];
    const start = (page - 1) * limit;
    const slice = tracks.slice(start, start + limit).map(trackToLite);
    return rep.send({ ok: true, loadType: res?.loadType || null, tracks: slice });
  });

  // Queue read
  app.get("/v1/queue", async (req, rep) => {
    const guildId = req.query?.guildId;
    if (!guildId) return rep.code(400).send({ ok: false, error: "guildId required" });
    const player = getPlayer(guildId);
    if (!player) return rep.send({ ok: true, state: null });
    return rep.send({ ok: true, state: snapshot(player) });
  });

  // Queue ops
  app.post("/v1/queue", controlLimitConf, async (req, rep) => {
    const { guildId, action, args = {} } = req.body || {};
    if (!guildId || !action) return rep.code(400).send({ ok: false, error: "guildId and action required" });
    const player = getPlayer(guildId);
    if (!player) return rep.code(404).send({ ok: false, error: "No player" });

    const q = player.queue;
    switch (action) {
      case "clear": if (q?.clear) q.clear(); else if (Array.isArray(q?.tracks)) q.tracks.length = 0; break;
      case "remove": {
        const index = Number(args.index ?? -1);
        if (!Number.isInteger(index) || index < 0) return rep.code(422).send({ ok: false, error: "Valid index required" });
        if (q?.remove) q.remove(index); else if (Array.isArray(q?.tracks) && q.tracks[index]) q.tracks.splice(index, 1);
        break;
      }
      case "move": {
        const from = Number(args.from ?? -1);
        const to = Number(args.to ?? -1);
        if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0) {
          return rep.code(422).send({ ok: false, error: "Valid from/to required" });
        }
        if (q?.move) q.move(from, to);
        else if (Array.isArray(q?.tracks) && q.tracks[from]) {
          const [t] = q.tracks.splice(from, 1);
          q.tracks.splice(to, 0, t);
        }
        break;
      }
      default: return rep.code(400).send({ ok: false, error: "Unknown action" });
    }
    return rep.send({ ok: true, state: snapshot(player) });
  });

  // Play by query or trackId (with 409 when not connected)
  app.post("/v1/play", playLimitConf, async (req, rep) => {
    const { guildId, query, trackId, requesterId, voiceChannelId, textChannelId, source } = req.body || {};
    if (!guildId || (!query && !trackId)) {
      return rep.code(400).send({ ok: false, error: "guildId and query|trackId required" });
    }
    const requester = requesterId ? (client.users?.cache?.get?.(requesterId) || requesterId) : null;
    const out = await doPlay({ guildId, query, trackId, requester, voiceChannelId, textChannelId, source });
    const sc = out.ok ? 200 : out.code === "NOT_CONNECTED" ? 409 : 404;
    return rep.code(sc).send(out);
  });

  // Controls
  app.post("/v1/control", controlLimitConf, async (req, rep) => {
    const { guildId, action, args } = req.body || {};
    if (!guildId || !action) return rep.code(400).send({ ok: false, error: "guildId and action required" });
    const out = await doControl({ guildId, action, args });
    return rep.code(out.ok ? 200 : 400).send(out);
  });

  // Filters
  app.post("/v1/filters", controlLimitConf, async (req, rep) => {
    const { guildId, filters } = req.body || {};
    if (!guildId || !filters) return rep.code(400).send({ ok: false, error: "guildId and filters required" });
    const out = await doFilters({ guildId, filters });
    return rep.code(out.ok ? 200 : 400).send(out);
  });

  // Status/health/nodes
  app.get("/v1/status", async (req, rep) => {
    const guildId = req.query?.guildId;
    if (!guildId) return rep.code(400).send({ ok: false, error: "guildId required" });
    const out = await doStatus({ guildId });
    return rep.code(200).send(out);
  });

  app.get("/v1/health", async (_req, rep) => {
    const ready = Boolean(client?.ws?.status === 0 || client?.isReady?.());
    const ping = Number(client?.ws?.ping ?? 0);
    const uptime = process.uptime();
    return rep.send({ ok: true, bot: { ready, ping }, adapter: { uptime } });
  });

  app.get("/v1/lavalink", async (_req, rep) => {
    const nm = client.lavalink?.nodeManager;
    const list = [];
    if (nm?.nodes) {
      const iter = typeof nm.nodes.values === "function" ? nm.nodes.values() : nm.nodes;
      for (const node of iter) {
        list.push({
          id: node.id ?? node.options?.id ?? "node",
          connected: Boolean(node.connected ?? node.state === "connected"),
          players: Number(node.stats?.players ?? 0),
          playingPlayers: Number(node.stats?.playingPlayers ?? 0),
          cpuLoad: Number(node.stats?.cpu?.lavalinkLoad ?? 0),
          memUsed: Number(node.stats?.memory?.used ?? 0),
          uptime: Number(node.stats?.uptime ?? 0),
        });
      }
    }
    const connected = list.some((n) => n.connected);
    return rep.send({ ok: true, lavalink: { connected, nodes: list } });
  });

  // ---- SSE with reply.hijack ----
  const subs = new Map(); // guildId => Set<res>
  let sseId = 0;

  function writeSSE(res, { event, data, id, retry }) {
    try {
      if (retry) res.write(`retry: ${retry}\n`);
      if (id != null) res.write(`id: ${id}\n`);
      if (event) res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {}
  }

  function pushSSE(guildId, event, payload) {
    const set = subs.get(guildId);
    if (!set) return;
    const id = ++sseId;
    for (const r of set) writeSSE(r, { event, data: payload, id });
  }

  function broadcastAll(event, payload) {
    for (const [gid] of subs) pushSSE(gid, event, payload);
  }

  app.get("/v1/stream", async (req, rep) => {
    const bearer = getBearerToken(req);
    const xhdr = req.headers["x-adapter-token"];
    if (!token || (bearer !== token && xhdr !== token)) {
      rep.code(401);
      rep.hijack();
      try { rep.raw.end(); } catch {}
      return;
    }

    const guildId = req.query?.guildId;
    if (!guildId) {
      rep.code(400);
      rep.hijack();
      try { rep.raw.end(); } catch {}
      return;
    }

    // Take over lifecycle before writing any headers
    rep.hijack();
    try {
      rep.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      });
    } catch {
      try { rep.raw.end(); } catch {}
      return;
    }

    writeSSE(rep.raw, { event: null, data: { ok: true, connected: true }, id: ++sseId, retry: 5000 });

    if (!subs.has(guildId)) subs.set(guildId, new Set());
    const set = subs.get(guildId);
    set.add(rep.raw);

    const hb = setInterval(() => {
      try { rep.raw.write(`: ping ${Date.now()}\n\n`); } catch {}
    }, 15000);

    const onClose = () => {
      clearInterval(hb);
      const set2 = subs.get(guildId);
      if (set2) {
        set2.delete(rep.raw);
        if (set2.size === 0) subs.delete(guildId);
      }
      try { rep.raw.end(); } catch {}
    };

    req.raw.on("close", onClose);
    req.raw.on("error", onClose);
  });

  if (client.lavalink) {
    client.lavalink.on("trackStart", (player, track) => pushSSE(player.guildId, "nowPlaying", trackToLite(track)));
    client.lavalink.on("playerUpdate", (_old, next) => {
      pushSSE(next.guildId, "playerUpdate", {
        position: Number(next.position ?? next.lastPosition ?? 0),
        paused: Boolean(next.paused ?? false),
        volume: Number(next.volume ?? 100),
      });
    });
    client.lavalink.on("queueEnd", (player) => pushSSE(player.guildId, "queueUpdated", { empty: true }));
    client.lavalink.on("trackEnd", (player) => pushSSE(player.guildId, "queueUpdated", { changed: true }));
    client.lavalink.on("trackError", (player, track, payload) => {
      pushSSE(player.guildId, "trackError", { track: trackToLite(track), error: payload?.exception?.message ?? "error" });
    });
    client.lavalink.on("trackStuck", (player, track, payload) => {
      pushSSE(player.guildId, "trackStuck", { track: trackToLite(track), thresholdMs: payload?.thresholdMs ?? null });
    });

    const nm = client.lavalink.nodeManager;
    nm?.on?.("connect", (node) => {
      try { node.updateSession(true, 300_000); } catch {}
      broadcastAll("nodeStatus", { id: node.id, state: "connected" });
    });
    nm?.on?.("disconnect", (node, reason) => {
      broadcastAll("nodeStatus", { id: node.id, state: "disconnected", reason: reason?.code ?? null });
    });
    nm?.on?.("reconnecting", (node) => broadcastAll("nodeStatus", { id: node.id, state: "reconnecting" }));
    nm?.on?.("error", (node, error) => broadcastAll("nodeStatus", { id: node.id, state: "error", message: String(error?.message || error) }));
    nm?.on?.("resumed", (node, _payload, players) => {
      for (const p of players) pushSSE(p.guildId, "resumed", { guildId: p.guildId, nodeId: node.id });
      broadcastAll("nodeStatus", { id: node.id, state: "resumed", players: players?.length ?? 0 });
    });
  }

  app.listen({ port, host: "0.0.0.0" })
    .then(() => app.log.info(`Music bridge listening on :${port}`))
    .catch((e) => { app.log.error(e); process.exit(1); });

  return app;
};
