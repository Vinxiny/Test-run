// Anime-style entities with speed, synergies, better feedback

class Entity {
  constructor(x, z) {
    this.x = x; this.z = z; this.y = 0;
    this.vx = 0; this.vz = 0;
    this.radius = 0.6;
    this.hp = 100; this.maxHp = 100;
    this.alive = true;
    this.mesh = null;
  }
  distanceTo(other) {
    const dx = this.x - other.x, dz = this.z - other.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}

class Player extends Entity {
  constructor(x, z, magicId, name, isHealer, isLocal) {
    super(x, z);
    this.magic = getMagic(magicId);
    this.name = name || 'Knight';
    this.isHealer = !!isHealer;
    this.isLocal = !!isLocal;
    this.id = null;
    this.mana = 100; this.maxMana = 100;
    this.baseSpeed = 6.8 * (this.magic.speed || 1.0);
    this.speed = this.baseSpeed;
    this.facing = 0;
    this.cooldowns = [0, 0, 0, 0];
    this.invuln = 0;
    this.gold = 0;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 40;
    this.kills = 0;
    this.damageDealt = 0;
    this.color = this.magic.color;
    this.radius = 0.55;
    this.speedBuffTimer = 0;
    this.comboCount = 0;
    this.lastAbilityTime = 0;
    this.y = 0;
    this.vy = 0;
    this.onGround = true;
  }

  update(dt, input, world) {
    if (!this.alive) return;

    for (let i = 0; i < 4; i++) {
      if (this.cooldowns[i] > 0) this.cooldowns[i] = Math.max(0, this.cooldowns[i] - dt);
    }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.speedBuffTimer > 0) {
      this.speedBuffTimer -= dt;
      if (this.speedBuffTimer <= 0) this.speed = this.baseSpeed;
    }

    this.mana = Math.min(this.maxMana, this.mana + 9.5 * dt);

    if (!this.isLocal || !input) return;

    let mx = 0, mz = 0;
    if (input.up) mz -= 1;
    if (input.down) mz += 1;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (input.joyX !== undefined) { mx = input.joyX; mz = input.joyY; }

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0.05) {
      mx /= len; mz /= len;
      // High-freedom snappy turning + acceleration (game feel)
      const targetFacing = Math.atan2(mx, mz);
      let diff = targetFacing - this.facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facing += diff * Math.min(1, 16 * dt);

      const targetVx = mx * this.speed;
      const targetVz = mz * this.speed;
      this.vx += (targetVx - this.vx) * Math.min(1, 13 * dt);
      this.vz += (targetVz - this.vz) * Math.min(1, 13 * dt);
    } else {
      this.vx *= 0.76;
      this.vz *= 0.76;
    }

    // Jump – more satisfying float
    if (input.jump && this.onGround) {
      this.vy = 11.4;
      this.onGround = false;
      Audio.attack();
    }
    this.vy = (this.vy || 0) - 26 * dt;
    this.y = (this.y || 0) + this.vy * dt;
    if (this.y <= 0) {
      this.y = 0;
      this.vy = 0;
      this.onGround = true;
    }

