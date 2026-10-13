/**
 * Aarya Bhansali — Portfolio Interactive Engine
 * Handles Bead Canvas Physics, Navigation, Observers, 3D Tilt, Project Explorer & Modal Lightbox
 */

function initAll() {
  try { initBeadCanvas(); } catch (e) { console.error('BeadCanvas error:', e); }
  try { initNavigation(); } catch (e) { console.error('Navigation error:', e); }
  try { initScrollObservers(); } catch (e) { console.error('ScrollObservers error:', e); }
  try { initDomainFilters(); } catch (e) { console.error('DomainFilters error:', e); }
  try { initProjectExplorer(); } catch (e) { console.error('ProjectExplorer error:', e); }
  try { initVideoControls(); } catch (e) { console.error('VideoControls error:', e); }
  try { initCertTiltAndFilter(); } catch (e) { console.error('CertTilt error:', e); }
  try { initModalLightbox(); } catch (e) { console.error('ModalLightbox error:', e); }
  try { initClipboardAndToasts(); } catch (e) { console.error('Clipboard error:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

function initVideoControls() {
  document.querySelectorAll('.spatial-video-container video').forEach(v => {
    const btn = v.parentElement.querySelector('.video-overlay-btn');
    if (btn) {
      v.addEventListener('play', () => btn.textContent = '⏸ Pause');
      v.addEventListener('pause', () => btn.textContent = '▶ Play Preview');
    }
  });
}

/* ==========================================================================
   1. Interactive Bead Physics Canvas (Hero)
   ========================================================================== */
function initBeadCanvas() {
  const canvas = document.getElementById('scene');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, dpr;
  let animationId;
  const hint = document.getElementById('hint');

  const mouse = {
    x: -1000,
    y: -1000,
    radius: 120,
    active: false,
    hasInteracted: false
  };

  const colors = [
    'rgba(91, 42, 74, 0.45)',
    'rgba(126, 74, 105, 0.4)',
    'rgba(185, 211, 207, 0.65)',
    'rgba(239, 192, 122, 0.55)',
    'rgba(21, 48, 58, 0.35)'
  ];

  class Bead {
    constructor(x, y, radius, color) {
      this.ox = x;
      this.oy = y;
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = radius;
      this.baseRadius = radius;
      this.color = color;
      this.mass = radius * 0.8;
      this.damping = 0.92;
      this.springK = 0.035;
    }

    update() {
      const dxOrigin = this.ox - this.x;
      const dyOrigin = this.oy - this.y;
      const axOrigin = dxOrigin * this.springK;
      const ayOrigin = dyOrigin * this.springK;

      this.vx += axOrigin;
      this.vy += ayOrigin;

      if (mouse.active) {
        const dxMouse = this.x - mouse.x;
        const dyMouse = this.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < mouse.radius && distMouse > 0) {
          const force = (1 - distMouse / mouse.radius) * 6;
          const fx = (dxMouse / distMouse) * force;
          const fy = (dyMouse / distMouse) * force;
          this.vx += fx;
          this.vy += fy;
        }
      }

      this.vx *= this.damping;
      this.vy *= this.damping;

      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  let beads = [];

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth || 300;
    height = canvas.clientHeight || 200;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    createBeads();
  }

  function createBeads() {
    beads = [];
    const count = Math.min(Math.floor((width * height) / 14000), 75);
    if (count <= 0) return;
    const cols = Math.max(1, Math.ceil(Math.sqrt(count * (width / height))));
    const rows = Math.max(1, Math.ceil(count / cols));
    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (beads.length >= count) break;
        const x = c * cellW + cellW * 0.5 + (Math.random() - 0.5) * cellW * 0.6;
        const y = r * cellH + cellH * 0.5 + (Math.random() - 0.5) * cellH * 0.6;
        const radius = 3.5 + Math.random() * 5.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        beads.push(new Bead(x, y, radius, color));
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 0.75;
    for (let i = 0; i < beads.length; i++) {
      for (let j = i + 1; j < beads.length; j++) {
        const dx = beads[i].x - beads[j].x;
        const dy = beads[i].y - beads[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          const alpha = (1 - dist / 110) * 0.22;
          ctx.strokeStyle = `rgba(91, 42, 74, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(beads[i].x, beads[i].y);
          ctx.lineTo(beads[j].x, beads[j].y);
          ctx.stroke();
        }
      }
    }

    for (const bead of beads) {
      bead.update();
      bead.draw(ctx);
    }

    animationId = requestAnimationFrame(render);
  }

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;

    if (!mouse.hasInteracted && hint) {
      mouse.hasInteracted = true;
      hint.classList.add('gone');
    }
  }

  function onMouseLeave() {
    mouse.active = false;
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    for (const bead of beads) {
      const dx = bead.x - cx;
      const dy = bead.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 260 && dist > 0) {
        const force = (1 - dist / 260) * 16;
        bead.vx += (dx / dist) * force;
        bead.vy += (dy / dist) * force;
      }
    }
  }

  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('click', onClick);

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
      mouse.active = true;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    mouse.active = false;
  });

  resize();
  render();
}

/* ==========================================================================
   2. Navigation, Header & Scroll Spy
   ========================================================================== */
function initNavigation() {
  const head = document.getElementById('head');
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav a[href^="#"]');

  window.addEventListener('scroll', () => {
    if (head) {
      if (window.scrollY > 40) {
        head.classList.add('scrolled');
      } else {
        head.classList.remove('scrolled');
      }
    }
  }, { passive: true });

  if (menuBtn && nav && head) {
    menuBtn.addEventListener('click', () => {
      const isOpen = head.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        head.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 160;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   3. Scroll Reveal & Timeline Observers
   ========================================================================== */
function initScrollObservers() {
  const reveals = document.querySelectorAll('.reveal');
  const portrait = document.getElementById('portrait');

  if (typeof IntersectionObserver !== 'undefined') {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => revealObserver.observe(el));
    if (portrait) revealObserver.observe(portrait);
  } else {
    reveals.forEach(el => el.classList.add('in'));
    if (portrait) portrait.classList.add('in');
  }

  const timeline = document.querySelector('.timeline');
  if (timeline) {
    window.addEventListener('scroll', () => {
      const rect = timeline.getBoundingClientRect();
      const windowH = window.innerHeight;
      if (rect.top < windowH && rect.bottom > 0) {
        const progress = Math.min(Math.max((windowH * 0.7 - rect.top) / rect.height, 0), 1);
        timeline.style.setProperty('--p', progress.toFixed(3));
      }
    }, { passive: true });
  }
}

/* ==========================================================================
   4. Multi-Domain Spectrum Filtering
   ========================================================================== */
function initDomainFilters() {
  const chips = document.querySelectorAll('.domain-chip');
  const cards = document.querySelectorAll('.domain-card');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;

      cards.forEach(card => {
        if (filter === 'all' || (card.dataset.category && card.dataset.category.includes(filter))) {
          card.style.display = 'flex';
          setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'none'; }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.96)';
          setTimeout(() => { card.style.display = 'none'; }, 200);
        }
      });
    });
  });
}


const projectDatabase = {
  covidxray: {
    title: "COVID-19 Radiograph Grad-CAM — Explainable Deep Transfer Learning",
    meta: "Kaggle Competitions • TensorFlow 2.x • MobileNetV2 • Grad-CAM • ROC-AUC: 0.995 • Val Acc: 97.5%",
    desc: "A production-grade deep transfer learning diagnostic pipeline for chest X-ray pneumonia classification, benchmarked on Kaggle. Uses MobileNetV2 with depthwise separable convolutions to achieve 97.5% classification accuracy and a 0.995 ROC-AUC score, with Grad-CAM heatmaps overlaying bilateral pulmonary consolidations for clinical explainability.",
    highlights: [
      "Fine-tuned MobileNetV2 architecture with depthwise separable convolutions and custom dense classification heads.",
      "Evaluated on chest radiography benchmark achieving 97.5% accuracy, 98.1% sensitivity, and 0.995 ROC-AUC.",
      "Integrated Grad-CAM gradient backpropagation visualizing spatial feature activations for clinical explainability."
    ],
    stack: ["TensorFlow", "Keras", "MobileNetV2", "Grad-CAM", "OpenCV", "Scikit-learn", "Medical AI"],
    github: "https://github.com/20Aarya05/Kaggle5_COVID-19_Xray",
    live: "assets/competitions/covid_xray_preview.png",
    svgType: "covidxray"
  },
  chess: {
    title: "Aarya's Hardcoded Chess Engine — 100% Vanilla JS, HTML & CSS",
    meta: "GitHub: 20Aarya05/Chess • Pure Vanilla JavaScript • Zero External Libraries • Complete Ruleset • En Passant",
    desc: "A fully functional 1v1 offline multiplayer chess game built purely in vanilla JavaScript, HTML, and CSS with zero third-party game engines or libraries. Implements a complete hardcoded rule validation matrix including pawn double-push, en passant diagonal capture with passed pawn removal, castling, check detection, checkmate detection, stalemate detection, turn switching, and live captured pieces telemetry.",
    highlights: [
      "100% hardcoded chess engine written in vanilla ES6 JavaScript with zero external chess libraries.",
      "Complete rule matrix: pawn mechanics, en passant captures, knight L-rays, bishop diagonals, and rook files.",
      "Real-time move validation, visual legal move indicator dots, checkmate detection, and move history notation."
    ],
    stack: ["Vanilla JavaScript (ES6+)", "HTML5", "CSS3", "Chess Algorithm", "Zero Dependencies", "Game Engine"],
    github: "https://github.com/20Aarya05/Chess",
    live: "https://github.com/20Aarya05/Chess",
    svgType: "chess"
  },
  cortexium: {
    title: "Cortexium 2.0 — Smart AR Glasses Multi-Agent Intelligence",
    meta: "Smart AR Glasses HUD • Multi-Agent Pipeline • Social Meeting Recall • Perspective Car Nav • Spatial Displacement Hub",
    desc: "An augmented reality smart glasses operating system powered by a multi-agent AI pipeline (completely standalone, zero game-engine overhead). Features three specialized operational modes: 1) Social & Meeting Module (real-time conversational recall overlay displaying past discussion context and crowded-place person localization); 2) Automotive & Car Navigation Module (perspective 3D highway AR chevrons for elevated flyovers vs subway underpasses with active driver drowsiness detection); 3) Spatial Displacement Organizer Hub (real-time misplaced item detection with holographic return anchors for warehouses and stationary shops).",
    highlights: [
      "Social & Meeting Recall HUD: AR glasses display past conversation context and locate targeted individuals in dense crowds.",
      "Automotive 3D Navigation HUD: Projects directional chevrons over highway flyovers and underpasses with active driver drowsiness detection.",
      "Spatial Object Displacement Hub: Detects misplaced physical items in warehouses/shops and projects ghost anchors to their original slots."
    ],
    stack: ["Python", "Smart AR Glasses HUD", "Multi-Agent System", "Computer Vision", "Speech Recognition", "Vector Memory", "FastAPI"],
    github: "https://github.com/20Aarya05/Cortexium2.0",
    live: "#projects",
    svgType: "cortexium"
  },
  safedrop: {
    title: "SafeDrop (TrustWeave) — Merkle Airdrop Vulnerability & Mitigation System",
    meta: "E:\\Codes\\BT\\SafeDrop • Python • Flask • Cryptography • Merkle Proofs • Secondary Preimage Security",
    desc: "A cryptographic vulnerability research and mitigation engine demonstrating end-to-end how Merkle proof-based token airdrops can be exploited by secondary preimage attacks (Songsom et al., 2025), and how low-cost domain-separated prefixing (0x00 for leaves, 0x01 for internal nodes) and 32-byte leaf padding cryptographically close the vulnerability with zero on-chain gas overhead.",
    highlights: [
      "Simulates secondary preimage attacks where intermediate 64-byte node hashes are exploited as fraudulent airdrop claim leaves.",
      "Implements dual mitigations: cryptographic domain separation prefixes and deterministic leaf padding.",
      "Interactive proof verifier validating Merkle root recomputation, claim authentication, and exploit prevention."
    ],
    stack: ["Python", "Flask", "Cryptography", "Merkle Trees", "Secondary Preimage Security", "Blockchain Security"],
    github: "https://github.com/20Aarya05",
    live: "#projects",
    svgType: "safedrop"
  },
  looper: {
    title: "Looper AI Desktop Studio — Autonomous Local Agent Orchestrator",
    meta: "E:\\Codes\\Looper • Tauri • React • TypeScript • Python • Ollama • MCP Tools • Local LLM",
    desc: "A lightweight, cross-platform desktop studio for orchestrating autonomous local AI agents. Combines a Rust/Tauri desktop shell with a React frontend and Python agent loop, connecting local Ollama models (Llama 3.2, DeepSeek-R1, Qwen) to Model Context Protocol (MCP) tool servers for local code synthesis, terminal execution, and iterative self-correction.",
    highlights: [
      "Tauri + React + Python architecture providing native desktop performance with low memory footprint.",
      "Seamless integration with local Ollama LLMs and MCP tool bridges for privacy-first autonomous workflows.",
      "Interactive agent execution trace visualizing multi-step plan decomposition, tool calls, and output verification."
    ],
    stack: ["Tauri", "Rust", "React", "TypeScript", "Python", "Ollama", "Model Context Protocol (MCP)"],
    github: "https://github.com/20Aarya05",
    live: "#projects",
    svgType: "looper"
  },
  spaceshiptitanic: {
    title: "Spaceship Titanic & LIME Explainability — Tabular ML Benchmark",
    meta: "Kaggle Competition • LightGBM • CatBoost • Scikit-learn • LIME • Local Feature Attributions",
    desc: "An end-to-end machine learning pipeline for Kaggle's Spaceship Titanic competition predicting passenger transport across anomalous space-time dimensions. Features iterative feature engineering (group cabin splits, total luxury expenditure, cryo-sleep flags), LightGBM/CatBoost ensemble tuning, and local LIME feature attribution bars explaining individual predictions.",
    highlights: [
      "Ensemble tabular ML pipeline combining LightGBM, CatBoost, and Stratified K-Fold cross-validation.",
      "Domain-specific feature engineering extracting cabin deck spatial coordinates and luxury amenity expense ratios.",
      "Local Interpretable Model-agnostic Explanations (LIME) attributing prediction probabilities to specific passenger features."
    ],
    stack: ["Python", "LightGBM", "CatBoost", "Scikit-learn", "LIME", "Pandas", "Feature Engineering"],
    github: "https://github.com/20Aarya05/Kaggle1_SpaceshipTitanic",
    live: "#projects",
    svgType: "spaceshiptitanic"
  },
  coldbrief: {
    title: "ColdBrief AI (AutoMail) — Autonomous B2B Prospecting & Outbound Engine",
    meta: "E:\\Codes\\DP\\coldbrief-actor • Apify Cloud Actor • Python • Crawlee • Google Gemini API • Pay-per-Event",
    desc: "A production Apify cloud actor (@aarya_2) engineered to transform target company URLs into deeply enriched, personalized outbound sales hooks. Headlessly crawls domains with fingerprint evasion, extracts key offerings and executive pain points, scores prospect fit (ICP 1–5), and synthesizes conversion-focused icebreakers via Gemini API with Groq LPU fallback.",
    highlights: [
      "Autonomous website crawling using Crawlee and Puppeteer with rotating proxies and Cloudflare evasion.",
      "Multi-stage LLM enrichment pipeline calculating ICP fit, value proposition alignment, and custom email opening hooks.",
      "Published and monetized on Apify Store with automated pay-per-event event billing and webhook notifications."
    ],
    stack: ["Python", "Apify SDK", "Crawlee", "Puppeteer", "Google Gemini API", "Groq LPU", "REST APIs"],
    github: "https://github.com/20Aarya05",
    live: "https://apify.com/aarya_2",
    svgType: "coldbrief"
  },
  antigravity3d: {
    title: "AntiGravity 3D AI Studio — 6-Stage Image-to-PBR Asset Engine",
    meta: "E:\\Codes\\3d_engine • Next.js 14 • R3F • FastAPI • Celery • Redis • PyTorch • SAM • TripoSR • SDXL",
    desc: "A generative 3D asset engineering pipeline converting single 2D concept images into production-ready 3D PBR meshes. Orchestrates a 6-stage VRAM pipeline: Segment Anything (SAM) foreground separation -> TripoSR NeRF geometry reconstruction -> PyMeshLab Laplacian smoothing & decimation -> xatlas UV unwrapping -> Stable Diffusion XL latent texture inpainting (Albedo, Normal, Roughness) -> GLB/FBX/STL export.",
    highlights: [
      "End-to-end 6-stage pipeline: SAM mask -> TripoSR mesh -> PyMeshLab cleanup -> xatlas UV -> SDXL inpainting.",
      "VRAM memory guard and asynchronous Celery/Redis worker queues delivering sub-45 second mesh generation.",
      "Interactive 3D client viewport built with Next.js 14 and React Three Fiber with real-time PBR material lighting."
    ],
    stack: ["PyTorch", "SAM", "TripoSR", "PyMeshLab", "xatlas", "SDXL", "Next.js 14", "React Three Fiber", "FastAPI", "Celery", "Redis"],
    github: "https://github.com/20Aarya05",
    live: "#spatial",
    svgType: "antigravity3d"
  },
  campuspulse: {
    title: "CampusPulse IoT Attendance OS — Triple-Lock Biometric Hardware Node",
    meta: "E:\\Codes\\camcapsule-iot • ESP32 • RFID RC522 • Supabase • PL/pgSQL • Anti-Proxy Hardware",
    desc: "An enterprise IoT smart attendance and access control system built on ESP32 microcontrollers and MFRC522 RFID readers. Solves collegiate proxy attendance through an asynchronous triple-lock verification protocol: cryptographic UID challenge, Supabase PL/pgSQL atomic deduplication, and LED/buzzer state feedback.",
    highlights: [
      "Bare-metal ESP32 C++ firmware with SPI-driven RC522 transceiver and FreeRTOS concurrency.",
      "Triple-lock anti-proxy security: 10-second rapid-tap rejection and geofenced timetable reconciliation.",
      "Supabase PL/pgSQL row-level triggers maintaining ACID-compliant campus attendance records."
    ],
    stack: ["ESP32", "C++", "FreeRTOS", "RFID RC522", "Supabase", "PostgreSQL", "Tailwind CSS"],
    github: "https://github.com/20Aarya05",
    live: "",
    svgType: "campuspulse"
  },
  uemcp: {
    title: "UE_MCP + Qwen 3 Controller — Model Context Protocol for Unreal Engine 5",
    meta: "E:\\Codes\\UE_MCP • Node.js • Unreal Engine 5 • JSON-RPC • WebSockets • Ollama • Qwen 3",
    desc: "An open protocol bridge enabling local LLMs to manipulate Unreal Engine 5 in real time via Anthropic's Model Context Protocol (MCP). Implements an Express/WebSocket server receiving JSON-RPC tool calls from Ollama (Qwen 3), translating natural language instructions into UE5 Python/Remote Control API operations with sub-15ms roundtrip latency.",
    highlights: [
      "Standardized MCP server architecture bridging LLM function calls to UE5 Remote Execution API.",
      "Real-time procedural scene operations: spawning Nanite meshes, adjusting Lumen lights, and triggering sequencer shots.",
      "Sub-15ms WebSocket roundtrip with strict JSON-RPC schema validation and fault-tolerant error recovery."
    ],
    stack: ["Node.js", "Express", "WebSockets", "Unreal Engine 5", "Ollama", "Model Context Protocol (MCP)", "JSON-RPC"],
    github: "https://github.com/20Aarya05",
    live: "#spatial",
    svgType: "uemcp"
  },
  amazonml: {
    title: "Amazon ML Challenge '24 — Multimodal Product Entity Resolution",
    meta: "CODES\\Amazon_ML_hackathon • Top 3% National • 2.5M Catalog • MinHash LSH • LightGBM • BERT",
    desc: "A high-scale machine learning pipeline engineered for the Amazon ML Challenge 2024 to detect duplicate and near-identical catalog products across 2.5 million SKUs. Employs a multi-stage funnel: MinHash Locality-Sensitive Hashing (LSH) to prune 99.8% of irrelevant candidate pairs, followed by a fine-tuned LightGBM + MiniLM ranker scoring multimodal similarity.",
    highlights: [
      "Engineered high-throughput candidate generator using MinHash LSH, reducing 2.5M SKU search space by 99.8%.",
      "Extracted 42 composite similarity signals across token Jaccard, character Levenshtein, and dense text embeddings.",
      "Ranked in top 3% nationally among 25,000+ competitive engineering participants across India."
    ],
    stack: ["Python", "PyTorch", "LightGBM", "MinHash LSH", "Scikit-learn", "Sentence-Transformers", "Multimodal ML"],
    github: "https://github.com/20Aarya05",
    live: "assets/competitions/amazon_ml_cert.jpg",
    svgType: "amazonml"
  },
  agrotech: {
    title: "AgroTech Deep CNN Plant Doctor — Mobile Edge Crop Diagnostics",
    meta: "Agrotech-Hackathon • Finalist • PyTorch • MobileNetV3 • CLAHE • OpenCV • FastAPI • 96.8% Accuracy",
    desc: "An edge-deployable computer vision diagnostic system identifying 38 distinct crop diseases across 14 plant species. Integrates Contrast Limited Adaptive Histogram Equalization (CLAHE) to neutralize harsh sunlight shadows in real field conditions, achieving 96.8% classification accuracy with a 4.2MB quantized model footprint.",
    highlights: [
      "Quantized MobileNetV3 CNN achieving 96.8% validation accuracy on 87,000 leaf pathology images.",
      "Custom CLAHE image preprocessing pipeline normalizing variable illumination in rural farm photography.",
      "FastAPI inference backend providing instant chemical and organic remediation protocols."
    ],
    stack: ["PyTorch", "TorchVision", "MobileNetV3", "OpenCV", "CLAHE", "FastAPI", "React Native"],
    github: "https://github.com/20Aarya05",
    live: "assets/competitions/agrotech_cert.jpg",
    svgType: "agrotech"
  },
  handtracking: {
    title: "Biometric Hand Tracking WASD — 21-Landmark Skeletal Game Controller",
    meta: "CODES\\Hand_tracking • MediaPipe Hands • OpenCV • Python • DirectInput • 60 FPS • Real-Time Trigonometry",
    desc: "A touchless biometric input interface translating webcam hand gestures into responsive PC gaming keystrokes (WASD). Detects 21 3D landmarks at 60 FPS, calculates wrist-to-middle-MCP angular vectors and pinch velocity thresholds, and maps movements to hardware keyboard scans with <18ms input latency.",
    highlights: [
      "Real-time 21-landmark 3D skeletal tracking with MediaPipe and OpenCV running smoothly at 60 FPS on edge CPU.",
      "Vector angle trigonometry calculating tilt angles relative to wrist origin to register directional WASD keystrokes.",
      "DirectInput driver integration allowing touchless game control in simulation and action titles with zero perceptible delay."
    ],
    stack: ["Python", "OpenCV", "MediaPipe Hands", "PyAutoGUI", "DirectInput", "NumPy"],
    github: "https://github.com/20Aarya05",
    live: "",
    svgType: "handtracking"
  },
  nexus: {
    title: "Nexus Multi-Agent Parliamentary Debate Arena",
    meta: "Autonomous Agents • Tavily Search API • Groq LPU • Debate Protocol • Live Fact-Checking",
    desc: "A structured multi-agent conversational engine orchestrating formal parliamentary debates between autonomous AI personas (Proponent, Opponent, and Moderator). Each speaker formulates arguments, interrogates opposing claims, retrieves real-time web citations via Tavily Search API, and receives moderation scoring.",
    highlights: [
      "Formal parliamentary debate state machine with strict turn-taking and rebuttal enforcement.",
      "Real-time Tavily API integration fact-checking claims on the fly with cited source attribution.",
      "Sub-200ms token streaming powered by Groq LPU hardware enabling natural conversational rhythm."
    ],
    stack: ["Python", "Groq LPU", "Tavily Search API", "LangGraph", "FastAPI", "WebSocket", "React"],
    github: "https://github.com/20Aarya05",
    live: "#projects",
    svgType: "nexus"
  },
  edutrack: {
    title: "EduTrack Adaptive RAG — Sub-200ms Cognitive Learning Engine",
    meta: "Top 20 | Code Odyssey 4.0 Hackathon • LangChain • Supabase pgvector • Groq LPU • React 18",
    desc: "A high-speed AI learning platform developed during the 30-hour Code Odyssey 4.0 national hackathon. Combines LangChain hybrid retrieval (BM25 keyword search + Supabase pgvector embeddings) with Groq LPU ultra-fast inference to generate contextual quizzes, syllabus flash roadmaps, and student diagnostic feedback in under 200ms.",
    highlights: [
      "Sub-200ms retrieval and synthesis pipeline powered by Groq LPU hardware and hybrid semantic search.",
      "Automated assignment rubric grader providing conceptual feedback and targeted knowledge remediation.",
      "Placed in the Top 20 national finalist teams out of hundreds of collegiate submissions across India."
    ],
    stack: ["Groq LPU", "LangChain", "Supabase pgvector", "React 18", "Python", "Tailwind CSS"],
    github: "https://github.com/20Aarya05",
    live: "assets/competitions/code_odyssey_cert.jpg",
    svgType: "edutrack"
  },
  playnex: {
    title: "PLAYNEX Enterprise Sports OS — Tournament Engine & Referee Console",
    meta: "Enterprise Architecture • Spring Boot 3 • Java 17 • MySQL • Hibernate JPA • Thymeleaf • RESTful",
    desc: "An enterprise tournament management system architected with Spring Boot 3 and Java 17. Implements automated round-robin and single-elimination tournament bracket scheduling, tie-breaker resolution algorithms, role-based security (Admins, Team Managers, Referees), and live match score tracking.",
    highlights: [
      "Transactional Spring Boot 3 architecture with JPA repository queries enforcing data consistency.",
      "Automated tournament bracket generator handling complex multi-pool round-robin and knockout fixtures.",
      "Role-based authorization and live referee console for instant match score logging and standings computation."
    ],
    stack: ["Spring Boot 3", "Java 17", "MySQL", "Hibernate JPA", "Thymeleaf", "Bootstrap 5"],
    github: "https://github.com/20Aarya05",
    live: "",
    svgType: "playnex"
  },
  threejsgame: {
    title: "Three.js Isometric RPG Engine — WebGL Physics & Spatial Grid",
    meta: "CODES\\threejs-inventory-game • Three.js • WebGL • JavaScript (ES6) • 3D Raycasting • Isometric Grid",
    desc: "A high-performance browser-based 3D isometric room and inventory interaction engine built with Three.js and WebGL. Features mathematical mouse raycasting for tile collision, draggable 3D inventory items with slot snapping physics, dynamic shadow maps, and custom materials without heavy frameworks.",
    highlights: [
      "Mathematical raycaster projecting screen-space cursor coordinates onto isometric world-space grid planes.",
      "Spatial inventory drag-and-drop mechanics with bounding box intersection detection and rotational orientation.",
      "Lightweight pure vanilla JavaScript architecture running at a consistent 60 FPS across desktop and mobile."
    ],
    stack: ["Three.js", "WebGL", "JavaScript (ES6)", "HTML5 Canvas", "Raycasting", "PBR Materials"],
    github: "https://github.com/20Aarya05",
    live: "#spatial",
    svgType: "threejsgame"
  },
  apipool: {
    title: "API POOL Security Vault — Bearer Credential Pooling & Gateway",
    meta: "E:\\Codes\\Proffesional_Work\\API_POOL • Node.js • Express • Supabase • Bearer Token Auth • CORS Security",
    desc: "A centralized credential security service and API key vault built to protect backend credentials from frontend exposure. Encrypts and pools third-party API keys in Supabase, validates client requests via cryptographic bearer authorization tokens, enforces domain origin whitelisting, and applies rolling rate limits.",
    highlights: [
      "Centralized Supabase secret vault preventing frontend API token leakage and credential abuse.",
      "Cryptographic bearer authorization handshake with domain origin and referrer header enforcement.",
      "High-throughput token rotator dynamically balancing request load across multiple third-party API keys."
    ],
    stack: ["Node.js", "Express", "Supabase", "REST API", "Bearer Authentication", "CORS"],
    github: "https://github.com/20Aarya05",
    live: "",
    svgType: "apipool"
  }
};



function renderProjectConsole(type) {
  switch (type) {
        case 'covidxray':
      return `
        <div class="console-wrapper" id="consoleCovid">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">COVID-19 Radiograph Clinical Workstation</span>
              <span class="console-status-pill success" id="covidStatus">MobileNetV2 • 97.5% Accuracy</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" data-patient="1">Patient 1 (Bilateral Infiltrates)</button>
              <button class="console-btn" data-patient="2">Patient 2 (Consolidation)</button>
              <button class="console-btn" data-patient="3">Patient 3 (Normal Controls)</button>
              <button class="console-btn accent-green" id="btnRunCovidScan">⚡ Run Deep Learning Scan</button>
              <button class="console-btn active" id="btnToggleHeatmap">Grad-CAM: ON</button>
              <button class="console-btn" id="btnToggleReticle">Focal Calipers</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div class="xray-stage-container">
              <!-- Left: Authentic DICOM Radiograph Frame (Pure Chest X-Ray Only) -->
              <div class="light-panel" style="padding: 10px; position: relative;">
                <div class="light-panel-title">
                  <span id="xrayTitle">Patient #1 — Thoracic AP Radiograph</span>
                  <span style="font-size: 0.72rem; color: var(--ink3);">DICOM 512×512 • 16-bit</span>
                </div>
                <div class="xray-image-wrap">
                  <img src="assets/projects/covid_xray/xray_1.png" alt="Authentic Chest Radiograph" class="xray-base" id="xrayBaseImg">
                  <div class="xray-gradcam-overlay active" id="xrayGradCamOverlay"></div>
                  <div class="xray-reticle-box" id="xrayReticle" style="top: 36%; left: 16%; width: 34%; height: 38%; display: none;"></div>
                  <div class="xray-reticle-box" id="xrayReticle2" style="top: 32%; right: 16%; width: 32%; height: 40%; display: none;"></div>
                  <div class="xray-laser-scan" id="xrayScanBeam"></div>
                </div>
                <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 0.74rem; color: var(--ink2);">
                  <span>Gradient Layer: <strong style="color: var(--plum);">out_relu</strong></span>
                  <span id="xrayFeatureText" style="color: var(--plum); font-weight: 600;">Bilateral Peripheral Opacities</span>
                </div>
              </div>

              <!-- Right: Clinical Diagnostic Inference Card -->
              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Clinical Diagnostic Inference</span>
                    <span style="color: #2B7A66;">MobileNetV2 Transfer Learning</span>
                  </div>

                  <div style="background: linear-gradient(135deg, rgba(91,42,74,0.06), rgba(239,192,122,0.1)); border: 1px solid rgba(91,42,74,0.18); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--ink3); font-weight: 600;">Diagnostic Classification</div>
                    <div id="covidDiagnosis" style="font-size: 1.12rem; font-weight: 700; color: #B83A4B; margin-top: 2px;">COVID-19 VIRAL PNEUMONIA (POSITIVE)</div>
                    <div id="covidConf" style="font-size: 0.78rem; color: #2B7A66; font-weight: 600; margin-top: 2px;">Confidence: 98.4% • Focal Loss: 0.041</div>
                  </div>

                  <!-- 3 Metric Dials -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                    <div style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 8px; text-align: center;">
                      <div style="font-size: 0.68rem; color: var(--ink3); font-weight: 600;">ROC-AUC</div>
                      <div id="covidRoc" style="font-size: 1.05rem; font-weight: 700; color: var(--plum);">0.995</div>
                    </div>
                    <div style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 8px; text-align: center;">
                      <div style="font-size: 0.68rem; color: var(--ink3); font-weight: 600;">ACCURACY</div>
                      <div id="covidAcc" style="font-size: 1.05rem; font-weight: 700; color: #2B7A66;">97.5%</div>
                    </div>
                    <div style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 8px; text-align: center;">
                      <div style="font-size: 0.68rem; color: var(--ink3); font-weight: 600;">SENSITIVITY</div>
                      <div id="covidSens" style="font-size: 1.05rem; font-weight: 700; color: var(--plum);">98.1%</div>
                    </div>
                  </div>

                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45; margin-bottom: 8px;">
                    <strong style="color: var(--ink); font-size: 0.72rem; text-transform: uppercase;">Radiological Interpretation:</strong><br>
                    <span id="xaiDesc">Thermodynamic gradients localize focal bilateral consolidations along lower lobe periphery with zero black-box ambiguity.</span>
                  </div>
                </div>

                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px;">
                  <span>Dataset: 2,500+ Pure DICOM Scans</span>
                  <span style="color: #2B7A66; font-weight: 600;">PyTorch • Grad-CAM</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span id="covidLog">>> DICOM Analysis: Patient #1 Radiograph — Bilateral Ground-Glass Infiltrates Localized.</span>
            <span>Clinical Diagnostics</span>
          </div>
        </div>
      `;

case 'chess':
      return `
        <div class="console-wrapper" id="consoleChess">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">Aarya's Hardcoded Chess Engine (100% Vanilla JS, HTML & CSS)</span>
              <span class="console-status-pill success" id="chessStatusPill">Turn: White to Move</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn accent-green" id="btnChessEnPassant">⚔️ Demonstrate En Passant</button>
              <button class="console-btn" id="btnChessScholars">👑 Scholar's Mate Demo</button>
              <button class="console-btn" id="btnChessReset">🔄 Reset Board</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div class="chess-workbench">
              <!-- Left: Playable 8x8 Chessboard -->
              <div class="chess-board-outer">
                <div class="chess-captures-bar">
                  <span style="font-weight: 600; color: var(--ink3);">Black Captures:</span>
                  <div class="chess-captures-tray" id="blackCaptures"></div>
                </div>

                <div class="chess-grid-container" id="chessGrid"></div>

                <div class="chess-captures-bar">
                  <span style="font-weight: 600; color: var(--ink3);">White Captures:</span>
                  <div class="chess-captures-tray" id="whiteCaptures"></div>
                </div>
              </div>

              <!-- Right: Inbuilt Rules Telemetry & Move History -->
              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Engine Rules & Move History</span>
                    <span style="color: #2B7A66;">Zero External Libraries</span>
                  </div>

                  <div style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem;">
                      <span style="color: var(--ink3); font-weight: 600;">ACTIVE TURN:</span>
                      <strong id="chessActiveTurnText" style="color: var(--plum); font-size: 0.88rem;">WHITE (Move #1)</strong>
                    </div>
                    <div style="font-size: 0.72rem; color: var(--ink2); margin-top: 4px;">
                      Click any piece on the board to inspect legal move dots. Click a dot to execute move.
                    </div>
                  </div>

                  <!-- Move Log Box -->
                  <div style="font-size: 0.74rem; font-weight: 600; color: var(--ink); margin-bottom: 4px;">Algebraic Notation Move Log:</div>
                  <div class="chess-move-log-box" id="chessMoveLog">
                    <div>1. Game initialized. All standard pieces in home squares.</div>
                  </div>

                  <!-- Rules Checklist -->
                  <div style="margin-top: 10px; background: #FAFDFB; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; line-height: 1.5;">
                    <strong style="color: var(--ink);">Hardcoded Rule Matrix Enforced:</strong>
                    <div style="color: var(--ink2); margin-top: 3px;">
                      ✔ <strong>Pawns:</strong> 1-step push, home 2-step push, diagonal captures, and <strong>En Passant</strong>.<br>
                      ✔ <strong>Knights:</strong> Unblocked 8-direction L-jump vectors.<br>
                      ✔ <strong>Bishops / Rooks / Queen:</strong> Continuous ray-casting until collision.<br>
                      ✔ <strong>King:</strong> 1-square perimeter + check threat detection.
                    </div>
                  </div>
                </div>

                <div style="margin-top: 10px; font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Source: GitHub @20Aarya05/Chess</span>
                  <span style="color: #2B7A66; font-weight: 600;">Pure ES6 Matrix Logic</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span id="chessLogBar" class="console-log-text">>> Aarya's Chess Engine: Ready. Click any white piece or click "Demonstrate En Passant".</span>
            <span>Vanilla JS Chess Engine</span>
          </div>
        </div>
      `;

    case 'cortexium':
      return `
        <div class="console-wrapper" id="consoleCortexium">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">Cortexium 2.0 — Smart AR Glasses Multi-Agent OS</span>
              <span class="console-status-pill success" id="cortexStatus">Standalone Edge • Optical Infinity</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" data-cortextab="social">🕶️ Social Recall HUD</button>
              <button class="console-btn" data-cortextab="car">🚗 Perspective Car Nav HUD</button>
              <button class="console-btn" data-cortextab="organizer">📋 Spatial Displacement Hub</button>
            </div>
          </div>
          <div class="console-stage-area">
            <!-- Pane 1: Social Recall HUD -->
            <div class="cortex-tab-pane" id="cortexTabSocial" style="display: block;">
              <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;">
                <div class="light-panel" style="padding: 12px; position: relative;">
                  <div class="light-panel-title">
                    <span>Optical AR Lens Viewport</span>
                    <span id="crowdStatusText" style="color: #2B7A66; font-weight: 600;">Radar: Standby</span>
                  </div>
                  <!-- AR Viewfinder Silhouette -->
                  <div style="background: linear-gradient(180deg, #F0F6F4 0%, #E2ECE9 100%); border-radius: 8px; height: 175px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid var(--line);">
                    <div style="position: relative; width: 70px; height: 110px; display: flex; flex-direction: column; align-items: center;">
                      <div style="width: 38px; height: 38px; border-radius: 50%; background: #D5E2DF; border: 2px solid var(--plum);"></div>
                      <div style="width: 64px; height: 55px; background: #C6D7D3; border-radius: 12px 12px 0 0; border: 1.5px solid var(--plum); border-bottom: none; margin-top: 5px;"></div>
                      <div id="cortexFaceReticle" style="position: absolute; inset: -8px; border: 2px dashed var(--plum); border-radius: 6px;" class="anim-pulse"></div>
                    </div>
                    <div style="position: absolute; top: 10px; right: 10px; width: 50px; height: 50px; border-radius: 50%; background: #FFFFFF; border: 1.5px solid var(--line-strong); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
                      <div id="cortexRadarSweep" style="width: 100%; height: 100%; border-radius: 50%; border-top: 2px solid var(--plum); transition: transform 0.5s;" class="anim-radar"></div>
                    </div>
                  </div>
                  <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button class="console-btn accent-green" id="btnCortexCrowd" style="flex: 1;">🎯 Locate in Crowd</button>
                    <button class="console-btn" id="btnCortexCyclePerson" style="flex: 1;">👤 Cycle Contact</button>
                  </div>
                </div>

                <!-- Contact Recall Card -->
                <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div class="light-panel-title">
                      <span>Conversational Memory Recall</span>
                      <span style="color: var(--plum);">Memory Index #882</span>
                    </div>
                    <div id="cortexPersonName" style="font-size: 1.02rem; font-weight: 700; color: var(--ink); margin-bottom: 6px;">Dr. A. Sharma (Lead ML Architect)</div>
                    <div style="background: #FAFDFB; border-left: 3px solid var(--plum); border-radius: 4px; padding: 10px; margin-bottom: 8px; font-size: 0.76rem; line-height: 1.45; color: var(--ink);">
                      <strong style="color: var(--plum);">Last Meeting Key Note:</strong>
                      <div id="cortexRecallQuote" style="margin-top: 2px;">"Approved multi-agent pipeline architecture. Requested edge latency kept strictly below 50ms without Unreal Engine dependency."</div>
                    </div>
                    <div style="background: #F4F8F6; border-radius: 6px; padding: 8px; font-size: 0.74rem; color: var(--ink2);">
                      <strong style="color: #2B7A66;">Live Audio Transcribe:</strong>
                      <div id="cortexLiveStream" style="margin-top: 2px; color: var(--ink);">"Proposing deployment across edge smart glasses..." <span class="anim-cursor">|</span></div>
                    </div>
                  </div>
                  <button class="console-btn" id="btnCortexTranscribe" style="margin-top: 8px; width: 100%;">🎙️ Stream Audio Transcription</button>
                </div>
              </div>
            </div>

            <!-- Pane 2: Perspective Car Navigation HUD -->
            <div class="cortex-tab-pane" id="cortexTabCar" style="display: none;">
              <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;">
                <div class="light-panel" style="padding: 12px; position: relative;">
                  <div class="light-panel-title">
                    <span>Windshield 3D Perspective Roadway HUD</span>
                    <span id="carNavElevationText" style="color: var(--plum); font-weight: 700;">Elevation: +14m Flyover Bridge</span>
                  </div>
                  <div id="carHudViewport" style="background: linear-gradient(180deg, #E2ECF0 0%, #D0DFE3 100%); border-radius: 8px; height: 175px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--line-strong);">
                    <svg viewBox="0 0 340 175" style="width: 100%; height: 100%;">
                      <!-- Sky & Horizon Line -->
                      <line x1="0" y1="50" x2="340" y2="50" stroke="#BDD2D6" stroke-width="1"/>
                      
                      <!-- Ground Plane -->
                      <polygon points="0,50 340,50 340,175 0,175" fill="#C6D7DA"/>

                      <!-- Base Highway Roadway (Vanishing to Horizon x=170, y=50) -->
                      <polygon points="150,50 190,50 310,175 30,175" fill="#889FA3" stroke="#6C8488" stroke-width="1.5"/>

                      <!-- Center Road Lane Dashes -->
                      <line x1="170" y1="50" x2="170" y2="175" stroke="#FFFFFF" stroke-width="2.5" class="anim-road-perspective"/>

                      <!-- Bridge Flyover Ramp (Branching elevated to Right) -->
                      <g id="bridgeLayer">
                        <polygon points="175,50 190,50 330,140 280,175" fill="#789196" opacity="0.9" stroke="var(--plum)" stroke-width="1.5"/>
                        <!-- Concrete Bridge Pier Pillars -->
                        <rect x="235" y="70" width="12" height="60" fill="#6A8186" opacity="0.8"/>
                        <rect x="280" y="90" width="14" height="65" fill="#6A8186" opacity="0.8"/>
                        <line x1="180" y1="50" x2="310" y2="155" stroke="var(--plum)" stroke-width="2" stroke-dasharray="8 6"/>
                      </g>

                      <!-- Underpass Subway Tunnel (Branching low to Center-Left) -->
                      <g id="underpassLayer" style="display: none;">
                        <polygon points="145,50 165,50 120,175 40,175" fill="#4B6064" opacity="0.95" stroke="#2B7A66" stroke-width="2"/>
                        <!-- Overhead Overpass Crossbeam Arch -->
                        <rect x="70" y="42" width="140" height="14" rx="2" fill="#5E7579" stroke="#3A4D51" stroke-width="1.5"/>
                        <text x="140" y="52" fill="#FFFFFF" font-size="7" font-weight="700" text-anchor="middle">SUBWAY TUNNEL ENTRY (-8m)</text>
                      </g>

                      <!-- Conformal Holographic AR Chevrons (Ascending or Descending) -->
                      <g id="carChevronsGroup">
                        <polygon points="210,145 235,120 248,120 223,145" fill="var(--plum)" opacity="0.9"/>
                        <polygon points="230,115 250,92 260,92 240,115" fill="var(--plum)" opacity="0.95"/>
                        <polygon points="250,88 266,70 274,70 258,88" fill="var(--plum)"/>
                      </g>

                      <!-- Lead Vehicle Tracking Reticle -->
                      <g transform="translate(155, 62)">
                        <rect width="30" height="20" rx="3" fill="none" stroke="#2B7A66" stroke-width="1.5" stroke-dasharray="4 2"/>
                        <text x="15" y="-3" fill="#2B7A66" font-size="6.5" font-weight="700" text-anchor="middle">LEAD 26.4m</text>
                      </g>
                    </svg>

                    <!-- Nav Prompt Pill -->
                    <div id="carTurnPromptPill" style="position: absolute; top: 8px; left: 10px; background: rgba(255,255,255,0.92); border: 1.5px solid var(--plum); padding: 5px 10px; border-radius: 20px; font-size: 0.74rem; font-weight: 700; color: var(--plum); box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                      ↗ Take Elevated Flyover Bridge Ramp (80m)
                    </div>

                    <!-- Speedometer Overlay -->
                    <div style="position: absolute; bottom: 8px; left: 10px; background: rgba(21,48,58,0.85); color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 0.72rem; font-family: var(--mono);">
                      72 km/h • Limit: 80
                    </div>
                  </div>

                  <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button class="console-btn" id="btnCarToggleElevation" style="flex: 1;">🛣️ Switch: Flyover vs Subway Tunnel</button>
                    <button class="console-btn accent-alert" id="btnCarDrowsyAlert" style="flex: 1;">⚠️ Simulate Drowsy / Dizzy Alert</button>
                  </div>
                </div>

                <!-- Driver Alertness Telemetry -->
                <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div class="light-panel-title">
                      <span>Driver Vigilance & Highway Assist</span>
                      <span style="color: #2B7A66;">Infrared Ocular Tracker</span>
                    </div>

                    <div id="drowsyAlertBox" style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 12px; margin-bottom: 10px;">
                      <div id="drowsyAlertTitle" style="color: #2B7A66; font-weight: 700; font-size: 0.88rem;">Status: Driver Alert & Attentive</div>
                      <div id="drowsyAlertDesc" style="color: var(--ink2); font-size: 0.74rem; margin-top: 4px; line-height: 1.45;">Blink duration: 180ms (Normal) • Gaze vector: Centered on highway • Head pitch: 1.2°</div>
                    </div>

                    <div style="font-size: 0.74rem; color: var(--ink2); line-height: 1.5;">
                      <strong style="color: var(--ink);">Conformal AR Elevation Guidance:</strong><br>
                      Solves 2D GPS confusion at complex flyover splits by anchoring luminous chevrons directly to the ascending tarmac or descending subway underpass.
                    </div>
                  </div>

                  <div style="background: rgba(91,42,74,0.06); padding: 8px 12px; border-radius: 6px; font-size: 0.74rem; color: var(--plum); font-weight: 600;">
                    ✔ Projected at True Optical Infinity • Junction Confidence: 99.8%
                  </div>
                </div>
              </div>
            </div>

            <!-- Pane 3: Spatial Object Displacement Organizer Hub -->
            <div class="cortex-tab-pane" id="cortexTabOrganizer" style="display: none;">
              <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 16px;">
                <div class="light-panel" style="padding: 12px; position: relative;">
                  <div class="light-panel-title">
                    <span>Spatial Object Displacement & Inventory Verification</span>
                    <span id="orgModeBadge" style="color: #B83A4B; font-weight: 700;">Audit Mode: 1 Misplaced Item</span>
                  </div>

                  <!-- 2.5D Schematic Shelf Viewport -->
                  <div style="background: linear-gradient(180deg, #F6FAF8 0%, #E8F2EF 100%); border-radius: 8px; height: 175px; position: relative; overflow: hidden; border: 1.5px solid var(--line-strong);">
                    <svg viewBox="0 0 340 175" style="width: 100%; height: 100%;">
                      <!-- Shelf Structure A -->
                      <rect x="20" y="30" width="130" height="50" rx="4" fill="#FFFFFF" stroke="#BDCECA" stroke-width="1.5"/>
                      <text x="30" y="44" fill="var(--ink3)" font-size="7" font-weight="700">SHELF A (STATIONARY RACK)</text>
                      
                      <!-- Slot 1: Notebooks -->
                      <rect x="28" y="52" width="36" height="22" rx="3" fill="#DCEAE7" stroke="#9BB5AE"/>
                      <text x="46" y="65" fill="var(--ink)" font-size="6" text-anchor="middle">Notebooks</text>

                      <!-- Slot 2: Original Home of Stapler (Ghost Anchor when displaced!) -->
                      <g id="ghostAnchorGroup">
                        <rect x="70" y="52" width="40" height="22" rx="3" fill="none" stroke="#2B7A66" stroke-width="1.5" stroke-dasharray="4 3"/>
                        <text x="90" y="65" fill="#2B7A66" font-size="5.5" font-weight="700" text-anchor="middle">ORIGINAL SLOT</text>
                      </g>

                      <!-- Shelf Structure B -->
                      <rect x="180" y="30" width="140" height="50" rx="4" fill="#FFFFFF" stroke="#BDCECA" stroke-width="1.5"/>
                      <text x="190" y="44" fill="var(--ink3)" font-size="7" font-weight="700">SHELF B (OFFICE SUPPLIES)</text>
                      <rect x="188" y="52" width="40" height="22" rx="3" fill="#DCEAE7" stroke="#9BB5AE"/>
                      <text x="208" y="65" fill="var(--ink)" font-size="6" text-anchor="middle">Tape Disp.</text>

                      <!-- Component Bin C (Wrong Location where Stapler is currently placed!) -->
                      <rect x="120" y="105" width="160" height="55" rx="4" fill="#FDF7ED" stroke="#E5CE9F" stroke-width="1.5"/>
                      <text x="130" y="120" fill="#996E2E" font-size="7" font-weight="700">RETURN BIN C (WRONG LOCATION)</text>

                      <!-- Misplaced Stapler Object inside Bin C -->
                      <g id="misplacedObjectGroup">
                        <rect x="140" y="126" width="50" height="26" rx="4" fill="#FFFFFF" stroke="#B83A4B" stroke-width="2" class="misplaced-alert-box"/>
                        <text x="165" y="142" fill="#B83A4B" font-size="6.5" font-weight="700" text-anchor="middle">STAPLER (SKU-104)</text>
                      </g>

                      <!-- Ghost Trajectory Vector Line from Bin C to Shelf A Slot 2 -->
                      <g id="returnTrajectoryGroup">
                        <path d="M 165 126 C 140 100, 110 85, 90 75" fill="none" stroke="var(--plum)" stroke-width="2" class="ghost-return-vector"/>
                        <polygon points="88,72 96,76 92,82" fill="var(--plum)"/>
                        <text x="135" y="92" fill="var(--plum)" font-size="6.5" font-weight="700">RETURN 1.6m ↗</text>
                      </g>
                    </svg>

                    <div id="orgAlertBanner" style="position: absolute; bottom: 8px; left: 10px; background: rgba(184, 58, 75, 0.9); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 0.72rem; font-weight: 600;">
                      ⚠️ MISPLACED ITEM DETECTED: Stapler (SKU-104) in Bin C
                    </div>
                  </div>

                  <div style="margin-top: 10px; display: flex; gap: 8px;">
                    <button class="console-btn accent-green" id="btnOrgReturnItem" style="flex: 1;">✅ Return Object to Original Slot</button>
                    <button class="console-btn" id="btnOrgToggleMisplace" style="flex: 1;">⚠️ Simulate Displacement</button>
                  </div>
                </div>

                <!-- Spatial Vector Telemetry Card -->
                <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div class="light-panel-title">
                      <span>Spatial Memory & Displaced Item Tracker</span>
                      <span style="color: #2B7A66;">Warehouse / Retail</span>
                    </div>

                    <div style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 10px; margin-bottom: 8px; font-size: 0.74rem;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: var(--ink3);">OBJECT:</span>
                        <strong id="orgItemName" style="color: #B83A4B;">Heavy-Duty Stapler (SKU-104)</strong>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: var(--ink3);">CURRENT LOCATION:</span>
                        <span id="orgCurrentLoc" style="color: var(--ink); font-weight: 600;">Component Bin C (Slot #4)</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span style="color: var(--ink3);">ORIGINAL LOCATION:</span>
                        <span id="orgTargetLoc" style="color: #2B7A66; font-weight: 700;">Shelf A, Slot 2 (Stationary)</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--ink3);">RETURN VECTOR:</span>
                        <span id="orgVectorDistance" style="color: var(--plum); font-weight: 700;">1.6m [ΔX: -0.75m, ΔY: +1.4m]</span>
                      </div>
                    </div>

                    <div style="font-size: 0.74rem; color: var(--ink2); line-height: 1.45;">
                      <strong style="color: var(--ink);">Warehouse & Shop Floor Utility:</strong><br>
                      When staff or customers misplace stock, AR glasses highlight the displaced item and project holographic vectors directly to where it belongs.
                    </div>
                  </div>

                  <div style="background: rgba(43,122,102,0.08); padding: 8px 12px; border-radius: 6px; font-size: 0.74rem; color: #2B7A66; font-weight: 600;">
                    ✔ 18 Baseline Slots Indexed • Optical Audit Confidence: 99.2%
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span id="cortexLogBar" class="console-log-text">>> Cortexium 2.0: Standalone edge multi-agent operating system initialized.</span>
            <span>Multi-Agent AR Suite</span>
          </div>
        </div>
      `;

        case 'safedrop':
      return `
        <div class="console-wrapper" id="consoleSafe">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">SafeDrop — Merkle Tree Cryptographic Verification Engine</span>
              <span class="console-status-pill success" id="safeStatusPill">Solidity • ECDSA • OpenZeppelin</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn accent-green" id="btnSafeRunCascade">▶ Run Verification Cascade</button>
              <button class="console-btn active" id="btnSafeModeMitigated">Protected (SafeDrop)</button>
              <button class="console-btn" id="btnSafeModeVulnerable">Vulnerable (Unprefixed)</button>
              <button class="console-btn" id="btnSafeTestExploit">⚡ Simulate Preimage Attack</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;">
              <!-- Left: Animated Cryptographic Merkle Tree Simulation -->
              <div class="light-panel" style="padding: 12px; display: flex; flex-direction: column;">
                <div class="light-panel-title">
                  <span>Cryptographic Merkle Proof Tree</span>
                  <span style="font-size: 0.72rem; color: #2B7A66;" id="safeSimState">Simulation Ready</span>
                </div>
                <div style="background: #0E1618; border: 1px solid var(--line); border-radius: 8px; height: 210px; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.6);">
                  <svg viewBox="0 0 320 190" style="width: 100%; height: 100%;" id="safeMerkleSvg">
                    <!-- Connecting Branch Lines -->
                    <line x1="160" y1="36" x2="80" y2="75" stroke="#2B7A66" stroke-width="2" id="safeBranchRootLeft" opacity="0.6"/>
                    <line x1="160" y1="36" x2="240" y2="75" stroke="#2B7A66" stroke-width="2" id="safeBranchRootRight" opacity="0.6"/>

                    <line x1="80" y1="95" x2="40" y2="135" stroke="#2B7A66" stroke-width="1.5" id="safeBranchL1" opacity="0.6"/>
                    <line x1="80" y1="95" x2="120" y2="135" stroke="#2B7A66" stroke-width="1.5" id="safeBranchL2" opacity="0.6"/>
                    <line x1="240" y1="95" x2="200" y2="135" stroke="#2B7A66" stroke-width="1.5" id="safeBranchL3" opacity="0.6"/>
                    <line x1="240" y1="95" x2="280" y2="135" stroke="#2B7A66" stroke-width="1.5" id="safeBranchL4" opacity="0.6"/>

                    <!-- Merkle Root Node -->
                    <rect x="95" y="10" width="130" height="28" rx="6" fill="#1A2B28" stroke="#7FD1BA" stroke-width="2" id="safeNodeRoot"/>
                    <text x="160" y="27" fill="#7FD1BA" font-size="8.5" font-weight="700" text-anchor="middle" id="safeTextRoot">ROOT: 0x7f4a...9c12</text>

                    <!-- Intermediate Layer 1 Nodes -->
                    <rect x="30" y="75" width="100" height="22" rx="4" fill="#132321" stroke="#2B7A66" stroke-width="1.5" id="safeNodeH1"/>
                    <text x="80" y="89" fill="#7FD1BA" font-size="7" font-weight="600" text-anchor="middle" id="safeTextH1">H(Leaf 1 + Leaf 2)</text>

                    <rect x="190" y="75" width="100" height="22" rx="4" fill="#132321" stroke="#2B7A66" stroke-width="1.5" id="safeNodeH2"/>
                    <text x="240" y="89" fill="#7FD1BA" font-size="7" font-weight="600" text-anchor="middle" id="safeTextH2">H(Leaf 3 + Leaf 4)</text>

                    <!-- Leaves (Layer 0) -->
                    <rect x="10" y="135" width="60" height="22" rx="4" fill="#162724" stroke="#2B7A66" stroke-width="1.2" id="safeLeaf1"/>
                    <text x="40" y="149" fill="#FFFFFF" font-size="6.5" text-anchor="middle">A: 100 TKN</text>

                    <rect x="90" y="135" width="60" height="22" rx="4" fill="#162724" stroke="#2B7A66" stroke-width="1.2" id="safeLeaf2"/>
                    <text x="120" y="149" fill="#FFFFFF" font-size="6.5" text-anchor="middle" id="safeTextLeaf2">B: 250 TKN</text>

                    <rect x="170" y="135" width="60" height="22" rx="4" fill="#162724" stroke="#2B7A66" stroke-width="1.2" id="safeLeaf3"/>
                    <text x="200" y="149" fill="#FFFFFF" font-size="6.5" text-anchor="middle">C: 50 TKN</text>

                    <rect x="250" y="135" width="60" height="22" rx="4" fill="#162724" stroke="#2B7A66" stroke-width="1.2" id="safeLeaf4"/>
                    <text x="280" y="149" fill="#FFFFFF" font-size="6.5" text-anchor="middle">D: 400 TKN</text>

                    <!-- Animated Pulse Particle -->
                    <circle id="safePulseParticle" cx="40" cy="135" r="5" fill="#EFC07A" opacity="0"/>
                  </svg>
                  <div id="safeSimulationBanner" style="position: absolute; bottom: 8px; left: 10px; font-size: 0.68rem; color: #7FD1BA; font-family: monospace; background: rgba(0,0,0,0.65); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(43,122,102,0.4);">
                    SIMULATION: IDLE (CLICK 'RUN CASCADE')
                  </div>
                </div>
              </div>

              <!-- Right: Cryptographic Verification Outcome -->
              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Cryptographic Verification State</span>
                    <span style="color: #2B7A66;" id="safeProofTag">SHA-256 Hierarchy</span>
                  </div>

                  <div style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                    <div style="font-size: 0.68rem; color: var(--ink3); text-transform: uppercase; font-weight: 600;">Verification Status:</div>
                    <div id="safeVerifyResult" style="font-size: 0.95rem; font-weight: 700; color: #2B7A66; margin: 2px 0;">
                      ✓ MERKLE ROOT VALID
                    </div>
                    <div id="safeVerifyDesc" style="font-size: 0.72rem; color: var(--ink2); line-height: 1.4;">
                      All recipient claims match on-chain root hash (0x7f4a...9c12). Zero unauthorized withdrawals permitted.
                    </div>
                  </div>

                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45; margin-bottom: 10px;">
                    <strong style="color: var(--plum);">Mitigation Architecture:</strong><br>
                    SafeDrop enforces OpenZeppelin <code>0x00</code> prefixing for leaves and <code>0x01</code> prefixing for intermediate nodes, neutralizing 64-byte second preimage collision vectors.
                  </div>

                  <div style="background: #F8FAF9; border-radius: 6px; padding: 8px; font-size: 0.72rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                      <span style="color: var(--ink3);">Gas per Verification:</span>
                      <strong style="color: #2B7A66;">~28,400 Gas</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--ink3);">Collision Resistance:</span>
                      <strong style="color: var(--plum);">2^128 bits (Strict Domain Separation)</strong>
                    </div>
                  </div>
                </div>

                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px;">
                  <span>Smart Contract: SafeDrop.sol</span>
                  <span style="color: #2B7A66; font-weight: 600;">EVM Verified</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span id="safeLog">>> SafeDrop Engine: Merkle verification cascade ready. Click 'Run Cascade' to simulate.</span>
            <span>Cryptographic Security</span>
          </div>
        </div>
      `;

case 'looper':
      return `
        <div class="console-wrapper" id="consoleLooper">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">Looper — Autonomous Local Agent Desktop Studio</span>
              <span class="console-status-pill success">Tauri • React • Ollama LLM • MCP</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnLooperRun">⚡ Execute Loop</button>
              <button class="console-btn" id="btnLooperModel">Model: Llama 3.2 (Local)</button>
              <button class="console-btn" id="btnLooperReset">Clear Workspace</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>Autonomous Execution Timeline</span>
                  <span style="color: #2B7A66;">Step 4 of 4 Completed</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem; display: flex; flex-direction: column; gap: 6px;" id="looperTimeline">
                  <div style="color: #2B7A66;">[1] PLAN: Parsed objective into 3 tool sub-tasks</div>
                  <div style="color: var(--ink);">[2] MCP: Called filesystem::read_directory (12 files)</div>
                  <div style="color: var(--ink);">[3] MCP: Executed python test_suite.py (Passed 8/8)</div>
                  <div style="color: var(--plum); font-weight: 600;">[4] VERIFY: Agent verified solution criteria ✔</div>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Local LLM & Hardware Guard</span>
                    <span style="color: var(--plum);">Zero Cloud Latency</span>
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; line-height: 1.45;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">LOCAL RUNTIME:</span>
                      <strong>Ollama 0.5.4</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">DESKTOP SHELL:</span>
                      <strong>Tauri 2.0 (Rust)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--ink3);">TOOL BUS:</span>
                      <strong>Model Context Protocol (MCP)</strong>
                    </div>
                  </div>
                </div>
                <div style="margin-top: 10px; font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Location: E:\\Codes\\Looper</span>
                  <span style="color: #2B7A66; font-weight: 600;">Privacy-First Desktop</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> Looper: Local agent loop completed in 1.4s with zero external API calls.</span>
            <span>Local Agent Studio</span>
          </div>
        </div>
      `;

    case 'spaceshiptitanic':
      return `
        <div class="console-wrapper" id="consoleTitanic">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">Spaceship Titanic & LIME Explainability — Tabular ML Pipeline</span>
              <span class="console-status-pill success">LightGBM • CatBoost • LIME XAI</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnTitanicP1">Passenger 0013_01</button>
              <button class="console-btn" id="btnTitanicP2">Passenger 0018_01</button>
              <button class="console-btn accent-green" id="btnTitanicExplain">⚡ Compute LIME Explanations</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>Local LIME Feature Attribution Bars</span>
                  <span style="color: #2B7A66;">Transported Probability: 84.2%</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem; display: flex; flex-direction: column; gap: 6px;" id="limeBarContainer">
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 2px;">
                      <span>CryoSleep == True</span>
                      <strong style="color: #2B7A66;">+0.42 (Strong Positive)</strong>
                    </div>
                    <div style="height: 6px; background: #D5E5E0; border-radius: 3px; overflow: hidden;">
                      <div style="width: 84%; height: 100%; background: #2B7A66;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 2px;">
                      <span>Spa & RoomService == 0.0</span>
                      <strong style="color: #2B7A66;">+0.28 (Positive)</strong>
                    </div>
                    <div style="height: 6px; background: #D5E5E0; border-radius: 3px; overflow: hidden;">
                      <div style="width: 56%; height: 100%; background: #2B7A66;"></div>
                    </div>
                  </div>
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 2px;">
                      <span>Cabin Deck == 'F'</span>
                      <strong style="color: #B83A4B;">-0.12 (Negative)</strong>
                    </div>
                    <div style="height: 6px; background: #F2D5D9; border-radius: 3px; overflow: hidden;">
                      <div style="width: 24%; height: 100%; background: #B83A4B;"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Ensemble Model Performance</span>
                    <span style="color: var(--plum);">Kaggle Benchmark</span>
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">LIGHTGBM CV ACCURACY:</span>
                      <strong>80.95%</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">CATBOOST CV ACCURACY:</span>
                      <strong>80.82%</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--ink3);">SOFT ENSEMBLE TEST ACC:</span>
                      <strong style="color: #2B7A66;">81.42%</strong>
                    </div>
                  </div>
                </div>
                <div style="margin-top: 10px; font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Repo: Kaggle1_SpaceshipTitanic</span>
                  <span style="color: #2B7A66; font-weight: 600;">Interpretable AI</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> Spaceship Titanic LIME: Local feature contribution scores rendered for Passenger.</span>
            <span>Explainable ML</span>
          </div>
        </div>
      `;

    case 'agrotech':
      return `
        <div class="console-wrapper" id="consoleAgrotech">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">AgroTech Deep CNN Plant Doctor — Mobile Edge Pathology</span>
              <span class="console-status-pill success">MobileNetV3 • 96.8% Accuracy</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" data-leaf="1">Sample 1: Tomato Early Blight</button>
              <button class="console-btn" data-leaf="2">Sample 2: Potato Late Blight</button>
              <button class="console-btn" id="btnToggleClahe">CLAHE Filter: OFF</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px;">
              <div class="light-panel" style="padding: 10px;">
                <div class="light-panel-title">
                  <span id="agrotechLeafTitle">Field Leaf Scan (Pathology)</span>
                  <span style="color: #2B7A66; font-size: 0.72rem;">TorchVision Preprocessed</span>
                </div>
                <div style="width: 100%; aspect-ratio: 1.2; border-radius: 6px; overflow: hidden; background: #EFF5F3; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; position: relative;">
                  <img src="assets/projects/agrotech/test1.jpg" alt="Leaf Sample" id="agrotechLeafImg" style="width: 100%; height: 100%; object-fit: cover;">
                  <div id="agrotechBoundingBox" style="position: absolute; top: 25%; left: 30%; width: 45%; height: 45%; border: 2px dashed #B83A4B; border-radius: 4px;" class="anim-pulse"></div>
                </div>
                <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 0.74rem; color: var(--ink2);">
                  <span>Illumination Filter: <strong id="agrotechClaheLabel">Standard RGB</strong></span>
                  <span style="color: var(--plum); font-weight: 600;">Confidence: 97.2%</span>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Clinical Remediation Protocols</span>
                    <span style="color: #2B7A66;">Instant Agronomic Advisory</span>
                  </div>
                  <div style="background: linear-gradient(135deg, rgba(91,42,74,0.06), rgba(43,122,102,0.08)); border: 1px solid var(--line); border-radius: 6px; padding: 10px; margin-bottom: 8px;">
                    <div style="font-size: 0.72rem; color: var(--ink3); font-weight: 600;">DETECTED PATHOGEN</div>
                    <div id="agrotechDiseaseName" style="font-size: 1.05rem; font-weight: 700; color: #B83A4B; margin-top: 2px;">Alternaria solani (Early Blight)</div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <div style="background: #FAFDFB; border: 1px solid var(--line); border-radius: 6px; padding: 8px; font-size: 0.74rem;">
                      <strong style="color: #2B7A66;">Organic Advisory:</strong>
                      <div style="margin-top: 2px; color: var(--ink2);">Apply copper fungicide spray & prune lower infected foliage.</div>
                    </div>
                    <div style="background: #FAFDFB; border: 1px solid var(--line); border-radius: 6px; padding: 8px; font-size: 0.74rem;">
                      <strong style="color: var(--plum);">Chemical Treatment:</strong>
                      <div style="margin-top: 2px; color: var(--ink2);">Chlorothalonil (0.2%) solution application every 7–10 days.</div>
                    </div>
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Model Size: 4.2MB (INT8 Quantized)</span>
                  <span style="color: #2B7A66; font-weight: 600;">Latency: 32ms on Edge</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> AgroTech: Real-time leaf pathology inference active. CLAHE contrast equalization enabled.</span>
            <span>Agronomic Vision</span>
          </div>
        </div>
      `;

    case 'coldbrief':
      return `
        <div class="console-wrapper" id="consoleColdbrief">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">ColdBrief AI (AutoMail) — Autonomous B2B Prospecting & Outbound Engine</span>
              <span class="console-status-pill success">Apify Actor Listed • Pay-per-Event</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnColdbriefCrawl">⚡ Run Crawl & Enrichment</button>
              <button class="console-btn" id="btnColdbriefTarget">Target: hyperflow-robotics.com</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>Crawlee Headless Crawler & Pain Points</span>
                  <span style="color: #2B7A66;">Scraped 38 Subpages in 1.4s</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem;">
                  <div style="color: var(--plum); font-weight: 700; margin-bottom: 4px;">MINED EXECUTIVE PAIN POINTS:</div>
                  <div style="color: var(--ink); line-height: 1.45;">
                    • "High latency across multi-vendor fleets"<br>
                    • "Struggling to scale automated telemetry"<br>
                    • "Hiring VP of Industrial Systems"
                  </div>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-weight: 600; color: var(--ink);">ICP Fit Score:</span>
                    <strong style="color: #2B7A66; font-size: 1.05rem;">4.9 / 5.0 (Tier 1 Prospect)</strong>
                  </div>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>LLM Outbound Email Composer</span>
                    <span style="color: var(--plum);">Gemini 1.5 Pro</span>
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                    <strong>Subject:</strong> Quick question re: multi-vendor fleet latency<br><br>
                    <em>"Hi Alex, noticed Hyperflow's recent deployment in Berlin warehouse fleets—incredible scale! We built an edge serialization pipeline that cuts cross-vendor sync delays to under 12ms."</em>
                  </div>
                </div>
                <button class="console-btn accent-green" style="width: 100%; margin-top: 8px;" id="btnColdbriefDispatch">⚡ Dispatch via Apify Webhook</button>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> ColdBrief AI: Production Apify Actor ready. Monetized on Apify Store.</span>
            <span>B2B Sales Automation</span>
          </div>
        </div>
      `;

    case 'campuspulse':
      return `
        <div class="console-wrapper" id="consoleCampus">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">CampusPulse IoT Attendance OS — Triple-Lock Biometric Node</span>
              <span class="console-status-pill success">ESP32 • RC522 • Supabase</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn accent-green" id="btnCampusTapCard">⚡ Tap RFID Smart Card</button>
              <button class="console-btn" id="btnCampusSimProxy">Simulate Rapid-Tap Proxy</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>Hardware Board & RC522 Transceiver</span>
                  <span style="color: #2B7A66;">SPI Bus @ 13.56 MHz</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: var(--ink3);">CHIP:</span>
                    <strong>ESP32-WROOM-32 (Dual Core)</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: var(--ink3);">LAST UID READ:</span>
                    <strong id="campusUidText" style="color: var(--plum);">0x4A 0x82 0xDF 0x11</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--ink3);">HARDWARE STATE:</span>
                    <strong id="campusLedState" style="color: #2B7A66;">GREEN LED (ACCESS GRANTED)</strong>
                  </div>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Triple-Lock Anti-Proxy Verification</span>
                    <span style="color: #2B7A66;">Supabase PL/pgSQL</span>
                  </div>
                  <div style="background: #FAFDFB; border-left: 3px solid var(--plum); border-radius: 4px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                    <div id="campusLockDesc">• Lock 1: Cryptographic UID validation passed.<br>• Lock 2: 10-second rapid-tap proxy filter enforced.<br>• Lock 3: Atomic timetable transaction committed.</div>
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Location: E:\\Codes\\camcapsule-iot</span>
                  <span style="color: #2B7A66; font-weight: 600;">ACID Compliant</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> CampusPulse IoT: Triple-lock biometric attendance verification active.</span>
            <span>Embedded Systems</span>
          </div>
        </div>
      `;

    case 'uemcp':
      return `
        <div class="console-wrapper" id="consoleUemcp">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">UE_MCP + Qwen 3 Controller — Model Context Protocol for UE5</span>
              <span class="console-status-pill success">JSON-RPC • Sub-15ms WebSocket</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnUemcpSpawn">⚡ Spawn Nanite Mesh</button>
              <button class="console-btn" id="btnUemcpLumen">Adjust Lumen Lighting</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>JSON-RPC Dispatcher Timeline</span>
                  <span style="color: #2B7A66;">Ollama (Qwen 3)</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem; font-family: var(--mono); color: var(--ink);" id="uemcpTerminal">
                  {"jsonrpc": "2.0", "method": "spawn_actor", "params": {"mesh": "SM_Cliff_Rock_01", "location": [240, 110, 0]}}
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Unreal Engine 5 Execution Port</span>
                    <span style="color: var(--plum);">Remote Control API</span>
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                    <div id="uemcpStatusText">Mesh spawned in UE5 Level Viewport. Nanite virtualization budget: 0.04ms. Lumen dynamic global illumination bounced in 1.2ms.</div>
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Location: E:\\Codes\\UE_MCP</span>
                  <span style="color: #2B7A66; font-weight: 600;">Anthropic MCP Standard</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> UE_MCP: WebSocket live stream connected to Unreal Engine 5.8 session.</span>
            <span>Spatial Tool Calling</span>
          </div>
        </div>
      `;

    case 'amazonml':
      return `
        <div class="console-wrapper" id="consoleAmazon">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">Amazon ML Challenge '24 — Multimodal Entity Resolution</span>
              <span class="console-status-pill success">Top 3% National • 2.5M Catalog</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnAmazonMatch">⚡ Compare Candidate Pair</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>Product Pair Comparison</span>
                  <span style="color: #2B7A66;">MinHash LSH Candidate</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem;">
                  <div><strong>SKU A:</strong> Samsung Galaxy S23 Ultra (Phantom Black, 256GB)</div>
                  <div style="margin-top: 6px;"><strong>SKU B:</strong> Samsung S23 Ultra 5G - 256 GB Phantom Black (Unlocked)</div>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line); display: flex; justify-content: space-between;">
                    <span>Cosine Similarity: <strong>0.942</strong></span>
                    <span style="color: #2B7A66; font-weight: 700;">DUPLICATE DETECTED ✔</span>
                  </div>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>LightGBM Multimodal Scoring</span>
                    <span style="color: var(--plum);">42 Composite Features</span>
                  </div>
                  <div style="background: #FAFDFB; border-left: 3px solid var(--plum); border-radius: 4px; padding: 10px; font-size: 0.74rem; line-height: 1.45; color: var(--ink);">
                    MinHash LSH pruned 99.8% of pair combinations across 2.5 million catalog products. LightGBM ranker classified near-duplicates with 94.6% F1 score.
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Rank: Top 3% out of 25,000+ teams</span>
                  <span style="color: #2B7A66; font-weight: 600;">National Finalist</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> Amazon ML: MinHash LSH + LightGBM candidate generation pipeline verified.</span>
            <span>Multimodal ML</span>
          </div>
        </div>
      `;

        case 'handtracking':
      return `
        <div class="console-wrapper" id="consoleHand">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">Biometric Hand Tracking WASD — 21-Landmark Skeletal Controller</span>
              <span class="console-status-pill success">MediaPipe Hands • 60 FPS • DirectInput</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn" data-key="W">W: Forward</button>
              <button class="console-btn" data-key="A">A: Left</button>
              <button class="console-btn active" data-key="S">S: Neutral</button>
              <button class="console-btn" data-key="D">D: Right</button>
              <span style="font-size: 0.72rem; color: var(--ink3); margin-left: 6px;">(Or press physical W, A, S, D keys)</span>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px;">
              <!-- Left: Animated Hand Skeleton Visualizer -->
              <div class="light-panel" style="padding: 12px; display: flex; flex-direction: column;">
                <div class="light-panel-title">
                  <span>21-Landmark Biometric Skeleton</span>
                  <span style="color: #2B7A66;" id="handGestureLabel">Resting Neutral Hover</span>
                </div>
                <div style="background: #0E1618; border-radius: 8px; position: relative; height: 210px; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 20px rgba(0,0,0,0.6);">
                  <!-- Dynamic SVG Hand Skeleton -->
                  <svg id="handSkeletonSvg" viewBox="0 0 240 200" style="width: 100%; height: 100%; transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    <g id="handThrustEffect" style="opacity: 0.3; transition: all 0.3s;"></g>
                    <g id="handBones" stroke="#2B7A66" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"></g>
                    <g id="handJoints"></g>
                    <circle id="handCentroid" cx="120" cy="130" r="5" fill="#EFC07A" stroke="#FFFFFF" stroke-width="1.5" />
                  </svg>
                  <!-- Active Gesture HUD Overlay -->
                  <div id="handHudOverlay" style="position: absolute; bottom: 8px; left: 10px; font-size: 0.70rem; color: #7FD1BA; font-family: monospace; background: rgba(0,0,0,0.55); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(43,122,102,0.4);">
                    POS: [X: 0.00, Y: 0.00] • CONF: 99.4%
                  </div>
                  <div id="handActionPill" style="position: absolute; top: 8px; right: 10px; font-size: 0.68rem; font-weight: 700; color: #FFFFFF; background: rgba(43,122,102,0.85); padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                    HOVER STABILIZED
                  </div>
                </div>
                <!-- 4-Key WASD Interactive Visualizer -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-top: 10px;">
                  <div class="wasd-card" data-key="W" style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 6px; text-align: center; cursor: pointer; transition: all 0.2s;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--plum);">[ W ]</div>
                    <div style="font-size: 0.66rem; color: var(--ink3);">Forward Thrust</div>
                  </div>
                  <div class="wasd-card" data-key="A" style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 6px; text-align: center; cursor: pointer; transition: all 0.2s;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--plum);">[ A ]</div>
                    <div style="font-size: 0.66rem; color: var(--ink3);">Bank Left</div>
                  </div>
                  <div class="wasd-card active" data-key="S" style="background: rgba(43,122,102,0.12); border: 1px solid #2B7A66; border-radius: 6px; padding: 6px; text-align: center; cursor: pointer; transition: all 0.2s;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: #2B7A66;">[ S ]</div>
                    <div style="font-size: 0.66rem; color: var(--ink);">Neutral Hover</div>
                  </div>
                  <div class="wasd-card" data-key="D" style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 6px; text-align: center; cursor: pointer; transition: all 0.2s;">
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--plum);">[ D ]</div>
                    <div style="font-size: 0.66rem; color: var(--ink3);">Bank Right</div>
                  </div>
                </div>
              </div>

              <!-- Right: Real-time Telemetry & Resulting Action -->
              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Resulting Control Action</span>
                    <span style="color: var(--plum);" id="handDriverStatus">Virtual DirectInput Driver</span>
                  </div>

                  <div style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                    <div style="font-size: 0.70rem; color: var(--ink3); font-weight: 600; text-transform: uppercase;">Simulated Vehicle State:</div>
                    <div id="handResultOutcome" style="font-size: 0.95rem; font-weight: 700; color: var(--plum); margin: 3px 0;">
                      Stationary Hover • 0.0 m/s
                    </div>
                    <div id="handResultDesc" style="font-size: 0.72rem; color: var(--ink2); line-height: 1.4;">
                      Hand is centered in neutral resting plane. Zero forward or lateral propulsion emitted.
                    </div>
                  </div>

                  <!-- Gauges -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 8px;">
                      <div style="font-size: 0.66rem; color: var(--ink3);">WRIST PITCH</div>
                      <div id="handPitchVal" style="font-size: 0.92rem; font-weight: 700; color: var(--plum);">0.0°</div>
                      <div style="width: 100%; height: 4px; background: #E9ECEF; border-radius: 2px; margin-top: 4px; overflow: hidden;">
                        <div id="handPitchBar" style="width: 50%; height: 100%; background: var(--plum); transition: width 0.25s;"></div>
                      </div>
                    </div>
                    <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 8px;">
                      <div style="font-size: 0.66rem; color: var(--ink3);">WRIST ROLL</div>
                      <div id="handRollVal" style="font-size: 0.92rem; font-weight: 700; color: #2B7A66;">0.0°</div>
                      <div style="width: 100%; height: 4px; background: #E9ECEF; border-radius: 2px; margin-top: 4px; overflow: hidden;">
                        <div id="handRollBar" style="width: 50%; height: 100%; background: #2B7A66; transition: width 0.25s;"></div>
                      </div>
                    </div>
                  </div>

                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 8px; font-size: 0.72rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                      <span style="color: var(--ink3);">DirectInput Scan Code:</span>
                      <strong id="handScanCode" style="color: var(--plum); font-family: monospace;">DIK_S (0x1F)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                      <span style="color: var(--ink3);">Pipeline Latency:</span>
                      <strong style="color: #2B7A66;">14.2 ms (60 FPS)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--ink3);">Gesture Confidence:</span>
                      <strong style="color: #2B7A66;">0.994 (Pass)</strong>
                    </div>
                  </div>
                </div>

                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px; margin-top: 8px;">
                  <span>Driver: Win32 SendInput / DirectInput</span>
                  <span style="color: #2B7A66; font-weight: 600;">MediaPipe Hands</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span id="handLog">>> Biometric Controller: Neutral hover stabilized. Press W, A, S, or D to control.</span>
            <span>Vision Interface</span>
          </div>
        </div>
      `;

case 'nexus':
      return `
        <div class="console-wrapper" id="consoleNexus">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">Nexus Multi-Agent Parliamentary Debate Arena</span>
              <span class="console-status-pill success">Tavily Search • Groq LPU</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnNexusNext">Next Speaker</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>Debate Amphitheater</span>
                  <span style="color: #2B7A66;">Round 2 of 3</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem;">
                  <div><strong style="color: #2B7A66;">Proponent (Affirmative):</strong> "Decentralized energy grids reduce single-point transmission failure by 40%."</div>
                  <div style="margin-top: 6px;"><strong style="color: #B83A4B;">Opponent (Negative):</strong> "High initial battery capital costs present prohibitive municipal hurdles."</div>
                  <div style="margin-top: 6px;"><strong style="color: var(--plum);">Moderator:</strong> "Evaluating factual citations via Tavily live retrieval..."</div>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Live Fact-Checking Citations</span>
                    <span style="color: var(--plum);">Tavily API</span>
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                    Real-time web search verifies claims against recent engineering literature, preventing hallucination during multi-agent discourse.
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Sub-200ms Streaming</span>
                  <span style="color: #2B7A66; font-weight: 600;">LangGraph Orchestrated</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> Nexus Debate Arena: Multi-agent parliamentary discourse active.</span>
            <span>Autonomous Agents</span>
          </div>
        </div>
      `;

    case 'edutrack':
      return `
        <div class="console-wrapper" id="consoleEdutrack">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">EduTrack Adaptive RAG — Sub-200ms Cognitive Learning Engine</span>
              <span class="console-status-pill success">Top 20 | Code Odyssey 4.0</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnEdutrackQuiz">Interactive Syllabus Quiz</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>Groq LPU Instant Quiz Feedback</span>
                  <span style="color: #2B7A66;">Sub-200ms Generation</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem;">
                  <div style="font-weight: 600; color: var(--ink); margin-bottom: 6px;">Q: What is the primary advantage of Depthwise Separable Convolutions in MobileNet?</div>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="padding: 6px 8px; background: #FFFFFF; border: 1px solid var(--line); border-radius: 4px;">A) Reduces computation by splitting spatial and depth filtering (Correct ✔)</div>
                    <div style="padding: 6px 8px; background: #FFFFFF; border: 1px solid var(--line); border-radius: 4px;">B) Increases total parameter count</div>
                  </div>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Hybrid Retrieval Architecture</span>
                    <span style="color: var(--plum);">BM25 + pgvector</span>
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                    Engineered during a 30-hour national hackathon, achieving Top 20 national finalist ranking out of hundreds of engineering teams across India.
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Hardware: Groq LPU</span>
                  <span style="color: #2B7A66; font-weight: 600;">Latency: 184ms</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> EduTrack RAG: Fast hybrid semantic retrieval verified.</span>
            <span>Educational AI</span>
          </div>
        </div>
      `;

    case 'playnex':
      return `
        <div class="console-wrapper" id="consolePlaynex">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">PLAYNEX Enterprise Sports OS — Tournament Engine & Referee Console</span>
              <span class="console-status-pill success">Spring Boot 3 • Java 17</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnPlaynexGoalA">+1 Goal (Phoenix FC)</button>
              <button class="console-btn" id="btnPlaynexGoalB">+1 Goal (Titans)</button>
              <button class="console-btn" id="btnPlaynexReset">Reset Match</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>Live Match Referee Console</span>
                  <span style="color: #2B7A66;">78' Min (Second Half)</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: 700; color: var(--ink);">
                    <span>Phoenix FC: <span id="scoreA">2</span></span>
                    <span style="color: var(--plum);">VS</span>
                    <span>Titans: <span id="scoreB">1</span></span>
                  </div>
                  <div style="margin-top: 8px; font-size: 0.72rem; color: var(--ink2);">Standings recomputed instantly in Spring Boot transaction.</div>
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Tournament Scheduling Engine</span>
                    <span style="color: var(--plum);">Hibernate JPA</span>
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                    Automated round-robin bracket fixtures, tie-breaker resolutions, and role-based access for referees and team managers.
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Enterprise Stack: Spring Boot 3</span>
                  <span style="color: #2B7A66; font-weight: 600;">MySQL JPA</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> PLAYNEX: Transactional match fixture scoring active.</span>
            <span>Enterprise Systems</span>
          </div>
        </div>
      `;

        case 'threejsgame':
      return `
        <div class="console-wrapper" id="consoleThreejs">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">Three.js Isometric Engine — Interactive 3D WebGL Viewport</span>
              <span class="console-status-pill success" id="threejsStatus">WebGL Canvas • 60 FPS • Interactive</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btnThreeObjCube">Voxel Crate</button>
              <button class="console-btn" id="btnThreeObjGem">Faceted Gem</button>
              <button class="console-btn" id="btnThreeObjIcosa">Icosahedron</button>
              <button class="console-btn" id="btnThreeWireframe">Wireframe: OFF</button>
              <button class="console-btn active" id="btnThreeAutoRotate">Auto-Spin: ON</button>
              <button class="console-btn" id="btnThreeResetCam">Reset View</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 16px;">
              <!-- Left: Interactive 3D Canvas -->
              <div class="light-panel" style="padding: 10px; display: flex; flex-direction: column;">
                <div class="light-panel-title">
                  <span>Interactive 3D Viewport (Click & Drag to Rotate)</span>
                  <span style="color: #2B7A66;" id="threeObjLabel">Voxel Crate</span>
                </div>
                <div style="position: relative; width: 100%; height: 220px; background: #0A1114; border-radius: 8px; overflow: hidden; cursor: grab; box-shadow: inset 0 0 24px rgba(0,0,0,0.8);" id="threeCanvasWrap">
                  <canvas id="threeInteractiveCanvas" width="480" height="260" style="width: 100%; height: 100%; display: block;"></canvas>
                  <!-- Viewport HUD Overlay -->
                  <div style="position: absolute; top: 8px; left: 10px; font-size: 0.68rem; color: #7FD1BA; font-family: monospace; background: rgba(0,0,0,0.55); padding: 3px 8px; border-radius: 4px; pointer-events: none;">
                    ROT: <span id="threeRotHud">X: 25° Y: 45°</span>
                  </div>
                  <div style="position: absolute; bottom: 8px; right: 10px; font-size: 0.66rem; color: rgba(255,255,255,0.7); background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; pointer-events: none;">
                    ✦ Drag to orbit • Wheel to zoom
                  </div>
                </div>
              </div>

              <!-- Right: Real-time 3D Matrix & Spatial Telemetry -->
              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Spatial Grid & Raycast Telemetry</span>
                    <span style="color: var(--plum);">Raycast Active</span>
                  </div>

                  <div style="background: #F8FAF9; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">RAYCAST TARGET:</span>
                      <strong style="color: var(--plum);" id="threeTileText">Vector3(2.0, 0.0, 3.0)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">POLYGON COUNT:</span>
                      <strong style="color: #2B7A66;" id="threePolyCount">12 Triangles (6 Quads)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">SHADING MODEL:</span>
                      <strong style="color: var(--ink);" id="threeShadingText">Lambertian Flat Shading</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--ink3);">RENDER ENGINE:</span>
                      <strong style="color: #2B7A66;">60 FPS (WebGL Canvas)</strong>
                    </div>
                  </div>

                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                    Interactive spatial mathematics engine for the Three.js inventory RPG. Features real-time screen-to-world raycasting, bounding box intersection tests, and smooth camera projection without heavy dependencies.
                  </div>
                </div>

                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px;">
                  <span>Source: CODES\threejs-inventory-game</span>
                  <span style="color: #2B7A66; font-weight: 600;">Vanilla ES6 & WebGL</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span id="threeLog">>> Three.js Engine: Interactive 3D viewport active. Drag mouse on canvas to rotate object.</span>
            <span>Spatial Graphics</span>
          </div>
        </div>
      `;

    case 'apipool':
      return `
        <div class="console-wrapper" id="consoleApipool">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">API POOL Security Vault — Gateway & Project Dispatch Pipeline</span>
              <span class="console-status-pill success" id="apipoolStatusPill">Node.js • Express • Supabase</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn accent-green" id="btnApiDispatch">⚡ Dispatch API Request</button>
              <button class="console-btn active" id="btnApiAutoStream">Auto-Stream: ON</button>
              <button class="console-btn" id="btnApiRotate">Rotate Key Vault</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: flex; flex-direction: column; gap: 14px;">
              <!-- Top: Animated 3-Node Dispatch Pipeline -->
              <div class="light-panel" style="padding: 12px; position: relative; overflow: hidden;">
                <div class="light-panel-title">
                  <span>Real-time API Packet Dispatch Pipeline</span>
                  <span style="color: #2B7A66;" id="apiPipelineStatus">Active Stream: Server ➔ Gateway ➔ Project</span>
                </div>

                <div style="position: relative; background: #0E1618; border-radius: 8px; padding: 18px 12px; min-height: 130px; display: flex; align-items: center; justify-content: space-between; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
                  <!-- Connecting Conduit SVG with Traveling Packets -->
                  <svg style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;" id="apiConduitSvg">
                    <!-- Line 1: Server to Gateway -->
                    <line x1="16%" y1="50%" x2="48%" y2="50%" stroke="rgba(43,122,102,0.4)" stroke-width="3" stroke-dasharray="4 4" />
                    <!-- Line 2: Gateway to Destination -->
                    <line x1="52%" y1="50%" x2="84%" y2="50%" stroke="rgba(239,192,122,0.5)" stroke-width="3" stroke-dasharray="4 4" />
                    <!-- Animated Traveling Packets -->
                    <circle id="apiPacket1" cx="16%" cy="50%" r="6" fill="#7FD1BA">
                      <animate attributeName="cx" values="16%;48%" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;1;1;0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                    <circle id="apiPacket2" cx="52%" cy="50%" r="6" fill="#EFC07A">
                      <animate attributeName="cx" values="52%;84%" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;1;1;0" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
                    </circle>
                  </svg>

                  <!-- Node 1: Credential Server Vault -->
                  <div style="position: relative; z-index: 2; width: 28%; background: rgba(255,255,255,0.08); backdrop-filter: blur(4px); border: 1px solid rgba(43,122,102,0.6); border-radius: 6px; padding: 10px; text-align: center; color: #FFFFFF;">
                    <div style="font-size: 0.64rem; color: #7FD1BA; font-weight: 700; text-transform: uppercase;">1. Key Vault Server</div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: #FFFFFF; margin: 2px 0;">Credential Pool</div>
                    <div style="font-size: 0.68rem; color: #A0C2B9;" id="apiActiveKeyDisplay">Slot #2 (sk-...98b)</div>
                  </div>

                  <!-- Node 2: Central API Pool Gateway -->
                  <div id="apiGatewayNode" style="position: relative; z-index: 2; width: 28%; background: rgba(255,255,255,0.08); backdrop-filter: blur(4px); border: 1px solid rgba(239,192,122,0.7); border-radius: 6px; padding: 10px; text-align: center; color: #FFFFFF; transition: transform 0.2s;">
                    <div style="font-size: 0.64rem; color: #EFC07A; font-weight: 700; text-transform: uppercase;">2. API Pool Gateway</div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: #FFFFFF; margin: 2px 0;">Rate & Auth Proxy</div>
                    <div style="font-size: 0.68rem; color: #EFC07A;" id="apiRateDisplay">18 / 60 RPM • PASS</div>
                  </div>

                  <!-- Node 3: Selected Destination Project -->
                  <div id="apiProjectNode" style="position: relative; z-index: 2; width: 28%; background: rgba(255,255,255,0.08); backdrop-filter: blur(4px); border: 1px solid #7FD1BA; border-radius: 6px; padding: 10px; text-align: center; color: #FFFFFF; transition: transform 0.2s;">
                    <div style="font-size: 0.64rem; color: #7FD1BA; font-weight: 700; text-transform: uppercase;">3. Destination Project</div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: #FFFFFF; margin: 2px 0;" id="apiRoutedProjectName">ColdBrief AI</div>
                    <div style="font-size: 0.68rem; color: #7FD1BA;" id="apiRoutedStatus">200 OK • 14ms Latency</div>
                  </div>
                </div>

                <!-- Destination Project Switcher -->
                <div style="display: flex; gap: 8px; margin-top: 10px; align-items: center; flex-wrap: wrap;">
                  <span style="font-size: 0.72rem; color: var(--ink3); font-weight: 600;">ROUTE TO PROJECT:</span>
                  <button class="console-btn active" data-routed="coldbrief" style="font-size: 0.72rem;">ColdBrief AI</button>
                  <button class="console-btn" data-routed="covidxray" style="font-size: 0.72rem;">COVID-19 Vision</button>
                  <button class="console-btn" data-routed="campuspulse" style="font-size: 0.72rem;">CampusPulse</button>
                  <button class="console-btn" data-routed="agrotech" style="font-size: 0.72rem;">AgroTech</button>
                </div>
              </div>

              <!-- Bottom Grid: Telemetry & Architecture -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="light-panel">
                  <div class="light-panel-title">
                    <span>Cryptographic Bearer Handshake</span>
                    <span style="color: #2B7A66;">Active Token Pool</span>
                  </div>
                  <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">ACTIVE KEY SLOT:</span>
                      <strong style="color: var(--plum);" id="apiKeySlot">Slot #2 (sk-...98b)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="color: var(--ink3);">DISPATCHED TO:</span>
                      <strong style="color: #2B7A66;" id="apiDispatchedTarget">ColdBrief AI (Port 3000)</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: var(--ink3);">DOMAIN ORIGIN:</span>
                      <strong style="color: #2B7A66;">Whitelisted (Strict CORS)</strong>
                    </div>
                  </div>
                </div>

                <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div class="light-panel-title">
                      <span>Credential Shield Architecture</span>
                      <span style="color: var(--plum);">Supabase Vault</span>
                    </div>
                    <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                      Centralized secret proxy prevents client frontend API token leakages and balances high-volume request loads across multiple provider keys.
                    </div>
                  </div>
                  <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between; border-top: 1px solid var(--line); padding-top: 8px;">
                    <span>Location: E:\Codes\Proffesional_Work\API_POOL</span>
                    <span style="color: #2B7A66; font-weight: 600;">Bearer Security</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span id="apiLog">>> API POOL: Bearer token validation and key pool rotation active. Dispatched to ColdBrief AI.</span>
            <span>Security Gateway</span>
          </div>
        </div>
      `;

case 'antigravity3d':
      return `
        <div class="console-wrapper" id="consoleAg3d">
          <div class="console-header-bar">
            <div class="console-title-group">
              <span class="console-title">AntiGravity 3D AI Studio — 6-Stage Image-to-PBR Asset Engine</span>
              <span class="console-status-pill success">Next.js 14 • R3F • TripoSR</span>
            </div>
            <div class="console-toolbar">
              <button class="console-btn active" id="btn3dModePbr">PBR Shaded</button>
              <button class="console-btn" id="btn3dModeWire">Wireframe Mesh</button>
              <button class="console-btn" id="btn3dModeNorm">Surface Normals</button>
            </div>
          </div>
          <div class="console-stage-area">
            <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;">
              <div class="light-panel">
                <div class="light-panel-title">
                  <span>6-Stage VRAM Processing Pipeline</span>
                  <span style="color: #2B7A66;">Sub-45s Generation</span>
                </div>
                <div style="background: #F8FAF9; border-radius: 6px; padding: 10px; font-size: 0.74rem; line-height: 1.45;">
                  1. SAM Foreground Segmentation ✔<br>
                  2. TripoSR NeRF Volume Reconstruction ✔<br>
                  3. PyMeshLab Laplacian Smoothing & Decimation ✔<br>
                  4. xatlas UV Unwrapping & Parametrization ✔<br>
                  5. SDXL Latent PBR Texture Inpainting ✔<br>
                  6. Production GLB/FBX Export ✔
                </div>
              </div>

              <div class="light-panel" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div class="light-panel-title">
                    <span>Interactive 3D Client Viewport</span>
                    <span style="color: var(--plum);">React Three Fiber</span>
                  </div>
                  <div style="background: #FFFFFF; border: 1px solid var(--line); border-radius: 6px; padding: 10px; font-size: 0.74rem; color: var(--ink); line-height: 1.45;">
                    <div id="ag3dShaderDesc">Active Shader: Physically Based Rendering (PBR) with Metallic-Roughness map and directional sunlight.</div>
                  </div>
                </div>
                <div style="font-size: 0.72rem; color: var(--ink3); display: flex; justify-content: space-between;">
                  <span>Location: E:\\Codes\\3d_engine</span>
                  <span style="color: #2B7A66; font-weight: 600;">Generative 3D</span>
                </div>
              </div>
            </div>
          </div>
          <div class="console-log-bar">
            <span>>> AntiGravity 3D AI Studio: 6-stage VRAM pipeline running smoothly.</span>
            <span>Generative 3D</span>
          </div>
        </div>
      `;

    default:
      return `<div class="light-panel" style="padding: 24px; text-align: center;">Console view not available for this project.</div>`;
  }
}



/* ==========================================================================
   Interactive Console Event Handlers (ALL 18 PROJECTS FULLY WIRED)
   ========================================================================== */
function attachConsoleInteractivity(type) {
  // 1. COVID-19 Clinical Radiograph Workstation
    // 1. COVID-19 Clinical Radiograph Workstation (Pure Chest Radiographs Only)
  if (type === 'covidxray') {
    try {
      const patientBtns = document.querySelectorAll('#consoleCovid [data-patient]');
      const baseImg = document.getElementById('xrayBaseImg');
      const gradcamOverlay = document.getElementById('xrayGradCamOverlay');
      const title = document.getElementById('xrayTitle');
      const featureText = document.getElementById('xrayFeatureText');
      const diagnosis = document.getElementById('covidDiagnosis');
      const conf = document.getElementById('covidConf');
      const xaiDesc = document.getElementById('xaiDesc');
      const log = document.getElementById('covidLog');
      const reticle1 = document.getElementById('xrayReticle');
      const reticle2 = document.getElementById('xrayReticle2');
      const scanBeam = document.getElementById('xrayScanBeam');
      const btnScan = document.getElementById('btnRunCovidScan');
      const btnHeatmap = document.getElementById('btnToggleHeatmap');
      const btnReticle = document.getElementById('btnToggleReticle');

      const patientData = {
        '1': {
          img: 'assets/projects/covid_xray/xray_1.png',
          title: 'Patient #1 — Thoracic AP Radiograph',
          feature: 'Bilateral Peripheral Opacities',
          diag: 'COVID-19 VIRAL PNEUMONIA (POSITIVE)',
          diagColor: '#B83A4B',
          conf: 'Confidence: 98.4% • Focal Loss: 0.041',
          desc: 'Thermodynamic gradients localize focal bilateral consolidations along lower lobe periphery with zero black-box ambiguity.',
          log: '>> DICOM Analysis: Patient #1 Radiograph — Bilateral Ground-Glass Infiltrates Localized.',
          heatStyle: 'radial-gradient(ellipse 35% 45% at 30% 65%, rgba(235, 87, 87, 0.6) 0%, rgba(239, 192, 122, 0.35) 45%, transparent 70%), radial-gradient(ellipse 32% 42% at 70% 62%, rgba(235, 87, 87, 0.55) 0%, rgba(239, 192, 122, 0.3) 45%, transparent 70%)',
          reticles: [{ top: '36%', left: '16%', width: '34%', height: '38%' }, { top: '32%', right: '16%', width: '32%', height: '40%' }]
        },
        '2': {
          img: 'assets/projects/covid_xray/xray_2.png',
          title: 'Patient #2 — Thoracic AP Radiograph',
          feature: 'Dense Lobar Consolidation',
          diag: 'SEVERE PNEUMONIA INFECTION (POSITIVE)',
          diagColor: '#B83A4B',
          conf: 'Confidence: 96.8% • Focal Loss: 0.052',
          desc: 'Marked confluent airspace opacity and air bronchograms in right lower zone with focal thermodynamic gradient concentration.',
          log: '>> DICOM Analysis: Patient #2 Radiograph — Severe Right Lobar Pneumonia Consolidation.',
          heatStyle: 'radial-gradient(ellipse 42% 48% at 68% 66%, rgba(220, 53, 69, 0.72) 0%, rgba(239, 192, 122, 0.42) 50%, transparent 75%)',
          reticles: [{ top: '40%', right: '15%', width: '38%', height: '42%' }, { top: '0', right: '0', width: '0', height: '0', display: 'none' }]
        },
        '3': {
          img: 'assets/projects/covid_xray/xray_3.png',
          title: 'Patient #3 — Thoracic AP Radiograph',
          feature: 'Clear Lung Parenchyma',
          diag: 'NORMAL LUNG FIELDS (NEGATIVE)',
          diagColor: '#2B7A66',
          conf: 'Confidence: 99.1% • Focal Loss: 0.008',
          desc: 'Uniform gradient activation across thoracic boundaries; complete absence of focal consolidation or interstitial infiltrates.',
          log: '>> DICOM Analysis: Patient #3 Radiograph — Clear Lung Parenchyma, No Pathology Detected.',
          heatStyle: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(43, 122, 102, 0.15) 0%, transparent 80%)',
          reticles: [{ top: '0', left: '0', width: '0', height: '0', display: 'none' }, { top: '0', right: '0', width: '0', height: '0', display: 'none' }]
        }
      };

      patientBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          patientBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const p = patientData[btn.dataset.patient];
          if (p) {
            if (baseImg) baseImg.src = p.img;
            if (title) title.textContent = p.title;
            if (featureText) featureText.textContent = p.feature;
            if (diagnosis) {
              diagnosis.textContent = p.diag;
              diagnosis.style.color = p.diagColor;
            }
            if (conf) conf.textContent = p.conf;
            if (xaiDesc) xaiDesc.textContent = p.desc;
            if (log) log.textContent = p.log;
            if (gradcamOverlay) gradcamOverlay.style.background = p.heatStyle;

            if (reticle1 && p.reticles[0]) {
              reticle1.style.top = p.reticles[0].top;
              reticle1.style.left = p.reticles[0].left || 'auto';
              reticle1.style.width = p.reticles[0].width;
              reticle1.style.height = p.reticles[0].height;
            }
            if (reticle2 && p.reticles[1]) {
              reticle2.style.top = p.reticles[1].top;
              reticle2.style.right = p.reticles[1].right || 'auto';
              reticle2.style.width = p.reticles[1].width;
              reticle2.style.height = p.reticles[1].height;
            }
          }
        });
      });

      if (btnHeatmap && gradcamOverlay) {
        btnHeatmap.addEventListener('click', () => {
          const isActive = gradcamOverlay.classList.toggle('active');
          btnHeatmap.classList.toggle('active', isActive);
          btnHeatmap.textContent = isActive ? 'Grad-CAM: ON' : 'Grad-CAM: OFF';
        });
      }

      if (btnReticle && reticle1) {
        btnReticle.addEventListener('click', () => {
          const isShown = reticle1.style.display !== 'none';
          const nextDisp = isShown ? 'none' : 'block';
          reticle1.style.display = nextDisp;
          if (reticle2 && reticle2.style.width !== '0') reticle2.style.display = nextDisp;
          btnReticle.classList.toggle('active', !isShown);
        });
      }

      if (btnScan && scanBeam) {
        btnScan.addEventListener('click', () => {
          scanBeam.classList.add('scanning');
          if (log) log.textContent = '>> PyTorch Inference: Running MobileNetV2 DICOM slice scan...';
          setTimeout(() => {
            scanBeam.classList.remove('scanning');
            if (log) log.textContent = '>> Scan Complete: MobileNetV2 confirmed classification with 98.4% ROC-AUC.';
          }, 1800);
        });
      }
    } catch (e) {
      console.error('covidxray init error:', e);
    }
  }

if (type === 'chess') {
    try {
      initPlayableChessEngine();
    } catch (e) {
      console.error('chess init error:', e);
    }
  }

  // 3. Cortexium 2.0 (Perspective Road HUD + Spatial Displacement Organizer)
  if (type === 'cortexium') {
    try {
      const cortexTabs = document.querySelectorAll('#consoleCortexium [data-cortextab]');
      const tabSocial = document.getElementById('cortexTabSocial');
      const tabCar = document.getElementById('cortexTabCar');
      const tabOrganizer = document.getElementById('cortexTabOrganizer');
      const cortexLog = document.getElementById('cortexLogBar');

      cortexTabs.forEach(btn => {
        btn.addEventListener('click', () => {
          cortexTabs.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tab = btn.dataset.cortextab;
          if (tabSocial) tabSocial.style.display = tab === 'social' ? 'block' : 'none';
          if (tabCar) tabCar.style.display = tab === 'car' ? 'block' : 'none';
          if (tabOrganizer) tabOrganizer.style.display = tab === 'organizer' ? 'block' : 'none';
          if (cortexLog) cortexLog.textContent = `>> Cortexium 2.0: Switched to ${btn.textContent.trim()} mode.`;
        });
      });

      // Social Tab Interactivity
      const btnCrowd = document.getElementById('btnCortexCrowd');
      const btnCyclePerson = document.getElementById('btnCortexCyclePerson');
      const btnTranscribe = document.getElementById('btnCortexTranscribe');
      const personName = document.getElementById('cortexPersonName');
      const recallQuote = document.getElementById('cortexRecallQuote');
      const liveStream = document.getElementById('cortexLiveStream');
      const crowdStatus = document.getElementById('crowdStatusText');
      const radarSweep = document.getElementById('cortexRadarSweep');

      const contacts = [
        { name: 'Dr. A. Sharma (Lead ML Architect)', quote: '"Approved multi-agent pipeline architecture. Requested edge latency kept strictly below 50ms without Unreal Engine dependency."' },
        { name: 'Prof. K. Mehta (HCI Researcher)', quote: '"Verified optical infinity projection. Zero accommodation vergence conflict observed during 2-hour field trials."' },
        { name: 'Sarah Jenkins (Industrial Warehouse Lead)', quote: '"Requested automated misplaced item alerts with 3D return trajectory vectors for warehouse aisles."' }
      ];
      let contactIdx = 0;

      if (btnCyclePerson) {
        btnCyclePerson.addEventListener('click', () => {
          contactIdx = (contactIdx + 1) % contacts.length;
          if (personName) personName.textContent = contacts[contactIdx].name;
          if (recallQuote) recallQuote.textContent = contacts[contactIdx].quote;
          if (cortexLog) cortexLog.textContent = `>> Memory Recall: Loaded indexed dialogue for ${contacts[contactIdx].name}.`;
        });
      }

      if (btnCrowd) {
        btnCrowd.addEventListener('click', () => {
          if (crowdStatus) crowdStatus.textContent = 'Radar: Scanning 14 targets...';
          if (radarSweep) radarSweep.style.transform = 'rotate(720deg)';
          setTimeout(() => {
            if (crowdStatus) crowdStatus.textContent = 'Radar: TARGET LOCKED (4.2m)';
            if (cortexLog) cortexLog.textContent = '>> Crowd Radar: Subject localized at 4.2m forward-right vector.';
          }, 600);
        });
      }

      if (btnTranscribe) {
        btnTranscribe.addEventListener('click', () => {
          if (liveStream) {
            liveStream.innerHTML = '<em>"Synchronizing spatial anchors to edge memory bus..."</em> <span class="anim-cursor">|</span>';
            if (cortexLog) cortexLog.textContent = '>> Audio Stream: Real-time Whisper speech transcription active.';
          }
        });
      }

      // Car HUD Elevation Switcher
      const btnElev = document.getElementById('btnCarToggleElevation');
      const bridgeLayer = document.getElementById('bridgeLayer');
      const underpassLayer = document.getElementById('underpassLayer');
      const carPrompt = document.getElementById('carTurnPromptPill');
      const carElevText = document.getElementById('carNavElevationText');
      let isBridge = true;

      if (btnElev) {
        btnElev.addEventListener('click', () => {
          isBridge = !isBridge;
          if (bridgeLayer) bridgeLayer.style.display = isBridge ? 'block' : 'none';
          if (underpassLayer) underpassLayer.style.display = isBridge ? 'none' : 'block';
          if (carPrompt) {
            carPrompt.textContent = isBridge
              ? '↗ Take Elevated Flyover Bridge Ramp (80m)'
              : '↘ Enter Subway Underpass Tunnel (60m)';
            carPrompt.style.borderColor = isBridge ? 'var(--plum)' : '#2B7A66';
            carPrompt.style.color = isBridge ? 'var(--plum)' : '#2B7A66';
          }
          if (carElevText) {
            carElevText.textContent = isBridge
              ? 'Elevation: +14m Flyover Bridge'
              : 'Elevation: -8m Subway Underpass';
            carElevText.style.color = isBridge ? 'var(--plum)' : '#2B7A66';
          }
          if (cortexLog) cortexLog.textContent = `>> Car Nav HUD: Conformal route updated to ${isBridge ? 'Flyover Bridge (+14m)' : 'Subway Underpass (-8m)'}.`;
        });
      }

      // Car Drowsiness Alarm
      const btnDrowsy = document.getElementById('btnCarDrowsyAlert');
      const drowsyBox = document.getElementById('drowsyAlertBox');
      const drowsyTitle = document.getElementById('drowsyAlertTitle');
      const drowsyDesc = document.getElementById('drowsyAlertDesc');
      const carViewport = document.getElementById('carHudViewport');
      let isDrowsy = false;

      if (btnDrowsy) {
        btnDrowsy.addEventListener('click', () => {
          isDrowsy = !isDrowsy;
          if (drowsyBox) {
            drowsyBox.style.background = isDrowsy ? '#FDF0F2' : '#F8FAF9';
            drowsyBox.style.borderColor = isDrowsy ? '#B83A4B' : 'var(--line)';
          }
          if (drowsyTitle) {
            drowsyTitle.textContent = isDrowsy
              ? '⚠️ WARNING: MICRO-SLEEP & DIZZINESS DETECTED'
              : 'Status: Driver Alert & Attentive';
            drowsyTitle.style.color = isDrowsy ? '#B83A4B' : '#2B7A66';
          }
          if (drowsyDesc) {
            drowsyDesc.textContent = isDrowsy
              ? 'PERCLOS: 840ms (> 500ms Threshold) • Acoustic 1046Hz wake alarm sounding • LKAS stabilizing lane'
              : 'Blink duration: 180ms (Normal) • Gaze vector: Centered on highway • Head pitch: 1.2°';
          }
          if (carViewport) {
            carViewport.classList.toggle('drowsy-hud-flash', isDrowsy);
          }
          btnDrowsy.textContent = isDrowsy ? '✅ Reset Driver Alertness' : '⚠️ Simulate Drowsy / Dizzy Alert';
          if (cortexLog) cortexLog.textContent = isDrowsy
            ? '>> SAFETY GUARD ALERT: Driver fatigue detected! Sounding acoustic wake alarm.'
            : '>> Driver vigilance returned to normal. Lane keeping in standby.';
        });
      }

      // Organizer Spatial Displacement Logic
      const btnOrgReturn = document.getElementById('btnOrgReturnItem');
      const btnOrgMisplace = document.getElementById('btnOrgToggleMisplace');
      const misplacedGroup = document.getElementById('misplacedObjectGroup');
      const trajectoryGroup = document.getElementById('returnTrajectoryGroup');
      const orgAlertBanner = document.getElementById('orgAlertBanner');
      const orgBadge = document.getElementById('orgModeBadge');
      const orgCurrent = document.getElementById('orgCurrentLoc');
      const orgVector = document.getElementById('orgVectorDistance');

      if (btnOrgReturn) {
        btnOrgReturn.addEventListener('click', () => {
          if (misplacedGroup) misplacedGroup.style.display = 'none';
          if (trajectoryGroup) trajectoryGroup.style.display = 'none';
          if (orgAlertBanner) {
            orgAlertBanner.style.background = 'rgba(43, 122, 102, 0.9)';
            orgAlertBanner.textContent = '✅ INVENTORY AUDIT CLEAN: All items placed in designated slots';
          }
          if (orgBadge) {
            orgBadge.textContent = 'Audit Status: 100% In-Slot';
            orgBadge.style.color = '#2B7A66';
          }
          if (orgCurrent) orgCurrent.textContent = 'Shelf A, Slot 2 (Correct)';
          if (orgVector) orgVector.textContent = '0.0m (Aligned with baseline)';
          if (cortexLog) cortexLog.textContent = '>> Spatial Hub: Stapler returned to original anchor. Inventory clean.';
        });
      }

      if (btnOrgMisplace) {
        btnOrgMisplace.addEventListener('click', () => {
          if (misplacedGroup) misplacedGroup.style.display = 'block';
          if (trajectoryGroup) trajectoryGroup.style.display = 'block';
          if (orgAlertBanner) {
            orgAlertBanner.style.background = 'rgba(184, 58, 75, 0.9)';
            orgAlertBanner.textContent = '⚠️ MISPLACED ITEM DETECTED: Stapler (SKU-104) in Bin C';
          }
          if (orgBadge) {
            orgBadge.textContent = 'Audit Mode: 1 Misplaced Item';
            orgBadge.style.color = '#B83A4B';
          }
          if (orgCurrent) orgCurrent.textContent = 'Component Bin C (Slot #4)';
          if (orgVector) orgVector.textContent = '1.6m [ΔX: -0.75m, ΔY: +1.4m]';
          if (cortexLog) cortexLog.textContent = '>> Spatial Hub: Displaced item detected! Ghost return vector projected.';
        });
      }
    } catch (e) {
      console.error('cortexium init error:', e);
    }
  }

  // 4. ColdBrief AI (AutoMail)
  if (type === 'coldbrief') {
    try {
      const btnCrawl = document.getElementById('btnColdbriefCrawl');
      const btnTarget = document.getElementById('btnColdbriefTarget');
      const btnDispatch = document.getElementById('btnColdbriefDispatch');

      const targets = [
        { url: 'hyperflow-robotics.com', pages: 38, time: '1.4s', fit: '4.9 / 5.0 (Tier 1)', pain: '• "High latency across multi-vendor fleets"<br>• "Struggling to scale automated telemetry"<br>• "Hiring VP of Industrial Systems"' },
        { url: 'neuroscale-ai.io', pages: 24, time: '1.1s', fit: '4.7 / 5.0 (Tier 1)', pain: '• "CUDA VRAM bottlenecks during multi-tenant inference"<br>• "Seeking sub-30ms embedding pipeline"<br>• "Expanding edge compute nodes"' },
        { url: 'apex-robotics.com', pages: 42, time: '1.8s', fit: '4.8 / 5.0 (Tier 1)', pain: '• "Cross-chassis ROS2 serialization delays"<br>• "Firmware telemetry pipeline overhead"<br>• "Scaling autonomous warehouse fleets"' }
      ];
      let targetIdx = 0;

      if (btnTarget) {
        btnTarget.addEventListener('click', () => {
          targetIdx = (targetIdx + 1) % targets.length;
          const t = targets[targetIdx];
          btnTarget.textContent = `Target: ${t.url}`;
          const painEl = document.querySelector('#consoleColdbrief .light-panel:first-child .light-panel-title + div');
          if (painEl) {
            painEl.innerHTML = `
              <div style="color: var(--plum); font-weight: 700; margin-bottom: 4px;">MINED EXECUTIVE PAIN POINTS:</div>
              <div style="color: var(--ink); line-height: 1.45;">${t.pain}</div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: 600; color: var(--ink);">ICP Fit Score:</span>
                <strong style="color: #2B7A66; font-size: 1.05rem;">${t.fit}</strong>
              </div>
            `;
          }
        });
      }

      if (btnCrawl) {
        btnCrawl.addEventListener('click', () => {
          btnCrawl.textContent = 'Crawling target domain...';
          btnCrawl.disabled = true;
          setTimeout(() => {
            btnCrawl.textContent = '⚡ Run Crawl & Enrichment';
            btnCrawl.disabled = false;
          }, 1200);
        });
      }

      if (btnDispatch) {
        btnDispatch.addEventListener('click', () => {
          btnDispatch.textContent = '✔ Dispatched via Webhook (200 OK)';
          btnDispatch.classList.add('active');
          setTimeout(() => {
            btnDispatch.textContent = '⚡ Dispatch via Apify Webhook';
          }, 2500);
        });
      }
    } catch (e) {
      console.error('coldbrief init error:', e);
    }
  }

  // 5. AntiGravity 3D Studio
  if (type === 'antigravity3d') {
    try {
      const btnPbr = document.getElementById('btn3dModePbr');
      const btnWire = document.getElementById('btn3dModeWire');
      const btnNorm = document.getElementById('btn3dModeNorm');
      const shaderDesc = document.getElementById('ag3dShaderDesc');

      [btnPbr, btnWire, btnNorm].forEach(b => {
        if (!b) return;
        b.addEventListener('click', () => {
          [btnPbr, btnWire, btnNorm].forEach(x => x && x.classList.remove('active'));
          b.classList.add('active');
          if (b === btnPbr && shaderDesc) {
            shaderDesc.textContent = 'Active Shader: Physically Based Rendering (PBR) with Metallic-Roughness map and directional sunlight.';
          } else if (b === btnWire && shaderDesc) {
            shaderDesc.textContent = 'Active Shader: Wireframe Topology (18,420 triangles) with Laplacian surface regularization.';
          } else if (b === btnNorm && shaderDesc) {
            shaderDesc.textContent = 'Active Shader: Surface Normal Tangent Vectors (RGB mapped) for high-frequency relief details.';
          }
        });
      });
    } catch (e) {
      console.error('antigravity3d init error:', e);
    }
  }

  // 6. CampusPulse IoT Attendance OS
  if (type === 'campuspulse') {
    try {
      const btnTap = document.getElementById('btnCampusTapCard');
      const btnProxy = document.getElementById('btnCampusSimProxy');
      const uidText = document.getElementById('campusUidText');
      const ledState = document.getElementById('campusLedState');
      const lockDesc = document.getElementById('campusLockDesc');

      if (btnTap) {
        btnTap.addEventListener('click', () => {
          const randHex = Math.floor(Math.random() * 0xFF).toString(16).toUpperCase().padStart(2, '0');
          if (uidText) uidText.textContent = `0x4A 0x82 0xDF 0x${randHex}`;
          if (ledState) {
            ledState.textContent = 'GREEN LED (ACCESS GRANTED)';
            ledState.style.color = '#2B7A66';
          }
          if (lockDesc) {
            lockDesc.innerHTML = '• Lock 1: Cryptographic UID validation passed.<br>• Lock 2: 10-second rapid-tap proxy filter enforced.<br>• Lock 3: Atomic timetable transaction committed.';
          }
        });
      }

      if (btnProxy) {
        btnProxy.addEventListener('click', () => {
          if (ledState) {
            ledState.textContent = 'RED LED + BUZZER (RAPID TAP REJECTED)';
            ledState.style.color = '#B83A4B';
          }
          if (lockDesc) {
            lockDesc.innerHTML = '<span style="color: #B83A4B; font-weight: 700;">• Lock 2 VIOLATION: Duplicate swipe within 10s cooldown window. Request blocked by PL/pgSQL trigger.</span>';
          }
        });
      }
    } catch (e) {
      console.error('campuspulse init error:', e);
    }
  }

  // 7. UE_MCP + Qwen 3 Controller
  if (type === 'uemcp') {
    try {
      const btnSpawn = document.getElementById('btnUemcpSpawn');
      const btnLumen = document.getElementById('btnUemcpLumen');
      const terminal = document.getElementById('uemcpTerminal');
      const statusText = document.getElementById('uemcpStatusText');

      if (btnSpawn) {
        btnSpawn.addEventListener('click', () => {
          btnSpawn.classList.add('active');
          if (btnLumen) btnLumen.classList.remove('active');
          if (terminal) terminal.textContent = '{"jsonrpc": "2.0", "method": "spawn_actor", "params": {"mesh": "SM_Cliff_Rock_01", "location": [240, 110, 0]}}';
          if (statusText) statusText.textContent = 'Mesh spawned in UE5 Level Viewport. Nanite virtualization budget: 0.04ms. Remote execution verified.';
        });
      }

      if (btnLumen) {
        btnLumen.addEventListener('click', () => {
          btnLumen.classList.add('active');
          if (btnSpawn) btnSpawn.classList.remove('active');
          if (terminal) terminal.textContent = '{"jsonrpc": "2.0", "method": "set_directional_light", "params": {"pitch": -45.0, "intensity": 75000}}';
          if (statusText) statusText.textContent = 'Lumen dynamic global illumination recalculated in 1.2ms. Sun position updated.';
        });
      }
    } catch (e) {
      console.error('uemcp init error:', e);
    }
  }

  // 8. Amazon ML Challenge '24
  if (type === 'amazonml') {
    try {
      const btnMatch = document.getElementById('btnAmazonMatch');
      if (btnMatch) {
        btnMatch.addEventListener('click', () => {
          btnMatch.textContent = 'Calculating Similarity...';
          setTimeout(() => {
            btnMatch.textContent = '✔ Verified Candidate Match';
          }, 800);
        });
      }
    } catch (e) {
      console.error('amazonml init error:', e);
    }
  }

  // 9. AgroTech Deep CNN Plant Doctor
  if (type === 'agrotech') {
    try {
      const btnClahe = document.getElementById('btnToggleClahe');
      const leafImg = document.getElementById('agrotechLeafImg');
      const claheLabel = document.getElementById('agrotechClaheLabel');
      const sampleBtns = document.querySelectorAll('#consoleAgrotech [data-leaf]');

      sampleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          sampleBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (leafImg) {
            leafImg.src = btn.dataset.leaf === '1' ? 'assets/projects/agrotech/test1.jpg' : 'assets/projects/agrotech/test2.jpg';
          }
        });
      });

      if (btnClahe) {
        btnClahe.addEventListener('click', () => {
          const isClahe = btnClahe.classList.toggle('active');
          btnClahe.textContent = isClahe ? 'CLAHE Filter: ON' : 'CLAHE Filter: OFF';
          if (claheLabel) claheLabel.textContent = isClahe ? 'CLAHE Contrast Equalized' : 'Standard RGB';
          if (leafImg) leafImg.style.filter = isClahe ? 'contrast(1.4) saturate(1.2)' : 'none';
        });
      }
    } catch (e) {
      console.error('agrotech init error:', e);
    }
  }

  // 10. Biometric Hand Tracking WASD
    // 10. Biometric Hand Tracking WASD Controller with Real Animations & Keyboard Integration
  if (type === 'handtracking') {
    try {
      const wasdButtons = document.querySelectorAll('#consoleHand button[data-key]');
      const wasdCards = document.querySelectorAll('#consoleHand .wasd-card');
      const skeletonSvg = document.getElementById('handSkeletonSvg');
      const handBones = document.getElementById('handBones');
      const handJoints = document.getElementById('handJoints');
      const handCentroid = document.getElementById('handCentroid');
      const handThrust = document.getElementById('handThrustEffect');
      const gestureLabel = document.getElementById('handGestureLabel');
      const hudOverlay = document.getElementById('handHudOverlay');
      const actionPill = document.getElementById('handActionPill');
      const resultOutcome = document.getElementById('handResultOutcome');
      const resultDesc = document.getElementById('handResultDesc');
      const pitchVal = document.getElementById('handPitchVal');
      const pitchBar = document.getElementById('handPitchBar');
      const rollVal = document.getElementById('handRollVal');
      const rollBar = document.getElementById('handRollBar');
      const scanCode = document.getElementById('handScanCode');
      const log = document.getElementById('handLog');

      // 21 Joint Skeleton Bones connections (standard MediaPipe Hands topology)
      const bonePairs = [
        // Thumb
        [0, 1], [1, 2], [2, 3], [3, 4],
        // Index
        [0, 5], [5, 6], [6, 7], [7, 8],
        // Middle
        [0, 9], [9, 10], [10, 11], [11, 12],
        // Ring
        [0, 13], [13, 14], [14, 15], [15, 16],
        // Pinky
        [0, 17], [17, 18], [18, 19], [19, 20],
        // Palm knuckle crossbars
        [5, 9], [9, 13], [13, 17]
      ];

      // Pose landmark definitions for WASD
      const handPoses = {
        'S': {
          title: 'Resting Neutral Hover',
          pill: 'HOVER STABILIZED',
          pillBg: 'rgba(43,122,102,0.85)',
          pitch: 0.0,
          roll: 0.0,
          outcome: 'Stationary Hover • 0.0 m/s',
          desc: 'Hand is centered in neutral resting plane. Zero forward or lateral propulsion emitted.',
          scan: 'DIK_S (0x1F)',
          transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
          thrustSvg: '<circle cx="120" cy="130" r="30" fill="none" stroke="#2B7A66" stroke-width="1.5" stroke-dasharray="3 3"/>',
          coords: [
            [120, 180], // 0: Wrist
            [100, 160], [86, 140], [74, 120], [64, 105], // 1-4: Thumb
            [104, 125], [98, 95], [94, 70], [90, 48],    // 5-8: Index
            [120, 120], [120, 88], [120, 62], [120, 38], // 9-12: Middle
            [136, 125], [142, 95], [146, 70], [150, 48], // 13-16: Ring
            [152, 135], [162, 110], [170, 90], [176, 72] // 17-20: Pinky
          ]
        },
        'W': {
          title: 'Forward Pitch & Index Thrust',
          pill: 'FORWARD PROPULSION',
          pillBg: 'rgba(184,58,75,0.9)',
          pitch: -32.4,
          roll: -1.2,
          outcome: 'Accelerating Ahead • +4.8 m/s',
          desc: 'Index finger thrust forward with -32.4° wrist pitch. DirectInput emits continuous DIK_W scan codes.',
          scan: 'DIK_W (0x11)',
          transform: 'translate(0px, -14px) rotate(-4deg) scale(1.05)',
          thrustSvg: '<path d="M110,35 L120,15 L130,35" fill="none" stroke="#EFC07A" stroke-width="2.5"/><path d="M105,45 L120,25 L135,45" fill="none" stroke="#EFC07A" stroke-width="1.5" opacity="0.6"/>',
          coords: [
            [120, 185], // 0: Wrist
            [108, 165], [98, 150], [90, 135], [84, 122], // 1-4: Thumb
            [114, 120], [116, 85], [118, 55], [120, 24], // 5-8: Index extended
            [126, 130], [128, 110], [130, 98], [132, 88], // 9-12: Middle curled
            [138, 135], [142, 118], [144, 106], [146, 96],// 13-16: Ring curled
            [150, 142], [156, 126], [160, 116], [162, 108]// 17-20: Pinky curled
          ]
        },
        'A': {
          title: 'Roll Left Bank & Thumb Extension',
          pill: 'BANKING PORT / LEFT',
          pillBg: 'rgba(239,192,122,0.9)',
          pitch: -4.5,
          roll: -28.6,
          outcome: 'Strafing Left • -3.6 m/s',
          desc: 'Hand rolled -28.6° counter-clockwise. Flight controls yaw drone into leftward bank vector.',
          scan: 'DIK_A (0x1E)',
          transform: 'translate(-12px, 0px) rotate(-24deg) scale(0.98)',
          thrustSvg: '<path d="M40,110 L18,120 L40,130" fill="none" stroke="#7FD1BA" stroke-width="2.5"/><path d="M50,105 L28,120 L50,135" fill="none" stroke="#7FD1BA" stroke-width="1.5" opacity="0.6"/>',
          coords: [
            [135, 185], // 0: Wrist tilted
            [110, 160], [85, 145], [60, 135], [38, 125], // 1-4: Thumb reaching left
            [115, 125], [105, 95], [95, 70], [86, 48],   // 5-8: Index tilted left
            [130, 120], [124, 88], [120, 62], [116, 40], // 9-12: Middle
            [145, 125], [144, 98], [143, 75], [142, 54], // 13-16: Ring
            [160, 136], [164, 114], [167, 96], [170, 78] // 17-20: Pinky
          ]
        },
        'D': {
          title: 'Roll Right Bank & Palm Tilt',
          pill: 'BANKING STARBOARD / RIGHT',
          pillBg: 'rgba(91,42,74,0.9)',
          pitch: -4.0,
          roll: 28.6,
          outcome: 'Strafing Right • +3.6 m/s',
          desc: 'Hand rolled +28.6° clockwise. Low-level driver maps lateral vector to smooth right strafe.',
          scan: 'DIK_D (0x20)',
          transform: 'translate(12px, 0px) rotate(24deg) scale(0.98)',
          thrustSvg: '<path d="M200,110 L222,120 L200,130" fill="none" stroke="#EFC07A" stroke-width="2.5"/><path d="M190,105 L212,120 L190,135" fill="none" stroke="#EFC07A" stroke-width="1.5" opacity="0.6"/>',
          coords: [
            [105, 185], // 0: Wrist tilted
            [90, 165], [78, 148], [72, 130], [68, 116],  // 1-4: Thumb
            [105, 128], [104, 98], [103, 72], [104, 50], // 5-8: Index
            [120, 122], [124, 90], [128, 64], [132, 42], // 9-12: Middle tilted right
            [135, 125], [144, 95], [152, 70], [160, 50], // 13-16: Ring tilted right
            [148, 136], [160, 112], [172, 92], [184, 74] // 17-20: Pinky extended right
          ]
        }
      };

      function renderHandSkeleton(key) {
        const pose = handPoses[key] || handPoses['S'];
        const coords = pose.coords;

        if (skeletonSvg) {
          skeletonSvg.style.transform = pose.transform;
        }

        // Render bones
        if (handBones) {
          let bonesHtml = '';
          bonePairs.forEach(([i, j]) => {
            const p1 = coords[i];
            const p2 = coords[j];
            bonesHtml += `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${key === 'W' ? '#EFC07A' : key === 'S' ? '#2B7A66' : '#7FD1BA'}" stroke-width="2.5"/>`;
          });
          handBones.innerHTML = bonesHtml;
        }

        // Render 21 joints
        if (handJoints) {
          let jointsHtml = '';
          coords.forEach(([x, y], idx) => {
            const isTip = [4, 8, 12, 16, 20].includes(idx);
            const r = isTip ? 4.5 : (idx === 0 ? 5.5 : 3.5);
            const fill = isTip ? '#EFC07A' : (idx === 0 ? '#FFFFFF' : '#7FD1BA');
            jointsHtml += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#0E1618" stroke-width="1.2"/>`;
          });
          handJoints.innerHTML = jointsHtml;
        }

        if (handThrust) {
          handThrust.innerHTML = pose.thrustSvg || '';
        }

        // Update telemetry
        if (gestureLabel) gestureLabel.textContent = pose.title;
        if (actionPill) {
          actionPill.textContent = pose.pill;
          actionPill.style.background = pose.pillBg;
        }
        if (resultOutcome) resultOutcome.textContent = pose.outcome;
        if (resultDesc) resultDesc.textContent = pose.desc;
        if (pitchVal) pitchVal.textContent = (pose.pitch >= 0 ? '+' : '') + pose.pitch.toFixed(1) + '°';
        if (pitchBar) pitchBar.style.width = Math.min(100, Math.max(0, 50 + pose.pitch * 1.5)) + '%';
        if (rollVal) rollVal.textContent = (pose.roll >= 0 ? '+' : '') + pose.roll.toFixed(1) + '°';
        if (rollBar) rollBar.style.width = Math.min(100, Math.max(0, 50 + pose.roll * 1.5)) + '%';
        if (scanCode) scanCode.textContent = pose.scan;
        if (hudOverlay) hudOverlay.textContent = `PITCH: ${pose.pitch.toFixed(1)}° • ROLL: ${pose.roll.toFixed(1)}° • KEY: ${key}`;
        if (log) log.textContent = `>> Biometric Driver: Key [${key}] active. ${pose.outcome}. Latency: 14.2ms.`;

        // Update button and card active states
        wasdButtons.forEach(b => b.classList.toggle('active', b.dataset.key === key));
        wasdCards.forEach(c => c.classList.toggle('active', c.dataset.key === key));
      }

      // Initial render with S
      renderHandSkeleton('S');

      // Click on toolbar buttons
      wasdButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          renderHandSkeleton(btn.dataset.key);
        });
      });

      // Click on WASD cards
      wasdCards.forEach(card => {
        card.addEventListener('click', () => {
          renderHandSkeleton(card.dataset.key);
        });
      });

      // Keyboard keydown listener while modal is open
      const keyHandler = (e) => {
        const k = e.key.toUpperCase();
        if (['W', 'A', 'S', 'D'].includes(k)) {
          const consoleHand = document.getElementById('consoleHand');
          if (consoleHand && consoleHand.closest('.project-modal.active')) {
            renderHandSkeleton(k);
          }
        }
      };
      window.addEventListener('keydown', keyHandler);
    } catch (e) {
      console.error('handtracking init error:', e);
    }
  }

  // 11. SafeDrop Merkle Tree Cryptographic Verification Engine with Live Cascade Simulation
  if (type === 'safedrop') {
    try {
      const btnCascade = document.getElementById('btnSafeRunCascade');
      const btnMitigated = document.getElementById('btnSafeModeMitigated');
      const btnVulnerable = document.getElementById('btnSafeModeVulnerable');
      const btnExploit = document.getElementById('btnSafeTestExploit');
      const rootNode = document.getElementById('safeNodeRoot');
      const rootText = document.getElementById('safeTextRoot');
      const nodeH1 = document.getElementById('safeNodeH1');
      const nodeH2 = document.getElementById('safeNodeH2');
      const leaf2 = document.getElementById('safeLeaf2');
      const textLeaf2 = document.getElementById('safeTextLeaf2');
      const pulseParticle = document.getElementById('safePulseParticle');
      const banner = document.getElementById('safeSimulationBanner');
      const resultText = document.getElementById('safeVerifyResult');
      const resultDesc = document.getElementById('safeVerifyDesc');
      const proofTag = document.getElementById('safeProofTag');
      const log = document.getElementById('safeLog');

      let isMitigated = true;

      function resetTreeVisuals() {
        if (rootNode) {
          rootNode.setAttribute('stroke', '#7FD1BA');
          rootNode.setAttribute('fill', '#1A2B28');
        }
        if (rootText) {
          rootText.textContent = 'ROOT: 0x7f4a...9c12';
          rootText.setAttribute('fill', '#7FD1BA');
        }
        if (nodeH1) nodeH1.setAttribute('stroke', '#2B7A66');
        if (nodeH2) nodeH2.setAttribute('stroke', '#2B7A66');
        if (leaf2) {
          leaf2.setAttribute('stroke', '#2B7A66');
          leaf2.setAttribute('fill', '#162724');
        }
        if (textLeaf2) textLeaf2.textContent = 'B: 250 TKN';
        if (pulseParticle) pulseParticle.setAttribute('opacity', '0');
      }

      function runVerificationCascade() {
        resetTreeVisuals();
        if (banner) banner.textContent = 'CASCADE: 1/3 HASHING LEAF TRANSACTIONS...';
        if (log) log.textContent = '>> SafeDrop Simulation: Computing SHA-256 digests for Leaves A, B, C, D...';

        // Step 1: Leaves pulse
        setTimeout(() => {
          if (banner) banner.textContent = 'CASCADE: 2/3 COMPUTING INTERMEDIATE PARENTS H1 & H2...';
          if (nodeH1) nodeH1.setAttribute('stroke', '#EFC07A');
          if (nodeH2) nodeH2.setAttribute('stroke', '#EFC07A');
          if (pulseParticle) {
            pulseParticle.setAttribute('cx', '80');
            pulseParticle.setAttribute('cy', '85');
            pulseParticle.setAttribute('opacity', '1');
            pulseParticle.setAttribute('fill', '#EFC07A');
          }
          if (log) log.textContent = '>> SafeDrop Simulation: H(0x01 || H_A || H_B) and H(0x01 || H_C || H_D) assembled.';
        }, 450);

        // Step 2: Intermediate to Root
        setTimeout(() => {
          if (banner) banner.textContent = 'CASCADE: 3/3 PROPAGATING PROOF TO MERKLE ROOT...';
          if (pulseParticle) {
            pulseParticle.setAttribute('cx', '160');
            pulseParticle.setAttribute('cy', '25');
          }
        }, 900);

        // Step 3: Complete verification
        setTimeout(() => {
          if (rootNode) {
            rootNode.setAttribute('stroke', '#7FD1BA');
            rootNode.setAttribute('fill', '#16382E');
          }
          if (rootText) {
            rootText.textContent = 'ROOT VERIFIED: 0x7f4a...9c12';
            rootText.setAttribute('fill', '#7FD1BA');
          }
          if (pulseParticle) pulseParticle.setAttribute('opacity', '0');
          if (banner) banner.textContent = 'CASCADE COMPLETE: 100% CRYPTOGRAPHIC MATCH CONFIRMED';
          if (resultText) {
            resultText.textContent = '✓ MERKLE ROOT VALID';
            resultText.style.color = '#2B7A66';
          }
          if (resultDesc) resultDesc.textContent = 'Cryptographic proof verified against on-chain root in 28,400 gas. Claim authorized.';
          if (log) log.textContent = '>> SafeDrop Engine: Merkle verification cascade confirmed valid on-chain root.';
        }, 1350);
      }

      function runPreimageExploitSimulation() {
        resetTreeVisuals();
        if (banner) banner.textContent = 'ATTACK: INJECTING 64-BYTE PREIMAGE COLLISION IN LEAF B...';
        if (leaf2) {
          leaf2.setAttribute('stroke', '#B83A4B');
          leaf2.setAttribute('fill', '#3A141A');
        }
        if (textLeaf2) textLeaf2.textContent = 'B: 99,999 TKN';
        if (log) log.textContent = '>> Exploit Simulator: Malicious caller attempting 64-byte intermediate node collision.';

        setTimeout(() => {
          if (nodeH1) nodeH1.setAttribute('stroke', '#B83A4B');
          if (banner) banner.textContent = 'ATTACK: PROPAGATING MALICIOUS HASH TO ROOT...';
          if (pulseParticle) {
            pulseParticle.setAttribute('cx', '160');
            pulseParticle.setAttribute('cy', '25');
            pulseParticle.setAttribute('opacity', '1');
            pulseParticle.setAttribute('fill', '#B83A4B');
          }
        }, 500);

        setTimeout(() => {
          if (isMitigated) {
            // Mitigated: Blocked!
            if (rootNode) {
              rootNode.setAttribute('stroke', '#2B7A66');
              rootNode.setAttribute('fill', '#16382E');
            }
            if (rootText) {
              rootText.textContent = 'SAFE: ROOT PROTECTED (0x7f4a)';
              rootText.setAttribute('fill', '#7FD1BA');
            }
            if (banner) banner.textContent = 'ATTACK REJECTED: SAFEDROP 0x01 PREFIX NEUTRALIZED EXPLOIT';
            if (resultText) {
              resultText.textContent = '✓ EXPLOIT REJECTED (SAFE)';
              resultText.style.color = '#2B7A66';
            }
            if (resultDesc) resultDesc.textContent = 'SafeDrop domain prefixing forced distinct intermediate hashes. Smart contract aborted malicious transaction.';
            if (log) log.textContent = '>> SafeDrop Shield: Preimage attack thwarted. Strict 0x00/0x01 domain separation active.';
          } else {
            // Vulnerable: Exploit succeeds!
            if (rootNode) {
              rootNode.setAttribute('stroke', '#B83A4B');
              rootNode.setAttribute('fill', '#3A141A');
            }
            if (rootText) {
              rootText.textContent = 'ALERT: ROOT COMPROMISED!';
              rootText.setAttribute('fill', '#FFAAB4');
            }
            if (banner) banner.textContent = 'VULNERABILITY DETECTED: UNPREFIXED ROOT ACCEPTED FORGED LEAF';
            if (resultText) {
              resultText.textContent = '✕ ATTACK SUCCEEDED (UNPROTECTED)';
              resultText.style.color = '#B83A4B';
            }
            if (resultDesc) resultDesc.textContent = 'Unprefixed 64-byte node interpreted as leaf. Drain of 99,999 tokens permitted on unmitigated contract!';
            if (log) log.textContent = '>> Security Warning: Vulnerable unprefixed tree accepted forged second preimage.';
          }
        }, 1100);
      }

      if (btnCascade) btnCascade.addEventListener('click', runVerificationCascade);
      if (btnExploit) btnExploit.addEventListener('click', runPreimageExploitSimulation);

      if (btnMitigated) {
        btnMitigated.addEventListener('click', () => {
          isMitigated = true;
          btnMitigated.classList.add('active');
          if (btnVulnerable) btnVulnerable.classList.remove('active');
          if (proofTag) proofTag.textContent = 'SafeDrop Protected (0x01 Prefixed)';
          resetTreeVisuals();
          if (banner) banner.textContent = 'MODE: PROTECTED (SAFEDROP PREFIXING ACTIVE)';
        });
      }

      if (btnVulnerable) {
        btnVulnerable.addEventListener('click', () => {
          isMitigated = false;
          btnVulnerable.classList.add('active');
          if (btnMitigated) btnMitigated.classList.remove('active');
          if (proofTag) proofTag.textContent = 'Vulnerable (Raw 64-byte Tree)';
          resetTreeVisuals();
          if (banner) banner.textContent = 'MODE: VULNERABLE (NO DOMAIN SEPARATION)';
        });
      }
    } catch (e) {
      console.error('safedrop init error:', e);
    }
  }

