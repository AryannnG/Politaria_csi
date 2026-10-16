import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

const materialTextures = new Map();
const SIZE = 512;

function rng(seed) {
  let value = seed;
  return () => { value = (value * 16807) % 2147483647; return value / 2147483647; };
}

function paintAlbedo(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const next = rng({ asphalt: 31, paving: 17, brick: 41, roof: 53, stone: 67, plaster: 79, water: 97 }[kind] ?? 23);
  const base = { asphalt: '#343a3d', paving: '#9a978c', brick: '#8f5943', roof: '#68463b', stone: '#b2a891', plaster: '#c8c1ae', water: '#39717b' }[kind] ?? '#c8c1ae';
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  if (kind === 'water') {
    for (let i = 0; i < 1200; i += 1) {
      const x = next() * SIZE; const y = next() * SIZE;
      ctx.strokeStyle = `rgba(${130 + Math.floor(next() * 60)},${184 + Math.floor(next() * 48)},${190 + Math.floor(next() * 46)},${0.025 + next() * 0.09})`;
      ctx.lineWidth = 0.5 + next() * 2.2;
      ctx.beginPath(); ctx.ellipse(x, y, 4 + next() * 27, 0.5 + next() * 2.3, (next() - 0.5) * 0.35, 0, Math.PI * (0.4 + next() * 1.4)); ctx.stroke();
    }
    for (let i = 0; i < 100; i += 1) {
      ctx.fillStyle = `rgba(221,235,222,${next() * 0.1})`;
      ctx.beginPath(); ctx.arc(next() * SIZE, next() * SIZE, 0.6 + next() * 2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'asphalt') {
    for (let i = 0; i < 11000; i += 1) {
      const shade = Math.floor(50 + next() * 74);
      ctx.fillStyle = `rgba(${shade},${shade + 2},${shade + 3},${0.08 + next() * 0.23})`;
      const size = 0.5 + next() * 2.6;
      ctx.fillRect(next() * SIZE, next() * SIZE, size, size);
    }
    for (let i = 0; i < 24; i += 1) {
      ctx.strokeStyle = `rgba(20,23,25,${0.12 + next() * 0.15})`;
      ctx.lineWidth = 1 + next() * 2;
      const x = next() * SIZE; const y = next() * SIZE;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x + (next()-.5)*38,y + 16 + next()*48); ctx.lineTo(x + (next()-.5)*61,y + 25 + next()*55); ctx.stroke();
    }
    for (let y = 0; y < SIZE; y += 116) {
      ctx.fillStyle = 'rgba(173,165,143,.08)'; ctx.fillRect(0, y, SIZE, 2);
    }
  } else if (kind === 'paving') {
    ctx.strokeStyle = 'rgba(53,54,50,.42)'; ctx.lineWidth = 3;
    for (let y = 0; y <= SIZE; y += 64) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(SIZE,y); ctx.stroke(); }
    for (let row = 0; row < SIZE / 64; row += 1) {
      const offset = row % 2 ? 32 : 0;
      for (let x = -64 + offset; x <= SIZE; x += 64) { ctx.beginPath(); ctx.moveTo(x,row*64); ctx.lineTo(x,(row+1)*64); ctx.stroke(); }
    }
    for (let i = 0; i < 4200; i += 1) {
      const shade = Math.floor(80 + next()*110);
      ctx.fillStyle = `rgba(${shade},${shade},${shade-2},${next()*0.13})`;
      ctx.fillRect(next()*SIZE,next()*SIZE,1+next()*4,1+next()*3);
    }
  } else if (kind === 'brick') {
    const bw = 76; const bh = 34;
    for (let row = 0; row < SIZE / bh + 1; row += 1) {
      const shift = row % 2 ? -bw / 2 : 0;
      for (let x = shift; x < SIZE; x += bw) {
        const light = Math.floor(next()*28);
        ctx.fillStyle = `rgb(${137+light},${78+light},${57+light})`;
        ctx.fillRect(x+2,row*bh+2,bw-4,bh-4);
        ctx.fillStyle = 'rgba(250,213,173,.08)'; ctx.fillRect(x+4,row*bh+3,bw-8,2);
      }
    }
    ctx.strokeStyle = 'rgba(205,190,165,.72)'; ctx.lineWidth = 3;
    for (let y = 0; y <= SIZE; y += bh) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(SIZE,y); ctx.stroke(); }
    for (let row = 0; row < SIZE / bh; row += 1) {
      const shift = row % 2 ? -bw/2 : 0;
      for (let x = shift; x <= SIZE; x += bw) { ctx.beginPath(); ctx.moveTo(x,row*bh); ctx.lineTo(x,(row+1)*bh); ctx.stroke(); }
    }
  } else if (kind === 'roof') {
    for (let y = -24; y < SIZE + 24; y += 34) {
      const offset = Math.floor(y/34)%2 ? -38 : 0;
      for (let x = offset; x < SIZE + 40; x += 76) {
        const r = 95 + Math.floor(next()*56); const g = 45 + Math.floor(next()*37); const b = 31 + Math.floor(next()*27);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath(); ctx.moveTo(x,y+4); ctx.lineTo(x+70,y+4); ctx.lineTo(x+63,y+30); ctx.lineTo(x+7,y+30); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(232,192,151,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x+7,y+8); ctx.lineTo(x+63,y+8); ctx.stroke();
      }
    }
  } else {
    for (let i = 0; i < 9500; i += 1) {
      const shade = Math.floor(85 + next() * 140);
      ctx.fillStyle = `rgba(${shade},${shade-1},${shade-4},${0.025 + next()*0.1})`;
      ctx.fillRect(next()*SIZE,next()*SIZE,0.6+next()*3.4,0.6+next()*3.4);
    }
    for (let y = 26; y < SIZE; y += 88) {
      ctx.fillStyle = 'rgba(61,54,45,.12)'; ctx.fillRect(0,y,SIZE,2);
    }
  }
  return canvas;
}

