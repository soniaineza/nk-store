/* ══════════════════════════════════════════════════════════════════════
   Hero WebGL — a glass serum bottle floating in a drawn studio.
   Desktop-only, reduced-motion aware, pauses off-route, disposes cleanly.
   The still SVG underneath is the fallback and is never removed until
   WebGL has actually painted.
   ═══════════════════════════════════════════════════════════════════ */
let hero = null;

window.mountHero = async function mountHero(){
  const canvas = document.getElementById('heroGL');
  if (!canvas || hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 820px)').matches;
  if (reduced || small) return;                       // fallback stays

  let THREE;
  try { THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js'); }
  catch { return; }

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(0, 0, 8.2);

    /* studio environment, drawn not fetched */
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 256);
    bg.addColorStop(0, '#FFF6EE'); bg.addColorStop(.52, '#F3E2DC'); bg.addColorStop(1, '#E3CFC6');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 256);
    const soft = (x, y, r, col) => {
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 512, 256);
    };
    soft(130, 54, 150, 'rgba(255,255,255,.95)');
    soft(390, 92, 110, 'rgba(236,205,170,.75)');
    soft(256, 206, 140, 'rgba(199,138,131,.42)');
    const envTex = new THREE.CanvasTexture(c);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromEquirectangular(envTex);
    scene.environment = envRT.texture;
    envTex.dispose(); pmrem.dispose();

    /* multiple bottle silhouettes, revolved */
    const profiles = [
      [[0,0],[.52,0],[.56,.06],[.56,1.5],[.52,1.6],[.3,1.76],[.28,1.86],[.33,1.94],[.33,2.04],[0,2.04]],
      [[0,0],[.4,0],[.5,.2],[.5,1.6],[.3,1.8],[.1,2.0],[0,2.04]],
      [[0,0],[.6,0],[.7,.1],[.7,1.4],[.5,1.6],[.3,1.8],[.25,2.0]]
    ];
    const bottles = [];
    profiles.forEach((prof, idx) => {
      const glassGeo = new THREE.LatheGeometry(prof.map(([x,y]) => new THREE.Vector2(x, y - 1.05)), 72);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xFBEFE6, transmission: .94, thickness: 1.25, roughness: .07, ior: 1.46,
        clearcoat: 1, clearcoatRoughness: .04 + idx * .02, envMapIntensity: 1.5 - idx * .2,
        attenuationColor: new THREE.Color(0xE8C8BC), attenuationDistance: 2.4
      });
      const bottle = new THREE.Mesh(glassGeo, glassMat);
      bottle.position.x = (idx - 1) * 1.3;
      bottle.position.y = 1.2 + idx * .1;
      bottle.rotation.z = idx * .1;
      scene.add(bottle);
      bottles.push(bottle);
    });

    const group = new THREE.Group();
    bottles.forEach(b => group.add(b));
    scene.add(group);

    scene.add(new THREE.AmbientLight(0xFFF0E6, 1.2));
    const key = new THREE.DirectionalLight(0xFFF6EC, 2.8); key.position.set(4, 6, 5); scene.add(key);
    const rimLight = new THREE.PointLight(0xC78A83, 50, 30, 2); rimLight.position.set(-4, -1.5, 3); scene.add(rimLight);

    /* enhanced motes */
    const N = 200, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++){
      pos[i*3] = (Math.random()-.5)*9; pos[i*3+1] = (Math.random()-.5)*9; pos[i*3+2] = (Math.random()-.5)*5;
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sp = document.createElement('canvas'); sp.width = sp.height = 32;
    { const x = sp.getContext('2d'); const rg = x.createRadialGradient(16,16,0,16,16,16);
      rg.addColorStop(0,'rgba(255,245,232,1)'); rg.addColorStop(1,'rgba(230,195,190,0)');
      x.fillStyle = rg; x.fillRect(0,0,32,32); }
    const dustTex = new THREE.CanvasTexture(sp);
    const dmat = new THREE.PointsMaterial({ size:.04, map:dustTex, transparent:true,
      blending:THREE.AdditiveBlending, depthWrite:false, opacity:.7, sizeAttenuation:true });
    const dust = new THREE.Points(dgeo, dmat);
    dust.rotation.y = .1;
    scene.add(dust);

    /* orbiting rings */
    const N_RINGS = 4;
    for (let i = 0; i < N_RINGS; i++){
      const ringGeo = new THREE.TorusGeometry(.25 + i * .15, .03, 16, 32);
      const ringMat = new THREE.MeshPhysicalMaterial({ color: 0xC6A87B, metalness: 1, roughness: .2 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = .8 + i * .15;
      ring.userData.speed = .1 + i * .05;
      scene.add(ring);
    }

    const ptr = { x:0, y:0, tx:0, ty:0 };
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      ptr.tx = ((e.clientX - r.left) / r.width - .5) * 2;
      ptr.ty = ((e.clientY - r.top) / r.height - .5) * 2;
    };
    addEventListener('pointermove', onMove, { passive:true });

    const resize = () => {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

    let raf = 0, t0 = performance.now(), clock = 0, painted = false, running = true;
    const loop = now => {
      raf = requestAnimationFrame(loop);
      if (!running) return;
      const dt = Math.min(.05, (now - t0) / 1000); t0 = now; clock += dt;
      ptr.x += (ptr.tx - ptr.x) * Math.min(1, dt * 2.4);
      ptr.y += (ptr.ty - ptr.y) * Math.min(1, dt * 2.4);
      
      // Rotate multiple bottles
      bottles.forEach((b, i) => {
        b.rotation.y += 0.01 * (i % 2 === 0 ? 1 : -1);
        b.rotation.x += 0.005;
      });
      
      group.rotation.y = ptr.x * .55 + Math.sin(clock * .22) * .1;
      group.rotation.x = -ptr.y * .2;
      group.position.y = Math.sin(clock * .5) * .09;
      camera.position.x = ptr.x * .5; camera.position.y = -ptr.y * .3;
      camera.lookAt(0, 0, 0);
      rim.position.x = -3.4 + ptr.x * 2.2;
      
      // Rotate rings
      scene.traverse(object => {
        if (object.isMesh && object.userData.speed) {
          object.rotation.y += object.userData.speed;
        }
      });
      
      dust.rotation.y = clock * .03;
      renderer.render(scene, camera);
      if (!painted){
        painted = true;
        const still = document.getElementById('heroStill');
        const note = document.getElementById('glNote');
        if (still) still.style.display = 'none';
        if (note) note.hidden = false;
      }
    };
    raf = requestAnimationFrame(loop);

    const vis = () => { running = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', vis);

    hero = { dispose(){
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', vis);
      ro.disconnect();
      [glassGeo, capGeo, ringGeo, dgeo].forEach(x => x.dispose());
      [glassMat, capMat, ringMat, dmat].forEach(x => x.dispose());
      dustTex.dispose(); envRT.texture.dispose();
      renderer.dispose();
      hero = null;
    }};
  } catch { hero = null; }
};

window.disposeHero = function(){ hero?.dispose(); };
addEventListener('pagehide', () => window.disposeHero());

/* the router calls these; home may already be rendered by now */
if (location.hash === '' || location.hash === '#home') window.mountHero();
