  // Loading screen: keep it up until the logo has fully emerged AND the page has loaded
  (function(){
    const ld=document.getElementById('loader'), html=document.documentElement;
    if(!ld || !html.classList.contains('is-loading')) return;
    const MIN=1200, t0=performance.now();
    let done=false;
    const finish=()=>{ if(done) return; done=true;
      setTimeout(()=>{ ld.classList.add('is-done'); html.classList.remove('is-loading');
        try{sessionStorage.setItem('tnz_loaded','1')}catch(e){}
        setTimeout(()=>ld.remove(),1000); }, Math.max(0, MIN-(performance.now()-t0)));
    };
    if(document.readyState==='complete') finish(); else window.addEventListener('load',finish);
    setTimeout(finish,6000); // never block longer than this
  })();
  // FAQ accordion
  document.querySelectorAll('.faq__q').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const item=btn.closest('.faq__item');
      const open=item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded',open);
    });
  });
  // SP menu
  const menuBtn=document.querySelector('.menu-btn'),nav=document.getElementById('gnav');
  if(menuBtn&&nav){
  menuBtn.addEventListener('click',()=>{
    const open=nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded',open);
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');menuBtn.setAttribute('aria-expanded',false);}));
  }

  // Lightbox for event galleries
  const figs=[...document.querySelectorAll('.ev-gallery figure img')];
  if(figs.length){
    const lb=document.createElement('div'); lb.className='lb';
    lb.innerHTML='<img alt=""><button class="lb__close" aria-label="閉じる">×</button><button class="lb__prev" aria-label="前へ">‹</button><button class="lb__next" aria-label="次へ">›</button><p class="lb__count"></p>';
    document.body.appendChild(lb);
    const im=lb.querySelector('img'),cnt=lb.querySelector('.lb__count'); let i=0;
    const show=n=>{i=(n+figs.length)%figs.length; im.src=figs[i].src; cnt.textContent=(i+1)+' / '+figs.length;};
    figs.forEach((f,n)=>f.parentElement.addEventListener('click',()=>{show(n);lb.classList.add('is-open');}));
    const close=()=>lb.classList.remove('is-open');
    lb.querySelector('.lb__close').onclick=close;
    lb.querySelector('.lb__prev').onclick=e=>{e.stopPropagation();show(i-1)};
    lb.querySelector('.lb__next').onclick=e=>{e.stopPropagation();show(i+1)};
    lb.addEventListener('click',e=>{if(e.target===lb)close()});
    document.addEventListener('keydown',e=>{if(!lb.classList.contains('is-open'))return; if(e.key==='Escape')close(); if(e.key==='ArrowLeft')show(i-1); if(e.key==='ArrowRight')show(i+1);});
  }

  // New page without #anchor: always start at the top.
  // (html has scroll-behavior:smooth, so force an instant jump, and repeat after
  //  images/fonts finish loading in case the browser restored an old position)
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  const toTop=()=>{ if(location.hash) return;
    const h=document.documentElement, b=h.style.scrollBehavior; h.style.scrollBehavior='auto';
    window.scrollTo(0,0); h.scrollTop=0; document.body.scrollTop=0; h.style.scrollBehavior=b; };
  toTop(); requestAnimationFrame(toTop);
  window.addEventListener('load',toTop);
  window.addEventListener('pageshow',toTop);

  // Archive slider (PC). On phones the CSS stacks the cards and this does nothing visible.
  const track=document.getElementById('arcTrack');
  if(track){
    const cards=[...track.querySelectorAll('.arc-card')];
    const prev=document.querySelector('.arc-nav--prev'),next=document.querySelector('.arc-nav--next');
    const dotsWrap=document.querySelector('.arc-dots');
    const dots=cards.map((c,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',(i+1)+'枚目');b.onclick=()=>go(i);dotsWrap.appendChild(b);return b;});
    let cur=0;
    const center=c=>c.offsetLeft+c.offsetWidth/2-track.clientWidth/2;
    const go=i=>{cur=Math.max(0,Math.min(cards.length-1,i));track.scrollTo({left:center(cards[cur]),behavior:'smooth'});};
    const update=()=>{
      const mid=track.scrollLeft+track.clientWidth/2;
      let best=0,d=1e9; cards.forEach((c,i)=>{const dd=Math.abs(c.offsetLeft+c.offsetWidth/2-mid); if(dd<d){d=dd;best=i;}});
      cur=best; cards.forEach((c,i)=>c.classList.toggle('is-active',i===cur)); dots.forEach((b,i)=>b.classList.toggle('is-active',i===cur));
      prev.disabled=cur===0; next.disabled=cur===cards.length-1;
    };
    prev.onclick=()=>go(cur-1); next.onclick=()=>go(cur+1);
    track.addEventListener('scroll',()=>requestAnimationFrame(update),{passive:true});
    window.addEventListener('resize',update);
    // mouse drag (a drag does not count as a click on the card)
    let down=false,sx=0,sl=0,moved=false;
    track.addEventListener('mousedown',e=>{if(matchMedia('(max-width:768px)').matches)return;down=true;moved=false;sx=e.pageX;sl=track.scrollLeft;track.classList.add('is-drag');e.preventDefault();});
    window.addEventListener('mousemove',e=>{if(!down)return;const dx=e.pageX-sx;if(Math.abs(dx)>4)moved=true;track.scrollLeft=sl-dx;});
    window.addEventListener('mouseup',()=>{if(!down)return;down=false;track.classList.remove('is-drag');update();go(cur);});
    cards.forEach(c=>c.addEventListener('click',e=>{if(moved){e.preventDefault();moved=false;return;}
      // clicking a side card brings it to the center first
      const i=cards.indexOf(c); if(i!==cur){e.preventDefault();go(i);}}));
    const init=()=>{track.style.scrollBehavior='auto';track.scrollLeft=center(cards[0]);track.style.scrollBehavior='';update();};
    init();
    track.querySelectorAll('img').forEach(im=>{if(!im.complete)im.addEventListener('load',init,{once:true});});
    window.addEventListener('load',init);
  }

  // Embedded Google Maps can't load inside the Claude preview; show a link card there instead.
  // On the real site (own domain) the iframe is kept as-is.
  const mapBox=document.querySelector('.access__map');
  if(mapBox && /claude/i.test(location.hostname)){
    const fr=mapBox.querySelector('iframe'); if(fr) fr.remove();
    const fb=mapBox.querySelector('.map-fallback'); if(fb) fb.hidden=false;
  }
