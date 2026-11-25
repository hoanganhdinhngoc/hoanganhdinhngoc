import { DurableObject } from "cloudflare:workers";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ROOM_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RESERVED_CLOSE_CODES = new Set([1004, 1005, 1006, 1015]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}

function clampElo(v, fallback = 600) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(100, Math.min(3500, n));
}

function cleanName(raw, fallback) {
  const s = String(raw == null ? "" : raw).trim().slice(0, 24);
  return s || fallback;
}

function randomToken(len = 24) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

function randomRoomId(len = 6) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ROOM_CHARS[bytes[i] % ROOM_CHARS.length];
  }
  return out;
}

function parseTimeControl(tc) {
  const raw = String(tc || "none").trim();
  if (!raw || raw === "none" || !raw.includes("+")) {
    return { enabled: false, baseMs: 0, w: 0, b: 0, inc: 0, lastTs: 0 };
  }
  const [minStr, incStr] = raw.split("+");
  const min = Math.max(1, Math.min(180, parseInt(minStr, 10) || 10));
  const incSec = Math.max(0, Math.min(120, parseInt(incStr, 10) || 0));
  const baseMs = min * 60000;
  return {
    enabled: true,
    baseMs,
    w: baseMs,
    b: baseMs,
    inc: incSec * 1000,
    lastTs: 0,
  };
}

function publicState(st) {
  if (!st) return null;
  return {
    roomId: st.roomId,
    status: st.status,
    gameSeq: st.gameSeq,
    timeControl: st.timeControl,
    startFen: st.startFen,
    players: {
      w: st.players.w ? { name: st.players.w.name, elo: st.players.w.elo, connected: !!st.players.w.connected } : null,
      b: st.players.b ? { name: st.players.b.name, elo: st.players.b.elo, connected: !!st.players.b.connected } : null,
    },
    moves: st.moves || [],
    fen: st.fen,
    turn: st.turn,
    clock: st.clock,
    result: st.result,
    termination: st.termination,
    rematch: st.rematch || { requestedBy: null },
    createdAt: st.createdAt,
    updatedAt: st.updatedAt,
  };
}

