  // Loading screen: keep it up until the logo has fully emerged AND the page has loaded
  (function(){
    const ld=document.getElementById('loader'), html=document.documentElement;
    if(!ld || !html.classList.contains('is-loading')) return;
    const MIN=900, t0=performance.now();
    let done=false;
    const finish=()=>{ if(done) return; done=true;
      setTimeout(()=>{ ld.classList.add('is-done'); html.classList.remove('is-loading');
        try{sessionStorage.setItem('tnz_loaded','1')}catch(e){}
        setTimeout(()=>ld.remove(),850); }, Math.max(0, MIN-(performance.now()-t0)));
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

  // ===== トップに戻ったときの位置 =====
  // トップで過去開催のリンクを押した瞬間の位置(px)を覚えておき、
  // 過去開催ページから戻ってきたときにその位置へ一瞬で戻す。それ以外は何もしない。
  const ss={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},
            set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}},
            del:k=>{try{sessionStorage.removeItem(k)}catch(e){}}};
  if(document.querySelector('.hero')){                       // トップページ
    if('scrollRestoration' in history) history.scrollRestoration='manual';
    document.addEventListener('click',e=>{
      const a=e.target.closest('a[href^="event-"]'); if(!a) return;
      ss.set('tnz_return_y',String(Math.round(scrollY)));
      const cards=[...document.querySelectorAll('#arcTrack .arc-card')];
      if(cards.includes(a)) ss.set('tnz_return_slide',String(cards.indexOf(a)));   // カルーセルの何枚目を見ていたか
    },true);
    const navType=(performance.getEntriesByType('navigation')[0]||{}).type;
    const y=ss.get('tnz_return_y');
    if(y!==null && (navType==='back_forward' || ss.get('tnz_restore')==='1')){
      const s=ss.get('tnz_return_slide'); if(s!==null) window.__tnzSlide=+s;
      const go=()=>window.scrollTo(0,+y);
      go(); window.addEventListener('load',go);
    }
    ss.del('tnz_restore');
  }else{                                                      // 過去開催ページ
    // 一番上から表示（普通のサイトでは元から一番上。前のページの位置を引き継ぐ環境向けに、一瞬で上へ合わせる）
    if(!location.hash){ const top=()=>window.scrollTo(0,0); top(); requestAnimationFrame(top); }
    document.querySelectorAll('.ev-back > a').forEach(a=>a.addEventListener('click',e=>{
      if(ss.get('tnz_return_y')!==null){ e.preventDefault(); ss.set('tnz_restore','1'); location.href='index.html'; }
    }));
  }
  // ページ内リンク（#concept など）だけ、なめらかにスクロール
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href^="#"]'); if(!a) return;
    const t=document.querySelector(a.getAttribute('href')); if(!t) return;
    e.preventDefault(); t.scrollIntoView({behavior:'smooth'}); history.pushState(null,'',a.getAttribute('href'));
  });

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
    const startIdx=Math.min(cards.length-1,Math.max(0,window.__tnzSlide||0));   // 戻ってきたときは保存した1枚、普段は先頭
    const init=()=>{track.style.scrollBehavior='auto';track.scrollLeft=center(cards[startIdx]);track.style.scrollBehavior='';update();};
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
