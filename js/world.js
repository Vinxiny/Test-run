// World / Level management – real Descent layers, gold economy, freedom to push deeper

class World {
  constructor() {
    this.players = [];
    this.enemies = [];
    this.projectiles = [];
    this.ryo = null;
    this.layer = 1;
    this.teamGold = 0;
    this.waveTimer = 0;
    this.spawnPoints = [];
    this.killsThisLayer = 0;
    this.wavesCleared = 0;
    this.canDescend = false;
    this.layerNames = ['', "Hell's Gate", 'Circles of Torment', 'Devil Citadel', 'Abyssal Core', 'Absolute Void'];
    this.onTeamWipe = null;
    this.onLayerClear = null;
  }

  init(layer = 1) {
    this.layer = layer;
    this.enemies = [];
    this.projectiles = [];
    this.waveTimer = 2.5;
    this.killsThisLayer = 0;
    this.wavesCleared = 0;
    this.canDescend = false;
    this.spawnPoints = [
      { x: -22, z: -18 }, { x: 22, z: -18 },
      { x: -28, z: 12 }, { x: 28, z: 12 },
      { x: 0, z: -28 }, { x: -18, z: 22 }, { x: 18, z: 22 },
      { x: -12, z: -22 }, { x: 12, z: -22 }
    ];
  }

  addPlayer(p) {
    this.players.push(p);
  }

  setRyo(x, z) {
    this.ryo = new CaptainRyo(x, z);
  }

  getLayerMultiplier() {
    return 1 + (this.layer - 1) * 0.38;
  }

  spawnEnemy(x, z, type = 'lesser') {
    const e = new Enemy(x, z, type);
    const m = this.getLayerMultiplier();
    e.maxHp = Math.floor(e.maxHp * m);
    e.hp = e.maxHp;
    e.damage = Math.floor(e.damage * (1 + (this.layer - 1) * 0.22));
    e.speed *= 1 + (this.layer - 1) * 0.06;
    e.goldValue = Math.floor(e.goldValue * (1 + (this.layer - 1) * 0.35));
    this.enemies.push(e);
    return e;
  }

  spawnWave() {
    const base = 4 + this.layer * 2 + Math.floor(this.wavesCleared * 0.4);
    const elites = this.layer >= 2 ? Math.floor(this.layer * 0.8 + this.wavesCleared * 0.3) : 0;

    for (let i = 0; i < base; i++) {
      const sp = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
      const ox = (Math.random() - 0.5) * 7;
      const oz = (Math.random() - 0.5) * 7;
      this.spawnEnemy(sp.x + ox, sp.z + oz, 'lesser');
    }
    for (let i = 0; i < elites; i++) {
      const sp = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
      this.spawnEnemy(sp.x, sp.z, 'elite');
    }

    // Layer 3+ occasional mini-boss pressure
    if (this.layer >= 3 && Math.random() < 0.35) {
      const sp = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
      this.spawnEnemy(sp.x, sp.z, 'elite');
    }

    this.wavesCleared++;
    this.showRyo(this.layerNames[this.layer] + ' – Wave ' + this.wavesCleared);

    // Freedom: after enough waves players can choose to descend
    if (this.wavesCleared >= 3 + this.layer && !this.canDescend) {
      this.canDescend = true;
      this.showRyo('Portal open! Descend deeper for greater rewards… or keep farming');
    }
  }

  // Called when players decide to go deeper (freedom)
  descend() {
    if (!this.canDescend) return false;
    this.layer = Math.min(5, this.layer + 1);
    this.enemies.forEach(e => e.alive = false);
    this.projectiles = [];
    this.killsThisLayer = 0;
    this.wavesCleared = 0;
    this.canDescend = false;
    this.waveTimer = 3.5;
    this.showRyo('Descending to ' + this.layerNames[this.layer] + '…');
    // Reward courage
    this.teamGold += 25 + this.layer * 15;
    this.players.forEach(p => {
      if (p.alive) {
        p.hp = Math.min(p.maxHp, p.hp + 30);
        p.mana = Math.min(p.maxMana, p.mana + 25);
      }
    });
    return true;
  }

  // Simple shop – spend gold for power (called from UI)
  buy(itemId) {
    const prices = {
      heal: 40,
      mana: 30,
      damage: 55,
      speed: 50,
      revive: 80,
      grimoire: 120
    };
    const cost = prices[itemId];
    if (!cost || this.teamGold < cost) return false;

    this.teamGold -= cost;

    if (itemId === 'heal') {
      this.players.forEach(p => { if (p.alive) p.hp = Math.min(p.maxHp, p.hp + 55); });
      this.showRyo('Team healed!');
    } else if (itemId === 'mana') {
      this.players.forEach(p => { if (p.alive) p.mana = p.maxMana; });
      this.showRyo('Mana restored!');
    } else if (itemId === 'damage') {
      this.players.forEach(p => {
        p._dmgBoost = (p._dmgBoost || 1) + 0.18;
        setTimeout(() => { p._dmgBoost = Math.max(1, (p._dmgBoost || 1) - 0.18); }, 45000);
      });
      this.showRyo('Damage boosted for 45s!');
    } else if (itemId === 'speed') {
      this.players.forEach(p => {
        p.speed = p.baseSpeed * 1.35;
        p.speedBuffTimer = 40;
      });
      this.showRyo('Speed boosted!');
    } else if (itemId === 'revive') {
      const dead = this.players.find(p => !p.alive);
      if (dead) {
        dead.alive = true;
        dead.hp = Math.floor(dead.maxHp * 0.6);
        dead.mana = Math.floor(dead.maxMana * 0.5);
        this.showRyo(dead.name + ' revived!');
      } else {
        this.teamGold += cost; // refund
        return false;
      }
    } else if (itemId === 'grimoire') {
      this.players.forEach(p => {
        p.maxHp += 25;
        p.hp += 25;
        p.maxMana += 15;
        p.baseSpeed += 0.15;
        p.speed = p.baseSpeed;
      });
      this.showRyo('Grimoire Fragment absorbed – permanent power!');
    }
    return true;
  }

  addGold(amount, source) {
    this.teamGold += amount;
    if (source && source.gold !== undefined) source.gold += amount;
  }

  update(dt) {
    this.players.forEach(p => p.update(dt, p.isLocal ? window._input : null, this));
    if (this.ryo) this.ryo.update(dt, this);
    this.enemies.forEach(e => e.update(dt, this));
    this.projectiles.forEach(p => p.update(dt, this));
    this.projectiles = this.projectiles.filter(p => p.alive);

    // Wave management
    this.waveTimer -= dt;
    const livingEnemies = this.enemies.filter(e => e.alive).length;
    if (this.waveTimer <= 0 && livingEnemies < 3 + this.layer) {
      this.spawnWave();
      this.waveTimer = Math.max(9, 16 - this.layer * 1.5);
    }

    // Team wipe
    const living = this.players.filter(p => p.alive).length;
    if (this.players.length > 0 && living === 0) {
      if (this.onTeamWipe) this.onTeamWipe();
    }
  }

  showTaunt(text) {
    const el = document.getElementById('enemy-taunt');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add('hidden'), 3200);
  }

  showRyo(text) {
    const el = document.getElementById('ryo-banner');
    if (!el) return;
    el.textContent = 'Ryo: ' + text;
    el.classList.remove('hidden');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add('hidden'), 3600);
  }

  getLocalPlayer() {
    return this.players.find(p => p.isLocal);
  }
}
