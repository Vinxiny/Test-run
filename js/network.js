// Real LAN multiplayer – host-authoritative WebRTC DataChannels
// Pure offline after page load. Manual SDP exchange (copy/paste or share).
// No external servers required.

class NetManager {
  constructor() {
    this.isHost = false;
    this.roomCode = '';
    this.localId = 'p_' + Math.random().toString(36).slice(2, 9);
    this.players = []; // {id, name, magic, isHealer, ready, peer?}
    this.peers = new Map(); // id -> RTCPeerConnection
    this.dataChannels = new Map(); // id -> RTCDataChannel
    this.onPlayerUpdate = null;
    this.onStartGame = null;
    this.onRemoteState = null; // (id, state) => {}
    this.onRemoteAbility = null;
    this.localState = null;
    this.pendingOffer = null;
    this.pendingAnswer = null;
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  // ========== HOST ==========
  async host() {
    this.isHost = true;
    this.roomCode = this.generateCode();
    this.players = [{
      id: this.localId,
      name: 'Host',
      magic: null,
      isHealer: false,
      ready: false
    }];
    if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
    return this.roomCode;
  }

  // Create offer for a new client (host side)
  async createOfferForClient() {
    if (!this.isHost) return null;
    const pc = new RTCPeerConnection({
      iceServers: [] // pure LAN – no STUN/TURN needed on same Wi-Fi
    });
    const dc = pc.createDataChannel('game', { ordered: true });
    this._setupDataChannel(dc, 'pending');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait briefly for ICE gathering (non-trickle for simplicity)
    await new Promise(r => setTimeout(r, 400));

    const offerStr = btoa(JSON.stringify(pc.localDescription));
    this.pendingOffer = { pc, offerStr };
    return offerStr;
  }

  // Host accepts client's answer
  async acceptAnswer(answerStr) {
    if (!this.pendingOffer) return false;
    try {
      const answer = JSON.parse(atob(answerStr));
      await this.pendingOffer.pc.setRemoteDescription(answer);
      const id = 'client_' + Math.random().toString(36).slice(2, 7);
      this.peers.set(id, this.pendingOffer.pc);
      this.players.push({
        id,
        name: 'Player',
        magic: null,
        isHealer: false,
        ready: false
      });
      this.pendingOffer = null;
      if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
      return id;
    } catch (e) {
      console.error('Accept answer failed', e);
      return false;
    }
  }

  // ========== CLIENT ==========
  async joinWithOffer(offerStr) {
    this.isHost = false;
    this.roomCode = 'JOIN';
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.ondatachannel = (ev) => {
      this._setupDataChannel(ev.channel, this.localId);
    };

    try {
      const offer = JSON.parse(atob(offerStr));
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await new Promise(r => setTimeout(r, 400));
      const answerStr = btoa(JSON.stringify(pc.localDescription));
      this.peers.set('host', pc);
      this.players = [{
        id: this.localId,
        name: 'Player',
        magic: null,
        isHealer: false,
        ready: false
      }];
      if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
      return answerStr;
    } catch (e) {
      console.error('Join failed', e);
      return null;
    }
  }

  // Simple same-device / testing join (no real network)
  join(code) {
    this.isHost = false;
    this.roomCode = (code || 'LOCAL').toUpperCase();
    this.players = [{
      id: this.localId,
      name: 'Player',
      magic: null,
      isHealer: false,
      ready: false
    }];
    if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
    return true;
  }

  _setupDataChannel(dc, peerId) {
    dc.onopen = () => {
      console.log('DataChannel open', peerId);
      this.dataChannels.set(peerId, dc);
      // Send hello
      this._send(peerId, { type: 'hello', id: this.localId, name: this.players.find(p => p.id === this.localId)?.name });
    };
    dc.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        this._handleMessage(msg, peerId);
      } catch (e) {}
    };
    dc.onclose = () => {
      this.dataChannels.delete(peerId);
    };
  }

  _handleMessage(msg, fromId) {
    if (msg.type === 'hello') {
      // Update name etc.
      const p = this.players.find(pl => pl.id === msg.id);
      if (p) p.name = msg.name || p.name;
      if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
    }
    if (msg.type === 'state' && this.onRemoteState) {
      this.onRemoteState(msg.id, msg.state);
    }
    if (msg.type === 'ability' && this.onRemoteAbility) {
      this.onRemoteAbility(msg.id, msg.slot, msg.extra);
    }
    if (msg.type === 'ready') {
      const p = this.players.find(pl => pl.id === msg.id);
      if (p) {
        p.ready = true;
        p.magic = msg.magic;
        p.isHealer = msg.isHealer;
        p.name = msg.name || p.name;
      }
      if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
    }
    if (msg.type === 'start' && this.onStartGame) {
      this.onStartGame(msg.players);
    }
  }

  _send(peerId, obj) {
    const dc = this.dataChannels.get(peerId);
    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify(obj));
    }
  }

  broadcast(obj) {
    this.dataChannels.forEach((dc, id) => {
      if (dc.readyState === 'open') dc.send(JSON.stringify(obj));
    });
  }

  setLocalInfo(name, magicId, isHealer) {
    const p = this.players.find(pl => pl.id === this.localId);
    if (p) {
      p.name = name;
      p.magic = magicId;
      p.isHealer = isHealer;
    }
    this.broadcast({ type: 'ready', id: this.localId, name, magic: magicId, isHealer, ready: true });
    if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
  }

  setReady(ready) {
    const p = this.players.find(pl => pl.id === this.localId);
    if (p) p.ready = ready;
    if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
  }

  allReady() {
    return this.players.length > 0 && this.players.every(p => p.ready && p.magic);
  }

  // Host starts the game and tells everyone
  startGame(playersData) {
    this.broadcast({ type: 'start', players: playersData });
  }

  // Send local player state (position, facing, hp, mana...) at ~20Hz
  sendState(state) {
    this.broadcast({ type: 'state', id: this.localId, state });
  }

  sendAbility(slot, extra) {
    this.broadcast({ type: 'ability', id: this.localId, slot, extra });
  }

  // Dummy for local testing
  addDummyPlayer(name, magicId) {
    if (!this.isHost) return;
    this.players.push({
      id: 'ai_' + Math.random().toString(36).slice(2, 6),
      name,
      magic: magicId,
      isHealer: false,
      ready: true
    });
    if (this.onPlayerUpdate) this.onPlayerUpdate(this.players);
  }
}

const Net = new NetManager();
