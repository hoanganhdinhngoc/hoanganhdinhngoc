/* =====================================================================
   YoRHa Tactical Chess System — online.js
   Global: OnlineClient
   - Real-time 2-player online transport via Cloudflare Worker + Durable Object WebSocket
   ===================================================================== */
(function () {
  'use strict';

  const SERVER_HTTP = 'https://chess-ws.hoanganhdinhngoc.io.vn';
  const SERVER_WS = 'wss://chess-ws.hoanganhdinhngoc.io.vn';
  const RECONNECT_DELAYS = [1000, 2000, 3500, 5000, 5000];

  let ws = null;
  let pingTimer = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let manualClose = false;
  let handlers = {};

  const session = {
    active: false,
    roomId: null,
    inviteUrl: null,
    role: null,
    token: null,
    yourColor: null,
    name: null,
    elo: 600,
    gameSeq: 1,
    status: 'idle',
    opponentConnected: false,
    opponentName: '',
    connected: false,
    gameStarted: false
  };

  function resetSession() {
    session.active = false;
    session.roomId = null;
    session.inviteUrl = null;
    session.role = null;
    session.token = null;
    session.yourColor = null;
    session.name = null;
    session.elo = 600;
    session.gameSeq = 1;
    session.status = 'idle';
    session.opponentConnected = false;
    session.opponentName = '';
    session.connected = false;
    session.gameStarted = false;
  }

  function extractRoomId(raw) {
    const s = String(raw || '').trim();
    if (!s) return null;
    let candidate = s;
    if (/^https?:\/\//i.test(s) || s.includes('?') || s.includes('join=') || s.includes('room=')) {
      try {
        const u = new URL(/^https?:\/\//i.test(s) ? s : ('https://dummy.local/' + s.replace(/^\?/, '?')));
        const q = u.searchParams.get('join') || u.searchParams.get('room');
        if (q) candidate = q;
      } catch (e) {
        const m = s.match(/[?&](?:join|room)=([A-Za-z0-9]+)/i);
        if (m) candidate = m[1];
      }
    }
    const clean = String(candidate || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 4 || clean.length > 16) return null;
    return clean;
  }

  function buildInviteUrl(roomId) {
    const id = encodeURIComponent(String(roomId || '').trim().toUpperCase());
    if (typeof window !== 'undefined' && window.location && /^https?:$/i.test(window.location.protocol)) {
      return window.location.origin + window.location.pathname + '?join=' + id;
    }
    return 'https://hoanganhdinhngoc.io.vn/chess/?join=' + id;
  }

  function clearTimers() {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  }

  function closeSocketOnly() {
    clearTimers();
    if (ws) {
      const cur = ws;
      ws = null;
      cur.onopen = null;
      cur.onmessage = null;
      cur.onerror = null;
      cur.onclose = null;
      try { cur.close(1000, 'close'); } catch (e) { /* ignore */ }
    }
    session.connected = false;
  }

  function sendJson(obj) {
    if (!ws || ws.readyState !== 1) return false;
    try {
      ws.send(JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  function handleMessage(msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'pong') return;

    if (msg.type === 'room_state') {
      if (msg.yourToken) session.token = msg.yourToken;
      if (msg.yourColor) session.yourColor = msg.yourColor;
      const st = msg.state || {};
      session.gameSeq = st.gameSeq || 1;
      session.status = st.status || 'waiting';
      const oppColor = session.yourColor === 'w' ? 'b' : 'w';
      const opp = st.players && st.players[oppColor];
      session.opponentConnected = !!(opp && opp.connected);
      session.opponentName = (opp && opp.name) || '';
      if (st.status === 'playing' || st.status === 'ended') {
        session.gameStarted = true;
      }
      if (handlers.onRoomState) handlers.onRoomState(msg);
      return;
    }

    if (msg.type === 'game_start') {
      const st = msg.state || {};
      session.gameSeq = st.gameSeq || 1;
      session.status = st.status || 'playing';
      session.gameStarted = true;
      const oppColor = session.yourColor === 'w' ? 'b' : 'w';
      const opp = st.players && st.players[oppColor];
      session.opponentConnected = !!(opp && opp.connected);
      session.opponentName = (opp && opp.name) || '';
      if (handlers.onGameStart) handlers.onGameStart(st, session.yourColor);
      return;
    }

    if (msg.type === 'move') {
      session.status = msg.status || session.status;
      if (handlers.onMove) handlers.onMove(msg);
      return;
    }

    if (msg.type === 'game_over') {
      session.status = 'ended';
      if (handlers.onGameOver) handlers.onGameOver(msg);
      return;
    }

    if (msg.type === 'opponent_status') {
      if (msg.color !== session.yourColor) {
        session.opponentConnected = !!msg.connected;
        if (msg.name) session.opponentName = msg.name;
      }
      if (handlers.onOpponentStatus) handlers.onOpponentStatus(msg);
      return;
    }

    if (msg.type === 'opponent_left') {
      if (msg.color !== session.yourColor) {
        session.opponentConnected = false;
      }
      if (handlers.onOpponentLeft) handlers.onOpponentLeft(msg);
      return;
    }

    if (msg.type === 'rematch_offer') {
      if (handlers.onRematchOffer) handlers.onRematchOffer(msg);
      return;
    }

    if (msg.type === 'rematch_sent') {
      if (handlers.onRematchSent) handlers.onRematchSent(msg);
      return;
    }

    if (msg.type === 'rematch_declined') {
      if (handlers.onRematchDeclined) handlers.onRematchDeclined(msg);
      return;
    }

    if (msg.type === 'rematch_unavailable') {
      session.opponentConnected = false;
      if (handlers.onRematchUnavailable) handlers.onRematchUnavailable(msg);
      return;
    }

    if (msg.type === 'rematch_start') {
      if (msg.yourColor) session.yourColor = msg.yourColor;
      const st = msg.state || {};
      session.gameSeq = st.gameSeq || (session.gameSeq + 1);
      session.status = st.status || 'playing';
      session.gameStarted = true;
      const oppColor = session.yourColor === 'w' ? 'b' : 'w';
      const opp = st.players && st.players[oppColor];
      session.opponentConnected = !!(opp && opp.connected);
      session.opponentName = (opp && opp.name) || '';
      if (handlers.onRematchStart) handlers.onRematchStart(msg);
    }
  }

  function connectSocket() {
    closeSocketOnly();
    manualClose = false;
    const params = new URLSearchParams();
    params.set('role', session.role || 'guest');
    if (session.token) params.set('token', session.token);
    if (session.name) params.set('name', session.name);
    if (session.elo) params.set('elo', String(session.elo));

    const wsUrl = SERVER_WS + '/ws/' + encodeURIComponent(session.roomId) + '?' + params.toString();
    const sock = new WebSocket(wsUrl);
    ws = sock;

    let opened = false;
    sock.onopen = () => {
      if (ws !== sock) return;
      opened = true;
      session.connected = true;
      reconnectAttempt = 0;
      pingTimer = setInterval(() => {
        sendJson({ type: 'ping' });
      }, 25000);
      if (handlers.onConnect) handlers.onConnect(getSession());
    };

    sock.onmessage = (ev) => {
      if (ws !== sock) return;
      try {
        const data = JSON.parse(String(ev.data || ''));
        handleMessage(data);
      } catch (e) { /* ignore */ }
    };

    sock.onerror = () => {
      /* handled in onclose */
    };

    sock.onclose = (ev) => {
      if (ws !== sock) return;
      clearTimers();
      ws = null;
      session.connected = false;
      const code = ev && typeof ev.code === 'number' ? ev.code : 1006;

      if (manualClose || code === 1000 || code === 4000 || !session.active) {
        if (!manualClose && code !== 4000 && handlers.onError) {
          handlers.onError('disconnected');
        }
        return;
      }

      if (!opened && !session.gameStarted && reconnectAttempt === 0) {
        if (handlers.onError) handlers.onError('connect_failed');
        return;
      }

      if (reconnectAttempt < RECONNECT_DELAYS.length && session.active && session.roomId) {
        const delay = RECONNECT_DELAYS[reconnectAttempt++];
        if (handlers.onReconnecting) handlers.onReconnecting(reconnectAttempt);
        reconnectTimer = setTimeout(() => {
          if (session.active && !manualClose) connectSocket();
        }, delay);
      } else if (handlers.onError) {
        handlers.onError('connection_lost');
      }
    };
  }

  async function createRoom({ name, elo, color, timeControl }) {
    leaveRoom(true);
    const cleanName = String(name || 'Player 1').trim().slice(0, 24) || 'Player 1';
    const cleanElo = Math.max(100, Math.min(3500, parseInt(elo, 10) || 600));
    const res = await fetch(SERVER_HTTP + '/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        elo: cleanElo,
        color: color || 'w',
        timeControl: timeControl || 'none'
      })
    });
    if (!res.ok) {
      throw new Error('room_create_failed_' + res.status);
    }
    const data = await res.json();
    if (!data || !data.ok || !data.roomId) {
      throw new Error((data && data.error) || 'room_create_failed');
    }

    session.active = true;
    session.roomId = data.roomId;
    session.inviteUrl = buildInviteUrl(data.roomId);
    session.role = 'host';
    session.token = data.hostToken;
    session.yourColor = data.hostColor;
    session.name = cleanName;
    session.elo = cleanElo;
    session.gameSeq = 1;
    session.status = 'waiting';
    session.opponentConnected = false;
    session.opponentName = '';
    session.gameStarted = false;

    connectSocket();
    return getSession();
  }

  async function joinRoom({ roomInput, name, elo }) {
    const roomId = extractRoomId(roomInput);
    if (!roomId) throw new Error('invalid_room');

    leaveRoom(true);
    const cleanName = String(name || 'Player 2').trim().slice(0, 24) || 'Player 2';
    const cleanElo = Math.max(100, Math.min(3500, parseInt(elo, 10) || 600));

    const probe = await fetch(SERVER_HTTP + '/api/rooms/' + encodeURIComponent(roomId));
    if (probe.status === 404) throw new Error('room_not_found');
    if (!probe.ok) throw new Error('connect_failed');
    const info = await probe.json();
    if (!info || !info.ok) throw new Error((info && info.error) || 'room_not_found');
    if (info.full) throw new Error('room_full');

    session.active = true;
    session.roomId = roomId;
    session.inviteUrl = buildInviteUrl(roomId);
    session.role = 'guest';
    session.token = null;
    session.yourColor = null;
    session.name = cleanName;
    session.elo = cleanElo;
    session.gameSeq = 1;
    session.status = 'waiting';
    session.opponentConnected = false;
    session.opponentName = '';
    session.gameStarted = false;

    connectSocket();
    return getSession();
  }

  function sendMove({ uci, san, fenAfter, result, termination }) {
    return sendJson({
      type: 'move',
      gameSeq: session.gameSeq,
      uci,
      san,
      fenAfter,
      result: result || null,
      termination: termination || null
    });
  }

  function sendResign() {
    return sendJson({ type: 'resign', gameSeq: session.gameSeq });
  }

  function sendTimeout() {
    return sendJson({ type: 'timeout', gameSeq: session.gameSeq });
  }

  function requestRematch() {
    return sendJson({ type: 'rematch_request', gameSeq: session.gameSeq });
  }

  function acceptRematch() {
    return sendJson({ type: 'rematch_accept', gameSeq: session.gameSeq });
  }

  function declineRematch() {
    return sendJson({ type: 'rematch_decline', gameSeq: session.gameSeq });
  }

  function leaveRoom(silent) {
    manualClose = true;
    if (!silent && ws && ws.readyState === 1) {
      sendJson({ type: 'leave' });
    }
    closeSocketOnly();
    resetSession();
  }

  function setHandlers(cbs) {
    handlers = cbs || {};
  }

  function getSession() {
    return Object.assign({}, session);
  }

  window.OnlineClient = {
    SERVER_HTTP,
    SERVER_WS,
    extractRoomId,
    buildInviteUrl,
    createRoom,
    joinRoom,
    sendMove,
    sendResign,
    sendTimeout,
    requestRematch,
    acceptRematch,
    declineRematch,
    leaveRoom,
    setHandlers,
    getSession,
    isActive: () => !!session.active,
    isConnected: () => !!session.connected,
    opponentConnected: () => !!session.opponentConnected
  };
})();