if (type === 'looper') {
    try {
      const btnRun = document.getElementById('btnLooperRun');
      const btnModel = document.getElementById('btnLooperModel');
      const btnReset = document.getElementById('btnLooperReset');
      const timeline = document.getElementById('looperTimeline');

      const models = ['Llama 3.2 (Local)', 'DeepSeek-R1 (Local)', 'Qwen 2.5 Coder (Local)'];
      let modelIdx = 0;

      if (btnModel) {
        btnModel.addEventListener('click', () => {
          modelIdx = (modelIdx + 1) % models.length;
          btnModel.textContent = `Model: ${models[modelIdx]}`;
        });
      }

      if (btnRun && timeline) {
        btnRun.addEventListener('click', () => {
          timeline.innerHTML = '<div style="color: var(--plum);">Running local agent loop...</div>';
          setTimeout(() => {
            timeline.innerHTML = `
              <div style="color: #2B7A66;">[1] PLAN: Parsed objective into 3 tool sub-tasks</div>
              <div style="color: var(--ink);">[2] MCP: Called filesystem::read_directory (12 files)</div>
              <div style="color: var(--ink);">[3] MCP: Executed python test_suite.py (Passed 8/8)</div>
              <div style="color: var(--plum); font-weight: 600;">[4] VERIFY: Agent verified solution criteria ✔</div>
            `;
          }, 800);
        });
      }

      if (btnReset && timeline) {
        btnReset.addEventListener('click', () => {
          timeline.innerHTML = '<div style="color: var(--ink3);">Workspace cleared. Ready for next loop.</div>';
        });
      }
    } catch (e) {
      console.error('looper init error:', e);
    }
  }

  // 13. Spaceship Titanic ML & LIME
  if (type === 'spaceshiptitanic') {
    try {
      const btnP1 = document.getElementById('btnTitanicP1');
      const btnP2 = document.getElementById('btnTitanicP2');
      const btnExplain = document.getElementById('btnTitanicExplain');
      const limeContainer = document.getElementById('limeBarContainer');

      if (btnP1) {
        btnP1.addEventListener('click', () => {
          btnP1.classList.add('active');
          if (btnP2) btnP2.classList.remove('active');
        });
      }
      if (btnP2) {
        btnP2.addEventListener('click', () => {
          btnP2.classList.add('active');
          if (btnP1) btnP1.classList.remove('active');
        });
      }
      if (btnExplain && limeContainer) {
        btnExplain.addEventListener('click', () => {
          btnExplain.textContent = 'Computing LIME Weights...';
          setTimeout(() => {
            btnExplain.textContent = '⚡ Compute LIME Explanations';
          }, 600);
        });
      }
    } catch (e) {
      console.error('spaceshiptitanic init error:', e);
    }
  }

  // 14. Nexus Multi-Agent Debate Arena
  if (type === 'nexus') {
    try {
      const btnNext = document.getElementById('btnNexusNext');
      if (btnNext) {
        btnNext.addEventListener('click', () => {
          btnNext.textContent = 'Fetching Citations...';
          setTimeout(() => {
            btnNext.textContent = 'Next Speaker (Round 3)';
          }, 700);
        });
      }
    } catch (e) {
      console.error('nexus init error:', e);
    }
  }

  // 15. EduTrack Adaptive RAG
  if (type === 'edutrack') {
    try {
      const btnQuiz = document.getElementById('btnEdutrackQuiz');
      if (btnQuiz) {
        btnQuiz.addEventListener('click', () => {
          btnQuiz.textContent = '⚡ Generating Fresh Quiz (184ms)...';
          setTimeout(() => {
            btnQuiz.textContent = 'Interactive Syllabus Quiz';
          }, 800);
        });
      }
    } catch (e) {
      console.error('edutrack init error:', e);
    }
  }

  // 16. PLAYNEX Live Referee Counter
  if (type === 'playnex') {
    try {
      const scoreAEl = document.getElementById('scoreA');
      const scoreBEl = document.getElementById('scoreB');
      const btnA = document.getElementById('btnPlaynexGoalA');
      const btnB = document.getElementById('btnPlaynexGoalB');
      const btnReset = document.getElementById('btnPlaynexReset');
      let sA = 2, sB = 1;

      if (btnA) btnA.addEventListener('click', () => { sA++; if (scoreAEl) scoreAEl.textContent = sA; });
      if (btnB) btnB.addEventListener('click', () => { sB++; if (scoreBEl) scoreBEl.textContent = sB; });
      if (btnReset) btnReset.addEventListener('click', () => { sA = 0; sB = 0; if (scoreAEl) scoreAEl.textContent = 0; if (scoreBEl) scoreBEl.textContent = 0; });
    } catch (e) {
      console.error('playnex init error:', e);
    }
  }

  // 17. Three.js Game Grid Coordinate Raycasting
    // 17. Three.js Isometric RPG Engine — Interactive 3D Canvas Viewport
  if (type === 'threejsgame') {
    try {
      const canvas = document.getElementById('threeInteractiveCanvas');
      const wrap = document.getElementById('threeCanvasWrap');
      const rotHud = document.getElementById('threeRotHud');
      const polyCount = document.getElementById('threePolyCount');
      const shadingText = document.getElementById('threeShadingText');
      const objLabel = document.getElementById('threeObjLabel');
      const raycastText = document.getElementById('threeTileText');
      const log = document.getElementById('threeLog');

      const btnCube = document.getElementById('btnThreeObjCube');
      const btnGem = document.getElementById('btnThreeObjGem');
      const btnIcosa = document.getElementById('btnThreeObjIcosa');
      const btnWire = document.getElementById('btnThreeWireframe');
      const btnAuto = document.getElementById('btnThreeAutoRotate');
      const btnReset = document.getElementById('btnThreeResetCam');

      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Geometries (Vertices & Faces)
      let currentShape = 'cube';
      let wireframeOnly = false;
      let autoRotate = true;

      // Camera & Rotation State
      let rotX = 0.45; // ~25 deg
      let rotY = 0.78; // ~45 deg
      let zoom = 120;
      let isDragging = false;
      let lastMouseX = 0;
      let lastMouseY = 0;
      let animId = null;

      function getGeometry(shape) {
        if (shape === 'cube') {
          // Voxel Crate (Cube)
          const v = [
            [-0.7, -0.7, -0.7], [0.7, -0.7, -0.7], [0.7, 0.7, -0.7], [-0.7, 0.7, -0.7],
            [-0.7, -0.7,  0.7], [0.7, -0.7,  0.7], [0.7, 0.7,  0.7], [-0.7, 0.7,  0.7]
          ];
          const faces = [
            [0, 1, 2, 3, '#2B7A66'], // Front
            [5, 4, 7, 6, '#1F5A4B'], // Back
            [4, 0, 3, 7, '#388F78'], // Left
            [1, 5, 6, 2, '#246958'], // Right
            [4, 5, 1, 0, '#46AA90'], // Top
            [3, 2, 6, 7, '#153C32']  // Bottom
          ];
          return { v, faces, polys: '12 Triangles (6 Quads)', label: 'Voxel Crate' };
        } else if (shape === 'gem') {
          // Faceted Gem / Octahedron
          const v = [
            [0, 1.1, 0], [0, -1.1, 0],
            [-0.8, 0, 0], [0.8, 0, 0], [0, 0, -0.8], [0, 0, 0.8]
          ];
          const faces = [
            [0, 2, 5, '#EFC07A'], [0, 5, 3, '#E5AF61'], [0, 3, 4, '#D99E4A'], [0, 4, 2, '#C88D37'],
            [1, 5, 2, '#B87B25'], [1, 3, 5, '#A46B1C'], [1, 4, 3, '#905B13'], [1, 2, 4, '#7C4C0B']
          ];
          return { v, faces, polys: '8 Triangles (Octahedron)', label: 'Faceted Gem' };
        } else {
          // Icosahedron
          const phi = (1 + Math.sqrt(5)) / 2;
          const scale = 0.65;
          const v = [
            [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
            [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
            [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
          ].map(pt => [pt[0] * scale, pt[1] * scale, pt[2] * scale]);

          const faces = [
            [0, 11, 5, '#5B2A4A'], [0, 5, 1, '#72355D'], [0, 1, 7, '#8A4171'], [0, 7, 10, '#A14D85'], [0, 10, 11, '#5B2A4A'],
            [1, 5, 9, '#72355D'], [5, 11, 4, '#8A4171'], [11, 10, 2, '#A14D85'], [10, 7, 6, '#5B2A4A'], [7, 1, 8, '#72355D'],
            [3, 9, 4, '#8A4171'], [3, 4, 2, '#A14D85'], [3, 2, 6, '#5B2A4A'], [3, 6, 8, '#72355D'], [3, 8, 9, '#8A4171'],
            [4, 9, 5, '#A14D85'], [2, 4, 11, '#5B2A4A'], [6, 2, 10, '#72355D'], [8, 6, 7, '#8A4171'], [9, 8, 1, '#A14D85']
          ];
          return { v, faces, polys: '20 Triangles (Icosahedron)', label: 'Icosahedron Mesh' };
        }
      }

      function renderFrame() {
        if (!canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dark tech grid floor in background
        ctx.strokeStyle = 'rgba(43, 122, 102, 0.15)';
        ctx.lineWidth = 1;
        const cyFloor = canvas.height * 0.75;
        for (let x = -200; x <= 200; x += 40) {
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 + x, cyFloor - 20);
          ctx.lineTo(canvas.width / 2 + x * 2.2, canvas.height);
          ctx.stroke();
        }

        const geo = getGeometry(currentShape);
        const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

        // Project vertices
        const projected = geo.v.map(pt => {
          // Rotate Y
          const x1 = pt[0] * cosY - pt[2] * sinY;
          const z1 = pt[0] * sinY + pt[2] * cosY;
          // Rotate X
          const y2 = pt[1] * cosX - z1 * sinX;
          const z2 = pt[1] * sinX + z1 * cosX;

          // Camera perspective
          const dist = 3.2;
          const fov = zoom / (dist + z2);
          const px = canvas.width / 2 + x1 * fov;
          const py = canvas.height / 2 - y2 * fov;
          return { x: px, y: py, z: z2 };
        });

        // Compute face normals and sort by depth (Painter's algorithm)
        const faceData = geo.faces.map(face => {
          const p0 = projected[face[0]];
          const p1 = projected[face[1]];
          const p2 = projected[face[2]];

          // Surface normal in 2D cross product for winding / culling
          const winding = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);

          // Average Z depth
          let avgZ = 0;
          const indices = face.slice(0, face.length - 1);
          indices.forEach(idx => avgZ += projected[idx].z);
          avgZ /= indices.length;

          return {
            face,
            indices,
            winding,
            avgZ,
            color: face[face.length - 1]
          };
        });

        faceData.sort((a, b) => b.avgZ - a.avgZ);

        // Draw faces
        faceData.forEach(f => {
          if (f.winding < 0 && !wireframeOnly) return; // Backface culling

          ctx.beginPath();
          f.indices.forEach((idx, i) => {
            const p = projected[idx];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.closePath();

          if (wireframeOnly) {
            ctx.strokeStyle = '#7FD1BA';
            ctx.lineWidth = 1.6;
            ctx.stroke();
          } else {
            // Lambertian shading calculation
            ctx.fillStyle = f.color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        });

        // Auto-rotation increment
        if (autoRotate && !isDragging) {
          rotY += 0.012;
          rotX = 0.4 + Math.sin(Date.now() * 0.001) * 0.08;
        }

        // Update HUD
        const degX = Math.round((rotX * 180) / Math.PI) % 360;
        const degY = Math.round((rotY * 180) / Math.PI) % 360;
        if (rotHud) rotHud.textContent = `X: ${degX}° Y: ${degY}°`;

        animId = requestAnimationFrame(renderFrame);
      }

      // Start render loop
      animId = requestAnimationFrame(renderFrame);

      // Mouse drag controls
      if (wrap) {
        wrap.addEventListener('mousedown', (e) => {
          isDragging = true;
          lastMouseX = e.clientX;
          lastMouseY = e.clientY;
          wrap.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          const dx = e.clientX - lastMouseX;
          const dy = e.clientY - lastMouseY;
          lastMouseX = e.clientX;
          lastMouseY = e.clientY;

          rotY += dx * 0.012;
          rotX -= dy * 0.012;

          if (raycastText) {
            raycastText.textContent = `Vector3(${(rotX * 2).toFixed(1)}, ${(zoom / 50).toFixed(1)}, ${(rotY * 2).toFixed(1)})`;
          }
        });

        window.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            if (wrap) wrap.style.cursor = 'grab';
          }
        });

        wrap.addEventListener('wheel', (e) => {
          e.preventDefault();
          zoom = Math.max(60, Math.min(220, zoom - e.deltaY * 0.2));
        });
      }

      // Geometry buttons
      function setShape(shape, btn) {
        currentShape = shape;
        [btnCube, btnGem, btnIcosa].forEach(b => b && b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const g = getGeometry(shape);
        if (polyCount) polyCount.textContent = g.polys;
        if (objLabel) objLabel.textContent = g.label;
        if (log) log.textContent = `>> Three.js Engine: Switched geometry to ${g.label} (${g.polys}).`;
      }

      if (btnCube) btnCube.addEventListener('click', () => setShape('cube', btnCube));
      if (btnGem) btnGem.addEventListener('click', () => setShape('gem', btnGem));
      if (btnIcosa) btnIcosa.addEventListener('click', () => setShape('icosa', btnIcosa));

      if (btnWire) {
        btnWire.addEventListener('click', () => {
          wireframeOnly = !wireframeOnly;
          btnWire.classList.toggle('active', wireframeOnly);
          btnWire.textContent = wireframeOnly ? 'Wireframe: ON' : 'Wireframe: OFF';
          if (shadingText) shadingText.textContent = wireframeOnly ? 'WebGL Wireframe Mesh' : 'Lambertian Flat Shading';
        });
      }

      if (btnAuto) {
        btnAuto.addEventListener('click', () => {
          autoRotate = !autoRotate;
          btnAuto.classList.toggle('active', autoRotate);
          btnAuto.textContent = autoRotate ? 'Auto-Spin: ON' : 'Auto-Spin: OFF';
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', () => {
          rotX = 0.45;
          rotY = 0.78;
          zoom = 120;
          if (log) log.textContent = '>> Three.js Engine: Camera view reset to isometric default.';
        });
      }
    } catch (e) {
      console.error('threejs init error:', e);
    }
  }

  // 18. API POOL Security Vault — Animated Pipeline Dispatch to Portfolio Projects
  if (type === 'apipool') {
    try {
      const btnDispatch = document.getElementById('btnApiDispatch');
      const btnAutoStream = document.getElementById('btnApiAutoStream');
      const btnRotate = document.getElementById('btnApiRotate');
      const slotEl = document.getElementById('apiKeySlot');
      const activeKeyDisplay = document.getElementById('apiActiveKeyDisplay');
      const dispatchedTarget = document.getElementById('apiDispatchedTarget');
      const routedProjectName = document.getElementById('apiRoutedProjectName');
      const routedStatus = document.getElementById('apiRoutedStatus');
      const rateDisplay = document.getElementById('apiRateDisplay');
      const pipelineStatus = document.getElementById('apiPipelineStatus');
      const gatewayNode = document.getElementById('apiGatewayNode');
      const projectNode = document.getElementById('apiProjectNode');
      const log = document.getElementById('apiLog');
      const routeBtns = document.querySelectorAll('#consoleApipool [data-routed]');

      let currentSlot = 2;
      let activeTargetProject = 'ColdBrief AI';
      let autoStreamActive = true;
      let autoStreamTimer = null;
      let reqCounter = 18;

      const projectConfigs = {
        'coldbrief': { name: 'ColdBrief AI', port: 'Port 3000', desc: 'AI Morning Digest Generator' },
        'covidxray': { name: 'COVID-19 Vision', port: 'Port 8000', desc: 'MobileNetV2 DICOM Pipeline' },
        'campuspulse': { name: 'CampusPulse', port: 'Port 5000', desc: 'Transit & Event Realtime Feed' },
        'agrotech': { name: 'AgroTech', port: 'Port 8080', desc: 'IoT Soil & Crop Sensor Telemetry' }
      };

      function dispatchApiPacket() {
        reqCounter = (reqCounter % 58) + 1;
        const latency = Math.floor(Math.random() * 7) + 12; // 12-18ms
        const payloadSize = 1000 + Math.floor(Math.random() * 800); // ~1400 bytes

        // Flash Gateway Node
        if (gatewayNode) {
          gatewayNode.style.transform = 'scale(1.04)';
          gatewayNode.style.borderColor = '#7FD1BA';
          setTimeout(() => {
            gatewayNode.style.transform = 'scale(1)';
            gatewayNode.style.borderColor = 'rgba(239,192,122,0.7)';
          }, 250);
        }

        // Flash Project Node
        setTimeout(() => {
          if (projectNode) {
            projectNode.style.transform = 'scale(1.05)';
            projectNode.style.borderColor = '#EFC07A';
            projectNode.style.boxShadow = '0 0 16px rgba(127,209,186,0.5)';
            setTimeout(() => {
              projectNode.style.transform = 'scale(1)';
              projectNode.style.borderColor = '#7FD1BA';
              projectNode.style.boxShadow = 'none';
            }, 300);
          }

          if (routedStatus) routedStatus.textContent = `200 OK • ${latency}ms Latency`;
          if (rateDisplay) rateDisplay.textContent = `${reqCounter} / 60 RPM • PASS`;
          if (pipelineStatus) pipelineStatus.textContent = `Dispatched to ${activeTargetProject} (${latency}ms)`;
          if (log) log.textContent = `>> API POOL: Bearer packet [Slot #${currentSlot}] routed to ${activeTargetProject} (${payloadSize} bytes, ${latency}ms). 200 OK.`;
        }, 450);
      }

      function rotateKeyPool() {
        currentSlot = (currentSlot % 4) + 1;
        const keyHash = `sk-...${currentSlot * 23}b`;
        if (slotEl) slotEl.textContent = `Slot #${currentSlot} (${keyHash})`;
        if (activeKeyDisplay) activeKeyDisplay.textContent = `Slot #${currentSlot} (${keyHash})`;
        if (log) log.textContent = `>> API POOL: Credential Vault rotated to Slot #${currentSlot} (${keyHash}). Zero downtime.`;
      }

      if (btnDispatch) btnDispatch.addEventListener('click', dispatchApiPacket);
      if (btnRotate) btnRotate.addEventListener('click', rotateKeyPool);

      routeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          routeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const cfg = projectConfigs[btn.dataset.routed];
          if (cfg) {
            activeTargetProject = cfg.name;
            if (routedProjectName) routedProjectName.textContent = cfg.name;
            if (dispatchedTarget) dispatchedTarget.textContent = `${cfg.name} (${cfg.port})`;
            dispatchApiPacket();
          }
        });
      });

      if (btnAutoStream) {
        btnAutoStream.addEventListener('click', () => {
          autoStreamActive = !autoStreamActive;
          btnAutoStream.classList.toggle('active', autoStreamActive);
          btnAutoStream.textContent = autoStreamActive ? 'Auto-Stream: ON' : 'Auto-Stream: OFF';
          if (autoStreamActive) {
            if (!autoStreamTimer) autoStreamTimer = setInterval(dispatchApiPacket, 1800);
          } else {
            clearInterval(autoStreamTimer);
            autoStreamTimer = null;
          }
        });
      }

      // Initial auto-stream timer
      autoStreamTimer = setInterval(dispatchApiPacket, 2000);
    } catch (e) {
      console.error('apipool init error:', e);
    }
  }

}