    this.x += this.vx * dt;
    this.z += this.vz * dt;
    // Bigger arena = more freedom
    this.x = Math.max(-43, Math.min(43, this.x));
    this.z = Math.max(-43, Math.min(43, this.z));
  }

  tryAbility(slot, world) {
    if (!this.alive || this.cooldowns[slot] > 0) return false;
    const ab = [this.magic.basic, this.magic.skill1, this.magic.skill2, this.magic.ultimate][slot];
    if (this.mana < ab.mana) return false;

    this.mana -= ab.mana;
    this.cooldowns[slot] = ab.cooldown;
    Audio.cast(this.magic.id);

    // Strong visual cast feedback so powers feel impactful
    if (window.game && window.game.scene) {
      const flash = new THREE.PointLight(this.magic.color, 2.8, 14);
      flash.position.set(this.x, 1.4, this.z);
      window.game.scene.add(flash);
      setTimeout(() => window.game.scene.remove(flash), 180);
    }

    const now = performance.now();
    if (now - this.lastAbilityTime < 1800) this.comboCount++;
    else this.comboCount = 1;
    this.lastAbilityTime = now;

    let damageMult = 1 + Math.min(this.comboCount * 0.08, 0.4);

    let synergyBonus = 1;
    let synergyName = null;
    world.players.forEach(p => {
      if (p === this || !p.alive) return;
      if (this.distanceTo(p) < 12) {
        const syn = getSynergy(this.magic.id, p.magic.id);
        if (syn) {
          synergyBonus = Math.max(synergyBonus, syn.bonus);
          synergyName = syn.name;
        }
      }
    });
    if (synergyName && slot > 0) {
      world.showRyo('Synergy! ' + synergyName + '!');
      Audio.fanfare();
    }

    const finalDmg = Math.floor(ab.damage * damageMult * synergyBonus * this.getDamageMultiplier());
    this.damageDealt += finalDmg;

    const dirX = Math.sin(this.facing);
    const dirZ = Math.cos(this.facing);
    const proj = new Projectile(
      this.x + dirX * 1.3, this.z + dirZ * 1.3,
      dirX, dirZ, finalDmg, ab.range || 6,
      this.magic.color, this, ab.effect || null, ab.heal || 0
    );
    world.projectiles.push(proj);

    if (ab.effect === 'heal' || ab.effect === 'teamheal') {
      Audio.heal();
      if (ab.effect === 'heal') this.hp = Math.min(this.maxHp, this.hp + ab.heal);
      else world.players.forEach(p => { if (p.alive) p.hp = Math.min(p.maxHp, p.hp + ab.heal); });
    }
    if (ab.effect === 'dash') {
      this.x += dirX * 5.5;
      this.z += dirZ * 5.5;
    }
    if (ab.effect === 'speedbuff') {
      world.players.forEach(p => {
        if (p.alive) {
          p.speed = p.baseSpeed * 1.45;
          p.speedBuffTimer = 6;
        }
      });
      world.showRyo('Tempest Domain – Speed up!');
    }
    if (ab.effect === 'teleport') {
      this.x += dirX * 7;
      this.z += dirZ * 7;
    }
    return true;
  }


  gainXP(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(40 + this.level * 28);
      // Get stronger
      this.maxHp += 18;
      this.hp = this.maxHp;
      this.maxMana += 10;
      this.mana = this.maxMana;
      this.baseSpeed += 0.12;
      this.speed = this.baseSpeed;
      leveled = true;
    }
    if (leveled) {
      Audio.fanfare();
      if (window.game && window.game.world) {
        window.game.world.showRyo(this.name + ' reached Level ' + this.level + '!');
      }
    }
  }

  getDamageMultiplier() {
    const levelBonus = 1 + (this.level - 1) * 0.14;
    const tempBoost = this._dmgBoost || 1;
    return levelBonus * tempBoost;
  }

  addXp(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = Math.floor(this.xpToNext * 1.32 + 18);
      this.maxHp += 18;
      this.hp = Math.min(this.maxHp, this.hp + 28);
      this.maxMana += 12;
      this.mana = this.maxMana;
      this.baseSpeed += 0.14;
      this.speed = this.baseSpeed;
      leveled = true;
      Audio.fanfare();
      this.justLeveled = true;
    }
    if (leveled && window.game && window.game.world) {
      window.game.world.showRyo(this.name + ' → Level ' + this.level + '!');
    }
  }

  takeDamage(amount) {
    if (!this.alive || this.invuln > 0) return;
    this.hp -= amount;
    this.invuln = 0.4;
    this.comboCount = 0;
    Audio.hit();
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      Audio.death();
    }
  }
}

class Enemy extends Entity {
  constructor(x, z, type = 'lesser') {
    super(x, z);
    this.type = type;
    this.radius = type === 'elite' ? 0.95 : type === 'boss' ? 1.5 : 0.65;
    this.speed = type === 'elite' ? 4.4 : type === 'boss' ? 3.4 : 3.9;
    this.damage = type === 'elite' ? 20 : type === 'boss' ? 32 : 11;
    this.maxHp = type === 'elite' ? 260 : type === 'boss' ? 1100 : 80;
    this.hp = this.maxHp;
    this.attackCd = 0;
    this.summonCd = type === 'lesser' ? 999 : 7.5;
    this.tauntCd = 3.5 + Math.random() * 5;
    this.target = null;
    this.color = type === 'boss' ? 0x7f1d1d : type === 'elite' ? 0x9f1239 : 0x4a044e;
    this.goldValue = type === 'boss' ? 150 : type === 'elite' ? 42 : 10;
    this.pulse = Math.random() * Math.PI * 2;
  }

  update(dt, world) {
    if (!this.alive) return;
    this.pulse += dt * 3;
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.summonCd = Math.max(0, this.summonCd - dt);
    this.tauntCd = Math.max(0, this.tauntCd - dt);

    let nearest = null, nearestDist = 999;
    world.players.forEach(p => {
      if (!p.alive) return;
      const d = this.distanceTo(p);
      if (d < nearestDist) { nearestDist = d; nearest = p; }
    });
    this.target = nearest;
    if (!nearest) return;

    if (this.tauntCd <= 0 && nearestDist < 15) {
      this.tauntCd = 6.5 + Math.random() * 7;
      const lines = [
        "You insects dare challenge me?!",
        "I am eternal! Kneel before true power!",
        "Your magic is a child's toy!",
        "I will crush every last one of you!",
        "The Abyss itself bows to me!",
        "Pathetic mortals... disappear!",
        "Feel the wrath of Hell!",
        "You will never reach the Grimoire!",
        "I have destroyed legions stronger than you!",
        "Beg for mercy — it won't save you!"
      ];
      world.showTaunt(lines[Math.floor(Math.random() * lines.length)]);
      Audio.taunt();
    }

    if ((this.type === 'elite' || this.type === 'boss') && this.summonCd <= 0 && nearestDist < 17) {
      this.summonCd = this.type === 'boss' ? 12 : 9.5;
      const count = this.type === 'boss' ? 4 : 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 2.2 + Math.random() * 2.5;
        world.spawnEnemy(this.x + Math.cos(angle) * dist, this.z + Math.sin(angle) * dist, 'lesser');
      }
      world.showTaunt("Rise, my loyal minions!");
      Audio.taunt();
    }