function makeTexture(canvas, colorSpace = null) {
  if (!canvas) return null;
  const texture = new CanvasTexture(canvas);
  if (colorSpace) texture.colorSpace = colorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeNormalCanvas(kind) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = SIZE;
  const context = canvas.getContext('2d'); if (!context) return null;
  const image = context.createImageData(SIZE, SIZE);
  const field = new Float32Array(SIZE * SIZE);
  const next = rng({ asphalt: 113, paving: 131, brick: 149, roof: 167, stone: 181, plaster: 197 }[kind] ?? 89);
  for (let i = 0; i < field.length; i += 1) field[i] = next();
  const brick = kind === 'brick'; const tile = kind === 'roof'; const slab = kind === 'paving';
  for (let y = 0; y < SIZE; y += 1) for (let x = 0; x < SIZE; x += 1) {
    const index = y * SIZE + x;
    let height = field[index] * (kind === 'asphalt' ? 0.13 : 0.045);
    if (brick && (y % 34 < 3 || (x + (Math.floor(y/34)%2 ? 38 : 0)) % 76 < 3)) height += 0.42;
    if (tile && (y % 34 < 3 || (x + (Math.floor(y/34)%2 ? 38 : 0)) % 76 < 3)) height += 0.32;
    if (slab && (x % 64 < 3 || y % 64 < 3)) height += 0.35;
    const left = field[y*SIZE + Math.max(0,x-1)]; const right = field[y*SIZE + Math.min(SIZE-1,x+1)];
    const up = field[Math.max(0,y-1)*SIZE+x]; const down = field[Math.min(SIZE-1,y+1)*SIZE+x];
    let nx = -(right-left) * (kind === 'asphalt' ? 1.35 : 0.45);
    let ny = -(down-up) * (kind === 'asphalt' ? 1.35 : 0.45);
    if (height > 0.3) { nx = (x%2 ? -0.45 : 0.45); ny = (y%2 ? -0.45 : 0.45); }
    const length = Math.hypot(nx,ny,1);
    image.data[index*4] = Math.round((nx/length * .5 + .5)*255);
    image.data[index*4+1] = Math.round((ny/length * .5 + .5)*255);
    image.data[index*4+2] = Math.round((1/length * .5 + .5)*255);
    image.data[index*4+3] = 255;
  }
  context.putImageData(image,0,0);
  return canvas;
}

function makeRoughnessCanvas(kind) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = SIZE;
  const context = canvas.getContext('2d'); if (!context) return null;
  const next = rng(211 + kind.length * 13);
  const base = kind === 'glass' ? 115 : kind === 'roof' ? 208 : kind === 'asphalt' ? 226 : kind === 'water' ? 84 : 190;
  context.fillStyle = `rgb(${base},${base},${base})`; context.fillRect(0,0,SIZE,SIZE);
  for (let i=0;i<6000;i+=1) { const v=Math.max(70,Math.min(255,base+(next()-.5)*52)); context.fillStyle=`rgba(${v},${v},${v},.17)`; context.fillRect(next()*SIZE,next()*SIZE,1+next()*4,1+next()*4); }
  return canvas;
}

export function makeCityMaps(kind = 'plaster') {
  if (!materialTextures.has(kind)) {
    const albedo = paintAlbedo(kind);
    const normal = makeNormalCanvas(kind);
    const roughness = makeRoughnessCanvas(kind);
    const map = makeTexture(albedo, SRGBColorSpace);
    if (map) map.repeat.set(kind === 'asphalt' ? 3 : 1.2, kind === 'asphalt' ? 3 : 1.2);
    const normalMap = makeTexture(normal);
    const roughnessMap = makeTexture(roughness);
    if (normalMap) normalMap.repeat.copy(map?.repeat ?? { x: 1, y: 1 });
    if (roughnessMap) roughnessMap.repeat.copy(map?.repeat ?? { x: 1, y: 1 });
    materialTextures.set(kind, { map, normalMap, roughnessMap });
  }
  return materialTextures.get(kind);
}

export function makeCityTexture(kind = 'plaster') {
  return makeCityMaps(kind).map;
}