/* ==========================================================================
   Playable Chess Engine Logic (Vanilla JavaScript)
   ========================================================================== */
function initPlayableChessEngine() {
  const grid = document.getElementById('chessGrid');
  const moveLog = document.getElementById('chessMoveLog');
  const whiteCap = document.getElementById('whiteCaptures');
  const blackCap = document.getElementById('blackCaptures');
  const turnText = document.getElementById('chessActiveTurnText');
  const statusPill = document.getElementById('chessStatusPill');
  const logBar = document.getElementById('chessLogBar');
  const btnEnPassant = document.getElementById('btnChessEnPassant');
  const btnScholars = document.getElementById('btnChessScholars');
  const btnReset = document.getElementById('btnChessReset');

  if (!grid) return;

  const glyphs = {
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙',
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟'
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  let board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];

  let currentTurn = 'w'; // 'w' | 'b'
  let selectedSquare = null; // {r, c}
  let legalMoves = []; // array of {r, c, isEnPassant, isCapture, isCastleKS, isCastleQS}
  let enPassantTarget = null; // {r, c} passed square eligible for en passant
  let moveCount = 1;
  let capturedByWhite = [];
  let capturedByBlack = [];
  let lastMove = null; // { from: {r, c}, to: {r, c} }
  let gameOver = false;
  let hasMoved = {
    wK: false, wR_ks: false, wR_qs: false,
    bK: false, bR_ks: false, bR_qs: false
  };

  function isOpponentPiece(p, isWhite) {
    if (p === '.') return false;
    return isWhite ? p === p.toLowerCase() : p === p.toUpperCase();
  }

  function findKing(color, b = board) {
    const targetKing = color === 'w' ? 'K' : 'k';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c] === targetKing) return { r, c };
      }
    }
    return null;
  }

  function isSquareAttacked(r, c, byColor, b = board) {
    const isAttackerWhite = byColor === 'w';

    // 1. Pawns attacking (r, c)
    const pawnRow = isAttackerWhite ? r + 1 : r - 1;
    const targetPawn = isAttackerWhite ? 'P' : 'p';
    if (pawnRow >= 0 && pawnRow < 8) {
      if (c - 1 >= 0 && b[pawnRow][c - 1] === targetPawn) return true;
      if (c + 1 < 8 && b[pawnRow][c + 1] === targetPawn) return true;
    }

    // 2. Knights attacking (r, c)
    const targetKnight = isAttackerWhite ? 'N' : 'n';
    const knightOffsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (b[nr][nc] === targetKnight) return true;
      }
    }

    // 3. Kings attacking (r, c)
    const targetKing = isAttackerWhite ? 'K' : 'k';
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          if (b[nr][nc] === targetKing) return true;
        }
      }
    }

    // 4. Straight rays (Rook / Queen)
    const straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const targetRook = isAttackerWhite ? 'R' : 'r';
    const targetQueen = isAttackerWhite ? 'Q' : 'q';
    for (const [dr, dc] of straightDirs) {
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
        const p = b[nr][nc];
        if (p !== '.') {
          if (p === targetRook || p === targetQueen) return true;
          break; // blocked by any piece
        }
        step++;
      }
    }

    // 5. Diagonal rays (Bishop / Queen)
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const targetBishop = isAttackerWhite ? 'B' : 'b';
    for (const [dr, dc] of diagDirs) {
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
        const p = b[nr][nc];
        if (p !== '.') {
          if (p === targetBishop || p === targetQueen) return true;
          break; // blocked by any piece
        }
        step++;
      }
    }

    return false;
  }

  function isKingInCheck(color, b = board) {
    const kPos = findKing(color, b);
    if (!kPos) return false;
    const opponent = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(kPos.r, kPos.c, opponent, b);
  }

  function getCandidateMoves(r, c, b = board) {
    const piece = b[r][c];
    if (piece === '.') return [];
    const isWhite = piece === piece.toUpperCase();
    const moves = [];

    // PAWN
    if (piece.toLowerCase() === 'p') {
      const dir = isWhite ? -1 : 1;
      const startRank = isWhite ? 6 : 1;

      // 1-step forward
      if (r + dir >= 0 && r + dir < 8 && b[r + dir][c] === '.') {
        moves.push({ r: r + dir, c: c, isCapture: false });
        // 2-step forward
        if (r === startRank && b[r + 2 * dir][c] === '.') {
          moves.push({ r: r + 2 * dir, c: c, isCapture: false, isPawnDouble: true });
        }
      }

      // Diagonal captures
      [-1, 1].forEach(dc => {
        const nr = r + dir;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = b[nr][nc];
          if (target !== '.' && isOpponentPiece(target, isWhite)) {
            if (target.toLowerCase() !== 'k') {
              moves.push({ r: nr, c: nc, isCapture: true });
            }
          }
          // En Passant
          if (enPassantTarget && enPassantTarget.r === nr && enPassantTarget.c === nc) {
            moves.push({ r: nr, c: nc, isCapture: true, isEnPassant: true });
          }
        }
      });
    }

    // KNIGHT
    if (piece.toLowerCase() === 'n') {
      const jumps = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      jumps.forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = b[nr][nc];
          if (target === '.') {
            moves.push({ r: nr, c: nc, isCapture: false });
          } else if (isOpponentPiece(target, isWhite) && target.toLowerCase() !== 'k') {
            moves.push({ r: nr, c: nc, isCapture: true });
          }
        }
      });
    }

    // BISHOP / ROOK / QUEEN
    const dirs = [];
    if (piece.toLowerCase() === 'b' || piece.toLowerCase() === 'q') {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (piece.toLowerCase() === 'r' || piece.toLowerCase() === 'q') {
      dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }
    dirs.forEach(([dr, dc]) => {
      let step = 1;
      while (true) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;
        const target = b[nr][nc];
        if (target === '.') {
          moves.push({ r: nr, c: nc, isCapture: false });
        } else {
          if (isOpponentPiece(target, isWhite) && target.toLowerCase() !== 'k') {
            moves.push({ r: nr, c: nc, isCapture: true });
          }
          break;
        }
        step++;
      }
    });

    // KING
    if (piece.toLowerCase() === 'k') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = b[nr][nc];
            if (target === '.') {
              moves.push({ r: nr, c: nc, isCapture: false });
            } else if (isOpponentPiece(target, isWhite) && target.toLowerCase() !== 'k') {
              moves.push({ r: nr, c: nc, isCapture: true });
            }
          }
        }
      }

      // Castling
      const enemy = isWhite ? 'b' : 'w';
      const rank = isWhite ? 7 : 0;
      if (r === rank && c === 4 && !isSquareAttacked(rank, 4, enemy, b)) {
        // Kingside castling (O-O)
        const canCastleKS = isWhite ? (!hasMoved.wK && !hasMoved.wR_ks) : (!hasMoved.bK && !hasMoved.bR_ks);
        if (canCastleKS && b[rank][5] === '.' && b[rank][6] === '.') {
          if (!isSquareAttacked(rank, 5, enemy, b) && !isSquareAttacked(rank, 6, enemy, b)) {
            moves.push({ r: rank, c: 6, isCapture: false, isCastleKS: true });
          }
        }
        // Queenside castling (O-O-O)
        const canCastleQS = isWhite ? (!hasMoved.wK && !hasMoved.wR_qs) : (!hasMoved.bK && !hasMoved.bR_qs);
        if (canCastleQS && b[rank][3] === '.' && b[rank][2] === '.' && b[rank][1] === '.') {
          if (!isSquareAttacked(rank, 3, enemy, b) && !isSquareAttacked(rank, 2, enemy, b)) {
            moves.push({ r: rank, c: 2, isCapture: false, isCastleQS: true });
          }
        }
      }
    }

    return moves;
  }

  function getStrictlyLegalMoves(r, c) {
    const piece = board[r][c];
    if (piece === '.') return [];
    const isWhite = piece === piece.toUpperCase();
    const color = isWhite ? 'w' : 'b';
    if (color !== currentTurn) return [];

    const candidates = getCandidateMoves(r, c, board);
    const legal = [];

    for (const m of candidates) {
      const simBoard = board.map(row => [...row]);
      
      if (m.isEnPassant) {
        simBoard[r][m.c] = '.';
      }

      if (m.isCastleKS) {
        simBoard[r][5] = simBoard[r][7];
        simBoard[r][7] = '.';
      } else if (m.isCastleQS) {
        simBoard[r][3] = simBoard[r][0];
        simBoard[r][0] = '.';
      }

      simBoard[m.r][m.c] = simBoard[r][c];
      simBoard[r][c] = '.';

      // Discard any move where own king remains or becomes in check!
      if (!isKingInCheck(color, simBoard)) {
        legal.push(m);
      }
    }

    return legal;
  }

  function hasAnyLegalMoves(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p !== '.') {
          const isWhite = p === p.toUpperCase();
          if ((color === 'w' && isWhite) || (color === 'b' && !isWhite)) {
            const moves = getStrictlyLegalMoves(r, c);
            if (moves.length > 0) return true;
          }
        }
      }
    }
    return false;
  }

  function renderBoard() {
    grid.innerHTML = '';
    const inCheck = isKingInCheck(currentTurn, board);
    const checkedKing = inCheck ? findKing(currentTurn, board) : null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        const isLight = (r + c) % 2 === 0;
        sq.className = `chess-square ${isLight ? 'sq-light' : 'sq-dark'}`;
        sq.dataset.row = r;
        sq.dataset.col = c;

        // Selected square highlight
        if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
          sq.classList.add('sq-selected');
        }

        // Last move highlight
        if (lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c))) {
          sq.classList.add('sq-last-move');
        }

        // King in check highlight
        if (checkedKing && checkedKing.r === r && checkedKing.c === c) {
          sq.classList.add('sq-in-check');
        }

        const piece = board[r][c];
        if (piece !== '.') {
          const isWhite = piece === piece.toUpperCase();
          const pSpan = document.createElement('span');
          pSpan.className = `chess-piece-glyph ${isWhite ? 'white-piece' : 'black-piece'}`;
          pSpan.textContent = glyphs[piece] || piece;
          sq.appendChild(pSpan);
        }

        // Highlight strictly legal move indicators
        const legal = legalMoves.find(m => m.r === r && m.c === c);
        if (legal) {
          if (legal.isCapture) {
            const ring = document.createElement('div');
            ring.className = 'chess-capture-ring';
            sq.appendChild(ring);
          } else {
            const dot = document.createElement('div');
            dot.className = 'chess-legal-dot';
            sq.appendChild(dot);
          }
        }

        sq.addEventListener('click', () => handleSquareClick(r, c));
        grid.appendChild(sq);
      }
    }

    if (whiteCap) whiteCap.innerHTML = capturedByWhite.map(p => glyphs[p] || p).join(' ');
    if (blackCap) blackCap.innerHTML = capturedByBlack.map(p => glyphs[p] || p).join(' ');
    if (turnText) {
      turnText.textContent = `${currentTurn === 'w' ? 'WHITE' : 'BLACK'} (Move #${moveCount})`;
    }

    // Status pill state
    if (statusPill) {
      if (gameOver) {
        if (inCheck) {
          const winner = currentTurn === 'w' ? 'Black' : 'White';
          statusPill.textContent = `🏆 Checkmate! ${winner} Wins!`;
          statusPill.className = 'console-status-pill error';
        } else {
          statusPill.textContent = '🤝 Draw (Stalemate)';
          statusPill.className = 'console-status-pill';
        }
      } else if (inCheck) {
        statusPill.textContent = `⚠️ CHECK! ${currentTurn === 'w' ? 'White' : 'Black'} King in danger!`;
        statusPill.className = 'console-status-pill error';
      } else {
        statusPill.textContent = `Turn: ${currentTurn === 'w' ? 'White to Move' : 'Black to Move'}`;
        statusPill.className = 'console-status-pill success';
      }
    }
  }

  function handleSquareClick(r, c) {
    if (gameOver) {
      if (logBar) logBar.textContent = '>> Game has concluded. Click "Reset Chessboard" to start a new match.';
      return;
    }

    const clickedPiece = board[r][c];
    const isOwnPiece = clickedPiece !== '.' &&
      ((currentTurn === 'w' && clickedPiece === clickedPiece.toUpperCase()) ||
       (currentTurn === 'b' && clickedPiece === clickedPiece.toLowerCase()));

    // 1. If clicking a legal move destination
    const move = legalMoves.find(m => m.r === r && m.c === c);
    if (move && selectedSquare) {
      executeMove(selectedSquare.r, selectedSquare.c, move.r, move.c, move);
      selectedSquare = null;
      legalMoves = [];
      renderBoard();
      return;
    }

    // 2. If clicking own piece, select and compute strictly legal moves
    if (isOwnPiece) {
      selectedSquare = { r, c };
      legalMoves = getStrictlyLegalMoves(r, c);

      // Helpful audio/text guidance if 0 legal moves (pinned or check)
      if (legalMoves.length === 0 && logBar) {
        const inCheck = isKingInCheck(currentTurn, board);
        if (inCheck) {
          logBar.textContent = `>> [Check Defense Required]: Your King is in check! This piece cannot block or escape the threat.`;
        } else {
          logBar.textContent = `>> [Absolute Pin]: This piece is pinned to your King and cannot move out of the line of fire.`;
        }
      }

      renderBoard();
      return;
    }

    // 3. Click elsewhere deselects
    selectedSquare = null;
    legalMoves = [];
    renderBoard();
  }

  function executeMove(fromR, fromC, toR, toC, moveData = {}) {
    const p = board[fromR][fromC];
    const target = board[toR][toC];
    const isWhite = p === p.toUpperCase();

    // Track castling rights
    if (p === 'K') hasMoved.wK = true;
    if (p === 'k') hasMoved.bK = true;
    if (fromR === 7 && fromC === 7) hasMoved.wR_ks = true;
    if (fromR === 7 && fromC === 0) hasMoved.wR_qs = true;
    if (fromR === 0 && fromC === 7) hasMoved.bR_ks = true;
    if (fromR === 0 && fromC === 0) hasMoved.bR_qs = true;

    let notation = '';

    // En Passant capture execution
    if (moveData.isEnPassant) {
      const capturedPawnRow = fromR;
      const capturedPawnCol = toC;
      const capturedPawn = board[capturedPawnRow][capturedPawnCol];
      board[capturedPawnRow][capturedPawnCol] = '.';
      if (isWhite) capturedByWhite.push(capturedPawn);
      else capturedByBlack.push(capturedPawn);

      notation = `${files[fromC]}x${files[toC]}${8 - toR} e.p.`;
      if (logBar) logBar.textContent = `>> [EN PASSANT]: Pawn at ${files[toC]}${8 - capturedPawnRow} captured!`;
    } else if (moveData.isCastleKS) {
      // Kingside castling
      board[fromR][5] = board[fromR][7];
      board[fromR][7] = '.';
      notation = 'O-O';
      if (logBar) logBar.textContent = `>> [CASTLING]: ${isWhite ? 'White' : 'Black'} castled kingside (O-O).`;
    } else if (moveData.isCastleQS) {
      // Queenside castling
      board[fromR][3] = board[fromR][0];
      board[fromR][0] = '.';
      notation = 'O-O-O';
      if (logBar) logBar.textContent = `>> [CASTLING]: ${isWhite ? 'White' : 'Black'} castled queenside (O-O-O).`;
    } else {
      // Normal move or capture
      const pieceUpper = p.toUpperCase();
      if (target !== '.') {
        if (isWhite) capturedByWhite.push(target);
        else capturedByBlack.push(target);
        notation = `${pieceUpper !== 'P' ? pieceUpper : files[fromC]}x${files[toC]}${8 - toR}`;
      } else {
        notation = `${pieceUpper !== 'P' ? pieceUpper : ''}${files[toC]}${8 - toR}`;
      }
    }

    // Set new En Passant target if 2-step pawn push
    if (p.toLowerCase() === 'p' && Math.abs(toR - fromR) === 2) {
      enPassantTarget = { r: (fromR + toR) / 2, c: fromC };
    } else {
      enPassantTarget = null;
    }

    // Move piece on board
    board[toR][toC] = p;
    board[fromR][fromC] = '.';

    // Pawn Promotion (auto-Queen)
    if (p === 'P' && toR === 0) {
      board[toR][toC] = 'Q';
      notation += '=Q';
      if (logBar) logBar.textContent = `>> [PROMOTION]: White pawn promoted to Queen at ${files[toC]}8!`;
    } else if (p === 'p' && toR === 7) {
      board[toR][toC] = 'q';
      notation += '=Q';
      if (logBar) logBar.textContent = `>> [PROMOTION]: Black pawn promoted to Queen at ${files[toC]}1!`;
    }

    lastMove = { from: { r: fromR, c: fromC }, to: { r: toR, c: toC } };

    // Switch turn
    currentTurn = currentTurn === 'w' ? 'b' : 'w';
    if (currentTurn === 'w') moveCount++;

    // Evaluate check & legal moves for the new turn
    const inCheck = isKingInCheck(currentTurn, board);
    const hasMoves = hasAnyLegalMoves(currentTurn);

    if (!hasMoves) {
      gameOver = true;
      if (inCheck) {
        notation += '#';
        const winner = currentTurn === 'w' ? 'Black' : 'White';
        if (logBar) logBar.textContent = `>> CHECKMATE! ${currentTurn === 'w' ? 'White' : 'Black'} King is mated. ${winner} wins!`;
      } else {
        if (logBar) logBar.textContent = `>> STALEMATE: ${currentTurn === 'w' ? 'White' : 'Black'} has no legal moves. Match is a draw.`;
      }
    } else if (inCheck) {
      notation += '+';
      if (logBar) logBar.textContent = `>> CHECK! ${currentTurn === 'w' ? 'White' : 'Black'} King is under attack!`;
    }

    logMove(notation);
  }

  function logMove(notation) {
    if (!moveLog) return;
    const entry = document.createElement('div');
    entry.textContent = `${moveCount}. ${notation}`;
    moveLog.appendChild(entry);
    moveLog.scrollTop = moveLog.scrollHeight;
  }

  function resetBoard() {
    board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.', '.', '.', '.'],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    currentTurn = 'w';
    selectedSquare = null;
    legalMoves = [];
    enPassantTarget = null;
    moveCount = 1;
    capturedByWhite = [];
    capturedByBlack = [];
    lastMove = null;
    gameOver = false;
    hasMoved = {
      wK: false, wR_ks: false, wR_qs: false,
      bK: false, bR_ks: false, bR_qs: false
    };

    if (moveLog) moveLog.innerHTML = '<div>1. Game initialized. Standard setup.</div>';
    if (logBar) logBar.textContent = '>> Chessboard reset. Turn: White to Move.';
    renderBoard();
  }

  // Demonstration: Step-by-Step En Passant sequence
  if (btnEnPassant) {
    btnEnPassant.addEventListener('click', () => {
      resetBoard();
      // 1. e4 a6
      executeMove(6, 4, 4, 4, {});
      executeMove(1, 0, 2, 0, {});
      // 2. e5 d5 (Black 2-step double push!)
      executeMove(4, 4, 3, 4, {});
      executeMove(1, 3, 3, 3, { isPawnDouble: true });

      renderBoard();
      if (logBar) {
        logBar.textContent = '>> En Passant setup ready! Click White pawn at e5 -> click d6 green ring to execute e.p.!';
      }
    });
  }

  // Demonstration: Scholar's Mate Opening Demo
  if (btnScholars) {
    btnScholars.addEventListener('click', () => {
      resetBoard();
      // 1. e4 e5
      executeMove(6, 4, 4, 4, {});
      executeMove(1, 4, 3, 4, {});
      // 2. Bc4 Nc6
      executeMove(7, 5, 4, 2, {});
      executeMove(0, 1, 2, 2, {});
      // 3. Qh5 Nf6??
      executeMove(7, 3, 3, 7, {});
      executeMove(0, 6, 2, 5, {});
      // 4. Qxf7# (Checkmate!)
      executeMove(3, 7, 1, 5, { isCapture: true });

      renderBoard();
      if (logBar) {
        logBar.textContent = ">> Scholar's Mate executed (Qxf7#)! Black King is in Checkmate (Queen protected by Bishop at c4).";
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', resetBoard);
  }

  renderBoard();
}



/* ==========================================================================
   Project Explorer Initializer
   ========================================================================== */
function initProjectExplorer() {
  const buttons = document.querySelectorAll('.plist button[role="tab"]');
  const stage = document.getElementById('projectStage');
  const filterBtns = document.querySelectorAll('.exp-filter');

  function loadProject(key) {
    const data = projectDatabase[key];
    if (!data || !stage) return;

    buttons.forEach(b => {
      const isSelected = b.dataset.project === key;
      b.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      b.classList.toggle('active', isSelected);
    });

    stage.innerHTML = `
      <div class="viz">
        ${renderProjectConsole(data.svgType || key)}
      </div>
      <div class="pinfo">
        <h3>${data.title}</h3>
        <div class="meta">${data.meta}</div>
        <p class="desc">${data.desc}</p>
        <ul class="highlights">
          ${data.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
        <div class="stack">
          ${data.stack.map(s => `<span class="tag-badge">${s}</span>`).join('')}
        </div>
        <div class="stage-actions">
          ${data.github ? `<a href="${data.github}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">View GitHub Source ↗</a>` : ''}
          ${data.live && data.live.startsWith('http') ? `<a href="${data.live}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Production Live ↗</a>` : ''}
        </div>
      </div>
    `;

    try {
      attachConsoleInteractivity(data.svgType || key);
    } catch (err) {
      console.error(`Error attaching interactivity for ${key}:`, err);
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      loadProject(btn.dataset.project);
    });
  });

  filterBtns.forEach(f => {
    f.addEventListener('click', () => {
      filterBtns.forEach(btn => btn.classList.remove('active'));
      f.classList.add('active');
      const cat = f.dataset.cat;

      buttons.forEach(btn => {
        if (cat === 'all') {
          btn.style.display = 'block';
        } else {
          const cats = (btn.dataset.cat || '').split(' ');
          btn.style.display = cats.includes(cat) ? 'block' : 'none';
        }
      });

      const firstVisible = Array.from(buttons).find(b => b.style.display !== 'none');
      if (firstVisible) {
        firstVisible.click();
      }
    });
  });

  const initialBtn = document.querySelector('.plist button[aria-selected="true"]') || buttons[0];
  if (initialBtn) {
    loadProject(initialBtn.dataset.project);
  } else {
    loadProject('coldbrief');
  }
}


/* ==========================================================================
   6. Certifications 3D Tilt & Lightbox
   ========================================================================== */
function initCertTiltAndFilter() {
  const cards = document.querySelectorAll('.cert');
  cards.forEach(card => {
    const cardIn = card.querySelector('.cert-in');
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotX = ((y - midY) / midY) * -8;
      const rotY = ((x - midX) / midX) * 10;
      if (cardIn) cardIn.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`;
      card.style.setProperty('--gx', `${(x / rect.width) * 100}%`);
      card.style.setProperty('--gy', `${(y / rect.height) * 100}%`);
    });
    card.addEventListener('mouseleave', () => {
      if (cardIn) cardIn.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
    card.addEventListener('click', () => {
      const img = card.dataset.certImg;
      const title = card.querySelector('h3')?.textContent || '';
      const issuer = card.querySelector('.issuer')?.textContent || '';
      const detail = card.querySelector('.detail')?.textContent || '';
      if (img) openLightbox(img, title, issuer, detail);
    });
  });

  const filters = document.querySelectorAll('.cert-filter');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      const filterType = btn.dataset.filter;
      cards.forEach(card => {
        if (filterType === 'all' || (card.dataset.issuer && card.dataset.issuer.includes(filterType))) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function openLightbox(imgSrc, title, meta, desc) {
  const modal = document.getElementById('certModal');
  if (!modal) return;
  const modalImg = modal.querySelector('#modalImage');
  const modalTitle = modal.querySelector('#modalTitle');
  const modalMeta = modal.querySelector('#modalMeta');
  const modalDesc = modal.querySelector('#modalDesc');
  if (modalImg) modalImg.src = imgSrc;
  if (modalTitle) modalTitle.textContent = title || '';
  if (modalMeta) modalMeta.textContent = meta || '';
  if (modalDesc) modalDesc.textContent = desc || '';
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const modal = document.getElementById('certModal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function initModalLightbox() {
  const modal = document.getElementById('certModal');
  if (!modal) return;
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox();
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeLightbox();
  });
}

function initClipboardAndToasts() {
  const copyBtns = document.querySelectorAll('.copy-btn');
  const toast = document.getElementById('toast');

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.dataset.email || 'aaryabhansalidab@gmail.com';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(() => {
          showToast('✓ Email copied to clipboard!');
        }).catch(() => showToast('aaryabhansalidab@gmail.com'));
      } else {
        showToast('aaryabhansalidab@gmail.com');
      }
    });
  });
}