    if (nearestDist > this.radius + 1.3) {
      const dx = nearest.x - this.x, dz = nearest.z - this.z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      this.x += (dx / len) * this.speed * dt;
      this.z += (dz / len) * this.speed * dt;
    } else if (this.attackCd <= 0) {
      this.attackCd = this.type === 'boss' ? 1.25 : 1.0;
      nearest.takeDamage(this.damage);
      Audio.attack();
    }
  }

  takeDamage(amount, source) {
    if (!this.alive) return;
    const dealt = Math.min(amount, Math.max(0, this.hp));
    this.hp -= amount;
    Audio.hit();
    if (source) {
      source.damageDealt = (source.damageDealt || 0) + dealt;
      if (source.addXp) source.addXp(Math.floor(dealt * 0.3));
    }
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      Audio.death();
      if (source) {
        source.kills = (source.kills || 0) + 1;
        const xpGain = this.type === 'boss' ? 95 : this.type === 'elite' ? 42 : 15;
        if (source.addXp) source.addXp(xpGain);
        // Team gold + personal gold
        if (window.game && window.game.world) {
          window.game.world.addGold(this.goldValue, source);
          window.game.world.killsThisLayer = (window.game.world.killsThisLayer || 0) + 1;
        } else if (source.gold !== undefined) {
          source.gold += this.goldValue;
        }
      }
    }
  }
}

class Projectile {
  constructor(x, z, dx, dz, damage, range, color, owner, effect, heal) {
    this.x = x; this.z = z;
    this.dx = dx; this.dz = dz;
    this.speed = 16;
    this.damage = damage;
    this.rangeLeft = range;
    this.color = color;
    this.owner = owner;
    this.effect = effect;
    this.heal = heal || 0;
    this.alive = true;
    this.radius = 0.38;
  }

  update(dt, world) {
    if (!this.alive) return;
    const step = this.speed * dt;
    this.x += this.dx * step;
    this.z += this.dz * step;
    this.rangeLeft -= step;
    if (this.rangeLeft <= 0) { this.alive = false; return; }

    for (const e of world.enemies) {
      if (!e.alive) continue;
      if (this.distanceTo(e) < this.radius + e.radius) {
        e.takeDamage(this.damage, this.owner);
        if (this.effect === 'nullify') e.attackCd = Math.max(e.attackCd, 1.4);
        if (this.effect === 'stun') {
          const old = e.speed;
          e.speed *= 0.25;
          setTimeout(() => { if (e.alive) e.speed = old; }, 1600);
        }
        if (this.effect === 'pull') {
          const dx = this.owner.x - e.x, dz = this.owner.z - e.z;
          const len = Math.sqrt(dx*dx + dz*dz) || 1;
          e.x += (dx / len) * 2.5;
          e.z += (dz / len) * 2.5;
        }
        this.alive = false;
        return;
      }
    }
  }

  distanceTo(other) {
    const dx = this.x - other.x, dz = this.z - other.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}

class CaptainRyo extends Entity {
  constructor(x, z) {
    super(x, z);
    this.radius = 0.75;
    this.speed = 5.8;
    this.hp = 9999; this.maxHp = 9999;
    this.color = 0x1e1b4b;
    this.speakCd = 7;
    this.assistCd = 11;
  }

  update(dt, world) {
    this.speakCd = Math.max(0, this.speakCd - dt);
    this.assistCd = Math.max(0, this.assistCd - dt);

    let cx = 0, cz = 0, n = 0;
    world.players.forEach(p => { if (p.alive) { cx += p.x; cz += p.z; n++; } });
    if (n === 0) return;
    cx /= n; cz /= n;

    const dx = cx - this.x, dz = cz - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 3.8) {
      this.x += (dx / dist) * this.speed * dt;
      this.z += (dz / dist) * this.speed * dt;
    }

    if (this.speakCd <= 0) {
      this.speakCd = 12 + Math.random() * 9;
      const lines = [
        "Keep moving, maggots!",
        "I'll cut the path — follow!",
        "Heal the downed one NOW!",
        "That one's mine.",
        "Don't get cocky out there.",
        "The Grimoire is deeper. Move!",
        "Use your synergies, damn it!",
        "Speed is life — stay sharp!"
      ];
      world.showRyo(lines[Math.floor(Math.random() * lines.length)]);
      Audio.ryoSpeak();
    }

    if (this.assistCd <= 0) {
      const living = world.players.filter(p => p.alive).length;
      if (living > 0 && living <= Math.ceil(world.players.length * 0.6)) {
        this.assistCd = 16;
        let nearest = null, nd = 999;
        world.enemies.forEach(e => {
          if (!e.alive) return;
          const d = this.distanceTo(e);
          if (d < nd) { nd = d; nearest = e; }
        });
        if (nearest && nd < 14) {
          nearest.takeDamage(70, null);
          world.showRyo("Dark Magic — Dimension Slash!");
          Audio.cast('dark');
        }
      }
    }
  }
}
