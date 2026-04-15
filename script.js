

    (function(){
  try {
    const canvas = document.getElementById('tesseract-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 220, H = 220, cx = W/2, cy = H/2;
    
    const name = "HOMASVI";
    let currentIdx = 0;
    let particles = [];
    const ptsPerL = 200; // High density for perfect lines
    
    let state = "FORMING";
    let stateTime = 0;
    let angleX = 0, angleY = 0;
    let animRunning = true;
    let mouse = { x: -1000, y: -1000, active: false };

    // High-precision Coordinate Generators
    function getPoints(char) {
        const pts = [];
        const s = 45; // scale
        const step = 200 / 3; // roughly spread points across the strokes
        
        switch(char) {
            case 'H':
                for(let i=0; i<80; i++) pts.push([-s, -s+i*s*2/80, 0], [s, -s+i*s*2/80, 0]);
                for(let i=0; i<40; i++) pts.push([-s+i*s*2/40, 0, 0]);
                break;
            case 'O':
                for(let i=0; i<200; i++) {
                    const a = (i/200)*Math.PI*2;
                    pts.push([Math.cos(a)*s*1.1, Math.sin(a)*s*1.3, 0]);
                }
                break;
            case 'M':
                for(let i=0; i<60; i++) pts.push([-s, -s+i*s*2/60, 0], [s, -s+i*s*2/60, 0]);
                for(let i=0; i<40; i++) {
                    pts.push([-s+i*s/40, -s+i*s/40, 0]);
                    pts.push([s-i*s/40, -s+i*s/40, 0]);
                }
                break;
            case 'A':
                for(let i=0; i<80; i++) {
                    pts.push([-s/1.5+i*s/120, -s+i*s*2/80, 0]);
                    pts.push([s/1.5-i*s/120, -s+i*s*2/80, 0]);
                }
                for(let i=0; i<40; i++) pts.push([-s/2+i*s/40, s/3, 0]);
                break;
            case 'S':
                for(let i=0; i<100; i++) {
                    const a = (i/100)*Math.PI*1.4;
                    pts.push([Math.cos(a+Math.PI)*s, Math.sin(a+Math.PI)*s/1.8 - s/1.8, 0]);
                }
                for(let i=0; i<100; i++) {
                    const a = (i/100)*Math.PI*1.4;
                    pts.push([Math.cos(a)*s, Math.sin(a)*s/1.8 + s/1.8, 0]);
                }
                break;
            case 'V':
                for(let i=0; i<100; i++) {
                    pts.push([-s+i*s/100, -s+i*s*2/100, 0]);
                    pts.push([s-i*s/100, -s+i*s*2/100, 0]);
                }
                break;
            case 'I':
                for(let i=0; i<120; i++) pts.push([0, -s+i*s*2/120, 0]);
                for(let i=0; i<40; i++) pts.push([-s/2+i*s/40, -s, 0], [-s/2+i*s/40, s, 0]);
                break;
        }
        while(pts.length < ptsPerL) pts.push([0,0,-200]);
        return pts.slice(0, ptsPerL);
    }

    for(let i=0; i<ptsPerL; i++) {
        particles.push({
            x: (Math.random()-0.5)*300, y: (Math.random()-0.5)*300, z: (Math.random()-0.5)*300,
            vx: 0, vy: 0, vz: 0, tx: 0, ty: 0, tz: 0
        });
    }

    const updateTargets = () => {
        const charPoints = getPoints(name[currentIdx]);
        particles.forEach((p, i) => {
            p.tx = charPoints[i][0]; p.ty = charPoints[i][1]; p.tz = charPoints[i][2];
        });
    };

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left - cx;
        mouse.y = e.clientY - rect.top - cy;
        mouse.active = true;
    });
    canvas.addEventListener('mouseleave', () => mouse.active = false);

    const observer = new IntersectionObserver((entries) => {
      animRunning = entries[0].isIntersecting;
      if(animRunning) draw();
    }, { threshold: 0.1 });
    observer.observe(canvas);

    function rotate3D(x, y, z, ax, ay) {
      let x1 = x * Math.cos(ay) - z * Math.sin(ay);
      let z1 = x * Math.sin(ay) + z * Math.cos(ay);
      let y2 = y * Math.cos(ax) - z1 * Math.sin(ax);
      let z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
      return [x1, y2, z2];
    }

    function draw() {
      if(!animRunning) return;

      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      ctx.arc(cx, cy, W/2 - 2, 0, Math.PI * 2);
      ctx.fillStyle = '#02050a';
      ctx.fill();

      stateTime++;
      angleX += 0.003;
      angleY += 0.006;

      // Faster logic: FORMING (250 frames = ~4s), SCATTERING (60 frames = ~1s)
      if(state === "FORMING" && stateTime > 240) {
          state = "SCATTERING"; stateTime = 0;
      } else if(state === "SCATTERING" && stateTime > 60) {
          state = "FORMING"; stateTime = 0;
          currentIdx = (currentIdx + 1) % name.length;
          updateTargets();
      }

      particles.forEach(p => {
          const [rx, ry, rz] = rotate3D(p.tx, p.ty, p.tz, angleX, angleY);
          
          if(state === "FORMING") {
              p.vx += (rx - p.x) * 0.12; // Stronger attraction for "perfection"
              p.vy += (ry - p.y) * 0.12;
              p.vz += (rz - p.z) * 0.12;
          } else {
              p.vx += (Math.random()-0.5) * 8;
              p.vy += (Math.random()-0.5) * 8;
              p.vz += (Math.random()-0.5) * 8;
          }

          if(mouse.active) {
              const mdx = p.x - mouse.x;
              const mdy = p.y - mouse.y;
              const dist = Math.sqrt(mdx*mdx + mdy*mdy);
              if(dist < 55) {
                  const force = (55 - dist) * 0.4;
                  p.vx += (mdx/dist) * force;
                  p.vy += (mdy/dist) * force;
              }
          }

          p.vx *= 0.82; p.vy *= 0.82; p.vz *= 0.82;
          p.x += p.vx; p.y += p.vy; p.z += p.vz;

          const size = 1 + (p.z + 50) / 45;
          ctx.beginPath();
          ctx.arc(cx + p.x, cy + p.y, Math.max(0.6, size), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 165, 106, ${0.3 + (p.z + 50)/100})`;
          ctx.fill();
          
          if(Math.random() > 0.993) {
              ctx.shadowColor = '#d4a56a';
              ctx.shadowBlur = 10;
              ctx.fill();
              ctx.shadowBlur = 0;
          }
      });

      requestAnimationFrame(draw);
    }

    updateTargets();
    draw();

  } catch(e) {
    console.error('HOMASVI animation error:', e);
  }
})();










    // Lazy-load terminal iframe only when scrolled into view
    const terminalIframe = document.getElementById('terminal-iframe');
    new IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
        terminalIframe.src = 'terminal.html';
        observer.disconnect();
    }
    }, { rootMargin: '200px' }).observe(terminalIframe);

    /* ── Fade-in observer ── */
    const obs = new IntersectionObserver(e => e.forEach(x => { if(x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.08 });
    document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
    setTimeout(() => document.querySelectorAll('#hero .fade-in').forEach(el => el.classList.add('visible')), 100);

    /* ── Active nav on scroll ── */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-center .nav-link');
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if(e.isIntersecting){
          navLinks.forEach(l => l.classList.remove('active'));
          const m = document.querySelector(`.nav-center a[href="#${e.target.id}"]`);
          if(m) m.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' }).observe;
    sections.forEach(s => {
      new IntersectionObserver(entries => {
        entries.forEach(e => {
          if(e.isIntersecting){
            navLinks.forEach(l => l.classList.remove('active'));
            let targetId = e.target.id;
            // Group projects and hackathons under "Work" parent nav
            if(['projects', 'hackathons'].includes(targetId)) {
                const workLink = document.querySelector('.nav-center .has-dropdown > .nav-link');
                if(workLink) workLink.classList.add('active');
            } else {
                const m = document.querySelector(`.nav-center a[href="#${targetId}"]`);
                if(m) m.classList.add('active');
            }

          }
        });
      }, { rootMargin: '-40% 0px -55% 0px' }).observe(s);
    });


    /* ── Hamburger ── */
    const hamburger = document.getElementById('hamburger');
    const drawer = document.getElementById('drawer');
    hamburger.addEventListener('click', () => drawer.classList.toggle('open'));
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));

    /* ── Typing animation ── */
    const words = [
      'the web.',
      'the world.',
      'scale.',
      'impact.',
      'fun.',
      'production.',
      'people.',

      'me.',
      'you.',
    ];
    let wi = 0, ci = 0, deleting = false;
    const target = document.getElementById('typing-target');

    async function typeTick() {
      const word = words[wi];
      if (!deleting) {
        target.textContent = word.slice(0, ci + 1);
        ci++;
        if (ci === word.length) {
          await pause(1800);
          deleting = true;
        } else {
          await pause(80 + Math.random() * 40);
        }
      } else {
        target.textContent = word.slice(0, ci - 1);
        ci--;
        if (ci === 0) {
          deleting = false;
          wi = (wi + 1) % words.length;
          await pause(200);
        } else {
          await pause(40 + Math.random() * 20);
        }
      }
      requestAnimationFrame(typeTick);
    }

    function pause(ms) { return new Promise(r => setTimeout(r, ms)); }
    setTimeout(typeTick, 800);
    
    const blob = document.getElementById('blob');
    let tx=0,ty=0,cx=0,cy=0;
    document.addEventListener('mousemove',(e)=>{ tx=e.clientX-350; ty=e.clientY-350; });
    (function ab(){ 
    cx+=(tx-cx)*.04; cy+=(ty-cy)*.04; 
    blob.style.left=cx+'px'; blob.style.top=cy+'px'; 
    requestAnimationFrame(ab);  
    })();