// The colour arc. Every base colour passes through the active LIGHT, so one
// character model reads correctly in every chapter.
const PAL = {
  open:   { name: 'Cold open: the cupboard', swatches: ['#0d0a0a', '#1d1714', '#3a2a1c', '#b8893a', '#f3d58a', '#ffe9b8'] },
  work:   { name: '2027: sodium orange / tired grey-green', swatches: ['#1c1814', '#3b3a30', '#5d6a57', '#8e9a7e', '#c8692e', '#f29a3a', '#ffc36b'] },
  fear:   { name: 'The letter: grey-green daylight', swatches: ['#2f332c', '#5a6353', '#8d9582', '#b9bca6', '#ddd8c2', '#e9e2cc'] },
  winter: { name: '2028: cold blues', swatches: ['#141c30', '#26345a', '#3f5584', '#6f86b2', '#aebfdc', '#e8eef6', '#f4c77a'] },
  turn:   { name: '2029: thaw into morning gold', swatches: ['#3b2616', '#8a5a34', '#e9a860', '#f6d58e', '#fbf0d9', '#9cc3d9', '#8fae6a'] },
  memory: { name: 'Memory: sepia', swatches: ['#3e2a18', '#6e4c2c', '#a47b4f', '#d8b98a', '#efdcb8'] },
  night:  { name: 'Saturn night', swatches: ['#0b1024', '#16213d', '#2c3b66', '#8a7fb8', '#e8d49a', '#fff6dc'] },
  gold:   { name: '2031 to 2040: morning gold', swatches: ['#4a3322', '#c7803f', '#eeb45e', '#f9dc8e', '#fdf3dc', '#a8cfe0', '#7fa860'] },
  end:    { name: '2047: deep indigo and starlight', swatches: ['#07071a', '#141433', '#26235a', '#46407e', '#9c8fd0', '#ffcf7a', '#fff8e6'] },
};

// LIGHT presets. key = multiply colour, k = how much, amb = ambient lift,
// shadow = the cel shadow tint, ink = line colour for the chapter.
const LIGHTS = {
  neutral: { id: 'neutral', key: '#ffffff', k: 0, shadow: '#b9a9c0', ink: '#2a1c14' },
  cupboard:{ id: 'cupboard', key: '#3a3040', k: 0.85, shadow: '#3a3048', ink: '#0c0806', sat: 0.8 },
  blade:   { id: 'blade', key: '#ffe2a8', k: 0.35, shadow: '#6a4a40', ink: '#1a100a' },
  sodium:  { id: 'sodium', key: '#ffb266', k: 0.62, amb: '#3b2a1c', ambK: 0.08, shadow: '#7a5a6a', ink: '#24150d', sat: 0.9 },
  sodiumDim:{ id: 'sodiumDim', key: '#c9844a', k: 0.75, amb: '#2a2018', ambK: 0.1, shadow: '#5a4458', ink: '#1c110a', sat: 0.85 },
  led:     { id: 'led', key: '#e6ecea', k: 0.4, amb: '#8e9a7e', ambK: 0.08, shadow: '#7f8a9a', ink: '#23211d', sat: 0.8 },
  dawn:    { id: 'dawn', key: '#c9d3bd', k: 0.45, amb: '#8e9a7e', ambK: 0.1, shadow: '#8a8aa0', ink: '#2a2620', sat: 0.8 },
  greyday: { id: 'greyday', key: '#c3c8b4', k: 0.5, amb: '#8d9582', ambK: 0.12, shadow: '#8c8ea0', ink: '#2d2a26', sat: 0.7 },
  winter:  { id: 'winter', key: '#9fb3db', k: 0.6, amb: '#3f5584', ambK: 0.12, shadow: '#6a78a8', ink: '#161c2e', sat: 0.75 },
  winterIn:{ id: 'winterIn', key: '#b4c1dc', k: 0.5, amb: '#6f86b2', ambK: 0.1, shadow: '#7c86b0', ink: '#1a2030', sat: 0.8 },
  hallWarm:{ id: 'hallWarm', key: '#ffd49a', k: 0.45, amb: '#6a4a30', ambK: 0.06, shadow: '#9a7a8a', ink: '#2a1a10' },
  thaw:    { id: 'thaw', key: '#d9d6c8', k: 0.35, amb: '#b9bca6', ambK: 0.08, shadow: '#9a98ac', ink: '#2c2822' },
  hallNight:{ id: 'hallNight', key: '#56608a', k: 0.8, amb: '#1a2040', ambK: 0.1, shadow: '#3a3a60', ink: '#0e0e1a', sat: 0.7 },
  gold:    { id: 'gold', key: '#ffe0a8', k: 0.35, amb: '#f6d58e', ambK: 0.06, shadow: '#b08a9a', ink: '#3b2616' },
  memory:  { id: 'memory', key: '#e8c890', k: 0.55, amb: '#a47b4f', ambK: 0.14, shadow: '#9a7458', ink: '#4a3220', sat: 0.35 },
  night:   { id: 'night', key: '#7482b8', k: 0.7, amb: '#16213d', ambK: 0.12, shadow: '#3c4270', ink: '#0c1022', sat: 0.8 },
  goldHour:{ id: 'goldHour', key: '#ffc98a', k: 0.45, amb: '#eeb45e', ambK: 0.06, shadow: '#a0708a', ink: '#3a2414' },
  end:     { id: 'end', key: '#6c68b0', k: 0.72, amb: '#141433', ambK: 0.14, shadow: '#302c64', ink: '#0a0a1c', sat: 0.75 },
};

// the characters' base colours (graded by LIGHT at draw time)
const COL = {
  skin: '#f0c7a4', skinSh: '#d39a7e', cheek: '#e8a08a', lip: '#c9786a',
  nellHair40: '#4a2e22', nellHair50: '#6a4d3e', nellGrey: '#a6a09a', nellHair70: '#e2ddd6',
  eye: '#2a1a14', white: '#fbf6ec',
  rust: '#b5553a', rustDk: '#8d3f2c', vest: '#e3d84a', vestBand: '#e8e8e0', navy: '#3a4660', denim: '#4b5d7e',
  cream: '#efe3c8', coat: '#5b5e4c', coatWinter: '#40486a', scarf: '#c2653e',
  samHair: '#8a4a2a', samJumper: '#5f8a5a', samYellow: '#e0b44a', samCoat: '#c46a3a',
  dadJacket: '#34405a', dadCap: '#4a4a44', dadHair: '#6a5a4a', dadSkin: '#e8b894',
  girlHat: '#c0473a', girlCoat: '#e8c14a', blanket: '#8a4a4a', blanket2: '#d9b06a',
  glove: '#8a8a7a', gloveDk: '#6a6a5a',
  brass: '#c29240', brassDk: '#7a5520', brassHi: '#f8e2a0', brassOld: '#9a7a3e',
  wood: '#8a5a34', woodDk: '#5c3a20', leather: '#4a2e1e', glass: '#9ab8c4',
  paper: '#efe6cf', pencil: '#5a5048',
};
