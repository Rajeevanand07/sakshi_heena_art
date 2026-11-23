// WebGL version of the gallery canvas, with the "inverse mirror" edge effect
// from the reference site: a band along every edge shows a flipped reflection
// of the content just inside it, with red/blue colour fringes. The faster you
// scroll, the more the reflection is squashed.
//
// How it works:
//   1. Each photo card (number + photo + caption) and each heading block is
//      drawn once into its own 2D canvas and uploaded as a texture. Copies of
//      the same item share it.
//   2. Every frame, the cards are positioned (same wrap-around maths as the DOM
//      version) and rendered into an off-screen image.
//   3. A full-screen shader copies that image to the screen, bending the
//      pixels near the edges and splitting the colour channels, then draws the
//      fixed grid lines on top (so the grid is never distorted).
//
// This file is loaded on demand (dynamic import), so Three.js never delays the
// first paint. The DOM version shows until this is ready.

import {
  ColorManagement,
  LinearSRGBColorSpace,
  CanvasTexture,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';

// No colour conversions anywhere: canvas pixels go to the screen unchanged.
ColorManagement.enabled = false;

const BG = [0xf4 / 255, 0xf5 / 255, 0xf5 / 255];
const GRID_ALPHA = 0.06;

// ---- Effect tuning ----
const EDGE_BAND_X = 44; // px from the left/right edge with the effect (desktop)
const EDGE_BAND_Y = 34; // px from the top/bottom edge (desktop)
const BASE_AMOUNT = 0.8; // stretch while still
const SPEED_AMOUNT = 0.92; // extra stretch per px/frame of scroll speed
const MAX_AMOUNT = 4;
const REACH = 1; // stretch power = 1 + amount * REACH
const FRINGE = 4; // px red and blue split apart at the edge (grows with speed)
const FOLD = 0.28; // outer 28% of the band is the flipped mirror
const REFLECT = 1.1; // mirror shows ~1.1 bands of content, squashed

const mod = (n, m) => ((n % m) + m) % m;

// ---------------------------------------------------------------------------
// Drawing cards into 2D canvases (matches the DOM styles in styles.css)
// ---------------------------------------------------------------------------

const FONT = '"Google Sans Flex", system-ui, sans-serif';
const COLORS = { text: '#1c1c1c', muted: '#9b9b9b', heading: '#222222', body: '#808080', media: '#e4e2dd' };

function typeScale(mobile) {
  return mobile
    ? { labelH: 20, label: 11, captionPad: 6, caption: 12, meta: 12, metaGap: 12, body: 13, bodyGap: 8 }
    : { labelH: 26, label: 13, captionPad: 10, caption: 14, meta: 16, metaGap: 22, body: 19, bodyGap: 16 };
}

function makeCanvas(w, h, dpr) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w * dpr));
  canvas.height = Math.max(1, Math.ceil(h * dpr));
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.scale(dpr, dpr);
  // Opaque page-colour background (the grid is added back by the shader).
  ctx.fillStyle = '#f4f5f5';
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr); // whole canvas, incl. rounded-up row
  ctx.textBaseline = 'top';
  return { canvas, ctx };
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCover(ctx, img, x, y, w, h) {
  const ir = img.naturalWidth / img.naturalHeight;
  const br = w / h;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  if (ir > br) {
    sw = sh * br;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw / br;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Photo card: number above, photo, title + subtitle below.
function buildImageCard(item, scale, mobile, dpr, onUpdate) {
  const t = typeScale(mobile);
  const w = item.w * scale;
  const h = item.h * scale;
  const cardH = t.labelH + h + t.captionPad + t.caption * 1.35 * 2 + 4;
  const { canvas, ctx } = makeCanvas(w, cardH, dpr);
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;

  const drawText = () => {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `400 ${t.label}px ${FONT}`;
    ctx.fillText(String(item.id).padStart(2, '0'), 0, 2);
    const cy = t.labelH + h + t.captionPad;
    ctx.fillStyle = COLORS.text;
    ctx.font = `400 ${t.caption}px ${FONT}`;
    ctx.fillText(item.title, 0, cy);
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(item.subtitle, 0, cy + t.caption * 1.35 + 2);
  };

  ctx.fillStyle = COLORS.media;
  ctx.fillRect(0, t.labelH, w, h);
  drawText();

  if (item.image) {
    // Blurred preview first, then the real photo (sized for this screen).
    loadImage(item.image.blur)
      .then((img) => {
        drawCover(ctx, img, 0, t.labelH, w, h);
        texture.needsUpdate = true;
        onUpdate();
      })
      .catch(() => {});
    // Same pick rule as the browser's srcset for the hidden DOM <img>, so the
    // photo comes from cache instead of downloading a second size.
    const need = w * (window.devicePixelRatio || 1);
    const pick = item.image.srcSet.find((s) => s.w >= need) || item.image.srcSet[item.image.srcSet.length - 1];
    loadImage(pick.src)
      .then((img) => {
        drawCover(ctx, img, 0, t.labelH, w, h);
        texture.needsUpdate = true;
        onUpdate();
      })
      .catch(() => {});
  }

  return { texture, width: w, height: cardH };
}

// Heading block: big heading, meta line with tag, wrapped paragraph.
function buildTextCard(item, scale, mobile, dpr) {
  const t = typeScale(mobile);
  const boxW = item.w * scale;
  const headingSize = 4.6 * 16 * scale;

  const probe = makeCanvas(1, 1, 1).ctx;
  probe.font = `700 ${headingSize}px ${FONT}`;
  if ('letterSpacing' in probe) probe.letterSpacing = `${-0.04 * headingSize}px`;
  const headingW = probe.measureText(item.heading).width;
  if ('letterSpacing' in probe) probe.letterSpacing = '0px';
  probe.font = `400 ${t.body}px ${FONT}`;
  const bodyLines = wrapLines(probe, item.body, boxW);

  const w = Math.max(boxW, headingW + 4);
  const metaY = headingSize + t.metaGap;
  const bodyY = metaY + t.meta * 1.3 + t.bodyGap;
  const cardH = bodyY + bodyLines.length * t.body * 1.5 + 4;

  const { canvas, ctx } = makeCanvas(w, cardH, dpr);
  ctx.fillStyle = COLORS.heading;
  ctx.font = `700 ${headingSize}px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${-0.04 * headingSize}px`;
  ctx.fillText(item.heading, 0, 0);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  ctx.font = `400 ${t.meta}px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(item.meta, 0, metaY);
  const metaW = ctx.measureText(item.meta).width;
  ctx.fillStyle = COLORS.muted;
  ctx.fillText(item.tag, metaW + 20, metaY);

  ctx.font = `400 ${t.body}px ${FONT}`;
  ctx.fillStyle = COLORS.body;
  bodyLines.forEach((line, i) => ctx.fillText(line, 0, bodyY + i * t.body * 1.5 + (t.body * 0.25)));

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return { texture, width: w, height: cardH };
}

// ---------------------------------------------------------------------------
// The edge shader
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D tScene;
  uniform vec2 uRes;      // screen size in CSS px
  uniform vec2 uBand;     // edge band size in CSS px (x: left/right, y: top/bottom)
  uniform vec2 uMargin;   // extra px rendered beyond each screen edge
  uniform float uAmount;  // squeeze strength
  uniform float uReach;   // stretch power gained per unit of amount
  uniform float uFringe;  // px the red/blue channels shift apart in the band
  uniform float uFold;    // where the mirror zone ends (fraction of the band)
  uniform float uReflect; // how much content the mirror zone reflects (in bands)
  uniform float uDpr;
  uniform float uCell;    // grid cell size in CSS px
  uniform vec3 uBg;
  uniform float uGridAlpha;
  varying vec2 vUv;

  // Edge band, measured as x = distance from the edge / band (0 at the edge):
  //   x > fold : STRETCH zone. Content entering the band is pulled out toward
  //              the fold, getting taller/wider until it thins into streaks.
  //   x < fold : MIRROR zone. A small, squashed, flipped reflection of the
  //              content nearest the edge (the "inverse mirror").
  // g(x) is where (in band units from the edge) each screen pixel samples.
  float edgeMap(float x, float pw) {
    if (x > uFold) return pow((x - uFold) / (1.0 - uFold), pw);
    return (uFold - x) / uFold * uReflect;
  }

  // p is in px from the low edge, len is the screen size on that axis.
  float bend(float p, float len, float band, float pw) {
    if (p < band) return edgeMap(p / band, pw) * band;
    float q = len - p;
    if (q < band) return len - edgeMap(q / band, pw) * band;
    return p;
  }

  // shift: px this colour channel is pushed sideways inside the band, so red
  // and blue separate into fringes on either side of the stretched shapes.
  vec2 bendUv(float amount, float shift) {
    vec2 p = vUv * uRes;
    float pw = 1.0 + amount * uReach; // stronger with scroll speed
    vec2 s = vec2(bend(p.x, uRes.x, uBand.x, pw), bend(p.y, uRes.y, uBand.y, pw));
    // How deep into a band this pixel is (0 outside, 1 at the screen edge).
    vec2 d = min(p, uRes - p);
    vec2 w = clamp(1.0 - d / uBand, 0.0, 1.0);
    // Shift along the edge: sideways in the top/bottom bands, up/down in the
    // left/right bands (like the reference's left-blue / right-red letters).
    s += shift * vec2(w.y, w.x) * (0.6 + amount * 0.35);
    return (s + uMargin) / (uRes + 2.0 * uMargin);
  }

  void main() {
    // Each colour channel bends a little differently -> red/blue fringes.
    // Each colour channel bends and shifts differently -> strong red/blue
    // fringes (blue on one side of a shape, red/yellow on the other).
    float r = texture2D(tScene, bendUv(uAmount * 0.7, uFringe)).r;
    float g = texture2D(tScene, bendUv(uAmount, 0.0)).g;
    float b = texture2D(tScene, bendUv(uAmount * 1.4, -uFringe)).b;
    vec3 color = vec3(r, g, b);

    // Fixed 1px grid lines (same as the old CSS grid), never distorted.
    vec2 px = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
    vec2 cell = mod(px, uCell);
    float line = step(cell.x, 1.0) + step(cell.y, 1.0);
    // Only draw grid over empty background, like the CSS grid behind the cards.
    float onBg = step(distance(color, uBg), 0.02);
    color = mix(color, vec3(0.0), min(line, 1.0) * uGridAlpha * onBg);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------

export function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function createEdgeRenderer({ canvas, mobile, requestRender }) {
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0xf4f5f5, 1);

  const scene = new Scene();
  const camera = new OrthographicCamera(0, 1, 0, -1, -10, 10);
  const geometry = new PlaneGeometry(1, 1);
  const target = new WebGLRenderTarget(1, 1, { depthBuffer: false });
  target.texture.minFilter = LinearFilter;
  target.texture.magFilter = LinearFilter;

  const post = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tScene: { value: target.texture },
      uRes: { value: new Vector2(1, 1) },
      uBand: { value: new Vector2(EDGE_BAND_X, EDGE_BAND_Y) },
      uMargin: { value: new Vector2(0, 0) },
      uAmount: { value: BASE_AMOUNT },
      uReach: { value: REACH },
      uFold: { value: FOLD },
      uFringe: { value: FRINGE },
      uReflect: { value: REFLECT },
      uDpr: { value: dpr },
      uCell: { value: 256 },
      uBg: { value: new Vector3(...BG) },
      uGridAlpha: { value: GRID_ALPHA },
    },
  });
  const postScene = new Scene();
  const postMesh = new Mesh(new PlaneGeometry(2, 2), post);
  postMesh.frustumCulled = false;
  postScene.add(postMesh);
  const postCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let meshes = [];
  let cards = new Map();
  let layout = null;
  let amount = BASE_AMOUNT;

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const bandScale = mobile ? 0.6 : 1;
    const bandX = EDGE_BAND_X * bandScale;
    const bandY = EDGE_BAND_Y * bandScale;
    // The mirror only samples inward, so no off-screen margin is needed.
    const mx = 0;
    const my = 0;
    renderer.setSize(w, h, false);
    target.setSize(Math.ceil((w + 2 * mx) * dpr), Math.ceil((h + 2 * my) * dpr));
    camera.left = -mx;
    camera.right = w + mx;
    camera.top = my;
    camera.bottom = -(h + my);
    camera.updateProjectionMatrix();
    post.uniforms.uRes.value.set(w, h);
    post.uniforms.uMargin.value.set(mx, my);
    post.uniforms.uCell.value = w < 768 ? w / 3 : 256;
    post.uniforms.uBand.value.set(bandX, bandY);
  };

  const clearCards = () => {
    meshes.forEach((m) => scene.remove(m));
    meshes = [];
    cards.forEach((c) => {
      c.texture.dispose();
      c.material.dispose();
    });
    cards = new Map();
  };

  // (Re)build textures and meshes for a layout from InfiniteCanvas.
  const setLayout = (next) => {
    clearCards();
    layout = next;
    resize();
    for (const c of next.copies) {
      let card = cards.get(c.id);
      if (!card) {
        const built =
          c.type === 'text'
            ? buildTextCard(c, next.scale, mobile, dpr)
            : buildImageCard(c, next.scale, mobile, dpr, requestRender);
        card = { ...built, material: new MeshBasicMaterial({ map: built.texture, toneMapped: false }) };
        cards.set(c.id, card);
      }
      const mesh = new Mesh(geometry, card.material);
      mesh.scale.set(card.width, card.height, 1);
      mesh.userData = { copy: c, card };
      scene.add(mesh);
      meshes.push(mesh);
    }
  };

  // Draw one frame at camera offset (cx, cy). speed = px moved this frame.
  const render = (cx, cy, speed) => {
    if (!layout) return;
    const { totalW, totalH, padX, padY } = layout;
    for (const mesh of meshes) {
      const { copy, card } = mesh.userData;
      const x = mod(copy.baseX + cx + padX, totalW) - padX;
      const y = mod(copy.baseY + cy + padY, totalH) - padY;
      mesh.position.set(x + card.width / 2, -(y + card.height / 2), 0);
    }
    const goal = Math.min(MAX_AMOUNT, BASE_AMOUNT + speed * SPEED_AMOUNT);
    amount += (goal - amount) * 0.25;
    post.uniforms.uAmount.value = amount;

    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
  };

  // True while the stretch is still easing back to its resting strength,
  // so the canvas keeps drawing frames until it has settled.
  const isSettling = () => Math.abs(amount - BASE_AMOUNT) > 0.01;

  const dispose = () => {
    clearCards();
    geometry.dispose();
    post.dispose();
    postMesh.geometry.dispose();
    target.dispose();
    renderer.dispose();
  };

  // Zoom the cards around the screen centre (1 = normal). Used by the opening
  // animation; the grid lines are drawn in the shader, so they don't zoom.
  const setZoom = (z) => {
    camera.zoom = z;
    camera.updateProjectionMatrix();
  };

  return { setLayout, render, resize, isSettling, setZoom, dispose };
}
