// High-polish Magic system – anime inspired, combinable, with speed stats
const MAGICS = {
  dark: {
    id: 'dark', name: 'Dark', icon: '🌑', color: 0x4c1d95, accent: '#7c3aed',
    description: 'Heavy dimension cuts that ignore light',
    speed: 1.0,
    basic: { name: 'Dark Slash', damage: 20, mana: 0, cooldown: 0.16, range: 2.4, style: 'melee' },
    skill1: { name: 'Dimension Cut', damage: 48, mana: 20, cooldown: 4.2, range: 3.8, style: 'slash' },
    skill2: { name: 'Black Hole', damage: 15, mana: 26, cooldown: 6.5, range: 4.5, effect: 'pull' },
    ultimate: { name: 'Abyss Severance', damage: 105, mana: 52, cooldown: 16, range: 5.5, effect: 'wide', style: 'finisher' },
    synergy: { with: ['antimagic', 'spatial'], name: 'Void Rupture', bonus: 1.45 }
  },
  fire: {
    id: 'fire', name: 'Fire', icon: '🔥', color: 0xea580c, accent: '#f97316',
    description: 'Explosive flames that burn forever',
    speed: 1.05,
    basic: { name: 'Flame Bolt', damage: 16, mana: 0, cooldown: 0.18, range: 9, style: 'ranged' },
    skill1: { name: 'Fire Wall', damage: 32, mana: 18, cooldown: 4.8, range: 3.2, effect: 'wall' },
    skill2: { name: 'Inferno Burst', damage: 55, mana: 28, cooldown: 6, range: 4.2 },
    ultimate: { name: 'Solar Catastrophe', damage: 125, mana: 58, cooldown: 18, range: 6.5, effect: 'burn' },
    synergy: { with: ['wind', 'lightning'], name: 'Plasma Storm', bonus: 1.5 }
  },
  water: {
    id: 'water', name: 'Water', icon: '💧', color: 0x0284c7, accent: '#38bdf8',
    description: 'Flowing tides that heal and crush',
    speed: 1.0,
    basic: { name: 'Aqua Shot', damage: 13, mana: 0, cooldown: 0.18, range: 9.5, style: 'ranged' },
    skill1: { name: 'Healing Tide', damage: 0, mana: 22, cooldown: 5.5, range: 6, effect: 'heal', heal: 42 },
    skill2: { name: 'Tidal Wave', damage: 42, mana: 26, cooldown: 6.2, range: 5.5 },
    ultimate: { name: 'Ocean of Life', damage: 25, mana: 48, cooldown: 20, range: 8, effect: 'teamheal', heal: 75 },
    synergy: { with: ['earth', 'wind'], name: 'Storm Surge', bonus: 1.35 }
  },
  wind: {
    id: 'wind', name: 'Wind', icon: '🌪️', color: 0x10b981, accent: '#34d399',
    description: 'Swift blades and team acceleration',
    speed: 1.25,
    basic: { name: 'Wind Blade', damage: 14, mana: 0, cooldown: 0.16, range: 7.5, style: 'ranged' },
    skill1: { name: 'Gale Dash', damage: 25, mana: 12, cooldown: 3.0, range: 7, effect: 'dash' },
    skill2: { name: 'Cyclone', damage: 40, mana: 24, cooldown: 5.5, range: 4.5 },
    ultimate: { name: 'Tempest Domain', damage: 80, mana: 48, cooldown: 16, range: 9, effect: 'speedbuff' },
    synergy: { with: ['fire', 'lightning'], name: 'Thunder Gale', bonus: 1.4 }
  },
  lightning: {
    id: 'lightning', name: 'Lightning', icon: '⚡', color: 0xeab308, accent: '#facc15',
    description: 'Blinding speed and chain destruction',
    speed: 1.3,
    basic: { name: 'Spark', damage: 17, mana: 0, cooldown: 0.15, range: 6.5, style: 'ranged' },
    skill1: { name: 'Chain Bolt', damage: 34, mana: 16, cooldown: 3.8, range: 8, effect: 'chain' },
    skill2: { name: 'Thunder Stun', damage: 28, mana: 22, cooldown: 5, range: 5.5, effect: 'stun' },
    ultimate: { name: 'Heavenly Judgment', damage: 115, mana: 52, cooldown: 17, range: 10, effect: 'stun' },
    synergy: { with: ['fire', 'wind'], name: 'Plasma Storm', bonus: 1.5 }
  },
  earth: {
    id: 'earth', name: 'Earth', icon: '🪨', color: 0x78716c, accent: '#a8a29e',
    description: 'Unbreakable walls and crushing quakes',
    speed: 0.88,
    basic: { name: 'Stone Spike', damage: 18, mana: 0, cooldown: 0.25, range: 4.2, style: 'melee' },
    skill1: { name: 'Earthen Wall', damage: 0, mana: 18, cooldown: 4.5, range: 3.5, effect: 'barrier' },
    skill2: { name: 'Seismic Quake', damage: 52, mana: 28, cooldown: 6.5, range: 5.5 },
    ultimate: { name: 'Titan Crush', damage: 100, mana: 52, cooldown: 18, range: 6.5, effect: 'knockup' },
    synergy: { with: ['water', 'dark'], name: 'Mud Prison', bonus: 1.35 }
  },
  antimagic: {
    id: 'antimagic', name: 'Anti-Magic', icon: '🗡️', color: 0x1e1b4b, accent: '#6366f1',
    description: 'Nullifies any spell – the ultimate counter',
    speed: 1.08,
    basic: { name: 'Null Slash', damage: 22, mana: 0, cooldown: 0.24, range: 2.6, effect: 'nullify', style: 'melee' },
    skill1: { name: 'Magic Break', damage: 40, mana: 16, cooldown: 3.8, range: 3.2, effect: 'nullify' },
    skill2: { name: 'Black Divider', damage: 62, mana: 26, cooldown: 5.5, range: 4.2, effect: 'nullify' },
    ultimate: { name: 'Demon-Dweller', damage: 135, mana: 48, cooldown: 15, range: 5.2, effect: 'nullify' },
    synergy: { with: ['dark', 'spatial'], name: 'Void Rupture', bonus: 1.45 }
  },
  spatial: {
    id: 'spatial', name: 'Spatial', icon: '🌀', color: 0x6366f1, accent: '#818cf8',
    description: 'Warp space – portals and team relocation',
    speed: 1.12,
    basic: { name: 'Spatial Cut', damage: 15, mana: 0, cooldown: 0.2, range: 5.5, style: 'ranged' },
    skill1: { name: 'Short Warp', damage: 12, mana: 12, cooldown: 2.8, range: 9, effect: 'teleport' },
    skill2: { name: 'Portal Gate', damage: 0, mana: 28, cooldown: 7.5, range: 12, effect: 'portal' },
    ultimate: { name: 'Spatial Domination', damage: 90, mana: 52, cooldown: 18, range: 8, effect: 'teleport' },
    synergy: { with: ['dark', 'antimagic'], name: 'Void Rupture', bonus: 1.45 }
  }
};

const MAGIC_LIST = Object.values(MAGICS);

function getMagic(id) {
  return MAGICS[id] || MAGICS.dark;
}

function getSynergy(magicA, magicB) {
  if (!magicA || !magicB) return null;
  const a = getMagic(magicA);
  const b = getMagic(magicB);
  if (a.synergy && a.synergy.with.includes(b.id)) return a.synergy;
  if (b.synergy && b.synergy.with.includes(a.id)) return b.synergy;
  return null;
}