export class ChessRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(
        "CREATE TABLE IF NOT EXISTS room_state (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)"
      );
    });
  }

  loadState() {
    const rows = this.ctx.storage.sql.exec("SELECT data FROM room_state WHERE id = 1").toArray();
    if (!rows.length) return null;
    try {
      return JSON.parse(rows[0].data);
    } catch {
      return null;
    }
  }

  saveState(st) {
    st.updatedAt = new Date().toISOString();
    this.ctx.storage.sql.exec(
      "INSERT OR REPLACE INTO room_state (id, data) VALUES (1, ?)",
      JSON.stringify(st)
    );
  }

  async scheduleCleanup() {
    await this.ctx.storage.setAlarm(Date.now() + 6 * 3600 * 1000);
  }

  async alarm() {
    if (this.ctx.getWebSockets().length === 0) {
      this.ctx.storage.sql.exec("DELETE FROM room_state WHERE id = 1");
    } else {
      await this.scheduleCleanup();
    }
  }

  sendTo(ws, msg) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* ignore broken socket */
    }
  }

  broadcast(msg, excludeWs = null) {
    const payload = JSON.stringify(msg);
    for (const sock of this.ctx.getWebSockets()) {
      if (excludeWs && sock === excludeWs) continue;
      try {
        sock.send(payload);
      } catch {
        /* ignore */
      }
    }
  }

  executeRematchSwap(st) {
    const oldW = st.players.w;
    const oldB = st.players.b;
    st.players.w = oldB;
    st.players.b = oldW;
    st.hostColor = st.hostColor === "w" ? "b" : "w";
    st.gameSeq += 1;
    st.moves = [];
    st.fen = st.startFen || START_FEN;
    st.turn = "w";
    st.clock = parseTimeControl(st.timeControl);
    st.status = "playing";
    st.result = null;
    st.termination = null;
    st.rematch = { requestedBy: null };

    for (const sock of this.ctx.getWebSockets()) {
      const att = sock.deserializeAttachment();
      if (!att) continue;
      att.color = att.color === "w" ? "b" : "w";
      sock.serializeAttachment(att);
    }

    this.saveState(st);

    const pub = publicState(st);
    for (const sock of this.ctx.getWebSockets()) {
      const att = sock.deserializeAttachment();
      if (!att) continue;
      this.sendTo(sock, {
        type: "rematch_start",
        yourColor: att.color,
        state: pub,
      });
    }
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/init") {
      const body = await request.json();
      const hostColor = body.hostColor === "b" ? "b" : "w";
      const oppColor = hostColor === "w" ? "b" : "w";
      const tc = String(body.timeControl || "none");
      const now = new Date().toISOString();

      const st = {
        roomId: String(body.roomId || ""),
        status: "waiting",
        gameSeq: 1,
        timeControl: tc,
        startFen: START_FEN,
        hostToken: String(body.hostToken || randomToken()),
        guestToken: null,
        hostColor,
        players: {
          w: null,
          b: null,
        },
        moves: [],
        fen: START_FEN,
        turn: "w",
        clock: parseTimeControl(tc),
        result: null,
        termination: null,
        rematch: { requestedBy: null },
        createdAt: now,
        updatedAt: now,
      };
      st.players[hostColor] = {
        name: cleanName(body.name, "Player 1"),
        elo: clampElo(body.elo, 600),
        connected: false,
      };
      st.players[oppColor] = null;

      this.saveState(st);
      await this.scheduleCleanup();
      return jsonResponse({ ok: true, roomId: st.roomId, hostColor, timeControl: tc });
    }

    if (request.method === "GET" && url.pathname === "/status") {
      const st = this.loadState();
      if (!st) {
        return jsonResponse({ ok: false, error: "room_not_found" }, 404);
      }
      return jsonResponse({
        ok: true,
        roomId: st.roomId,
        status: st.status,
        full: !!(st.hostToken && st.guestToken),
      });
    }

    if (url.pathname === "/ws") {
      if ((request.headers.get("Upgrade") || "").toLowerCase() !== "websocket") {
        return jsonResponse({ ok: false, error: "upgrade_required" }, 426);
      }
      const st = this.loadState();
      if (!st) {
        return jsonResponse({ ok: false, error: "room_not_found" }, 404);
      }

      const tokenParam = url.searchParams.get("token") || "";
      const roleParam = url.searchParams.get("role") || "guest";
      const nameParam = url.searchParams.get("name");
      const eloParam = url.searchParams.get("elo");

      let seatColor = null;
      let seatToken = null;
      let seatRole = roleParam;
      let justStarted = false;

      if (tokenParam && tokenParam === st.hostToken) {
        seatColor = st.hostColor;
        seatToken = st.hostToken;
        seatRole = "host";
      } else if (tokenParam && st.guestToken && tokenParam === st.guestToken) {
        seatColor = st.hostColor === "w" ? "b" : "w";
        seatToken = st.guestToken;
        seatRole = "guest";
      } else if (!st.guestToken && st.status === "waiting") {
        seatColor = st.hostColor === "w" ? "b" : "w";
        seatToken = randomToken();
        st.guestToken = seatToken;
        seatRole = "guest";
        st.players[seatColor] = {
          name: cleanName(nameParam, "Player 2"),
          elo: clampElo(eloParam, 600),
          connected: true,
        };
        st.status = "playing";
        if (st.clock.enabled) st.clock.lastTs = Date.now();
        justStarted = true;
      } else {
        return jsonResponse({ ok: false, error: "room_full" }, 409);
      }

      if (!justStarted && st.players[seatColor]) {
        st.players[seatColor].connected = true;
        if (nameParam && nameParam.trim()) {
          st.players[seatColor].name = cleanName(nameParam, st.players[seatColor].name);
        }
        if (eloParam !== null && eloParam !== "") {
          st.players[seatColor].elo = clampElo(eloParam, st.players[seatColor].elo);
        }
      } else if (!st.players[seatColor]) {
        st.players[seatColor] = {
          name: cleanName(nameParam, seatColor === "w" ? "Player 1" : "Player 2"),
          elo: clampElo(eloParam, 600),
          connected: true,
        };
      }

      // Close any previous WebSocket for the same token cleanly before accepting replacement
      for (const existing of this.ctx.getWebSockets()) {
        const att = existing.deserializeAttachment();
        if (att && att.token === seatToken) {
          try {
            existing.close(4000, "replaced");
          } catch {
            /* ignore */
          }
        }
      }

      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({
        color: seatColor,
        token: seatToken,
        role: seatRole,
      });

      this.saveState(st);
      await this.scheduleCleanup();

      const pub = publicState(st);
      this.sendTo(server, {
        type: "room_state",
        yourColor: seatColor,
        yourToken: seatToken,
        state: pub,
      });

      if (justStarted) {
        this.broadcast({ type: "game_start", state: pub });
      } else {
        this.broadcast(
          {
            type: "opponent_status",
            color: seatColor,
            connected: true,
            name: st.players[seatColor].name,
            elo: st.players[seatColor].elo,
          },
          server
        );
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    return jsonResponse({ ok: false, error: "not_found" }, 404);
  }

  async webSocketMessage(ws, raw) {
    const att = ws.deserializeAttachment();
    if (!att || !att.color) return;

    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "ping") {
      this.sendTo(ws, { type: "pong", ts: Date.now() });
      return;
    }

    const st = this.loadState();
    if (!st) return;

    const color = att.color;
    await this.scheduleCleanup();

    if (msg.type === "move") {
      if (st.status !== "playing") return;
      if (msg.gameSeq !== st.gameSeq) return;
      if (color !== st.turn) return;
      if (typeof msg.uci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(msg.uci)) return;

      const now = Date.now();
      if (st.clock.enabled) {
        if (st.moves.length >= 1 && st.clock.lastTs > 0) {
          const elapsed = Math.max(0, now - st.clock.lastTs);
          st.clock[color] -= elapsed;
          if (st.clock[color] <= 0) {
            st.clock[color] = 0;
            st.status = "ended";
            st.result = color === "w" ? "0-1" : "1-0";
            st.termination = "timeout";
            this.saveState(st);
            this.broadcast({
              type: "game_over",
              gameSeq: st.gameSeq,
              result: st.result,
              termination: st.termination,
              clock: st.clock,
            });
            return;
          }
          st.clock[color] += st.clock.inc || 0;
        }
        st.clock.lastTs = now;
      }

      const move = {
        ply: st.moves.length + 1,
        uci: msg.uci,
        san: String(msg.san || msg.uci),
        color,
        fenAfter: String(msg.fenAfter || ""),
      };
      st.moves.push(move);
      if (move.fenAfter) st.fen = move.fenAfter;
      st.turn = st.turn === "w" ? "b" : "w";

      if (msg.result === "1-0" || msg.result === "0-1" || msg.result === "1/2-1/2") {
        st.status = "ended";
        st.result = msg.result;
        st.termination = String(msg.termination || "checkmate");
      }

      this.saveState(st);
      this.broadcast({
        type: "move",
        gameSeq: st.gameSeq,
        move,
        clock: st.clock,
        turn: st.turn,
        status: st.status,
        result: st.result,
        termination: st.termination,
      });
      return;
    }

    if (msg.type === "resign") {
      if (st.status !== "playing" || msg.gameSeq !== st.gameSeq) return;
      st.status = "ended";
      st.result = color === "w" ? "0-1" : "1-0";
      st.termination = "resign";
      this.saveState(st);
      this.broadcast({
        type: "game_over",
        gameSeq: st.gameSeq,
        result: st.result,
        termination: st.termination,
        clock: st.clock,
      });
      return;
    }

    if (msg.type === "timeout") {
      if (st.status !== "playing" || !st.clock.enabled || st.moves.length < 1) return;
      const elapsed = st.clock.lastTs > 0 ? Math.max(0, Date.now() - st.clock.lastTs) : 0;
      const rem = st.clock[st.turn] - elapsed;
      if (rem > 350) return;
      st.clock[st.turn] = 0;
      st.status = "ended";
      st.result = st.turn === "w" ? "0-1" : "1-0";
      st.termination = "timeout";
      this.saveState(st);
      this.broadcast({
        type: "game_over",
        gameSeq: st.gameSeq,
        result: st.result,
        termination: st.termination,
        clock: st.clock,
      });
      return;
    }

    if (msg.type === "rematch_request") {
      if (st.status !== "ended") return;
      const oppColor = color === "w" ? "b" : "w";
      const oppSockets = this.ctx.getWebSockets().filter((s) => {
        const a = s.deserializeAttachment();
        return a && a.color === oppColor;
      });
      if (!oppSockets.length) {
        this.sendTo(ws, { type: "rematch_unavailable", reason: "opponent_left" });
        return;
      }
      if (st.rematch && st.rematch.requestedBy && st.rematch.requestedBy !== color) {
        this.executeRematchSwap(st);
        return;
      }
      st.rematch = { requestedBy: color };
      this.saveState(st);
      this.sendTo(ws, { type: "rematch_sent" });
      for (const s of oppSockets) {
        this.sendTo(s, {
          type: "rematch_offer",
          fromColor: color,
          fromName: (st.players[color] && st.players[color].name) || "",
        });
      }
      return;
    }

    if (msg.type === "rematch_accept") {
      if (st.status !== "ended" || !st.rematch || !st.rematch.requestedBy || st.rematch.requestedBy === color) {
        return;
      }
      this.executeRematchSwap(st);
      return;
    }

    if (msg.type === "rematch_decline") {
      if (st.rematch && st.rematch.requestedBy && st.rematch.requestedBy !== color) {
        st.rematch = { requestedBy: null };
        this.saveState(st);
        this.broadcast(
          {
            type: "rematch_declined",
            byName: (st.players[color] && st.players[color].name) || "",
          },
          ws
        );
      }
      return;
    }

    if (msg.type === "leave") {
      if (st.players[color]) st.players[color].connected = false;
      if (st.rematch && st.rematch.requestedBy === color) st.rematch = { requestedBy: null };
      this.saveState(st);
      this.broadcast(
        {
          type: "opponent_left",
          color,
          name: (st.players[color] && st.players[color].name) || "",
        },
        ws
      );
      try {
        ws.close(1000, "left");
      } catch {
        /* ignore */
      }
    }
  }

  handleDisconnect(ws) {
    const att = ws.deserializeAttachment();
    if (!att || !att.token || !att.color) return;
    const stillHasSameToken = this.ctx.getWebSockets().some((s) => {
      if (s === ws) return false;
      const a = s.deserializeAttachment();
      return a && a.token === att.token;
    });
    if (stillHasSameToken) return;

    const st = this.loadState();
    if (!st) return;
    if (st.players[att.color]) st.players[att.color].connected = false;
    if (st.rematch && st.rematch.requestedBy === att.color) {
      st.rematch = { requestedBy: null };
    }
    this.saveState(st);
    this.broadcast(
      {
        type: "opponent_status",
        color: att.color,
        connected: false,
        name: (st.players[att.color] && st.players[att.color].name) || "",
      },
      ws
    );
  }

  async webSocketClose(ws, code, reason) {
    this.handleDisconnect(ws);
    try {
      if (code >= 1000 && code < 5000 && !RESERVED_CLOSE_CODES.has(code)) {
        ws.close(code, reason || "");
      } else {
        ws.close(1000, "");
      }
    } catch {
      /* already closed */
    }
  }

  async webSocketError(ws) {
    this.handleDisconnect(ws);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ ok: true, service: "nier-chess-online", ts: Date.now() });
    }

    if (request.method === "POST" && url.pathname === "/api/rooms") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const roomId = randomRoomId(6);
      const hostToken = randomToken(24);
      let hostColor = body.color === "b" ? "b" : body.color === "w" ? "w" : "random";
      if (hostColor === "random") {
        const byte = new Uint8Array(1);
        crypto.getRandomValues(byte);
        hostColor = byte[0] % 2 === 0 ? "w" : "b";
      }
      const timeControl = String(body.timeControl || "none");
      const name = cleanName(body.name, "Player 1");
      const elo = clampElo(body.elo, 600);

      const id = env.CHESS_ROOMS.idFromName(roomId);
      const stub = env.CHESS_ROOMS.get(id);
      const initRes = await stub.fetch("https://room/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, hostToken, hostColor, timeControl, name, elo }),
      });
      if (!initRes.ok) {
        return jsonResponse({ ok: false, error: "room_init_failed" }, 500);
      }

      return jsonResponse({
        ok: true,
        roomId,
        hostToken,
        hostColor,
        timeControl,
      });
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/rooms/")) {
      const roomId = url.pathname.slice(11).trim().toUpperCase();
      if (!/^[A-Z0-9]{4,16}$/.test(roomId)) {
        return jsonResponse({ ok: false, error: "invalid_room" }, 400);
      }
      const id = env.CHESS_ROOMS.idFromName(roomId);
      const stub = env.CHESS_ROOMS.get(id);
      return stub.fetch(new Request("https://room/status", { method: "GET" }));
    }

    if (url.pathname.startsWith("/ws/")) {
      const roomId = url.pathname.slice(4).trim().toUpperCase();
      if (!/^[A-Z0-9]{4,16}$/.test(roomId)) {
        return jsonResponse({ ok: false, error: "invalid_room" }, 400);
      }
      const id = env.CHESS_ROOMS.idFromName(roomId);
      const stub = env.CHESS_ROOMS.get(id);
      const doUrl = new URL("https://room/ws");
      doUrl.search = url.search;
      return stub.fetch(new Request(doUrl.toString(), request));
    }

    return jsonResponse({ ok: false, error: "not_found" }, 404);
  },
};
