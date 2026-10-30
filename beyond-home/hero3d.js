// hero3d.js — Three.js house with scroll-driven wall explosion + roof-to-header fly

(function () {

  const canvas   = document.getElementById('hero-canvas');
  const overlays = {
    front: document.getElementById('overlay-front'),
    right: document.getElementById('overlay-right'),
    left:  document.getElementById('overlay-left'),
    back:  document.getElementById('overlay-back'),
  };

  // --- RENDERER ---

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xffffff);

  // --- SCENE + CAMERA ---

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);

  const CAM_START = new THREE.Vector3(8.0, 8.0, 13.0); // initial zoomed-out position
  const CAM_FAR   = new THREE.Vector3(4.5, 4.5,  7.0); // reached when explosion starts
  const CAM_NEAR  = new THREE.Vector3(2.2, 2.2,  2.8); // reached at end of explosion

  // About-section camera: directly in front of the right wall on the +X axis.
  // CAM_ABOUT_LOOK targets the wall centre (homePos 0.5 + EXPLODE_DIST 0.2 = 0.7).
  const CAM_ABOUT      = new THREE.Vector3(3.5,  0.0, 0.0);
  const CAM_ABOUT_LOOK = new THREE.Vector3(0.7,  0.0, 0.0);

  // Phase 2: move down and in close — creates perspective skew.
  // Camera drops below the wall and pulls toward it so the wall
  // fills the viewport with strong foreshortening.
  const CAM_SKEW      = new THREE.Vector3(1.8, 0.05, -0.6);
  const CAM_SKEW_LOOK = new THREE.Vector3(0.9, 0.2,  0.1);
  // Head-tilt (camera roll): lerp camera.up toward this on phase 2.
  // Tilt the up vector in Z to roll the camera around its forward axis.
  // Positive Z tilts counterclockwise; negative Z tilts clockwise.
  const CAM_SKEW_UP   = new THREE.Vector3(0.0, 1.0, 1.5).normalize();

  // Phase 3 (0.65 → 0.85): rotate gaze from skew position toward the top-right
  // corner of the wall. Camera drifts slightly, tilt eases back toward neutral.
  // Top-right of the right wall face: +Y (top) and +Z (screen-right = world +Z).
  // Phase 3: move closer to the corner faced in phase 2 (+Z side),
  // while panning gaze to the opposite corner.
  const CAM_PAN      = new THREE.Vector3(1.5,  0.1, -0.2);
  const CAM_PAN_LOOK = new THREE.Vector3(-1.2,  1.4, -0.001);
  const CAM_PAN_UP   = new THREE.Vector3(0.2,  1.8, -0.8).normalize();

  camera.position.copy(CAM_START);
  camera.lookAt(0, 0.2, 0);

  // --- LIGHTING ---

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));

  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(2, 4, 3);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xffffff, 0.2);
  fill.position.set(-3, 1, -2);
  scene.add(fill);

  // --- HOUSE GROUP ---

  const house = new THREE.Group();
  scene.add(house);

  // --- WALL GEOMETRY ---

  const WALL_SIZE    = 1.0;
  const HALF         = WALL_SIZE / 2;
  const EXPLODE_DIST = 0.2;

  // labelOffset: world-space nudge applied when projecting the label position,
  // so labels float at the edge of each wall rather than dead-centre.
  // Tangent to the wall face (perpendicular to its normal) + slight Y lift.
  const wallDefs = [
    { id: 'front', pos: [ 0,    0,  HALF], dir: [ 0, 0,  1], ry:  0,           labelOffset: [ 0.58, 0.1,  0    ] },
    { id: 'back',  pos: [ 0,    0, -HALF], dir: [ 0, 0, -1], ry:  Math.PI,     labelOffset: [-0.58, 0.1,  0    ] },
    { id: 'left',  pos: [-HALF, 0,  0   ], dir: [-1, 0,  0], ry:  Math.PI / 2, labelOffset: [ 0,    0.1, -0.58 ] },
    { id: 'right', pos: [ HALF, 0,  0   ], dir: [ 1, 0,  0], ry: -Math.PI / 2, labelOffset: [ 0,    0.1,  0.58 ] },
  ];

  const baseMat = new THREE.MeshStandardMaterial({
    color:       0xd0d0cc,
    roughness:   0.85,
    metalness:   0,
    side:        THREE.DoubleSide,
    transparent: true,  // needed so opacity can be animated when non-active walls fade out
    opacity:     1,
  });

  const wallMeshes = wallDefs.map(def => {
    const geo  = new THREE.PlaneGeometry(WALL_SIZE, WALL_SIZE);
    const mesh = new THREE.Mesh(geo, baseMat.clone());
    mesh.position.set(...def.pos);
    mesh.rotation.y = def.ry;
    mesh.userData = {
      id:          def.id,
      homePos:     new THREE.Vector3(...def.pos),
      dir:         new THREE.Vector3(...def.dir),
      labelOffset: new THREE.Vector3(...def.labelOffset),
    };
    house.add(mesh);
    return mesh;
  });

  // --- ROOF (4-sided pyramid) ---

  // transparent: true so we can fade opacity during the fly-away
  const roofMat  = new THREE.MeshStandardMaterial({ color: 0xb8b8b4, roughness: 0.9, transparent: true });
  const roofGeo  = new THREE.ConeGeometry(0.76, 0.5, 4);
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.set(0, HALF + 0.25, 0);
  roofMesh.rotation.y = Math.PI / 4;
  house.add(roofMesh);

  // --- ABOUT SECTION TEXT (PHASES 2 + 3) ---
  //
  // Both texts share one CanvasTexture on a full-wall-face plane (1.0 × 1.0) placed
  // just in front of the right wall.  Canvas is also 1024 × 1024 so both dimensions
  // have equal resolution (1 world unit = 1024 canvas px in both axes).
  //
  // Phase 2 — "WE DON'T CUT CORNERS."
  //   Drawn at canvas (82, 512) rotated −90°, runs bottom-to-top.
  //   Canvas X 82 maps to world Z ≈ 0.42 (the +Z corner of the wall).
  //
  // Phase 3 — "WE LET LIGHT COME INTO THEM."
  //   Drawn horizontally at canvas (512, 8) — no rotation.
  //   Canvas Y ≈ 0 maps to world +Y top of the plane; text runs across the full width.

  const ABOUT_TEXT        = "WE DON'T CUT CORNERS.";
  const PHASE3_TEXT       = "WE LET LIGHT COME INTO THEM.";
  let   aboutTextCharCount  = -1;   // track last rendered count to avoid redundant redraws
  let   phase3TextCharCount = -1;

  const aboutTexCanvas  = document.createElement('canvas');
  aboutTexCanvas.width  = 1024;
  aboutTexCanvas.height = 1024;
  const aboutTexCtx     = aboutTexCanvas.getContext('2d');
  const aboutTexture    = new THREE.CanvasTexture(aboutTexCanvas);

  // MeshBasicMaterial — ignores lighting so the text reads crisply as a surface decal.
  // depthTest: false + renderOrder: 1 avoids THREE.js transparent back-to-front sorting
  // painting the wall over the text when the camera moves past the distance crossover.
  const aboutTextMat  = new THREE.MeshBasicMaterial({
    map:        aboutTexture,
    transparent: true,
    opacity:     0,
    depthWrite:  false,
    depthTest:   false,
    side:        THREE.DoubleSide,
  });

  // Plane: 1.0 × 1.0 — full wall face so both Phase 2 and Phase 3 texts fit.
  // rotation.y = +π/2 makes the front face point toward +X (camera side).
  // x = 0.715  → just in front of the right wall (0.5 home + 0.2 explode = 0.7)
  // z = 0.0    → centred on the wall face; Phase 2 text is positioned at canvas X ≈ 82
  //              which maps to world Z ≈ 0.42, keeping it at the +Z corner visually.
  const aboutTextMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 1.0),
    aboutTextMat
  );
  aboutTextMesh.rotation.y  = Math.PI / 2;
  aboutTextMesh.position.set(0.715, 0.1, 0.0);
  aboutTextMesh.renderOrder = 1;   // render after walls (renderOrder 0) so text is always on top
  scene.add(aboutTextMesh);

  function drawAboutText (wallExpandP) {
    // Phase 2 runs 0.30 → 0.60: typewriter along the tall (1024px / 1.0 world-unit) dimension
    const phase2P = Math.max(0, Math.min(1, (wallExpandP - 0.30) / 0.30));
    const count2  = Math.ceil(phase2P * ABOUT_TEXT.length);

    // Phase 3 runs 0.65 → 0.85: typewriter along the top edge (1024px / 1.0 world-unit width)
    const phase3P = Math.max(0, Math.min(1, (wallExpandP - 0.65) / 0.20));
    const count3  = Math.ceil(phase3P * PHASE3_TEXT.length);

    if (count2 === aboutTextCharCount && count3 === phase3TextCharCount) return;  // nothing changed
    aboutTextCharCount  = count2;
    phase3TextCharCount = count3;

    aboutTexCtx.clearRect(0, 0, 1024, 1024);

    // Phase 2: rotated −90° so text flows bottom-to-top on the 3D plane.
    // Canvas X 82 → world Z ≈ 0.42 (+Z corner). Canvas Y 512 → world Y 0.1 (plane centre).
    // After rotate(−π/2), text's rightward direction maps to canvas −Y (upward);
    // THREE.js flipY makes upward canvas = higher V = higher world Y → bottom-to-top.
    if (count2 > 0) {
      aboutTexCtx.save();
      aboutTexCtx.translate(82, 512);
      aboutTexCtx.rotate(-Math.PI / 2);
      aboutTexCtx.font         = 'bold 42px Georgia, "Times New Roman", serif';
      aboutTexCtx.fillStyle    = '#1a1a1a';
      aboutTexCtx.textAlign    = 'center';
      aboutTexCtx.textBaseline = 'middle';
      aboutTexCtx.fillText(ABOUT_TEXT.slice(0, count2), 0, 0);
      aboutTexCtx.restore();
    }

    // Phase 3: horizontal text at canvas top (Y ≈ 0 = world +Y top edge of plane).
    // No rotation — text flows left-to-right across the full 1024px canvas width,
    // which maps to the full 1.0-unit wall width.  Centred at canvas X 512 = world Z 0.
    if (count3 > 0) {
      aboutTexCtx.save();
      aboutTexCtx.translate(512, 140);
      aboutTexCtx.font         = 'bold 50px Georgia, "Times New Roman", serif';
      aboutTexCtx.fillStyle    = '#1a1a1a';
      aboutTexCtx.textAlign    = 'center';
      aboutTexCtx.textBaseline = 'top';
      aboutTexCtx.fillText(PHASE3_TEXT.slice(0, count3), 0, 0);
      aboutTexCtx.restore();
    }

    aboutTexture.needsUpdate = true;
  }

  // --- RAYCASTER ---

  const raycaster   = new THREE.Raycaster();
  const mouse       = new THREE.Vector2(-999, -999);
  let   hoveredMesh = null;
  const COLOR_BASE  = new THREE.Color(0xd0d0cc);
  const COLOR_HOVER = new THREE.Color(0xbcbcb8);

  window.addEventListener('mousemove', e => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  canvas.addEventListener('click', () => {
    if (hoveredMesh) {
      document.dispatchEvent(new CustomEvent('wall-click', {
        detail: { id: hoveredMesh.userData.id },
      }));
    }
  });

  // --- ACTIVE FACE / SPIN STATE ---
  //
  // The house spins so the clicked wall always ends up in the "right" position
  // (facing +X toward the camera). wallToHouseY maps each wall id to the house
  // group Y rotation that brings it to that orientation.

  const wallToHouseY = {
    right:  0,
    front:  Math.PI / 2,
    left:   Math.PI,
    back:  -Math.PI / 2,
  };

  let activeWallId  = 'right'; // the wall currently in the display position
  let targetHouseY  = 0;       // target house group Y rotation
  let houseSpinY    = 0;       // smoothly lerped toward targetHouseY

  document.addEventListener('wall-click', e => {
    activeWallId = e.detail.id;
    targetHouseY = wallToHouseY[activeWallId];
  });

  // --- SCROLL STATE ---

  let explodeProgress  = 0;
  let targetExplode    = 0;
  let cameraProgress   = 0;
  let targetCamera     = 0;
  let approachProgress = 0; // START → FAR over pre-explosion scroll
  let targetApproach   = 0;
  let idleClock        = 0;

  window.setHeroExplode = function (p) {
    targetExplode = Math.max(0, Math.min(1, p));
  };

  window.setHeroCameraZoom = function (p) {
    targetCamera = Math.max(0, Math.min(1, p));
  };

  window.setHeroCameraApproach = function (p) {
    targetApproach = Math.max(0, Math.min(1, p));
  };

  // --- ROOF FLY STATE ---

  let roofFlyProgress = 0;
  let targetRoofFly   = 0;

  window.setRoofFly = function (p) {
    targetRoofFly = Math.max(0, Math.min(1, p));
  };

  // Scratch vectors reused each frame to avoid allocations
  const _flyFrom      = new THREE.Vector3();
  const _approachBase = new THREE.Vector3();          // scratch for START→FAR lerp
  const _heroLook     = new THREE.Vector3(0, 0.2, 0); // hero lookAt target
  const _lookTarget   = new THREE.Vector3();           // blended lookAt each frame
  const _heroUp       = new THREE.Vector3(0, 1, 0);   // default camera up

  // --- HERO EXIT FADE ---
  // Driven by the hold phase at the end of the hero sequence.
  // Used to fade overlays out before hero-sticky unsticks.
  let heroExitProgress = 0;
  let targetHeroExit   = 0;

  window.setHeroExit = function (p) {
    targetHeroExit = Math.max(0, Math.min(1, p));
  };

  // --- ABOUT SECTION STATE (stub — logic to be added) ---

  let wallExpandProgress = 0;
  let targetWallExpand   = 0;

  window.setWallExpand = function (p) {
    targetWallExpand = Math.max(0, Math.min(1, p));
  };

  // --- OVERLAY TRACKING ---

  const _v3 = new THREE.Vector3();

  // Fixed world-space offset from the active wall's centre to the label anchor.
  // The house always spins so the active wall ends up facing +X, meaning its
  // world position converges to roughly (0.5 + explode, 0, 0). Adding this
  // offset lands the label at the same screen spot every time.
  const LABEL_ANCHOR = new THREE.Vector3(0.6, 0.1, -0.58);

  function updateOverlays () {
    wallMeshes.forEach(mesh => {
      const el = overlays[mesh.userData.id];
      if (!el) return;

      const isActive = mesh.userData.id === activeWallId && explodeProgress > 0.55;

      if (!isActive) {
        el.style.opacity = 0;
        el.classList.remove('visible');
        return;
      }

      // project from active wall centre + fixed right-side anchor offset
      mesh.getWorldPosition(_v3);
      _v3.add(LABEL_ANCHOR);
      const proj = _v3.project(camera);

      el.style.left    = ( proj.x * 0.5 + 0.5) * window.innerWidth  + 'px';
      el.style.top     = (-proj.y * 0.5 + 0.5) * window.innerHeight + 'px';
      el.style.opacity = Math.max(0, 1 - heroExitProgress * 2);
      el.classList.add('visible');
    });
  }

  // --- HOUSE SCREEN FOOTPRINT ---
  // Projects the assembled house's corners (walls + roof apex) to screen px and
  // publishes centre + half-extents on window.__houseScreen for the text repel.

  const _houseCorners = [];
  [-HALF, HALF].forEach(x => [-HALF, HALF].forEach(z => {
    _houseCorners.push(new THREE.Vector3(x, -HALF, z));
    _houseCorners.push(new THREE.Vector3(x,  HALF, z));
  }));
  _houseCorners.push(new THREE.Vector3(0, HALF + 0.5, 0));   // roof apex
  const _hc = new THREE.Vector3();

  function updateHouseScreen () {
    camera.updateMatrixWorld();
    house.updateMatrixWorld();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of _houseCorners) {
      _hc.copy(c).applyMatrix4(house.matrixWorld).project(camera);
      const sx = ( _hc.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-_hc.y * 0.5 + 0.5) * window.innerHeight;
      if (sx < minX) minX = sx; if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy; if (sy > maxY) maxY = sy;
    }
    window.__houseScreen = {
      cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
      rx: (maxX - minX) / 2, ry: (maxY - minY) / 2,
    };
  }

  // --- RENDER LOOP ---

  function animate () {
    requestAnimationFrame(animate);

    // smooth lerp toward targets
    explodeProgress    += (targetExplode    - explodeProgress)    * 0.07;
    cameraProgress     += (targetCamera     - cameraProgress)     * 0.06;
    // Approach uses an asymmetric rate: slow (0.04) on the way in for the gradual
    // dolly feel, faster (0.09) on the way out so scrolling back up reverses visibly.
    approachProgress   += (targetApproach   - approachProgress)   * (targetApproach < approachProgress ? 0.09 : 0.04);
    roofFlyProgress    += (targetRoofFly    - roofFlyProgress)    * 0.06;
    heroExitProgress   += (targetHeroExit   - heroExitProgress)   * 0.05;
    wallExpandProgress += (targetWallExpand - wallExpandProgress) * 0.07;

    // --- CAMERA ---
    // Approach phase: START → FAR over pre-explosion scroll.
    // Explosion phase: FAR → NEAR during walls-out scroll.
    // Combined: lerp START→FAR first, then blend toward NEAR.
    _approachBase.lerpVectors(CAM_START, CAM_FAR, approachProgress);
    camera.position.lerpVectors(_approachBase, CAM_NEAR, cameraProgress);

    // Phase 1 (0.00 → 0.30): swing camera to face right wall head-on
    const aboutCamP  = Math.min(1, wallExpandProgress / 0.3);
    // Phase 2 (0.30 → 0.60): drop down + push in → perspective skew + tilt + zoom
    const aboutSkewP = Math.min(1, Math.max(0, (wallExpandProgress - 0.3)  / 0.3));
    // Hold  (0.60 → 0.65): phase 2 end-state held (aboutSkewP stays 1)
    // Phase 3 (0.65 → 0.85): rotate gaze toward top-right corner of wall
    const aboutPanP  = Math.min(1, Math.max(0, (wallExpandProgress - 0.65) / 0.2));

    if (aboutPanP > 0) {
      camera.position.lerpVectors(CAM_SKEW, CAM_PAN, aboutPanP);
      _lookTarget.lerpVectors(CAM_SKEW_LOOK, CAM_PAN_LOOK, aboutPanP);
      camera.up.lerpVectors(CAM_SKEW_UP, CAM_PAN_UP, aboutPanP);
      camera.fov = 28 + (38 - 28) * aboutPanP; // 28° → 38° slight zoom-out through phase 3
    } else if (aboutSkewP > 0) {
      camera.position.lerpVectors(CAM_ABOUT, CAM_SKEW, aboutSkewP);
      _lookTarget.lerpVectors(CAM_ABOUT_LOOK, CAM_SKEW_LOOK, aboutSkewP);
      camera.up.lerpVectors(_heroUp, CAM_SKEW_UP, aboutSkewP);
      camera.fov = 45 + (28 - 45) * aboutSkewP; // 45° → 28°
    } else if (aboutCamP > 0) {
      camera.position.lerpVectors(CAM_NEAR, CAM_ABOUT, aboutCamP);
      _lookTarget.lerpVectors(_heroLook, CAM_ABOUT_LOOK, aboutCamP);
      camera.up.copy(_heroUp);
      camera.fov = 45;
    } else {
      _lookTarget.copy(_heroLook);
      camera.up.copy(_heroUp);
      camera.fov = 45;
    }
    camera.updateProjectionMatrix();
    camera.lookAt(_lookTarget);

    // --- SPIN + IDLE ---
    // shortest-path lerp — normalize delta to [-π, π] so it never
    // goes the long way around when crossing the ±π boundary
    let spinDelta = targetHouseY - houseSpinY;
    while (spinDelta >  Math.PI) spinDelta -= Math.PI * 2;
    while (spinDelta < -Math.PI) spinDelta += Math.PI * 2;
    houseSpinY += spinDelta * 0.05;

    const idleWeight = Math.max(0, 1 - explodeProgress * 8);
    if (idleWeight > 0) idleClock += 0.008;
    house.rotation.y = houseSpinY + Math.sin(idleClock) * 0.18 * idleWeight;

    // --- WALLS: position ---
    wallMeshes.forEach(mesh => {
      const { homePos, dir } = mesh.userData;
      mesh.position.copy(homePos).addScaledVector(dir, explodeProgress * EXPLODE_DIST);
    });

    // roof: explosion float, then fly off upward
    const explodedRoofY = (HALF + 0.25) + explodeProgress * 0.4;
    if (roofFlyProgress > 0.001) {
      _flyFrom.set(0, explodedRoofY, 0);
      roofMesh.position.set(
        _flyFrom.x - 1.5 * roofFlyProgress,
        _flyFrom.y + 3.0 * roofFlyProgress,
        _flyFrom.z
      );
      roofMesh.scale.setScalar(1 - roofFlyProgress * 0.7);
      roofMat.opacity = Math.max(0, 1 - roofFlyProgress * 1.8);
    } else {
      roofMesh.position.set(0, explodedRoofY, 0);
      roofMesh.scale.setScalar(1);
      roofMat.opacity = 1;
    }

    // expose the house's on-screen footprint (used by text-repel.js)
    updateHouseScreen();

    // update HTML overlay positions
    updateOverlays();

    // --- ABOUT TEXT ---
    // Phase 2 text: fade in as phase 2 begins (0.28 → 0.32), stay visible through phase 3.
    const _aboutFade = Math.max(0, Math.min(1, (wallExpandProgress - 0.28) / 0.04));
    aboutTextMat.opacity = _aboutFade;
    drawAboutText(wallExpandProgress);

    // raycasting for hover — only during hero hold phase, not once about section begins
    if (explodeProgress > 0.4 && wallExpandProgress < 0.05) {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(wallMeshes);

      if (hits.length > 0) {
        const hit = hits[0].object;
        if (hoveredMesh !== hit) {
          if (hoveredMesh) hoveredMesh.material.color.copy(COLOR_BASE);
          hoveredMesh = hit;
          hit.material.color.copy(COLOR_HOVER);
        }
        canvas.style.cursor = 'pointer';
      } else {
        if (hoveredMesh) {
          hoveredMesh.material.color.copy(COLOR_BASE);
          hoveredMesh = null;
        }
        canvas.style.cursor = 'default';
      }
    }

    // skip the full-screen render once the second half fully covers it
    if (!window.__heroPaused) renderer.render(scene, camera);
  }

  animate();

  // --- RESIZE ---

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

})();
