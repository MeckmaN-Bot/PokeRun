var Gi=Object.defineProperty;var Ui=(a,e,t)=>e in a?Gi(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var b=(a,e,t)=>Ui(a,typeof e!="symbol"?e+"":e,t);import{g as O}from"./gsap-SFc2wnMY.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();const Ys="pokerun.audio.v3",jt={master:.6,music:.85,sfx:.95,muted:!1},Wi={"ui.click":.55,"ui.hover":.35,"ui.confirm":.85,"ui.cancel":.8,"ui.error":.85,"ui.coin":.9,"battle.hit":.65,"battle.miss":.7,"battle.crit":1,"battle.faint":1.05,"battle.super_effective":1,"battle.not_effective":.8,"battle.immune":.75,"catch.throw":.8,"catch.land":.8,"catch.wobble":.55,"catch.caught":1.05,"catch.broke":.95,"shop.coin":.8,"shop.buy":1,"shop.pack_open":.95,"shop.voucher":.85,"shop.reroll":.75,"shop.unaffordable":.8,"wave.intro":1.05,"wave.boss_warn":1.05},Ki={"ui.click":{kind:"tone",freq:520,duration:.06,type:"square"},"ui.confirm":{kind:"tone",freq:660,duration:.1,type:"triangle",sweep:990},"ui.cancel":{kind:"tone",freq:220,duration:.1,type:"sawtooth",sweep:110},"ui.error":{kind:"tone",freq:180,duration:.18,type:"square"},"ui.coin":{kind:"tone",freq:1320,duration:.08,type:"triangle",sweep:1760}};class zi{constructor(){b(this,"ctx",null);b(this,"masterGain",null);b(this,"musicGain",null);b(this,"musicDuckGain",null);b(this,"sfxGain",null);b(this,"uiGain",null);b(this,"settings",this.load());b(this,"suspendedByVisibility",!1);b(this,"lastFireAt",new Map);b(this,"listeners",new Set);b(this,"buffers",new Map);b(this,"bufferUrls",new Map);b(this,"pendingDecodes",new Map);b(this,"musicUrls",new Map);b(this,"currentMusicKey",null);b(this,"currentMusicNode",null);b(this,"musicGenToken",0);b(this,"duckLevel",1);b(this,"noiseBuffer",null)}ensureContext(){if(this.ctx)return this.ctx;try{const e=window.AudioContext||window.webkitAudioContext,t=new e;return this.ctx=t,this.masterGain=t.createGain(),this.musicGain=t.createGain(),this.musicDuckGain=t.createGain(),this.sfxGain=t.createGain(),this.uiGain=t.createGain(),this.musicDuckGain.connect(this.musicGain),this.musicGain.connect(this.masterGain),this.sfxGain.connect(this.masterGain),this.uiGain.connect(this.masterGain),this.masterGain.connect(t.destination),this.musicDuckGain.gain.value=1,this.applyGains(),t}catch{return null}}resume(){const e=this.ensureContext();(e==null?void 0:e.state)==="suspended"&&e.resume()}registerSfx(e,t){this.bufferUrls.set(e,t)}registerMusic(e,t){this.musicUrls.set(e,t)}prefetch(e){for(const t of e){const s=this.bufferUrls.get(t)??this.musicUrls.get(t);s&&fetch(s).catch(()=>{})}}play(e,t){if(this.settings.muted||this.suspendedByVisibility)return;const s=this.ensureContext();if(!s)return;s.state==="suspended"&&s.resume();const i=performance.now(),n=this.lastFireAt.get(e)??0,r=e==="ui.click"?0:12;if(i-n<r)return;this.lastFireAt.set(e,i);const o=(t==null?void 0:t.bus)??(e.startsWith("ui.")?"ui":"sfx"),l=this.busNode(o);if(!l)return;const c=Wi[e]??1,d=((t==null?void 0:t.volume)??1)*c,p=this.buffers.get(e);if(p){this.playBuffer(s,l,p,d);return}const u=this.bufferUrls.get(e);if(u){this.loadBuffer(s,e,u).then(m=>{m&&this.playBuffer(s,l,m,d)});return}const h=Ki[e];h&&this.synthesizeVoice(s,l,h,d,0)}async playMusic(e,t){if(!e){this.stopMusic((t==null?void 0:t.fadeMs)??800);return}if(!(t!=null&&t.force)&&this.currentMusicKey===e)return;const s=this.ensureContext();if(!s||!this.musicDuckGain)return;const i=this.musicUrls.get(e);if(!i)return;const n=++this.musicGenToken,r=await this.loadMusicBuffer(s,e,i);if(n!==this.musicGenToken||!r||!this.musicDuckGain)return;const o=(t==null?void 0:t.fadeMs)??1200,l=Math.max(0,o)/1e3,c=(t==null?void 0:t.loop)??!0,d=(t==null?void 0:t.volume)??1,p=s.currentTime,u=this.currentMusicNode;if(u){const v=u.gain.gain;v.cancelScheduledValues(p),v.setValueAtTime(v.value,p),v.linearRampToValueAtTime(1e-4,p+l);const g=p+l+.05;try{u.src.stop(g)}catch{}}const h=s.createBufferSource();h.buffer=r,h.loop=c;const m=s.createGain();m.gain.setValueAtTime(1e-4,p),m.gain.linearRampToValueAtTime(d,p+l),h.connect(m).connect(this.musicDuckGain),h.start(),this.currentMusicNode={src:h,gain:m},this.currentMusicKey=e}stopMusic(e=600){const t=this.ctx;if(!t)return;this.musicGenToken++;const s=this.currentMusicNode;if(this.currentMusicKey=null,this.currentMusicNode=null,!s)return;const i=Math.max(0,e)/1e3,n=t.currentTime,r=s.gain.gain;r.cancelScheduledValues(n),r.setValueAtTime(r.value,n),r.linearRampToValueAtTime(1e-4,n+i);try{s.src.stop(n+i+.05)}catch{}}duckMusic(e,t=250){const s=this.ctx;if(!s||!this.musicDuckGain){this.duckLevel=e;return}const i=Math.max(0,Math.min(1,e));this.duckLevel=i;const n=s.currentTime,r=this.musicDuckGain.gain;r.cancelScheduledValues(n),r.setValueAtTime(r.value,n),r.linearRampToValueAtTime(i<.001?1e-4:i,n+Math.max(0,t)/1e3)}duckPulse(e=.45,t=800,s=200){this.duckMusic(e,s),window.setTimeout(()=>this.duckMusic(1,s),Math.max(0,t))}getCurrentMusicKey(){return this.currentMusicKey}getSettings(){return{...this.settings}}setVolume(e,t){this.settings[e]=Math.max(0,Math.min(1,t)),this.persist(),this.applyGains(),this.notify()}setMuted(e){this.settings.muted=e,this.persist(),this.applyGains(),this.notify()}toggleMute(){return this.setMuted(!this.settings.muted),this.settings.muted}onChange(e){return this.listeners.add(e),()=>this.listeners.delete(e)}busNode(e){switch(e){case"music":return this.musicGain;case"sfx":return this.sfxGain;case"ui":return this.uiGain}}applyGains(){if(!this.masterGain||!this.musicGain||!this.sfxGain||!this.uiGain)return;const e=this.settings.muted||this.suspendedByVisibility;this.masterGain.gain.value=e?0:this.settings.master,this.musicGain.gain.value=this.settings.music,this.sfxGain.gain.value=this.settings.sfx,this.uiGain.gain.value=this.settings.sfx}setSuspendedByVisibility(e){this.suspendedByVisibility=e,this.applyGains()}playBuffer(e,t,s,i){const n=e.createBufferSource();n.buffer=s;const r=e.createGain();r.gain.value=i,n.connect(r).connect(t),n.start()}async loadBuffer(e,t,s){const i=this.buffers.get(t);if(i)return i;const n=this.pendingDecodes.get(t);if(n)return n;const r=(async()=>{try{const o=await fetch(s);if(!o.ok)return null;const l=await o.arrayBuffer(),c=await e.decodeAudioData(l);return this.buffers.set(t,c),c}catch{return null}finally{this.pendingDecodes.delete(t)}})();return this.pendingDecodes.set(t,r),r}loadMusicBuffer(e,t,s){return this.loadBuffer(e,`__music__:${t}`,s)}synthesizeVoice(e,t,s,i,n){const r=e.currentTime+n;if(s.kind==="tone"){const o=e.createOscillator(),l=e.createGain();o.type=s.type??"sine",o.frequency.setValueAtTime(s.freq,r),s.sweep!=null&&o.frequency.exponentialRampToValueAtTime(s.sweep,r+s.duration);const c=(s.gain??.25)*i;l.gain.setValueAtTime(1e-4,r),l.gain.exponentialRampToValueAtTime(c,r+.005),l.gain.exponentialRampToValueAtTime(1e-4,r+s.duration),o.connect(l).connect(t),o.start(r),o.stop(r+s.duration+.02);return}if(s.kind==="noise"){const o=this.getNoiseBuffer(e),l=e.createBufferSource();l.buffer=o;const c=e.createBiquadFilter();c.type="lowpass",c.frequency.value=s.cutoff??2e3;const d=e.createGain(),p=(s.gain??.4)*i;d.gain.setValueAtTime(1e-4,r),d.gain.exponentialRampToValueAtTime(p,r+.005),d.gain.exponentialRampToValueAtTime(1e-4,r+s.duration),l.connect(c).connect(d).connect(t),l.start(r),l.stop(r+s.duration+.02);return}if(s.kind==="chord"){const o=(s.gain??.2)*i,l=e.createGain();l.gain.setValueAtTime(1e-4,r),l.gain.exponentialRampToValueAtTime(o,r+.005),l.gain.exponentialRampToValueAtTime(1e-4,r+s.duration),l.connect(t);for(const c of s.freqs){const d=e.createOscillator();d.type=s.type??"triangle",d.frequency.setValueAtTime(c,r),s.sweep!=null&&d.frequency.exponentialRampToValueAtTime(s.sweep*(c/s.freqs[0]),r+s.duration),d.connect(l),d.start(r),d.stop(r+s.duration+.02)}return}if(s.kind==="sequence"){let o=n;for(const l of s.steps){this.synthesizeVoice(e,t,l,i,o);const c=l.kind==="sequence"?0:l.duration;o+=c+s.stepDelay}}}getNoiseBuffer(e){if(this.noiseBuffer)return this.noiseBuffer;const t=e.sampleRate*.6,s=e.createBuffer(1,t,e.sampleRate),i=s.getChannelData(0);for(let n=0;n<t;n++)i[n]=Math.random()*2-1;return this.noiseBuffer=s,s}load(){try{const e=localStorage.getItem(Ys);if(!e)return{...jt};const t=JSON.parse(e);return{...jt,...t}}catch{return{...jt}}}persist(){try{localStorage.setItem(Ys,JSON.stringify(this.settings))}catch{}}notify(){this.listeners.forEach(e=>{try{e()}catch{}})}}const k=new zi;typeof document<"u"&&document.addEventListener("visibilitychange",()=>{k.setSuspendedByVisibility(document.hidden)});const Da="pokerun:settings:v1",vt={reduceMotion:!1,animationSpeed:1.5};let ve=null;function be(){if(ve)return ve;try{const a=localStorage.getItem(Da);if(a){const e=JSON.parse(a);ve={reduceMotion:typeof e.reduceMotion=="boolean"?e.reduceMotion:vt.reduceMotion,animationSpeed:[.5,1,1.5,2].includes(e.animationSpeed)?e.animationSpeed:vt.animationSpeed}}else ve={...vt}}catch{ve={...vt}}return ve}function rt(a){ve={...a};try{localStorage.setItem(Da,JSON.stringify(ve))}catch{}Fa(ve)}function Fa(a=be()){document.documentElement.dataset.reduceMotion=a.reduceMotion?"on":"off";const e=1/a.animationSpeed;document.documentElement.style.setProperty("--anim-scale",String(e))}let Xs=!1;function ji(){Xs||(Xs=!0,document.addEventListener("keydown",a=>{a.key.toLowerCase()==="m"&&!Ji(a.target)&&(k.resume(),k.toggleMute())}))}let ge=null,Je=null,Qe=null;function Lt(){ge&&(Je==null||Je(),Je=null,Qe&&(document.removeEventListener("keydown",Qe),Qe=null),ge.remove(),ge=null)}function Vi(a){a.innerHTML=`
    <div class="audio-modal-body">${Oa()}</div>
    <div class="audio-modal-foot">
      <button class="aus-mute" type="button" data-mute>${k.getSettings().muted?"Unmute":"Mute"}</button>
      <button class="aus-test" type="button" data-test-sfx>Test SFX ▶</button>
      <span class="aus-hint">Press <kbd>M</kbd> to mute</span>
    </div>
  `,a.addEventListener("input",t=>{const s=t.target;if(s.dataset.volume){const i=parseInt(s.value,10)/100;k.setVolume(s.dataset.volume,i)}}),a.addEventListener("click",t=>{const s=t.target;if(s.closest("[data-mute]")){k.resume(),k.toggleMute();return}if(s.closest("[data-test-sfx]")){k.resume(),k.play("ui.confirm");return}});const e=k.onChange(()=>{const t=k.getSettings();["master","music","sfx"].forEach(i=>{const n=a.querySelector(`input[data-volume="${i}"]`),r=a.querySelector(`[data-volume-value="${i}"]`),o=Math.round(t[i]*100);n&&document.activeElement!==n&&(n.value=String(o)),r&&(r.textContent=String(o))});const s=a.querySelector("[data-mute]");s&&(s.classList.toggle("is-muted",t.muted),s.textContent=t.muted?"Unmute":"Mute")});return()=>{e(),a.innerHTML=""}}function Yi(a){a.classList.add("audio-btn-host");const e=document.createElement("button");e.type="button",e.className="ink-btn ghost audio-btn settings-btn",e.title="Settings (M to mute)",e.setAttribute("aria-label","Settings"),e.innerHTML=Js(k.getSettings().muted),a.appendChild(e),e.addEventListener("click",()=>{k.resume(),ge?Lt():Xi()});const t=k.onChange(()=>{e.innerHTML=Js(k.getSettings().muted)});return()=>{t(),e.remove()}}function Xi(){const a=be(),e=(s,i)=>`<button class="settings-pill${a.animationSpeed===s?" active":""}" data-speed="${s}" type="button">${i}</button>`,t=document.createElement("div");t.className="modal-overlay audio-modal-overlay",t.innerHTML=`
    <div class="modal htp-modal settings-modal-shop" role="dialog" aria-label="Settings">
      <button class="modal-close" data-close aria-label="Close">✕</button>
      <div class="htp-eyebrow">Display · Motion · Audio</div>
      <h2 class="modal-title">◈ <em>Settings</em></h2>

      <div class="settings-row">
        <div class="settings-row-label">
          <div class="srl-title">Reduce Motion</div>
          <div class="srl-sub">Mute non-essential animations and shakes.</div>
        </div>
        <label class="settings-toggle">
          <input type="checkbox" data-reduce-motion ${a.reduceMotion?"checked":""} />
          <span class="settings-toggle-track"><span class="settings-toggle-knob"></span></span>
        </label>
      </div>

      <div class="settings-row">
        <div class="settings-row-label">
          <div class="srl-title">Animation Speed</div>
          <div class="srl-sub">Speed up battle and intro flair.</div>
        </div>
        <div class="settings-pills" data-speed-pills>
          ${e(.5,"0.5×")}
          ${e(1,"1×")}
          ${e(1.5,"1.5×")}
          ${e(2,"2×")}
        </div>
      </div>

      <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px; flex-direction:column; align-items:stretch; gap:10px;">
        <div class="settings-row-label">
          <div class="srl-title">Sound &amp; Music</div>
          <div class="srl-sub">Master · Music · SFX</div>
        </div>
        <div class="audio-modal-body">${Oa()}</div>
        <div class="audio-modal-foot">
          <button class="aus-mute" type="button" data-mute>${k.getSettings().muted?"Unmute":"Mute"}</button>
          <button class="aus-test" type="button" data-test-sfx>Test SFX ▶</button>
          <span class="aus-hint">Press <kbd>M</kbd> to mute</span>
        </div>
      </div>
    </div>
  `,document.body.appendChild(t),ge=t,t.addEventListener("click",s=>{s.target===t&&Lt()}),t.addEventListener("input",s=>{const i=s.target;if(i.dataset.volume){const n=parseInt(i.value,10)/100;k.setVolume(i.dataset.volume,n)}i.hasAttribute("data-reduce-motion")&&rt({...be(),reduceMotion:i.checked})}),t.addEventListener("click",s=>{const i=s.target;if(i.closest("[data-close]")){Lt();return}if(i.closest("[data-mute]")){k.resume(),k.toggleMute();return}if(i.closest("[data-test-sfx]")){k.resume(),k.play("ui.confirm");return}const n=i.closest("[data-speed]");if(n){const r=parseFloat(n.dataset.speed||"1");rt({...be(),animationSpeed:r}),t.querySelectorAll("[data-speed]").forEach(o=>{o.classList.toggle("active",parseFloat(o.dataset.speed||"1")===r)})}}),Qe=s=>{s.key==="Escape"&&Lt()},document.addEventListener("keydown",Qe),Je=k.onChange(()=>{if(!ge)return;const s=k.getSettings();["master","music","sfx"].forEach(n=>{const r=ge.querySelector(`input[data-volume="${n}"]`),o=ge.querySelector(`[data-volume-value="${n}"]`),l=Math.round(s[n]*100);r&&document.activeElement!==r&&(r.value=String(l)),o&&(o.textContent=String(l))});const i=ge.querySelector("[data-mute]");i&&(i.classList.toggle("is-muted",s.muted),i.textContent=s.muted?"Unmute":"Mute")})}function Ji(a){if(!(a instanceof HTMLElement))return!1;const e=a.tagName;return e==="INPUT"||e==="TEXTAREA"||a.isContentEditable}function Js(a){return`
    <svg class="aus-cog ${a?"is-muted":""}" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="miter">
        <path d="M12 3 L13 5 L15 4 L16 6 L18 6 L18 8 L20 9 L19 11 L21 12 L19 13 L20 15 L18 16 L18 18 L16 18 L15 20 L13 19 L12 21 L11 19 L9 20 L8 18 L6 18 L6 16 L4 15 L5 13 L3 12 L5 11 L4 9 L6 8 L6 6 L8 6 L9 4 L11 5 Z"/>
        <circle cx="12" cy="12" r="3.2" fill="${a?"var(--oxblood)":"var(--ink)"}" stroke="none"/>
      </g>
      ${a?'<line x1="4" y1="4" x2="20" y2="20" stroke="var(--oxblood)" stroke-width="2.4" stroke-linecap="square"/>':""}
    </svg>
  `}function Oa(){const a=k.getSettings(),e=(t,s,i,n)=>`
    <label class="aus-row">
      <span class="aus-label">
        <span class="aus-label-name">${t}</span>
        <span class="aus-label-sub">${s}</span>
      </span>
      <input type="range" min="0" max="100" step="1" value="${Math.round(n*100)}" data-volume="${i}" />
      <span class="aus-value" data-volume-value="${i}">${Math.round(n*100)}</span>
    </label>
  `;return`
    ${e("Master","Overall mix","master",a.master)}
    ${e("Music","Soundtrack","music",a.music)}
    ${e("SFX","Effects · UI","sfx",a.sfx)}
  `}const Zi='button, .ink-btn, [role="button"], [data-sfx]';function Qi(a=document.body){a.addEventListener("pointerdown",s=>{k.resume();const i=s.target;if(!i)return;const n=i.closest(Zi);if(!n)return;const r=n.dataset.sfx;r!=="none"&&k.play(r||"ui.click")},{capture:!0});const e=()=>{const s=document.querySelectorAll(".modal-overlay:not(.hidden):not(.audio-modal-overlay)").length;k.duckMusic(s>0?.55:1,220)};new MutationObserver(e).observe(document.body,{subtree:!0,attributes:!0,attributeFilter:["class"],childList:!0})}function en(){k.registerSfx("ui.click","/audio/sfx/ui-click.ogg"),k.registerSfx("ui.confirm","/audio/sfx/ui-confirm.ogg"),k.registerSfx("ui.cancel","/audio/sfx/ui-cancel.ogg"),k.registerSfx("ui.error","/audio/sfx/ui-error.ogg"),k.registerSfx("ui.coin","/audio/sfx/ui-coin.ogg"),k.registerSfx("battle.hit","/audio/sfx/wood-block-thud.ogg"),k.registerSfx("battle.crit","/audio/sfx/cymbal-crash.ogg"),k.registerSfx("battle.miss","/audio/sfx/slide-whistle.ogg"),k.registerSfx("battle.faint","/audio/sfx/sad-trombone.ogg"),k.registerSfx("battle.super_effective","/audio/sfx/trumpet-rip.ogg"),k.registerSfx("battle.not_effective","/audio/sfx/muted-trumpet.ogg"),k.registerSfx("battle.immune","/audio/sfx/kazoo-buzz.ogg"),k.registerSfx("catch.throw","/audio/sfx/whoosh.ogg"),k.registerSfx("catch.land","/audio/sfx/wood-clack.ogg"),k.registerSfx("catch.wobble","/audio/sfx/wood-clack-soft.ogg"),k.registerSfx("catch.caught","/audio/sfx/clarinet-jubilee.ogg"),k.registerSfx("catch.broke","/audio/sfx/strangled-trumpet.ogg"),k.registerSfx("shop.coin","/audio/sfx/brass-coin.ogg"),k.registerSfx("shop.buy","/audio/sfx/till-chime.ogg"),k.registerSfx("shop.pack_open","/audio/sfx/paper-rip.ogg"),k.registerSfx("shop.voucher","/audio/sfx/stamp-thud.ogg"),k.registerSfx("shop.reroll","/audio/sfx/slot-machine.ogg"),k.registerSfx("shop.unaffordable","/audio/sfx/dud-buzz.ogg"),k.registerSfx("wave.intro","/audio/sfx/fanfare-short.ogg"),k.registerSfx("wave.boss_warn","/audio/sfx/siren-trombone.ogg"),k.registerMusic("music.victory","/audio/music/victory-fanfare.ogg"),k.registerMusic("music.defeat","/audio/music/defeat-theme.ogg"),k.registerMusic("music.evolution","/audio/music/evolution-theme.ogg"),k.registerMusic("music.catch_intro","/audio/music/catch-encounter.ogg"),k.registerMusic("music.menu","/audio/music/menu-theme.ogg"),k.registerMusic("music.shop","/audio/music/shop-theme.ogg"),k.registerMusic("music.battle_normal","/audio/music/battle-normal.ogg"),k.registerMusic("music.battle_boss","/audio/music/battle-boss.ogg")}const Ve=[0,50,100,200,400];function Ga(){return[{unlocked:!0,item:null},{unlocked:!1,item:null},{unlocked:!1,item:null},{unlocked:!1,item:null},{unlocked:!1,item:null}]}const Ae=5,Ua="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";function Wa(a){return`${Ua}/${a}.png`}function tn(a){return`${Ua}/versions/generation-v/black-white/animated/${a}.gif`}function sn(a){return a<=649}const et="pokelike_cache_",an=7*24*60*60*1e3,Dt="https://pokeapi.co/api/v2";function Ka(a){try{const e=localStorage.getItem(et+a);if(!e)return null;const t=JSON.parse(e);return Date.now()-t.timestamp>an?(localStorage.removeItem(et+a),null):t.data}catch{return null}}function is(a,e){try{const t={data:e,timestamp:Date.now()};localStorage.setItem(et+a,JSON.stringify(t))}catch{try{const t=Object.keys(localStorage).filter(s=>s.startsWith(et));t.slice(0,Math.floor(t.length/2)).forEach(s=>localStorage.removeItem(s)),localStorage.setItem(et+a,JSON.stringify({data:e,timestamp:Date.now()}))}catch{}}}async function Et(a,e=8e3){const t=a.replace(Dt,"").replace(/\//g,"_"),s=Ka(t);if(s)return s;const i=new AbortController,n=setTimeout(()=>i.abort(),e);try{const r=await fetch(a,{signal:i.signal});if(!r.ok)throw new Error(`API fetch failed: ${a} (${r.status})`);const o=await r.json();return is(t,o),o}finally{clearTimeout(n)}}function nn(a){return{hp:"hp",attack:"attack",defense:"defense","special-attack":"spAtk","special-defense":"spDef",speed:"speed"}[a]??null}function ae(a,e,t){return t?Math.floor((2*a+31+Math.floor(0/4))*e/100)+e+10:Math.floor((Math.floor((2*a+31+Math.floor(0/4))*e/100)+5)*1)}const yt=new Map;async function ns(a){var t,s,i,n,r;const e=String(a);if(yt.has(e))return yt.get(e);try{const o=await Et(`${Dt}/move/${e}`),l=o.damage_class.name,c=o.power??0,d=o.accuracy??100,p={id:o.id,name:o.name,displayName:o.name.split("-").map(u=>u[0].toUpperCase()+u.slice(1)).join(" "),type:o.type.name,category:l,power:c,accuracy:d,pp:o.pp,maxPp:o.pp,effect:((t=o.effect_entries.find(u=>u.language.name==="en"))==null?void 0:t.short_effect)??"",effectChance:o.effect_chance??0,priority:o.priority,isContact:((s=o.flags)==null?void 0:s.contact)??!1,isSoundBased:((i=o.flags)==null?void 0:i.sound)??!1,isPowder:((n=o.flags)==null?void 0:n.powder)??!1,isTwoTurn:((r=o.flags)==null?void 0:r.charge)??!1,target:o.target.name};return yt.set(e,p),yt.set(String(o.id),p),p}catch{return null}}async function rn(a,e,t){const s=a.filter(h=>h.version_group_details.some(m=>m.move_learn_method.name==="level-up"&&m.level_learned_at>0&&m.level_learned_at<=60)).map(h=>({name:h.move.name,level:Math.min(...h.version_group_details.filter(m=>m.move_learn_method.name==="level-up"&&m.level_learned_at>0).map(m=>m.level_learned_at))})).sort((h,m)=>h.level-m.level),i=s.filter(h=>h.level<=Math.max(t,1)),r=(await Promise.all(i.slice(0,12).map(h=>ns(h.name)))).filter(h=>h!==null),o=60,l=r.filter(h=>h.power>0&&h.power<=o&&e.includes(h.type)),c=r.filter(h=>h.power>0&&h.power<=o&&!e.includes(h.type)),d=r.filter(h=>h.category==="status"&&h.power===0),p=[],u=(h,m)=>{for(const v of h){if(p.length>=m)break;p.find(g=>g.id===v.id)||p.push(v)}};if(u(l,1),u(c,2),u(d,2),p.length===0){const h=await ns("tackle");h&&p.push(h)}return{moves:p.slice(0,2),learnsetPool:s}}async function Ct(a){const e=[];if(!a.learnsetPool||a.learnsetPool.length===0)return e;const t=new Set(a.learnedMoveIds??[]),s=new Set((a.pendingLearns??[]).map(r=>r.id)),i=new Set((a.movePool??[]).map(r=>r.id)),n=a.learnsetPool.filter(r=>r.level>0&&r.level<=a.level);for(const r of n){const o=await ns(r.name);if(o&&!(t.has(o.id)||s.has(o.id)||i.has(o.id))){if(a.moves.length<4){a.moves.push(o),t.add(o.id),e.push({newMove:o,replacedMove:null});continue}a.pendingLearns=a.pendingLearns??[],a.pendingLearns.push(o),s.add(o.id),e.push({newMove:o,replacedMove:null,pending:!0})}}return a.learnedMoveIds=Array.from(t),e}function gt(a,e,t){if(a.pendingLearns=(a.pendingLearns??[]).filter(i=>i.id!==e.id),a.movePool=a.movePool??[],t>=0&&t<a.moves.length){const i=a.moves[t];a.moves[t]={...e},i&&!a.movePool.some(n=>n.id===i.id)&&a.movePool.push(i)}else t>=0&&a.moves.length<4?(a.moves.push({...e}),a.movePool=a.movePool.filter(i=>i.id!==e.id)):a.movePool.some(i=>i.id===e.id)||a.movePool.push({...e});const s=new Set(a.learnedMoveIds??[]);s.add(e.id),a.learnedMoveIds=Array.from(s)}function on(a,e,t){if(!a.movePool||e<0||e>=a.movePool.length||t<0||t>=a.moves.length)return;const s=a.movePool[e],i=a.moves[t];a.moves[t]={...s},a.movePool[e]=i}const bt=new Map;async function ln(a){if(bt.has(a))return bt.get(a);const e={nextEvolutionId:null,evolutionLevel:null,isFullyEvolved:!0};try{let t=function(r,o){if(r.species.name===o){if(r.evolves_to.length===0)return{nextEvolutionId:null,evolutionLevel:null,isFullyEvolved:!0};const l=r.evolves_to[0],c=l.evolution_details[0],d=l.species.url.replace(/\/$/,"").split("/"),p=parseInt(d[d.length-1]);return{nextEvolutionId:isNaN(p)?null:p,evolutionLevel:(c==null?void 0:c.min_level)??null,isFullyEvolved:!1}}for(const l of r.evolves_to){const c=t(l,o);if(c!==null)return c}return null};const s=await Et(`${Dt}/pokemon-species/${a}`),i=await Et(s.evolution_chain.url),n=t(i.chain,a)??e;return bt.set(a,n),n}catch{return bt.set(a,e),e}}async function ot(a,e){const t=`_pokemon_${a}_${e}`,s=Ka(t);if(s)return s;const i=await Et(`${Dt}/pokemon/${a}`);is(`_pokemon_${i.id}`,i);const n={hp:45,attack:45,defense:45,spAtk:45,spDef:45,speed:45};for(const v of i.stats){const g=nn(v.stat.name);g&&(n[g]=v.base_stat)}const r=Object.values(n).reduce((v,g)=>v+g,0),o=i.types.sort((v,g)=>v.slot-g.slot).map(v=>v.type.name),{moves:l,learnsetPool:c}=await rn(i.moves,o,e),d=Wa(i.id),p=sn(i.id)?tn(i.id):d,u=await ln(i.name),h=i.name.split("-").map(v=>v[0].toUpperCase()+v.slice(1)).join("-"),m={id:i.id,name:i.name,displayName:h,types:o,baseStats:n,level:e,moves:l,heldItem:null,itemSlots:Ga(),sprite:d,animatedSprite:p,isFullyEvolved:u.isFullyEvolved,bst:r,abilities:i.abilities.map(v=>v.ability.name),evolutionChainId:i.id,heightDm:i.height,nextEvolutionId:u.nextEvolutionId,evolutionLevel:u.evolutionLevel,learnsetPool:c,learnedMoveIds:l.map(v=>v.id)};return is(t,m),m}async function rs(a,e,t){const s=[];let i=0;const n=5;for(let r=0;r<a.length;r+=n){const o=a.slice(r,r+n),l=await Promise.all(o.map(c=>ot(c,e)));s.push(...l),i+=l.length,t==null||t(i,a.length)}return s}async function cn(){await rs([1,4,7,25,133],5)}const dn=[152,155,158,161,163,167,170,172,173,187,153,156,159,168,178,184,195,199,219,224,154,157,160,181,185,196,197,211,230,245,248,249,250],pt=[{id:"gen1",ordinal:1,region:"Kanto",themeAccent:"#cc4040",pokemonRange:{min:1,max:151},curatedKeep:[],starterPool:[1,4,7,25,133],unlockAfter:null,status:"live"},{id:"gen2",ordinal:2,region:"Johto",themeAccent:"#dab94a",pokemonRange:{min:152,max:251},curatedKeep:dn,starterPool:[152,155,158,25,133],unlockAfter:"gen1",status:"live"},{id:"gen3",ordinal:3,region:"Hoenn",themeAccent:"#3a8aa3",pokemonRange:{min:252,max:386},curatedKeep:[],starterPool:[252,255,258,25,133],unlockAfter:"gen2",status:"coming_soon",flavorText:"The Hoenn region awaits. Lore, content, and gym leaders incoming in the next epic."},{id:"gen4",ordinal:4,region:"Sinnoh",themeAccent:"#6a8aa3",pokemonRange:{min:387,max:493},curatedKeep:[],starterPool:[387,390,393,25,133],unlockAfter:"gen3",status:"planned"},{id:"gen5",ordinal:5,region:"Unova",themeAccent:"#8a3a3a",pokemonRange:{min:494,max:649},curatedKeep:[],starterPool:[495,498,501,25,133],unlockAfter:"gen4",status:"planned"},{id:"gen6",ordinal:6,region:"Kalos",themeAccent:"#3a6a8a",pokemonRange:{min:650,max:721},curatedKeep:[],starterPool:[650,653,656,25,133],unlockAfter:"gen5",status:"planned"},{id:"gen7",ordinal:7,region:"Alola",themeAccent:"#e0a73a",pokemonRange:{min:722,max:809},curatedKeep:[],starterPool:[722,725,728,25,133],unlockAfter:"gen6",status:"planned"},{id:"gen8",ordinal:8,region:"Galar",themeAccent:"#7a3a8a",pokemonRange:{min:810,max:905},curatedKeep:[],starterPool:[810,813,816,25,133],unlockAfter:"gen7",status:"planned"},{id:"gen9",ordinal:9,region:"Paldea",themeAccent:"#8a3a4a",pokemonRange:{min:906,max:1025},curatedKeep:[],starterPool:[906,909,912,25,133],unlockAfter:"gen8",status:"planned"}],za=new Map(pt.map(a=>[a.id,a]));function lt(a){return za.get(a)}function Ss(a){const e=za.get(a);if(e)return pt.find(t=>t.unlockAfter===e.id)}function ja(){const a=new Set;for(const e of pt)if(e.status==="live")for(const t of e.curatedKeep)a.add(t);return a}const pn="pokerun_unlocked_gens_",un=new Set(pt.map(a=>a.id));function Va(a){return`${pn}${a.toLowerCase()}`}function Ya(a){const e=new Set(["gen1"]);if(!a)return e;try{const t=JSON.parse(localStorage.getItem(Va(a))??"[]");if(Array.isArray(t))for(const s of t)typeof s=="string"&&un.has(s)&&e.add(s)}catch{}return e}function hn(a,e){if(!a||!e)return;const t=Ss(e);if(!t||t.status!=="live")return;const s=Ya(a);if(!s.has(t.id)){s.add(t.id);try{localStorage.setItem(Va(a),JSON.stringify([...s]))}catch{}}}const Xa=[16,17,19,21,23,27,29,32,35,39,43,46,48,50,52,54,56,58,60,63,66,69,72,74,79,81,84,86,90,92,96,100,102,104,116,120,129],Ja=[...Xa,1,4,7,25,37,41,74,77,88,98,109,111,114,118,122,123,124,126,127,128,152,155,158,161,163,165,167,170,172,173,174,175,177,179,183,187,191,193,194,198,200,204,206,209,213,214,215,216,218,220,222,223,225,226,228,231],Za=[...Ja,2,5,8,15,18,20,22,24,26,28,30,33,36,40,44,47,49,51,53,55,57,59,61,64,67,70,73,75,80,82,85,87,91,93,97,101,103,105,117,121,125,153,156,159,162,164,166,168,171,176,178,180,184,188,192,195,199,205,210,217,219,221,224,227,229,232],Qa=[...Za,3,6,9,65,68,71,76,78,83,89,94,95,99,106,107,110,112,113,115,119,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,154,157,160,181,185,189,196,197,201,202,203,207,208,211,212,214,230,233,234,235,236,237,238,239,240,241,242,243,244,245],mn=[...Qa,248,249,250,254,257,260,282,289,295,302,306,310,330,334,350,357,359,362,373,376,380,381,382,383,384,385,386,389,392,395,398,407,409,411,416,428,430,432,437,442,445,448,452,454,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487],fn=[67,93,57,125,126,123,87,55,28,97],Zs=[130,94,65,76,112,59,62,34,121],vn=[248,245,243,244,249,250,257,260,254,373,376,380,381],yn=[384,382,383,445,448,483,484,485,487,486,480,481,482];function gn(a,e="gen1"){const t=a<=5?Xa:a<=10?Ja:a<=15?Za:a<=20?Qa:mn;if(e==="gen1")return t.filter(i=>i<=151);const s=ja();return t.filter(i=>i<=151||s.has(i)||e==="endless"&&i>251)}function bn(a,e="gen1"){const t=a<=5?fn:a<=10?Zs:a<=20?vn:yn;let s;if(e==="gen1")s=t.filter(i=>i<=151);else{const i=ja();s=t.filter(n=>n<=151||i.has(n)||e==="endless"&&n>251)}return s.length===0?Zs.filter(i=>i<=151):s}function Vt(a,e){return[...a].sort(()=>Math.random()-.5).slice(0,e)}const Yt=[{id:1,name:"Bulbasaur",displayName:"Bulbasaur"},{id:4,name:"Charmander",displayName:"Charmander"},{id:7,name:"Squirtle",displayName:"Squirtle"},{id:25,name:"Pikachu",displayName:"Pikachu"},{id:133,name:"Eevee",displayName:"Eevee"}];function ws(a,e,t="gen1"){let s,i,n,r;a===1?(s=1,i=4,n=7,r=60):a===2?(s=1,i=7,n=11,r=70):a<=4?(s=2,i=10+(a-3)*3,n=14+(a-3)*3,r=65+a*6):a<=9?(s=a<=6?2:3,i=16+(a-5)*4,n=22+(a-5)*4,r=70+a*7):a<=14?(s=a<=11?3:4,i=36+(a-10)*5,n=46+(a-10)*5,r=100+a*7):a<=19?(s=a<=16?4:5,i=56+(a-15)*5,n=68+(a-15)*5,r=130+a*6):(s=a<=22?5:6,i=Math.min(90,80+(a-20)*2),n=Math.min(100,92+(a-20)*2),r=170+a*5);let o=1;if(a>=4&&(o=1+Math.pow((a-2)/10,1.8)*.85),e){a<=7?s=2:(s=s+1,i=Math.min(100,Math.floor(i*1.1)),n=Math.min(100,Math.floor(n*1.1))),r=Math.floor(r*2);const l=Math.min(1.35,1.08+(a-5)*.012);o*=l}return{enemyCount:s,levelMin:i,levelMax:n,isBossWave:e,enemyPool:gn(a,t),bossPool:bn(a,t),coinReward:r,threatMultiplier:o}}function kn(a){return a.levelMin+Math.floor(Math.random()*(a.levelMax-a.levelMin+1))}function Ce(a){if(a.isBossWave){const e=Math.ceil(a.enemyCount/2),t=a.enemyCount-e;return[...Vt(a.bossPool,e),...Vt(a.enemyPool,t)]}return Vt(a.enemyPool,a.enemyCount)}function Sn(a,e,t,s="gen1"){let n=ws(a,e,s).coinReward;for(const r of t)r.effect.coinMultiplier&&(n=Math.floor(n*r.effect.coinMultiplier));return n}const Z=[{id:"oran_berry",name:"Oran Berry",rarity:"common",itemType:"held",icon:"❧",pokeapiName:"oran-berry",description:"Restores 15% max HP when HP drops below 40%. Recharges after each wave.",effect:{trigger:"on_hit_taken",hpThreshold:.4,healPercent:.15,rechargesEveryWave:!0}},{id:"sitrus_berry",name:"Sitrus Berry",rarity:"common",itemType:"held",icon:"❧",pokeapiName:"sitrus-berry",description:"Restores 25% max HP when HP drops below 50%. Recharges every 3 waves.",effect:{trigger:"on_hit_taken",hpThreshold:.5,healPercent:.25,rechargesAfterWaves:3}},{id:"pecha_berry",name:"Pecha Berry",rarity:"common",itemType:"held",icon:"❧",pokeapiName:"pecha-berry",description:"Cures Poison when inflicted.",effect:{trigger:"on_status",curesStatus:"poison"}},{id:"rawst_berry",name:"Rawst Berry",rarity:"common",itemType:"held",icon:"❧",pokeapiName:"rawst-berry",description:"Cures Burn when inflicted.",effect:{trigger:"on_status",curesStatus:"burn"}},{id:"chesto_berry",name:"Chesto Berry",rarity:"common",itemType:"held",icon:"❧",pokeapiName:"chesto-berry",description:"Cures Sleep when inflicted.",effect:{trigger:"on_status",curesStatus:"sleep"}},{id:"cheri_berry",name:"Cheri Berry",rarity:"common",itemType:"held",icon:"❧",pokeapiName:"cheri-berry",description:"Cures Paralysis when inflicted.",effect:{trigger:"on_status",curesStatus:"paralysis"}},{id:"aspear_berry",name:"Aspear Berry",rarity:"common",itemType:"held",icon:"❧",pokeapiName:"aspear-berry",description:"Cures Freeze when inflicted.",effect:{trigger:"on_status",curesStatus:"freeze"}},{id:"lum_berry",name:"Lum Berry",rarity:"common",itemType:"held",icon:"❧",pokeapiName:"lum-berry",description:"Cures any status condition once.",effect:{trigger:"on_status",curesStatus:"any"}},{id:"amulet_coin",name:"Amulet Coin",rarity:"common",itemType:"held",icon:"¢",pokeapiName:"amulet-coin",description:"+20% coins earned per wave.",effect:{trigger:"passive",coinMultiplier:1.2}},{id:"choice_band",name:"Choice Band",rarity:"rare",itemType:"held",icon:"✚",pokeapiName:"choice-band",description:"+50% Attack, but locked to the first move used each battle.",effect:{trigger:"passive",statBoost:{attack:1.5},lockToFirstMove:!0}},{id:"choice_specs",name:"Choice Specs",rarity:"rare",itemType:"held",icon:"⊙",pokeapiName:"choice-specs",description:"+50% Sp. Atk, but locked to the first move used each battle.",effect:{trigger:"passive",statBoost:{spAtk:1.5},lockToFirstMove:!0}},{id:"choice_scarf",name:"Choice Scarf",rarity:"rare",itemType:"held",icon:"›",pokeapiName:"choice-scarf",description:"+50% Speed, but locked to the first move used each battle.",effect:{trigger:"passive",statBoost:{speed:1.5},lockToFirstMove:!0}},{id:"life_orb",name:"Life Orb",rarity:"rare",itemType:"held",icon:"◉",pokeapiName:"life-orb",description:"+30% damage on all moves. Costs 8% of current HP per attack. No self-damage below 20% HP.",effect:{trigger:"on_attack",damageMultiplier:1.3,currentHpCostPercent:.08,noSelfDamageBelowHpPct:.2}},{id:"leftovers",name:"Leftovers",rarity:"rare",itemType:"held",icon:"◇",pokeapiName:"leftovers",description:"Restores 6.25% max HP at the end of each turn.",effect:{trigger:"end_of_turn",regenPercent:.0625}},{id:"shell_bell",name:"Shell Bell",rarity:"rare",itemType:"held",icon:"⊕",pokeapiName:"shell-bell",description:"Restores HP equal to 1/6 of damage dealt (min 5 HP).",effect:{trigger:"on_attack",healAmount:.1667,minHealAmount:5}},{id:"rocky_helmet",name:"Rocky Helmet",rarity:"rare",itemType:"held",icon:"▽",pokeapiName:"rocky-helmet",description:"Deals 1/6 max HP to contact attackers. 15% chance to paralyze them.",effect:{trigger:"on_hit_taken",damageReflectPercent:.1667,paralysisOnContact:.15}},{id:"eviolite",name:"Eviolite",rarity:"rare",itemType:"held",icon:"◈",pokeapiName:"eviolite",description:"+50% Def and Sp. Def if the holder is not fully evolved.",effect:{trigger:"passive",statBoost:{defense:1.5,spDef:1.5}}},{id:"assault_vest",name:"Assault Vest",rarity:"rare",itemType:"held",icon:"▣",pokeapiName:"assault-vest",description:"+50% Sp. Def, but cannot use status moves.",effect:{trigger:"passive",statBoost:{spDef:1.5}}},{id:"focus_sash",name:"Focus Sash",rarity:"rare",itemType:"held",icon:"◈",pokeapiName:"focus-sash",description:"Survive one KO-hit from full HP with 1 HP. Destroyed at end of wave.",effect:{trigger:"on_hit_taken",surviveKO:!0,waveEndDestroy:!0}},{id:"air_balloon",name:"Air Balloon",rarity:"rare",itemType:"held",icon:"○",pokeapiName:"air-balloon",description:"Immune to Ground-type moves until hit by any attack.",effect:{trigger:"passive",immuneGround:!0}},{id:"weakness_policy",name:"Weakness Policy",rarity:"rare",itemType:"held",icon:"↑",pokeapiName:"weakness-policy",description:"Raises Atk and Sp. Atk by 2 stages when hit by a super-effective move.",effect:{trigger:"on_hit_taken",statOnHit:{condition:"super_effective",stat:"attack",stages:2}}},{id:"expert_belt",name:"Expert Belt",rarity:"rare",itemType:"held",icon:"†",pokeapiName:"expert-belt",description:"+20% damage on super-effective moves.",effect:{trigger:"on_attack",damageMultiplier:1.2}},{id:"muscle_band",name:"Muscle Band",rarity:"rare",itemType:"held",icon:"▲",pokeapiName:"muscle-band",description:"+10% damage on physical moves.",effect:{trigger:"on_attack",damageMultiplier:1.1}},{id:"wise_glasses",name:"Wise Glasses",rarity:"rare",itemType:"held",icon:"⊙",pokeapiName:"wise-glasses",description:"+10% damage on special moves.",effect:{trigger:"on_attack",damageMultiplier:1.1}},{id:"magnet",name:"Magnet",rarity:"rare",itemType:"held",icon:"↯",pokeapiName:"magnet",description:"+20% power to Electric-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"electric",multiplier:1.2}}},{id:"charcoal",name:"Charcoal",rarity:"rare",itemType:"held",icon:"▲",pokeapiName:"charcoal",description:"+20% power to Fire-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"fire",multiplier:1.2}}},{id:"mystic_water",name:"Mystic Water",rarity:"rare",itemType:"held",icon:"▼",pokeapiName:"mystic-water",description:"+20% power to Water-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"water",multiplier:1.2}}},{id:"miracle_seed",name:"Miracle Seed",rarity:"rare",itemType:"held",icon:"❧",pokeapiName:"miracle-seed",description:"+20% power to Grass-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"grass",multiplier:1.2}}},{id:"soft_sand",name:"Soft Sand",rarity:"rare",itemType:"held",icon:"≋",pokeapiName:"soft-sand",description:"+20% power to Ground-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"ground",multiplier:1.2}}},{id:"sharp_beak",name:"Sharp Beak",rarity:"rare",itemType:"held",icon:"›",pokeapiName:"sharp-beak",description:"+20% power to Flying-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"flying",multiplier:1.2}}},{id:"twisted_spoon",name:"Twisted Spoon",rarity:"rare",itemType:"held",icon:"⊕",pokeapiName:"twisted-spoon",description:"+20% power to Psychic-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"psychic",multiplier:1.2}}},{id:"spell_tag",name:"Spell Tag",rarity:"rare",itemType:"held",icon:"†",pokeapiName:"spell-tag",description:"+20% power to Ghost-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"ghost",multiplier:1.2}}},{id:"metal_coat",name:"Metal Coat",rarity:"rare",itemType:"held",icon:"◆",pokeapiName:"metal-coat",description:"+20% power to Steel-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"steel",multiplier:1.2}}},{id:"dragon_fang",name:"Dragon Fang",rarity:"rare",itemType:"held",icon:"∿",pokeapiName:"dragon-fang",description:"+20% power to Dragon-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"dragon",multiplier:1.2}}},{id:"poison_barb",name:"Poison Barb",rarity:"rare",itemType:"held",icon:"‡",pokeapiName:"poison-barb",description:"+20% power to Poison-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"poison",multiplier:1.2}}},{id:"silk_scarf",name:"Silk Scarf",rarity:"rare",itemType:"held",icon:"○",pokeapiName:"silk-scarf",description:"+20% power to Normal-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"normal",multiplier:1.2}}},{id:"never_melt_ice",name:"Never-Melt Ice",rarity:"rare",itemType:"held",icon:"◇",pokeapiName:"never-melt-ice",description:"+20% power to Ice-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"ice",multiplier:1.2}}},{id:"black_belt",name:"Black Belt",rarity:"rare",itemType:"held",icon:"✕",pokeapiName:"black-belt",description:"+20% power to Fighting-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"fighting",multiplier:1.2}}},{id:"hard_stone",name:"Hard Stone",rarity:"rare",itemType:"held",icon:"▲",pokeapiName:"hard-stone",description:"+20% power to Rock-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"rock",multiplier:1.2}}},{id:"silver_powder",name:"Silver Powder",rarity:"rare",itemType:"held",icon:"◇",pokeapiName:"silver-powder",description:"+20% power to Bug-type moves.",effect:{trigger:"on_attack",typePowerBoost:{type:"bug",multiplier:1.2}}},{id:"scope_lens",name:"Scope Lens",rarity:"epic",itemType:"held",icon:"⊙",pokeapiName:"scope-lens",description:"Critical hit ratio +1 stage (raises crit rate to ~12.5%).",effect:{trigger:"passive",critBoost:1}},{id:"kings_rock",name:"King's Rock",rarity:"epic",itemType:"held",icon:"◆",pokeapiName:"kings-rock",description:"Moves have 10% chance to cause flinch.",effect:{trigger:"on_attack",flinchChance:.1}},{id:"wide_lens",name:"Wide Lens",rarity:"epic",itemType:"held",icon:"○",pokeapiName:"wide-lens",description:"Move accuracy +10%.",effect:{trigger:"passive",accuracyBoost:1.1}},{id:"heavy_duty_boots",name:"Heavy-Duty Boots",rarity:"epic",itemType:"held",icon:"▽",pokeapiName:"heavy-duty-boots",description:"Immune to entry hazard damage.",effect:{trigger:"passive"}},{id:"quick_claw",name:"Quick Claw",rarity:"epic",itemType:"held",icon:"›",pokeapiName:"quick-claw",description:"20% chance to move first regardless of Speed.",effect:{trigger:"passive",speedBoost:99}},{id:"mega_stone",name:"Mega Stone",rarity:"legendary",itemType:"held",icon:"◈",pokeapiName:"key-stone",description:"Pokémon deals 30% more damage and has 20% more HP.",effect:{trigger:"passive",damageMultiplier:1.3,statBoost:{hp:1.2}}},{id:"z_crystal",name:"Z-Crystal",rarity:"legendary",itemType:"held",icon:"✦",pokeapiName:"normalium-z",description:"Once per battle: next move does 2.5× damage, ignores type immunity.",effect:{trigger:"once_per_battle",damageMultiplier:2.5}},{id:"light_ball",name:"Light Ball",rarity:"legendary",itemType:"held",icon:"↯",pokeapiName:"light-ball",description:"Doubles Atk and Sp. Atk on Pokémon with BST below 400.",effect:{trigger:"passive",statBoost:{attack:2,spAtk:2}}},{id:"poke_bandage",name:"Poké Bandage",rarity:"rare",itemType:"held",icon:"✚",sprite:"/items/poke_bandage.png",description:"Restores 15% max HP after each completed wave. Only guaranteed passive healing.",effect:{trigger:"passive",waveRegen:.15}},{id:"leech_seed",name:"Leech Seed",rarity:"rare",itemType:"held",icon:"❧",pokeapiName:"leech-seed",description:"Drains 8% of the enemy's max HP each turn; heals the holder by the same amount.",effect:{trigger:"end_of_turn",drainPercent:.08}},{id:"binding_band",name:"Binding Band",rarity:"rare",itemType:"held",icon:"∞",pokeapiName:"binding-band",description:"Trapping moves (Wrap, Bind) deal 1/6 of target HP per turn instead of 1/8.",effect:{trigger:"passive"}},{id:"flame_orb",name:"Flame Orb",rarity:"epic",itemType:"held",icon:"▲",pokeapiName:"flame-orb",description:"Burns the holder at battle start. Activates Guts: +50% Atk while statused.",effect:{trigger:"passive",selfInflictStatus:"burn",gutsEffect:!0}},{id:"toxic_orb",name:"Toxic Orb",rarity:"epic",itemType:"held",icon:"‡",pokeapiName:"toxic-orb",description:"Badly poisons the holder at battle start. Activates Poison Heal: +12% max HP per turn instead of damage.",effect:{trigger:"end_of_turn",selfInflictStatus:"badPoison",poisonHealEffect:!0}},{id:"revive_heart",name:"Revive Heart",rarity:"legendary",itemType:"held",icon:"✦",sprite:"/items/revive_heart.png",description:"Once per run: automatically revives the holder at 30% HP when KO'd. Destroyed after use.",effect:{trigger:"on_hit_taken",reviveOncePercent:.3}},{id:"potion",name:"Potion",rarity:"common",itemType:"consumable",icon:"✚",pokeapiName:"potion",description:"Restores 20 HP to one Pokémon.",effect:{trigger:"manual",healAmount:20}},{id:"super_potion",name:"Super Potion",rarity:"common",itemType:"consumable",icon:"✚",pokeapiName:"super-potion",description:"Restores 50 HP to one Pokémon.",effect:{trigger:"manual",healAmount:50}},{id:"hyper_potion",name:"Hyper Potion",rarity:"rare",itemType:"consumable",icon:"✚",pokeapiName:"hyper-potion",description:"Restores 200 HP to one Pokémon.",effect:{trigger:"manual",healAmount:200}},{id:"max_potion",name:"Max Potion",rarity:"epic",itemType:"consumable",icon:"✚",pokeapiName:"max-potion",description:"Fully restores HP to one Pokémon.",effect:{trigger:"manual",healPercent:1}},{id:"antidote",name:"Antidote",rarity:"common",itemType:"consumable",icon:"†",pokeapiName:"antidote",description:"Cures Poison from one Pokémon.",effect:{trigger:"manual",curesStatus:"poison"}},{id:"burn_heal",name:"Burn Heal",rarity:"common",itemType:"consumable",icon:"◇",pokeapiName:"burn-heal",description:"Cures Burn from one Pokémon.",effect:{trigger:"manual",curesStatus:"burn"}},{id:"full_heal",name:"Full Heal",rarity:"common",itemType:"consumable",icon:"✚",pokeapiName:"full-heal",description:"Cures any status condition from one Pokémon.",effect:{trigger:"manual",curesStatus:"any"}},{id:"revive",name:"Revive",rarity:"rare",itemType:"consumable",icon:"✦",pokeapiName:"revive",description:"Revives a KO'd Pokémon to half HP.",effect:{trigger:"manual",healPercent:.5}},{id:"max_revive",name:"Max Revive",rarity:"rare",itemType:"consumable",icon:"✦",pokeapiName:"max-revive",description:"Revives a KO'd Pokémon to full HP.",effect:{trigger:"manual",healPercent:1}},{id:"rare_candy",name:"Rare Candy",rarity:"rare",itemType:"consumable",icon:"◈",pokeapiName:"rare-candy",description:"Levels up one Pokémon by 1.",effect:{trigger:"manual"}},{id:"x_attack",name:"X Attack",rarity:"rare",itemType:"consumable",icon:"†",pokeapiName:"x-attack",description:"+2 Attack stages for the current battle.",effect:{trigger:"manual",statBoost:{attack:2}}},{id:"x_speed",name:"X Speed",rarity:"rare",itemType:"consumable",icon:"›",pokeapiName:"x-speed",description:"+2 Speed stages for the current battle.",effect:{trigger:"manual",statBoost:{speed:2}}},{id:"x_sp_atk",name:"X Sp. Atk",rarity:"rare",itemType:"consumable",icon:"◇",pokeapiName:"x-sp-atk",description:"+2 Sp. Atk stages for the current battle.",effect:{trigger:"manual",statBoost:{spAtk:2}}},{id:"dire_hit",name:"Dire Hit",rarity:"rare",itemType:"consumable",icon:"⊙",pokeapiName:"dire-hit",description:"Raises critical hit rate for the current battle.",effect:{trigger:"manual",critBoost:2}},{id:"escape_rope",name:"Escape Rope",rarity:"rare",itemType:"consumable",icon:"○",pokeapiName:"escape-rope",description:"Skip the current wave (no reward, no coins).",effect:{trigger:"manual"}},{id:"pokemon_food",name:"Pokémon Food",rarity:"common",itemType:"consumable",icon:"✚",pokeapiName:"casteliacone",description:"Restores 30 HP to one Pokémon.",effect:{trigger:"manual",healAmount:30}},{id:"ether",name:"Ether",rarity:"rare",itemType:"consumable",icon:"◉",pokeapiName:"ether",description:"Fully restores the PP of one chosen move.",effect:{trigger:"manual"}},{id:"reroll_token",name:"Reroll Token",rarity:"rare",itemType:"consumable",icon:"⁂",pokeapiName:"coin-case",description:"Gives one free shop reroll (no coin cost).",effect:{trigger:"manual"}},{id:"blind_lens",name:"Blind Lens",rarity:"epic",itemType:"consumable",icon:"◎",pokeapiName:"lens-case",description:"Re-roll the upcoming gym arena's Field Effect. Single use.",effect:{trigger:"manual"}},{id:"full_restore",name:"Full Restore",rarity:"epic",itemType:"consumable",icon:"✚",pokeapiName:"full-restore",description:"Fully heals HP and cures status of one Pokémon.",effect:{trigger:"manual",healPercent:1,curesStatus:"any"}},{id:"sacred_ash",name:"Sacred Ash",rarity:"epic",itemType:"consumable",icon:"✦",pokeapiName:"sacred-ash",description:"Revives the entire team to full HP.",effect:{trigger:"manual",healPercent:1}},{id:"star_piece",name:"Star Piece",rarity:"epic",itemType:"consumable",icon:"✦",pokeapiName:"star-piece",description:"Grants +50 coins immediately. (Reward only)",effect:{trigger:"manual",coinMultiplier:50},rewardOnly:!0},{id:"big_nugget",name:"Big Nugget",rarity:"epic",itemType:"consumable",icon:"◈",pokeapiName:"big-nugget",description:"Grants +150 coins immediately. (Reward only)",effect:{trigger:"manual",coinMultiplier:150},rewardOnly:!0},{id:"protein",name:"Protein",rarity:"epic",itemType:"consumable",icon:"▲",pokeapiName:"protein",description:"Permanently grants +10% Attack to one Pokémon.",effect:{trigger:"manual",permanentStatBoost:{attack:.1}}},{id:"iron",name:"Iron",rarity:"epic",itemType:"consumable",icon:"▽",pokeapiName:"iron",description:"Permanently grants +10% Defense to one Pokémon.",effect:{trigger:"manual",permanentStatBoost:{defense:.1}}},{id:"carbos",name:"Carbos",rarity:"epic",itemType:"consumable",icon:"›",pokeapiName:"carbos",description:"Permanently grants +10% Speed to one Pokémon.",effect:{trigger:"manual",permanentStatBoost:{speed:.1}}},{id:"item_pouch",name:"Item Pouch",rarity:"epic",itemType:"consumable",icon:"◈",pokeapiName:"item-finder",description:"Instantly unlocks Slot 2 for a Pokémon of your choice, regardless of level. (Reward only)",effect:{trigger:"manual"},rewardOnly:!0},{id:"ace_trainers_gift",name:"Ace Trainer's Gift",rarity:"legendary",itemType:"consumable",icon:"◆",pokeapiName:"lucky-egg",description:"The Pokémon with the highest level gains 2× XP for the next 5 waves. (Reward only)",effect:{trigger:"manual"},rewardOnly:!0},{id:"evolution_stone",name:"Evolution Stone",rarity:"epic",itemType:"consumable",icon:"▲",pokeapiName:"moon-stone",description:"Immediately evolves a Pokémon into its next form.",effect:{trigger:"manual"}},{id:"max_elixir",name:"Max Elixir",rarity:"rare",itemType:"consumable",icon:"◉",pokeapiName:"max-elixir",description:"Fully restores PP of every move for your entire team. (Reward only)",effect:{trigger:"manual"},rewardOnly:!0},{id:"team_vitals",name:"Team Vitals",rarity:"rare",itemType:"consumable",icon:"✚",pokeapiName:"revival-herb",description:"Heals 50% of max HP for every Pokémon in your team. (Reward only)",effect:{trigger:"manual",healPercent:.5},rewardOnly:!0},{id:"evolution_stone",name:"Evolution Stone",rarity:"epic",itemType:"consumable",icon:"▲",pokeapiName:"sun-stone",description:"Evolves the chosen Pokémon into its next form — even for stone-only evolutions.",effect:{trigger:"manual"}},{id:"synergy_stone",name:"Synergy Stone",rarity:"epic",itemType:"held",icon:"◈",pokeapiName:"shiny-stone",description:"+15% damage per other held item on this Pokémon (max +60%). More items = more power.",effect:{trigger:"passive"}},{id:"rally_band",name:"Rally Band",rarity:"rare",itemType:"held",icon:"≋",pokeapiName:"soothe-bell",description:"+8% damage per alive team member (including self). A full team of 5 = +40%.",effect:{trigger:"passive"}},{id:"type_enhancer",name:"Type Enhancer",rarity:"epic",itemType:"held",icon:"◆",pokeapiName:"ability-capsule",description:"+35% to same-type moves when 3+ team members share your primary type.",effect:{trigger:"passive",typePowerBoost:{type:"normal",multiplier:1}}},{id:"momentum_badge",name:"Momentum Badge",rarity:"epic",itemType:"held",icon:"›",pokeapiName:"absorb-bulb",description:"Gains 1 stack each wave won (max 10). Each stack adds +10% damage. Stacks persist.",effect:{trigger:"passive"}},{id:"formation_crest",name:"Formation Crest",rarity:"rare",itemType:"held",icon:"◈",pokeapiName:"macho-brace",description:"+25% damage when this Pokémon is in lead position (slot 1). Stacks with Lead Vanguard.",effect:{trigger:"passive"}},{id:"quick_powder",name:"Quick Powder",rarity:"rare",itemType:"held",icon:"›",pokeapiName:"quick-powder",description:"+25% Speed, but only on the first turn of each battle.",effect:{trigger:"passive",firstTurnSpeedBoost:1.25}},{id:"type_lens",name:"Type Lens",rarity:"epic",itemType:"held",icon:"◆",pokeapiName:"zoom-lens",description:"Pokémon's secondary type also gets STAB damage.",effect:{trigger:"passive",dualStab:!0}},{id:"reset_pulse",name:"Reset Pulse",rarity:"epic",itemType:"held",icon:"◌",pokeapiName:"cell-battery",description:"When the enemy switches in, clear their stat stages. Once per wave.",effect:{trigger:"passive",resetPulse:!0}},{id:"tag_team_bell",name:"Tag-Team Bell",rarity:"rare",itemType:"held",icon:"✚",pokeapiName:"shoal-shell",description:"When this Pokémon is KO'd, the next ally enters at full HP with +1 Atk stage.",effect:{trigger:"passive",tagTeamRevive:!0}}],wn=[{type:"fire",name:"Mars",icon:"☉"},{type:"water",name:"Neptune",icon:"☋"},{type:"grass",name:"Venus",icon:"☿"},{type:"electric",name:"Jupiter",icon:"★"},{type:"psychic",name:"Mercury",icon:"☿"},{type:"ice",name:"Pluto",icon:"◌"},{type:"dragon",name:"Saturn",icon:"♄"},{type:"dark",name:"Nyx",icon:"☾"},{type:"fairy",name:"Luna",icon:"☽"},{type:"fighting",name:"Ares",icon:"♂"},{type:"flying",name:"Aeolus",icon:"✦"},{type:"poison",name:"Hades",icon:"☣"},{type:"ground",name:"Terra",icon:"⊕"},{type:"rock",name:"Ceres",icon:"◈"},{type:"bug",name:"Eris",icon:"✿"},{type:"ghost",name:"Styx",icon:"♁"},{type:"steel",name:"Vesta",icon:"▣"},{type:"normal",name:"Earth",icon:"○"}];for(const a of wn)Z.push({id:`planet_${a.type}`,name:`Planet: ${a.name}`,rarity:"rare",itemType:"consumable",icon:a.icon,description:`+1 level for ${a.type}-type moves this run (+10% damage per level).`,effect:{trigger:"manual",planetCardType:a.type}});const ei=[{id:"veteran_training",name:"Veteran Training",rarity:"common",icon:"◆",description:"All Pokémon gain +7% to all stats.",effect:{allStatsMultiplier:1.07}},{id:"stab_boost",name:"Type STAB Boost",rarity:"common",icon:"†",description:"STAB bonus increased from 1.5× to 1.6×.",effect:{stabMultiplier:1.6}},{id:"endurance",name:"Endurance",rarity:"common",icon:"▲",description:"All Pokémon gain +10% max HP.",effect:{statMultiplier:{hp:1.1}}},{id:"swift_feet",name:"Swift Feet",rarity:"common",icon:"›",description:"All Pokémon gain +8% Speed.",effect:{statMultiplier:{speed:1.08}}},{id:"iron_will",name:"Iron Will",rarity:"common",icon:"▽",description:"All Pokémon gain +8% Defense.",effect:{statMultiplier:{defense:1.08}}},{id:"mystic_mind",name:"Mystic Mind",rarity:"common",icon:"⊕",description:"All Pokémon gain +8% Sp. Def.",effect:{statMultiplier:{spDef:1.08}}},{id:"sharp_senses",name:"Sharp Senses",rarity:"common",icon:"⊙",description:"Move accuracy +5% globally.",effect:{accuracyBonus:1.05}},{id:"coin_collector",name:"Coin Collector",rarity:"common",icon:"¢",description:"+15% coins from all waves.",effect:{coinMultiplier:1.15}},{id:"lucky_streak",name:"Lucky Streak",rarity:"common",icon:"✦",description:"Critical hit rate slightly increased for all Pokémon.",effect:{critBoost:.03}},{id:"berry_feast",name:"Berry Feast",rarity:"common",icon:"❧",description:"All Berry items trigger twice.",effect:{berryTriggerTwice:!0}},{id:"last_resort",name:"Last Resort",rarity:"rare",icon:"▲",description:"When only 1 Pokémon remains, it gets +50% Atk and Sp. Atk.",effect:{lastPokemonBoost:.5}},{id:"grassy_carpet",name:"Grassy Carpet",rarity:"rare",icon:"❧",description:"All Pokémon heal 6.25% HP at the end of each turn.",effect:{regenPercent:.0625}},{id:"dual_threat",name:"Dual Threat",rarity:"rare",icon:"✕",description:"Dual-type Pokémon deal +15% damage.",effect:{dualTypeBonus:1.15}},{id:"evolution_power",name:"Evolution Power",rarity:"rare",icon:"✦",description:"Fully evolved Pokémon get +10% to all stats.",effect:{fullyEvolvedBonus:1.1}},{id:"rookie_boost",name:"Rookie Boost",rarity:"rare",icon:"❧",description:"Non-fully evolved Pokémon get +25% Def and Sp. Def.",effect:{notFullyEvolvedBonus:{def:1.25,spDef:1.25}}},{id:"speed_demons",name:"Speed Demons",rarity:"rare",icon:"›",description:"If Speed > enemy's, deal +20% damage.",effect:{speedDamageBonus:1.2}},{id:"underdog",name:"Underdog",rarity:"rare",icon:"▽",description:"The Pokémon with the lowest BST on the team gets +40% Attack.",effect:{lowestBSTAttackBonus:1.4}},{id:"type_coverage",name:"Type Coverage",rarity:"rare",icon:"◈",description:"If the team covers 6+ unique types, all moves deal +10% damage.",effect:{typeCoverageBonus:{minTypes:6,multiplier:1.1}}},{id:"nurses_blessing",name:"Nurse's Blessing",rarity:"rare",icon:"✚",description:"Between-wave HP regeneration +10%.",effect:{regenPercent:.1}},{id:"burn_cascade",name:"Burn Cascade",rarity:"rare",icon:"▲",description:"Fire-type moves deal +20% damage and have a 25% chance to burn.",effect:{typeBoost:{type:"fire",multiplier:1.2},fireBurnChance:.25}},{id:"synergy_link",name:"Synergy Link",rarity:"epic",icon:"∞",description:"After a KO, the next Pokémon enters with +2 to all stat stages.",effect:{onKOBoost:{stages:2}}},{id:"deaths_door",name:"Death's Door Power",rarity:"epic",icon:"†",description:"Pokémon below 25% HP deal double damage.",effect:{deathsDoorMultiplier:2}},{id:"adrenaline_rush",name:"Adrenaline Rush",rarity:"epic",icon:"↯",description:"First move each battle is guaranteed to be a critical hit.",effect:{firstMoveCrit:!0}},{id:"legendary_aura",name:"Legendary Aura",rarity:"epic",icon:"◇",description:"All Pokémon stats treated as 10% higher for damage calculation.",effect:{allStatsMultiplier:1.1}},{id:"double_up",name:"Double Up",rarity:"epic",icon:"II",description:"15% chance any move hits twice.",effect:{doubleHitChance:.15}},{id:"immortal_grit",name:"Immortal Grit",rarity:"epic",icon:"▲",description:"Focus Sash effect applies to all Pokémon once per wave.",effect:{focusSashAll:!0}},{id:"chain_reaction",name:"Chain Reaction",rarity:"epic",icon:"∞",description:"Each KO grants +1% permanent damage bonus (stacks, persists run).",effect:{chainKOBonus:.01}},{id:"adaptability",name:"Adaptability",rarity:"epic",icon:"◈",description:"All Pokémon have Adaptability (STAB = 2× instead of 1.5×).",effect:{adaptability:!0}},{id:"speed_boost",name:"Speed Boost",rarity:"epic",icon:"›",description:"All Pokémon gain +1 Speed stage at the end of each turn.",effect:{speedBoostPerTurn:1}},{id:"god_mode",name:"God Mode",rarity:"legendary",icon:"◆",description:"Once per run: entire team revived to full HP mid-battle (manual trigger).",effect:{godModeRevive:!0}},{id:"type_erase",name:"Type Erase",rarity:"legendary",icon:"○",description:"All moves deal neutral damage (ignores resistances and immunities).",effect:{typeEraseAll:!0}},{id:"mega_evolution",name:"Mega Evolution",rarity:"legendary",icon:"◈",description:"All Pokémon get +30% to all stats (Mega Evolution for all!).",effect:{allStatsMultiplier:1.3}},{id:"z_power_aura",name:"Z-Power Aura",rarity:"legendary",icon:"✦",description:"All moves get +15% power. Z-move slot recharges each boss wave.",effect:{allMovePowerBonus:1.15}},{id:"master_ball_luck",name:"Master Ball Luck",rarity:"legendary",icon:"◉",description:"+15% to all stats and +1 free reroll per shop.",effect:{allStatsMultiplier:1.15,extraReroll:1}},{id:"backline_burner",name:"Backline Burner",rarity:"rare",icon:"◇",description:"Pokémon in slot 4 or 5 deal +30% damage.",effect:{backlineDamageBonus:1.3}},{id:"pivot_tactics",name:"Pivot Tactics",rarity:"rare",icon:"↻",description:"After a Pokémon enters battle, +1 stage to Atk and Speed for 1 turn.",effect:{pivotBoost:{atk:1,speed:1,turns:1}}},{id:"item_maven",name:"Item Maven",rarity:"rare",icon:"◈",description:"Each held item adds +5% to one stat (rotates by slot).",effect:{itemMaven:.05}},{id:"type_mastery",name:"Type Mastery",rarity:"epic",icon:"◆",description:"+1 type level for the primary type when 2+ teammates share it.",effect:{typeMasteryBonus:1}},{id:"status_stacker",name:"Status Stacker",rarity:"epic",icon:"‡",description:"Damage from burn and poison +50%. Status moves +20% accuracy.",effect:{statusStacker:{damageMult:1.5,accuracyMult:1.2}}}];function Qs(a,e){if(e){const r=Math.random();return r<.15?"legendary":r<.65?"epic":"rare"}const t=Math.min(.08,.03+a*.001),s=Math.min(.25,.12+a*.003),i=Math.min(.45,.3+a*.002),n=Math.random();return n<t?"legendary":n<t+s?"epic":n<t+s+i?"rare":"common"}function ti(a,e=[]){const t=Z.filter(s=>s.rarity===a&&!e.includes(s.id));if(t.length===0){const s=["legendary","epic","rare","common"],i=s.indexOf(a);return i<s.length-1?ti(s[i+1],e):null}return t[Math.floor(Math.random()*t.length)]}function si(a,e){const t=ei.filter(s=>s.rarity===a&&!e.includes(s.id));if(t.length===0){const s=["legendary","epic","rare","common"],i=s.indexOf(a);return i<s.length-1?si(s[i+1],e):null}return t[Math.floor(Math.random()*t.length)]}function ea(a,e,t,s,i){const n=[],r=[],o=i==null?void 0:i.minRarity,l=d=>{if(!o)return d;const p=["common","rare","epic","legendary"];return p[Math.max(p.indexOf(d),p.indexOf(o))]??d},c=i!=null&&i.extraCard?4:3;if(s.length>0){const d=s[Math.floor(Math.random()*s.length)],p=l(Qs(a,e));n.push({type:"pokemon",rarity:p,pokemon:d})}for(;n.length<c;){const d=l(Qs(a,e));if(Math.random()<.4){const h=si(d,t);if(h){n.push({type:"perk",rarity:d,perk:h});continue}}const u=ti(d,r);if(u)r.push(u.id),n.push({type:"item",rarity:d,item:u});else if(s.length>0){const h=s[Math.floor(Math.random()*s.length)];n.push({type:"pokemon",rarity:"common",pokemon:h})}}return n.slice(0,c)}function $n(a){return{common:"Common",rare:"Rare",epic:"Epic",legendary:"Legendary"}[a]}function xn(a){return`rarity-${a}`}const ai=[{id:"poke_ball",name:"Poké Ball Booster",pokeapiName:"poke-ball",color:"#dc2626",price:50,contents:"held_items",options:3,pick:1,description:"3 held items — keep 1."},{id:"great_ball",name:"Great Ball Booster",pokeapiName:"great-ball",color:"#2563eb",price:60,contents:"consumables",options:3,pick:1,description:"3 consumables — keep 1."},{id:"ultra_ball",name:"Ultra Ball Booster",pokeapiName:"ultra-ball",color:"#eab308",price:80,contents:"perks",options:2,pick:1,description:"2 trainer perks — keep 1."},{id:"master_ball",name:"Master Ball Booster",pokeapiName:"master-ball",color:"#a855f7",price:120,contents:"mixed",options:5,pick:2,minRarity:"rare",description:"5 rare-tier goods — keep 2."},{id:"premier_ball",name:"Premier Ball Booster",pokeapiName:"premier-ball",color:"#be123c",price:100,contents:"spectral",options:2,pick:1,minRarity:"epic",description:"2 mighty items — carries a cost."}],Mn={poke_ball:"SERIES I",great_ball:"SERIES II",ultra_ball:"SERIES III",master_ball:"SERIES IV",premier_ball:"SPECIAL"},Tn={poke_ball:["#e84040","#c01818"],great_ball:["#2a6fd8","#154aa8"],ultra_ball:["#ffc83a","#ca8a04"],master_ball:["#a855f7","#6b21a8"],premier_ball:["#f8f1dd","#8b2f00"]},Pn={poke_ball:"held items",great_ball:"consumables",ultra_ball:"trainer perks",master_ball:"rare goods",premier_ball:"mighty items"},ta={poke_ball:"Poké Ball",great_ball:"Great Ball",ultra_ball:"Ultra Ball",master_ball:"Master Ball",premier_ball:"Premier Ball"};function sa(a){return ai.find(e=>e.id===a)}const aa=[{id:"frayed_edge",name:"Frayed Edge",description:"Team max HP reduced by 10% for the rest of the run."},{id:"heavy_load",name:"Heavy Load",description:"Team Speed reduced by 10% for the rest of the run."},{id:"blood_pact",name:"Blood Pact",description:"Lose 50 coins now."},{id:"time_debt",name:"Time Debt",description:"Next 2 waves give no coin reward."}];function Ln(){return aa[Math.floor(Math.random()*aa.length)]}const ii=[{id:"overstock",name:"Mart Restock Permit",icon:"▣",price:280,description:"The PokéMart team keeps the shelves fuller. Shop shows 2 extra items."},{id:"clearance_sale",name:"Mart Discount Card",icon:"¢",price:320,description:"A loyalty card from Celadon Dept. Store. All shop prices 25% cheaper."},{id:"reroll_surplus",name:"Free Sample Coupon",icon:"⁂",price:220,description:"The clerk waves your first restock through. First reroll per shop is free."},{id:"crystal_ball",name:"Itemfinder",icon:"◉",price:300,description:"Devon Corp's scout device. Reveals the next 2 waves' enemy roster in advance."},{id:"omen_globe",name:"Lucky Charm",icon:"◇",price:350,description:"A keepsake from Mt. Moon. Each wave grants +1 reward choice."},{id:"magic_trick",name:"Pack-In Promo",icon:"✦",price:300,description:"A trading-card promotion. Booster Packs cost 20% less and contain one extra option."},{id:"grabber",name:"Pickup Charter",icon:"◈",price:200,description:"Lessons from a Pickup-trained Linoone. New recruits arrive with slot 2 already unlocked."},{id:"tarot_merchant",name:"Stargazer's Permit",icon:"☆",price:280,description:"Mossdeep Observatory access. Planet Cards appear 50% more often in the shop."},{id:"type_atlas",name:"Type Scope",icon:"✦",price:300,description:"A field manual for type matchups. Every Planet Card in this run grants +2 type levels instead of +1."},{id:"held_slot_charter",name:"Bag Upgrade Permit",icon:"◈",price:350,description:"Bill's storage engineers retrofit your team. Every Pokémon unlocks one extra held-item slot."},{id:"boss_insurance",name:"Sacred Ash Insurance",icon:"✚",price:400,description:"A pinch of legendary ash, kept for emergencies. Once per boss wave a fainted Pokémon auto-revives at 25% HP."}];function ia(a){return ii.find(e=>e.id===a)}const _n={common:[20,40],rare:[60,100],epic:[150,250],legendary:[400,600]};function na(a,e,t=0){const[s,i]=_n[a],n=s+Math.floor(Math.random()*(i-s+1)),r=1+Math.min(.5,Math.max(0,e-3)*.022);return Math.max(1,Math.floor(n*r*(1-t)))}const Xt=["potion","super_potion","hyper_potion","full_restore","pokemon_food"];function ni(a,e=[],t=[],s){const i=[],n=new Set(e),r=t.includes("clearance_sale")?.25:0,o=t.includes("overstock")?2:0,l=s!=null&&s.excludeConsumables?Z.filter(h=>h.itemType!=="consumable"):Z,c=3+(Math.random()<.5?1:0)+o,d=["common","common","rare","rare","epic"];a>=10&&d.push("epic"),a>=15&&d.push("legendary");const p=d.sort(()=>Math.random()-.5).slice(0,c);!p.includes("epic")&&!p.includes("legendary")&&(p[p.length-1]="epic"),s!=null&&s.epicPity&&a>=8&&(p[0]="epic");for(const h of p){const m=l.filter(g=>g.rarity===h&&!n.has(g.id)&&!g.rewardOnly);if(m.length===0)continue;const v=m[Math.floor(Math.random()*m.length)];n.add(v.id),i.push({item:v,price:na(h,a,r),sold:!1})}if(!i.some(h=>Xt.includes(h.item.id))&&!(s!=null&&s.excludeConsumables)){const h=((s==null?void 0:s.teamHpRatio)??1)<.6,m=["hyper_potion","full_restore"],v=h||s!=null&&s.healingPity?Z.filter(w=>m.includes(w.id)&&!n.has(w.id)):Z.filter(w=>Xt.includes(w.id)&&!n.has(w.id)),g=v.length>0?v:Z.filter(w=>Xt.includes(w.id)&&!n.has(w.id));if(g.length>0){const w=g[Math.floor(Math.random()*g.length)];i.push({item:w,price:na(w.rarity,a,r),sold:!1})}}return i}function kt(a,e){return e>=a}function Bn(a,e){return a.sold||e<a.price?{success:!1,newCoins:e}:{success:!0,newCoins:e-a.price}}function ra(a){return 15+Math.floor(a/3)*5}function Jt(a,e=[],t=[],s){return ni(a,e,t,s)}function En(a,e=!1,t=[],s){const i=[];e&&i.push({packId:"master_ball",price:0,sold:!1,free:!0});const n=2,r=t.includes("magic_trick")?.2:0,o=(1+Math.min(.5,a*.02))*(1-r),l=new Set;e&&l.add("master_ball");const c=ai.filter(d=>d.id==="premier_ball"?a>=5:!(s!=null&&s.excludeConsumables&&d.id==="great_ball"));for(let d=0;d<n;d++){const p=c.filter(m=>!l.has(m.id)),u=p.length?p:c,h=u[Math.floor(Math.random()*u.length)];l.add(h.id),i.push({packId:h.id,price:Math.floor(h.price*o),sold:!1})}return i}function Cn(a,e=[],t=!1){const s=new Set(e),i=ii.filter(l=>!s.has(l.id));if(i.length===0)return[];if(!(t||Math.random()<.22+Math.min(.3,a*.01)))return[];const r=i[Math.floor(Math.random()*i.length)],o=1+Math.min(.25,a*.015);return[{voucherId:r.id,price:Math.floor(r.price*o),sold:!1}]}const _t=[{id:"lead_vanguard",name:"Lead Vanguard",icon:"◈",color:"blue",description:"Active Pokémon holds the lead slot in a team of 2+. Reward for keeping your frontrunner healthy."},{id:"last_stand",name:"Last Stand",icon:"✦",color:"red",description:"Your last Pokémon standing after others have fainted. Fight from the brink and deal double damage."},{id:"formation_crest",name:"Formation Lead",icon:"◈",color:"blue",description:"Formation Crest in the lead slot. Stacks with Lead Vanguard for a powerful double bonus."},{id:"mono_legion",name:"Mono Legion",icon:"◆",color:"gold",description:"Every living team member shares a type. Absolute purity grants tremendous power."},{id:"type_trio",name:"Type Trio",icon:"◇",color:"green",description:"3 or more living teammates share your type. Unity amplifies each strike."},{id:"type_bond",name:"Type Bond",icon:"◇",color:"green",description:"2 teammates share your type in a team of 3+. A bond begins to form."},{id:"trinity",name:"Trinity",icon:"✦",color:"gold",description:"Your team covers Fire, Water and Grass. The eternal triangle grants balance."},{id:"brute_force",name:"Brute Force",icon:"▲",color:"orange",description:"Choice Band + Muscle Band. Double down on raw physical power for extra damage."},{id:"mind_surge",name:"Mind Surge",icon:"⊙",color:"purple",description:"Choice Specs + Wise Glasses. Stack special attack for overwhelming mental force."},{id:"vampire_strike",name:"Vampire Strike",icon:"◉",color:"purple",description:"Life Orb + Shell Bell. Drain back what you spend. Raw power with built-in sustain."},{id:"precision_hunter",name:"Precision Hunter",icon:"⊙",color:"gold",description:"Scope Lens + Expert Belt. Critical hits on super-effective moves are devastating."},{id:"berserker",name:"Berserker Soul",icon:"▲",color:"red",description:"Flame Orb + Choice Band. Embrace the burn — pain fuels unbridled fury."},{id:"synergy_stone",name:"Synergy Stone",icon:"◈",color:"gold",description:"Synergy Stone amplifies each other held item sharing this Pokémon's slots (+15% per item, max ×1.60)."},{id:"rally_band",name:"Rally Band",icon:"≋",color:"blue",description:"Rally Band: +8% per living teammate. The whole team fuels the individual."},{id:"type_enhancer",name:"Type Master",icon:"◆",color:"green",description:"Type Enhancer fires when you use a STAB move with 3+ same-type allies. STAB pushed further."},{id:"momentum_badge",name:"Momentum Badge",icon:"›",color:"orange",description:"Momentum Badge gains +10% per wave won (up to ×2.0 at 10 stacks)."},{id:"royal_arsenal",name:"Royal Arsenal",icon:"♔",color:"gold",description:"Mega Stone + Z-Crystal — legendary weapons of kings, wielded by a single champion."},{id:"gilded_crown",name:"Gilded Crown",icon:"♕",color:"gold",description:"Light Ball + Amulet Coin — brilliance and fortune intertwined for electric payday."},{id:"phoenix_oath",name:"Phoenix Oath",icon:"✦",color:"red",description:"Revive Heart wielder at <30% HP — embrace the ashes. Your next strike burns brighter."},{id:"brilliant_beam",name:"Brilliant Beam",icon:"★",color:"gold",description:"Light Ball + Mega Stone + Z-Crystal on an Electric-type — a once-in-a-run jackpot."}];function os(a){const{attacker:e,team:t,slotIndex:s,moveType:i}=a,n=t.filter(y=>y.battleHp>0),r=[];let o=1;const l=ut(e),c=e.types[0];s===0&&t.length>=2&&(r.push({id:"lead_vanguard",name:"Lead Vanguard",multiplier:1.15,color:"blue",icon:"◈",description:"Active Pokémon holds the lead slot in a team of 2+. Reward for keeping your frontrunner healthy."}),o*=1.15),n.length===1&&t.length>=2&&e.battleHp>0&&(r.push({id:"last_stand",name:"Last Stand",multiplier:2,color:"red",icon:"✦",description:"Your last Pokémon standing after others have fainted. Fight from the brink and deal double damage."}),o*=2);const d=n.filter(y=>y.types.includes(c)).length,p=n.length;p>=3&&d===p?(r.push({id:"mono_legion",name:"Mono Legion",multiplier:2,color:"gold",icon:"◆",description:"Every living team member shares a type. Absolute purity grants tremendous power."}),o*=2):d>=3?(r.push({id:"type_trio",name:"Type Trio",multiplier:1.35,color:"green",icon:"◇",description:"3 or more living teammates share your type. Unity amplifies each strike."}),o*=1.35):d>=2&&p>=3&&(r.push({id:"type_bond",name:"Type Bond",multiplier:1.15,color:"green",icon:"◇",description:"2 teammates share your type in a team of 3+. A bond begins to form."}),o*=1.15);const u=new Set(n.flatMap(y=>y.types));u.has("fire")&&u.has("water")&&u.has("grass")&&(r.push({id:"trinity",name:"Trinity",multiplier:1.15,color:"gold",icon:"✦",description:"Your team covers Fire, Water and Grass. The eternal triangle grants balance."}),o*=1.15);const h=_(e,"choice_band"),m=_(e,"muscle_band"),v=_(e,"choice_specs"),g=_(e,"wise_glasses"),w=_(e,"life_orb"),A=_(e,"shell_bell"),x=_(e,"scope_lens"),T=_(e,"expert_belt"),P=_(e,"flame_orb");if(h&&m&&(r.push({id:"brute_force",name:"Brute Force",multiplier:1.2,color:"orange",icon:"▲",description:"Choice Band + Muscle Band. Double down on raw physical power for extra damage."}),o*=1.2),v&&g&&(r.push({id:"mind_surge",name:"Mind Surge",multiplier:1.2,color:"purple",icon:"⊙",description:"Choice Specs + Wise Glasses. Stack special attack for overwhelming mental force."}),o*=1.2),P&&h&&(r.push({id:"berserker",name:"Berserker Soul",multiplier:1.3,color:"red",icon:"▲",description:"Flame Orb + Choice Band. Embrace the burn — pain fuels unbridled fury."}),o*=1.3),w&&A&&(r.push({id:"vampire_strike",name:"Vampire Strike",multiplier:1.15,color:"purple",icon:"◉",description:"Life Orb + Shell Bell. Drain back what you spend. Raw power with built-in sustain."}),o*=1.15),x&&T&&(r.push({id:"precision_hunter",name:"Precision Hunter",multiplier:1.2,color:"gold",icon:"⊙",description:"Scope Lens + Expert Belt. Critical hits on super-effective moves are devastating."}),o*=1.2),_(e,"synergy_stone")){const y=l.filter($=>$.id!=="synergy_stone").length;if(y>0){const $=1+Math.min(4,y)*.15;r.push({id:"synergy_stone",name:`Synergy Stack ×${y}`,multiplier:$,color:"gold",icon:"◈",description:"Synergy Stone amplifies each other held item sharing this Pokémon's slots (+15% per item, max ×1.60)."}),o*=$}}if(_(e,"rally_band")){const y=n.length,$=1+y*.08;r.push({id:"rally_band",name:`Rally ×${y}`,multiplier:$,color:"blue",icon:"≋",description:"Rally Band: +8% per living teammate. The whole team fuels the individual."}),o*=$}if(_(e,"type_enhancer")){const y=i??c,$=n.filter(H=>H.types.includes(y)).length;i&&e.types.includes(i)&&$>=3&&(r.push({id:"type_enhancer",name:"Type Master",multiplier:1.35,color:"green",icon:"◆",description:"Type Enhancer fires when you use a STAB move with 3+ same-type allies. STAB pushed further."}),o*=1.35)}if(_(e,"momentum_badge")){const y=e.momentumStacks??0;if(y>0){const $=1+Math.min(10,y)*.1;r.push({id:"momentum_badge",name:`Momentum ×${y}`,multiplier:$,color:"orange",icon:"›",description:`Momentum Badge gains +10% per wave won (up to ×2.0 at 10 stacks). Current: ${y} stack${y!==1?"s":""}.`}),o*=$}}const I=_(e,"mega_stone"),C=_(e,"z_crystal"),L=_(e,"light_ball"),S=_(e,"revive_heart"),E=_(e,"amulet_coin");return I&&C&&(r.push({id:"royal_arsenal",name:"Royal Arsenal",multiplier:1.5,color:"gold",icon:"♔",description:"Mega Stone + Z-Crystal — legendary weapons of kings, wielded by a single champion."}),o*=1.5),L&&E&&(r.push({id:"gilded_crown",name:"Gilded Crown",multiplier:1.3,color:"gold",icon:"♕",description:"Light Ball + Amulet Coin — brilliance and fortune intertwined for electric payday."}),o*=1.3),S&&e.battleHp/e.maxBattleHp<.3&&(r.push({id:"phoenix_oath",name:"Phoenix Oath",multiplier:1.4,color:"red",icon:"✦",description:"Revive Heart wielder at <30% HP — embrace the ashes. Your next strike burns brighter."}),o*=1.4),L&&I&&C&&c==="electric"&&(r.push({id:"brilliant_beam",name:"Brilliant Beam",multiplier:1.75,color:"gold",icon:"★",description:"Light Ball + Mega Stone + Z-Crystal on an Electric-type — a once-in-a-run jackpot."}),o*=1.75),_(e,"formation_crest")&&s===0&&(r.push({id:"formation_crest",name:"Formation Lead",multiplier:1.25,color:"blue",icon:"◈",description:"Formation Crest in the lead slot. Stacks with Lead Vanguard for a powerful double bonus."}),o*=1.25),{totalMultiplier:o,activeSynergies:r}}const In={normal:{rock:.5,steel:.5,ghost:0},fire:{fire:.5,water:.5,rock:.5,dragon:.5,grass:2,ice:2,bug:2,steel:2},water:{water:.5,grass:.5,dragon:.5,fire:2,ground:2,rock:2},electric:{electric:.5,grass:.5,dragon:.5,ground:0,water:2,flying:2},grass:{fire:.5,grass:.5,poison:.5,flying:.5,bug:.5,dragon:.5,steel:.5,water:2,ground:2,rock:2},ice:{water:.5,ice:.5,steel:.5,grass:2,ground:2,flying:2,dragon:2},fighting:{poison:.5,flying:.5,psychic:.5,bug:.5,fairy:.5,ghost:0,normal:2,ice:2,rock:2,dark:2,steel:2},poison:{poison:.5,ground:.5,rock:.5,ghost:.5,steel:0,grass:2,fairy:2},ground:{grass:.5,bug:.5,flying:0,fire:2,electric:2,poison:2,rock:2,steel:2},flying:{electric:.5,rock:.5,steel:.5,grass:2,fighting:2,bug:2},psychic:{psychic:.5,steel:.5,dark:0,fighting:2,poison:2},bug:{fire:.5,fighting:.5,flying:.5,ghost:.5,steel:.5,fairy:.5,grass:2,psychic:2,dark:2},rock:{fighting:.5,ground:.5,steel:.5,fire:2,ice:2,flying:2,bug:2},ghost:{dark:.5,normal:0,ghost:2,psychic:2},dragon:{steel:.5,fairy:0,dragon:2},dark:{fighting:.5,dark:.5,fairy:.5,ghost:2,psychic:2},steel:{fire:.5,water:.5,electric:.5,steel:.5,ice:2,rock:2,fairy:2},fairy:{fire:.5,poison:.5,steel:.5,fighting:2,dragon:2,dark:2}};function Ft(a,e){let t=1;for(const s of e){const n=In[a][s];n!==void 0&&(t*=n)}return t}function An(a){return a===0?"No effect!":a<1?"Not very effective...":a>1?"Super effective!":""}const $e=[{id:"the_hook",name:"The Hook",icon:"⌾",color:"#8b2a2a",description:"Player loses 1 random item-slot item each turn.",tacticalHint:"Bring items you can afford to lose."},{id:"the_wall",name:"The Wall",icon:"▣",color:"#3a3a3a",description:"Enemies start with 2× max HP.",tacticalHint:"Bring sustained damage."},{id:"the_ox",name:"The Ox",icon:"◍",color:"#704214",description:"Your first attack each battle deals 0 damage.",tacticalHint:"Don't waste your strongest opener."},{id:"the_needle",name:"The Needle",icon:"✕",color:"#a03060",description:"Moves deal 50% less damage — but crits deal 3×.",tacticalHint:"Stack crit-rate items."},{id:"the_mouth",name:"The Mouth",icon:"○",color:"#4a1c6a",description:"No synergies are active this battle.",tacticalHint:"Raw stats only. Bring strong mons."},{id:"the_manacle",name:"The Manacle",icon:"⊘",color:"#2a5a8a",description:"All your Pokémon enter with −2 to all stat stages.",tacticalHint:"Stat boost perks (Synergy Link) shine here."},{id:"the_tooth",name:"The Tooth",icon:"◤",color:"#b04020",description:"Enemies heal 50% max HP once at 50% HP.",tacticalHint:"Burst them before they recover."},{id:"the_fish",name:"The Fish",icon:"∿",color:"#2a6a8a",description:"Held items are disabled this battle.",tacticalHint:"Raw type/stat matchups only."},{id:"the_serpent",name:"The Serpent",icon:"⟲",color:"#2a6a4a",description:"Your moves do not get STAB bonuses.",tacticalHint:"High-power non-STAB coverage helps."},{id:"the_eye",name:"The Eye",icon:"◉",color:"#6a4a8a",description:"No move can be used twice per battle.",tacticalHint:"Bring Pokémon with 4 different moves."}];function Ot(a){return $e.find(e=>e.id===a)}function tt(a=[]){const e=$e.filter(s=>!a.includes(s.id)),t=e.length?e:$e;return t[Math.floor(Math.random()*t.length)]}function Hn(a){const e=[...$e];for(let t=e.length-1;t>0;t--){const s=Math.floor(Math.random()*(t+1));[e[t],e[s]]=[e[s],e[t]]}return e.slice(0,Math.min(a,e.length)).map(t=>t.id)}function Nn(a){return a==="the_mouth"}function Rn(a){return a==="the_serpent"}function ls(a){return a==="the_fish"}function ut(a){var e;return(e=a.itemSlots)!=null&&e.length?a.itemSlots.filter(t=>t.unlocked&&t.item!=null).map(t=>t.item):a.heldItem?[a.heldItem]:[]}function _(a,e){var t,s;return(t=a.itemSlots)!=null&&t.length?a.itemSlots.some(i=>{var n;return i.unlocked&&((n=i.item)==null?void 0:n.id)===e}):((s=a.heldItem)==null?void 0:s.id)===e}function Ze(a){return{[-6]:.25,[-5]:.2857142857142857,[-4]:.3333333333333333,[-3]:.4,[-2]:.5,[-1]:.6666666666666666,0:1,1:1.5,2:2,3:2.5,4:3,5:3.5,6:4}[Math.max(-6,Math.min(6,a))]??1}function qn(a){return{[-6]:.3333333333333333,[-5]:.375,[-4]:.42857142857142855,[-3]:.5,[-2]:.6,[-1]:.75,0:1,1:1.3333333333333333,2:1.6666666666666667,3:2,4:2.3333333333333335,5:2.6666666666666665,6:3}[Math.max(-6,Math.min(6,a))]??1}function Se(a,e){const t=a.effectiveStats[e],s=e,i=s in a.statStages?a.statStages[s]:0;return Math.floor(t*Ze(i))}function oa(a,e,t,s,i=!1,n,r){var E;if(t.power===0||t.category==="status")return{damage:0,effectiveness:1,isCritical:!1,isImmune:!1};if(r!=null&&r.isPlayerAttacker&&r.bossBlind==="the_ox"&&i)return{damage:0,effectiveness:1,isCritical:!1,isImmune:!1};const o=Ft(t.type,e.types),c=s.some(y=>y.id==="type_erase")?1:o;if(c===0)return{damage:0,effectiveness:0,isCritical:!1,isImmune:!0};if(t.type==="ground"&&e.hasAirBalloon)return{damage:0,effectiveness:0,isCritical:!1,isImmune:!0};const d=a.level,p=t.power;let u,h;t.category==="physical"?(u=Se(a,"attack"),h=Se(e,"defense")):(u=Se(a,"spAtk"),h=Se(e,"spDef")),a.battleStatus==="burn"&&t.category==="physical"&&(_(a,"flame_orb")?u=Math.floor(u*1.5):u=Math.floor(u*.5)),a.battleStatus&&a.battleStatus!=="burn"&&t.category==="physical"&&(_(a,"flame_orb")||_(a,"toxic_orb"))&&(u=Math.floor(u*1.5));let m=Math.floor(Math.floor((2*d/5+2)*p*u/h)/50+2),v=.0625;s.some(y=>y.id==="lucky_streak")&&(v+=.03),s.some(y=>y.id==="adrenaline_rush")&&i&&(v=1),_(a,"scope_lens")&&(v=.125);const g=Math.random()<v,w=(r==null?void 0:r.bossBlind)==="the_needle"?3:1.5;g&&(m=Math.floor(m*w));let A=1;const x=!Rn(r==null?void 0:r.bossBlind),T=_(a,"type_lens")&&!ls(r==null?void 0:r.bossBlind);x&&(a.types.includes(t.type)||T&&a.types.length>=2&&a.types[1]===t.type)&&(s.some(y=>y.id==="adaptability")?A=2:A=s.some(y=>y.id==="stab_boost")?1.6:1.5),m=Math.floor(m*A),(r==null?void 0:r.bossBlind)==="the_needle"&&(m=Math.floor(m*.5)),m=Math.floor(m*c);const I=.85+Math.random()*.15;if(m=Math.floor(m*I),!ls(r==null?void 0:r.bossBlind)){_(a,"life_orb")&&(m=Math.floor(m*1.3)),_(a,"expert_belt")&&c>1&&(m=Math.floor(m*1.2)),_(a,"muscle_band")&&t.category==="physical"&&(m=Math.floor(m*1.1)),_(a,"wise_glasses")&&t.category==="special"&&(m=Math.floor(m*1.1)),_(a,"mega_stone")&&(m=Math.floor(m*1.3));for(const y of ut(a))if(y.effect.typePowerBoost){const{type:$,multiplier:H}=y.effect.typePowerBoost;t.type===$&&(m=Math.floor(m*H))}}if(r!=null&&r.typeLevels||s.some(y=>y.id==="type_mastery")){let y=((E=r==null?void 0:r.typeLevels)==null?void 0:E[t.type])??0;const $=s.find(H=>H.id==="type_mastery");if($!=null&&$.effect.typeMasteryBonus&&n){const H=a.types[0];H===t.type&&n.team.filter(K=>K.battleHp>0&&K.types.includes(H)).length>=2&&(y+=$.effect.typeMasteryBonus)}y>0&&(m=Math.floor(m*(1+y*.1)))}for(const y of s)y.effect.typeBoost&&y.effect.typeBoost.type===t.type&&(m=Math.floor(m*y.effect.typeBoost.multiplier));a.battleHp/a.maxBattleHp<.25&&s.some(y=>y.id==="deaths_door")&&(m=Math.floor(m*2)),s.some(y=>y.id==="speed_demons")&&Se(a,"speed")>Se(e,"speed")&&(m=Math.floor(m*1.2)),s.some(y=>y.id==="dual_threat")&&a.types.length>=2&&(m=Math.floor(m*1.15)),s.some(y=>y.id==="evolution_power")&&a.isFullyEvolved&&(m=Math.floor(m*1.1)),s.some(y=>y.id==="legendary_aura")&&(m=Math.floor(m*1.1)),s.some(y=>y.id==="mega_evolution")&&(m=Math.floor(m*1.3));const S=s.find(y=>y.id==="chain_reaction");if(S){const y=1+(S.effect.chainKOBonus??0);m=Math.floor(m*y)}if(s.some(y=>y.id==="z_power_aura")&&(m=Math.floor(m*1.15)),n&&n.slotIndex>=3){const y=s.find($=>$.id==="backline_burner");y!=null&&y.effect.backlineDamageBonus&&(m=Math.floor(m*y.effect.backlineDamageBonus))}if(n&&!Nn(r==null?void 0:r.bossBlind)){const{totalMultiplier:y,activeSynergies:$}=os({attacker:a,team:n.team,slotIndex:n.slotIndex,moveType:t.type});m=Math.floor(m*y),a._activeSynergies=$}else n&&(a._activeSynergies=[]);if(r!=null&&r.monoDamageBoost&&n){const y=n.team.filter($=>$.battleHp>0);if(y.length>0){const $=y[0].types[0];y.every(W=>W.types[0]===$)&&(m=Math.floor(m*1.25))}}return{damage:Math.max(1,m),effectiveness:c,isCritical:g,isImmune:!1}}function Dn(a,e,t){if(e.accuracy===0||e.accuracy===null)return!0;let s=e.accuracy/100;if(_(a,"wide_lens")&&(s*=1.1),t.some(o=>o.id==="sharp_senses")&&(s*=1.05),e.category==="status"){const o=t.find(l=>l.id==="status_stacker");o!=null&&o.effect.statusStacker&&(s*=o.effect.statusStacker.accuracyMult)}const i=a.statStages.accuracy??0,r=qn(i-0);return s*=r,Math.random()<s}function Fn(a,e){return!(a.battleStatus!==null||a.types.includes("fire"))}function On(a,e,t){const s=a.moves.filter(l=>l.pp>0);if(s.length===0)return{id:-1,name:"struggle",displayName:"Struggle",type:"normal",category:"physical",power:50,accuracy:100,pp:1,maxPp:1,effect:"",effectChance:0,priority:0,isContact:!0,isSoundBased:!1,isPowder:!1,isTwoTurn:!1,target:"selected-pokemon"};if(a.choiceLockedMove&&s.find(l=>l.id===a.choiceLockedMove.id))return a.choiceLockedMove;const i=e.battleStatus!==null,n=s.filter(l=>{if(l.category!=="status"&&l.power>0)return!1;const c=(l.effect??"").toLowerCase();return c.includes("burn")||c.includes("paralyz")||c.includes("poison")||c.includes("sleep")||c.includes("freeze")||c.includes("confus")});if(!i&&n.length>0&&Math.random()<.28){const l=n.filter(d=>{const p=(d.effect??"").toLowerCase();return!(p.includes("poison")&&(e.types.includes("poison")||e.types.includes("steel"))||p.includes("burn")&&e.types.includes("fire")||p.includes("paralyz")&&e.types.includes("electric")||p.includes("freeze")&&e.types.includes("ice"))}),c=l.length>0?l:n;return c[Math.floor(Math.random()*c.length)]}let r=s[0],o=-1/0;for(const l of s){if(l.power===0)continue;const c=Ft(l.type,e.types),d=a.types.includes(l.type)?1.5:1,p=l.power*c*d;p>o&&(o=p,r=l)}return r}function Gn(a,e,t){const s=a.moves.filter(P=>P.pp>0);if(s.length===0)return{id:-1,name:"struggle",displayName:"Struggle",type:"normal",category:"physical",power:50,accuracy:100,pp:1,maxPp:1,effect:"",effectChance:0,priority:0,isContact:!0,isSoundBased:!1,isPowder:!1,isTwoTurn:!1,target:"selected-pokemon"};if(a.choiceLockedMove&&s.find(P=>P.id===a.choiceLockedMove.id))return a.choiceLockedMove;const i=1.5,n=Ze(a.statStages.attack??0),r=Ze(a.statStages.spAtk??0),o=Ze(e.statStages.defense??0),l=Ze(e.statStages.spDef??0),c=(a.effectiveStats.attack??1)*n,d=(a.effectiveStats.spAtk??1)*r,p=Math.max(1,(e.effectiveStats.defense??1)*o),u=Math.max(1,(e.effectiveStats.spDef??1)*l),h=[],m=[];for(const P of s){if(P.power<=0){m.push(P);continue}const I=Ft(P.type,e.types);if(I===0)continue;const C=a.types.includes(P.type)?i:1,L=(P.accuracy??100)/100,S=P.category==="special"?d/u:c/p;let E=P.power*I*C*L*S;I>=2&&(E*=1.15),h.push({move:P,score:E,effectiveness:I})}if(h.length===0)return m.length>0?m[Math.floor(Math.random()*m.length)]:s[0];h.sort((P,I)=>I.score-P.score);const v=h[0].score,g=v*.88,w=h.filter(P=>P.score>=g);let A=0;const x=w.map(P=>{const I=P.move.maxPp>0?P.move.pp/P.move.maxPp:1,C=P.score/v,L=Math.max(.01,C*(.25+I));return A+=L,L});let T=Math.random()*A;for(let P=0;P<w.length;P++)if(T-=x[P],T<=0)return w[P].move;return w[w.length-1].move}function Un(a,e,t,s,i,n=1){if(t.priority!==s.priority)return t.priority>s.priority?"player":"enemy";const r=_(a,"quick_claw"),o=_(e,"quick_claw");if(r&&Math.random()<.2)return"player";if(o&&Math.random()<.2)return"enemy";let l=Se(a,"speed"),c=Se(e,"speed");n!==1&&(c=Math.floor(c*n)),_(a,"quick_powder")&&(a.turnsInBattle??0)===0&&(l=Math.floor(l*1.25)),_(e,"quick_powder")&&(e.turnsInBattle??0)===0&&(c=Math.floor(c*1.25));const d=a.battleStatus==="paralysis"?Math.floor(l*.5):l,p=e.battleStatus==="paralysis"?Math.floor(c*.5):c;return d>p?"player":p>d?"enemy":Math.random()<.5?"player":"enemy"}function Wn(a){const e=[];let t=0;if(a.battleHp<=0)return{damage:t,log:e};switch(a.battleStatus){case"burn":{const s=Math.max(1,Math.floor(a.maxBattleHp/16));t=s,e.push({text:`${a.displayName} is hurt by its burn! (−${s} HP)`,type:"damage"});break}case"poison":{if(_(a,"toxic_orb")){const s=Math.max(1,Math.floor(a.maxBattleHp*.12));t=-s,e.push({text:`${a.displayName} recovered HP via Poison Heal! (+${s})`,type:"heal"})}else{const s=Math.max(1,Math.floor(a.maxBattleHp/8));t=s,e.push({text:`${a.displayName} is hurt by poison! (−${s} HP)`,type:"damage"})}break}case"badPoison":{if(_(a,"toxic_orb")){const s=Math.max(1,Math.floor(a.maxBattleHp*.12));t=-s,e.push({text:`${a.displayName} recovered HP via Poison Heal! (+${s})`,type:"heal"})}else{a.poisonCounter=(a.poisonCounter??1)+1;const s=Math.max(1,Math.floor(a.maxBattleHp*a.poisonCounter/16));t=s,e.push({text:`${a.displayName} is badly poisoned! (−${s} HP)`,type:"damage"})}break}case"sleep":{a.sleepTurns=(a.sleepTurns??1)+1,a.sleepTurns>=3&&(a.battleStatus=null,a.sleepTurns=0,e.push({text:`${a.displayName} woke up!`,type:"status"}));break}case"freeze":{Math.random()<.2&&(a.battleStatus=null,e.push({text:`${a.displayName} thawed out!`,type:"status"}));break}}return{damage:t,log:e}}function Kn(a){const e=[];let t=0;if(a.battleHp<=0)return{heal:t,log:e};for(const s of ut(a)){if(s.id==="leftovers"){const i=Math.max(1,Math.floor(a.maxBattleHp*.0625));a.battleHp<a.maxBattleHp&&(t+=i,e.push({text:`${a.displayName} restored HP with Leftovers! (+${i})`,type:"heal"}))}if(s.id==="black_sludge")if(a.types.includes("poison")){const i=Math.max(1,Math.floor(a.maxBattleHp*.0625));a.battleHp<a.maxBattleHp&&(t+=i,e.push({text:`${a.displayName} absorbed toxins! (+${i})`,type:"heal"}))}else{const i=Math.max(1,Math.floor(a.maxBattleHp*.0625));t-=i,e.push({text:`${a.displayName} is hurt by Black Sludge! (−${i})`,type:"damage"})}}return{heal:t,log:e}}function la(a,e,t,s){const i=[];let n=e,r=!1;const o=_(a,"focus_sash"),l=s.some(d=>d.id==="immortal_grit");if((o||l)&&!a.hasUsedFocusSash&&a.battleHp===a.maxBattleHp&&n>=a.battleHp&&(n=a.battleHp-1,a.hasUsedFocusSash=!0,o&&(a.focusSashBroken=!0),r=!0,i.push({text:`${a.displayName} held on with its Focus Sash!`,type:"system"})),a.battleHp=Math.max(0,a.battleHp-n),_(a,"oran_berry")&&!(a.usedBerries??[]).includes("oran_berry")&&a.battleHp>0&&a.battleHp/a.maxBattleHp<.4){const d=Math.max(1,Math.floor(a.maxBattleHp*.15));a.battleHp=Math.min(a.maxBattleHp,a.battleHp+d),a.usedBerries=[...a.usedBerries??[],"oran_berry"],i.push({text:`${a.displayName} ate its Oran Berry! (+${d} HP)`,type:"heal"})}if(_(a,"sitrus_berry")&&!(a.usedBerries??[]).includes("sitrus_berry")&&a.battleHp>0&&a.battleHp/a.maxBattleHp<.5){const d=Math.max(1,Math.floor(a.maxBattleHp*.25));a.battleHp=Math.min(a.maxBattleHp,a.battleHp+d),a.usedBerries=[...a.usedBerries??[],"sitrus_berry"],i.push({text:`${a.displayName} ate its Sitrus Berry! (+${d} HP)`,type:"heal"})}t&&Ft(t.type,a.types)>1&&_(a,"weakness_policy")&&(a.statStages.attack=Math.min(6,a.statStages.attack+2),a.statStages.spAtk=Math.min(6,a.statStages.spAtk+2),i.push({text:`${a.displayName}'s Weakness Policy activated! Atk and SpAtk rose sharply!`,type:"status"})),a.hasAirBalloon&&t&&(a.hasAirBalloon=!1,i.push({text:`${a.displayName}'s Air Balloon popped!`,type:"system"}));const c=a.battleHp<=0;if(c&&_(a,"revive_heart")&&!a.reviveHeartUsed){const d=Math.max(1,Math.floor(a.maxBattleHp*.3));return a.battleHp=d,a.reviveHeartUsed=!0,i.push({text:`${a.displayName}'s Revive Heart activated! It recovered ${d} HP!`,type:"heal"}),{actualDamage:n,fainted:!1,focusSashTriggered:r,log:i}}return c&&i.push({text:`${a.displayName} fainted!`,type:"system"}),{actualDamage:n,fainted:c,focusSashTriggered:r,log:i}}function zn(a,e,t){const s=[];if(t.bossBlind!=="the_tooth")return{healed:!1,log:s};if(t.toothHealedEnemies.includes(e))return{healed:!1,log:s};if(a.battleHp<=0)return{healed:!1,log:s};const i=a.battleHp/a.maxBattleHp;if(i>0&&i<=.5){const n=Math.floor(a.maxBattleHp*.5);return a.battleHp=Math.min(a.maxBattleHp,a.battleHp+n),t.toothHealedEnemies.push(e),s.push({text:`${a.displayName}'s tooth bites back! Healed ${n} HP!`,type:"heal"}),{healed:!0,log:s}}return{healed:!1,log:s}}function jn(a){const e=[];if(a.bossBlind!=="the_hook")return e;const t=a.playerTeam.filter(o=>{var l;return o.battleHp>0&&((l=o.itemSlots)==null?void 0:l.some(c=>c.unlocked&&c.item!==null))});if(t.length===0)return e;const s=t[Math.floor(Math.random()*t.length)],i=s.itemSlots.map((o,l)=>({s:o,i:l})).filter(o=>o.s.unlocked&&o.s.item!==null);if(i.length===0)return e;const n=i[Math.floor(Math.random()*i.length)],r=n.s.item;return s.itemSlots[n.i].item=null,n.i===0&&(s.heldItem=null),e.push({text:`The Hook snatches ${r.name} from ${s.displayName}!`,type:"system"}),e}function ye(a,e){var w,A;const t=(w=a.itemSlots)!=null&&w.length?a.itemSlots.map(x=>({...x,item:x.item?{...x.item}:null})):Ga(),s={...a,itemSlots:t},i=((A=t[0])==null?void 0:A.item)??null,n={...a.baseStats},r=e.reduce((x,T)=>T.effect.allStatsMultiplier?x*T.effect.allStatsMultiplier:x,1),o=e.reduce((x,T)=>{var P;return(P=T.effect.statMultiplier)!=null&&P.hp?x*T.effect.statMultiplier.hp:x},r),l=e.reduce((x,T)=>{var P;return(P=T.effect.statMultiplier)!=null&&P.speed?x*T.effect.statMultiplier.speed:x},r),c=e.reduce((x,T)=>{var P;return(P=T.effect.statMultiplier)!=null&&P.defense?x*T.effect.statMultiplier.defense:x},r),d=e.reduce((x,T)=>{var P;return(P=T.effect.statMultiplier)!=null&&P.spDef?x*T.effect.statMultiplier.spDef:x},r),p=!a.isFullyEvolved&&_(s,"eviolite"),u={hp:Math.floor(ae(n.hp,a.level,!0)*o),attack:Math.floor(ae(n.attack,a.level,!1)*r),defense:Math.floor(ae(n.defense,a.level,!1)*c*(p?1.5:1)),spAtk:Math.floor(ae(n.spAtk,a.level,!1)*r),spDef:Math.floor(ae(n.spDef,a.level,!1)*d*(p?1.5:1)),speed:Math.floor(ae(n.speed,a.level,!1)*l)};_(s,"choice_scarf")&&(u.speed=Math.floor(u.speed*1.5)),_(s,"choice_band")&&(u.attack=Math.floor(u.attack*1.5)),_(s,"choice_specs")&&(u.spAtk=Math.floor(u.spAtk*1.5)),_(s,"assault_vest")&&(u.spDef=Math.floor(u.spDef*1.5)),_(s,"mega_stone")&&(u.hp=Math.floor(u.hp*1.2)),_(s,"light_ball")&&a.bst<400&&(u.attack=u.attack*2,u.spAtk=u.spAtk*2);const h=e.find(x=>x.id==="item_maven");if(h!=null&&h.effect.itemMaven){const x=ut(s).length;if(x>0){const T=1+x*h.effect.itemMaven;u.hp=Math.floor(u.hp*T),u.attack=Math.floor(u.attack*T),u.defense=Math.floor(u.defense*T),u.spAtk=Math.floor(u.spAtk*T),u.spDef=Math.floor(u.spDef*T),u.speed=Math.floor(u.speed*T)}}const m=u.hp,v=a,g={...a,itemSlots:t,heldItem:i,battleHp:m,maxBattleHp:m,effectiveStats:u,statStages:{attack:0,defense:0,spAtk:0,spDef:0,speed:0,accuracy:0,evasion:0},battleStatus:null,battleStatusTurns:0,poisonCounter:1,isConfused:!1,confusionTurns:0,hasUsedFocusSash:!1,choiceLockedMove:null,hasUsedZMove:!1,hasAirBalloon:_(s,"air_balloon"),twoTurnMove:null,sleepTurns:0,moves:a.moves.map(x=>({...x})),xp:v.xp??0,xpToNextLevel:It(a.level),pendingEvolution:v.pendingEvolution??!1,usedBerries:v.usedBerries??[],sitrusBerryLastUsedWave:v.sitrusBerryLastUsedWave??0,focusSashBroken:!1,reviveHeartUsed:v.reviveHeartUsed??!1,leechSeedActive:_(s,"leech_seed"),momentumStacks:v.momentumStacks??0};return _(g,"flame_orb")?g.battleStatus="burn":_(g,"toxic_orb")&&(g.battleStatus="badPoison"),ri(g),g}function ca(a){if(a.battleStatus==="sleep")return{canMove:!1,reason:`${a.displayName} is fast asleep!`};if(a.battleStatus==="freeze")return{canMove:!1,reason:`${a.displayName} is frozen solid!`};if(a.battleStatus==="paralysis"&&Math.random()<.25)return{canMove:!1,reason:`${a.displayName} is paralyzed! It can't move!`};if(a.isConfused){if(a.confusionTurns++,a.confusionTurns>=5)return a.isConfused=!1,a.confusionTurns=0,{canMove:!0,reason:`${a.displayName} snapped out of confusion!`};if(Math.random()<.33)return{canMove:!1,reason:`${a.displayName} hurt itself in confusion!`}}return{canMove:!0,reason:""}}function St(a,e){const t=a.battleHp;return a.battleHp=Math.min(a.maxBattleHp,a.battleHp+e),a.battleHp-t}function It(a){return Math.floor(Math.pow(a,1.5)*10)}function Vn(a){return Math.floor(a*55)}function da(a,e,t){a.xp+=e;let s=!1;for(;a.xp>=a.xpToNextLevel&&a.level<100;){a.xp-=a.xpToNextLevel,a.level++,a.xpToNextLevel=It(a.level),s=!0;const i=a.baseStats,n=t.reduce((c,d)=>d.effect.allStatsMultiplier?c*d.effect.allStatsMultiplier:c,1),r={hp:Math.floor(ae(i.hp,a.level,!0)*n),attack:Math.floor(ae(i.attack,a.level,!1)*n),defense:Math.floor(ae(i.defense,a.level,!1)*n),spAtk:Math.floor(ae(i.spAtk,a.level,!1)*n),spDef:Math.floor(ae(i.spDef,a.level,!1)*n),speed:Math.floor(ae(i.speed,a.level,!1)*n)},o=a.maxBattleHp,l=Math.max(0,r.hp-o);a.effectiveStats=r,a.maxBattleHp=r.hp,a.battleHp=Math.min(a.maxBattleHp,a.battleHp+l),ri(a)}return{leveledUp:s,newLevel:a.level}}function ri(a){const e=[0,10,25,50,80],t=[];if(!a.itemSlots)return t;for(let s=0;s<a.itemSlots.length&&s<e.length;s++){const i=a.itemSlots[s];!i.unlocked&&a.level>=e[s]&&(i.unlocked=!0,t.push(s))}return t}const cs=[{id:"double_coins",name:"Double Coins",icon:"¢",color:"#d4a014",description:"Coins earned from this wave are doubled."},{id:"rare_tag",name:"Rare Tag",icon:"◈",color:"#60a5fa",description:"All rewards from this wave are at least Rare."},{id:"investment",name:"Investment",icon:"†",color:"#7a8a4a",description:"Earn +25¢ per wave until your next boss clear."},{id:"speed_tag",name:"Speed Tag",icon:"›",color:"#0ea5e9",description:"Win this wave in 5 turns or less for +100¢."},{id:"orbit_tag",name:"Orbit Tag",icon:"◇",color:"#a855f7",description:"All team members gain +3 levels at wave end."},{id:"boss_tag",name:"Boss Tag",icon:"◆",color:"#b71c1c",description:"Next boss drops 2 reward cards instead of 1."},{id:"charm_tag",name:"Charm Tag",icon:"♧",color:"#ec4899",description:"Free Master Ball Pouch at the next shop."},{id:"voucher_tag",name:"Voucher Tag",icon:"◉",color:"#f59e0b",description:"Next shop guaranteed to have a voucher."}];function Yn(a){return cs.find(e=>e.id===a)}function Xn(a=[]){const e=cs.filter(s=>!a.includes(s.id)),t=e.length?e:cs;return t[Math.floor(Math.random()*t.length)]}const oi="pokerun_accounts",$s="pokerun_session",pa="pokerun_last_guest_username";async function li(a){const e=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(a));return Array.from(new Uint8Array(e)).map(t=>t.toString(16).padStart(2,"0")).join("")}function ci(){try{const a=localStorage.getItem(oi);return a?JSON.parse(a):[]}catch{return[]}}function Jn(a){localStorage.setItem(oi,JSON.stringify(a))}function xs(){try{const a=localStorage.getItem($s);return a?JSON.parse(a):null}catch{return null}}function Zn(){localStorage.removeItem($s)}function Ms(a){try{localStorage.setItem($s,JSON.stringify(a))}catch{}}async function Qn(a,e){const t=a.trim().slice(0,20);if(t.length<2)return{ok:!1,error:"Username must be at least 2 characters."};if(e.length<4)return{ok:!1,error:"Password must be at least 4 characters."};const s=ci();if(s.some(n=>n.username.toLowerCase()===t.toLowerCase()))return{ok:!1,error:"Username already taken."};const i=await li(t.toLowerCase()+":"+e);return s.push({username:t,passwordHash:i,createdAt:new Date().toISOString()}),Jn(s),Ms({username:t,isGuest:!1}),{ok:!0}}async function er(a,e){const t=a.trim();if(!t||!e)return{ok:!1,error:"Please enter username and password."};const i=ci().find(r=>r.username.toLowerCase()===t.toLowerCase());return i?await li(t.toLowerCase()+":"+e)!==i.passwordHash?{ok:!1,error:"Wrong password."}:(Ms({username:i.username,isGuest:!1}),{ok:!0}):{ok:!1,error:"Username not found."}}function tr(){let a,e=null;try{e=localStorage.getItem(pa)}catch{}if(e&&/^Guest_[A-Z0-9]{4}$/.test(e))a=e;else{a=`Guest_${Math.random().toString(36).slice(2,6).toUpperCase()}`;try{localStorage.setItem(pa,a)}catch{}}return Ms({username:a,isGuest:!0}),a}function oe(a,e=.4){return O.fromTo(a,{opacity:0,y:20},{opacity:1,y:0,duration:e,ease:"power2.out",clearProps:"transform"})}function Ye(a,e,t="damage"){const s=document.createElement("div");s.className="damage-number battle-vfx";const i={damage:"#b4352a",heal:"#5f7a3a",super_effective:"#c9962b",not_effective:"#8a7e6b",miss:"#8a7e6b",immune:"#8a7e6b",critical:"#7a3a9a"},n=t==="critical",r=t==="super_effective";typeof e=="number"?s.textContent=t==="heal"?`+${e}`:`-${e}`:s.textContent=e,s.style.color=i[t],(n||r)&&(s.style.fontSize="1.35rem");const o=a.getBoundingClientRect();s.style.position="fixed",s.style.left=`${o.left+o.width/2}px`,s.style.top=`${o.top+o.height*.2}px`,s.style.transform="translateX(-50%)",s.style.zIndex="9999",s.style.pointerEvents="none",document.body.appendChild(s),O.fromTo(s,{y:0,opacity:1,scale:n?1.5:1.2},{y:-90,opacity:0,scale:.9,duration:1.4,ease:"power2.out",onComplete:()=>s.remove()})}function Ie(a,e,t,s,i=!0){const n=Math.max(0,Math.min(100,t/s*100));i?O.to(a,{width:`${n}%`,duration:.5,ease:"power2.out"}):a.style.width=`${n}%`;let r;n>50?r="var(--hp-high)":n>25?r="var(--hp-mid)":r="var(--hp-low)",a.style.background=r,e&&(e.textContent=`${Math.max(0,t)}/${s}`)}function sr(a,e){const t=e==="right"?36:-36;return new Promise(s=>{const i=setTimeout(s,800);O.timeline({onComplete:()=>{clearTimeout(i),s()}}).to(a,{x:-t*.2,duration:.07,ease:"power2.out"}).to(a,{x:t,duration:.11,ease:"power3.in"}).to(a,{x:0,duration:.28,ease:"elastic.out(1.4, 0.35)"})})}function ua(a){return new Promise(e=>{const t=setTimeout(e,800);O.timeline({onComplete:()=>{clearTimeout(t),e()}}).to(a,{opacity:.1,duration:.07}).to(a,{opacity:1,duration:.07}).to(a,{opacity:.1,duration:.07}).to(a,{opacity:1,duration:.07}).to(a,{opacity:.1,duration:.05}).to(a,{opacity:1,duration:.07})})}function ha(a){return new Promise(e=>{const t=setTimeout(e,1200);O.timeline({onComplete:()=>{clearTimeout(t),e()}}).to(a,{y:10,duration:.15,ease:"power2.in"}).to(a,{y:100,opacity:0,rotation:-15,duration:.55,ease:"power3.in"})})}function Zt(a,e=!1){const t=e?-1:1;return O.fromTo(a,{y:60,opacity:0,scaleX:e?-.8:.8,scaleY:.8},{y:0,opacity:1,scaleX:t,scaleY:1,duration:.45,ease:"back.out(1.7)"})}function ar(a){return new Promise(e=>{if(a.length===0){e();return}const t=130,s=560;a.forEach((n,r)=>{n.style.animationDelay=`${r*t}ms`,n.classList.add("card-dealing")});const i=(a.length-1)*t+s+40;setTimeout(e,i)})}function te(a,e,t){const s={value:e};O.to(s,{value:t,duration:.8,ease:"power2.out",onUpdate:()=>{a.textContent=Math.floor(s.value).toLocaleString()}}),O.fromTo(a,{scale:1.3,color:"#ffd700"},{scale:1,color:"",duration:.6,ease:"elastic.out(1, 0.5)"})}function ma(a){O.fromTo(a,{x:-10},{x:0,duration:.5,ease:"elastic.out(6, 0.3)"})}function Qt(a,e="#f59e0b"){O.fromTo(a,{boxShadow:`0 0 30px ${e}`},{boxShadow:"0 0 0px transparent",duration:.9,ease:"power2.out"})}function ir(a,e){const t=e!=null&&e.hasTag?2.4:.55,s=e!=null&&e.hasTag?5200:3e3;return new Promise(i=>{const n=setTimeout(i,s);O.timeline({onComplete:()=>{clearTimeout(n),i()}}).fromTo(a,{scale:2.5,opacity:0},{scale:1,opacity:1,duration:.5,ease:"power3.out"}).to(a,{scale:1.04,duration:.18}).to(a,{scale:1,duration:.18}).to(a,{opacity:0,y:-30,delay:t,duration:.3,ease:"power2.in"})})}function nr(a,e){return new Promise(t=>{const s=document.createElement("div");s.className="boss-warn-overlay";const i=e??"#a32323";s.innerHTML=`
      <div class="bw-scanlines" style="--bw-color:${i}"></div>
      <div class="bw-vignette"></div>
      <div class="bw-stripes"></div>
      <div class="bw-center">
        <div class="bw-warn-row">
          <span class="bw-tri">◤</span>
          <span class="bw-text">WARNING</span>
          <span class="bw-tri bw-tri-r">◥</span>
        </div>
        <div class="bw-sub">Boss encounter approaching</div>
        ${a?`<div class="bw-blind" style="--bw-color:${i}">${a}</div>`:""}
        <div class="bw-dots"><i></i><i></i><i></i></div>
      </div>
    `,document.body.appendChild(s);const n=()=>{s.remove(),t()},r=setTimeout(n,2600);O.timeline({onComplete:()=>{clearTimeout(r),n()}}).fromTo(s,{opacity:0},{opacity:1,duration:.18,ease:"power2.out"}).fromTo(s.querySelector(".bw-center"),{scale:.6,opacity:0,y:30},{scale:1,opacity:1,y:0,duration:.35,ease:"back.out(2)"},"-=0.05").to(s.querySelector(".bw-text"),{x:"+=4",yoyo:!0,repeat:7,duration:.05,ease:"none"}).to(s,{opacity:0,duration:.3,ease:"power2.in"},"+=1.1")})}const rr={fire:"#c84a1a",water:"#2b5fa8",grass:"#5f7a3a",electric:"#d4a312",ice:"#6a9ebd",psychic:"#c74a7a",ghost:"#4a3a7a",dragon:"#3a4a9a",dark:"#3a2e22",fighting:"#a64223",poison:"#7a3a9a",rock:"#8a7a4a",ground:"#a6753a",steel:"#7a8090",fairy:"#c47090",bug:"#8a9a3a",flying:"#7a8ab0",normal:"#8a7e6b"},or={leaf:"polygon(50% 0%, 100% 35%, 80% 100%, 50% 90%, 20% 100%, 0% 35%)",vine:"polygon(0% 40%, 60% 0%, 100% 30%, 80% 100%, 30% 90%)",ember:"polygon(50% 0%, 90% 30%, 80% 70%, 100% 100%, 50% 80%, 0% 100%, 20% 70%, 10% 30%)",droplet:"polygon(50% 0%, 90% 50%, 80% 100%, 20% 100%, 10% 50%)",flake:"polygon(45% 0%, 55% 0%, 55% 35%, 100% 35%, 100% 55%, 55% 65%, 55% 100%, 45% 100%, 45% 65%, 0% 55%, 0% 45%, 45% 35%)",sparkle:"polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)",chunk:"polygon(20% 0%, 80% 10%, 100% 50%, 80% 100%, 30% 90%, 0% 60%)",shard:"polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",feather:"polygon(0% 50%, 30% 0%, 70% 20%, 100% 50%, 70% 80%, 30% 100%)",wisp:"polygon(20% 0%, 80% 20%, 100% 60%, 70% 100%, 30% 90%, 0% 50%)",bubble:"polygon(50% 0%, 80% 20%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 20%)",gear:"polygon(40% 0%, 60% 0%, 70% 20%, 100% 30%, 100% 70%, 70% 80%, 60% 100%, 40% 100%, 30% 80%, 0% 70%, 0% 30%, 30% 20%)",fist:"polygon(20% 10%, 80% 10%, 90% 40%, 100% 50%, 90% 60%, 80% 90%, 20% 90%, 10% 60%, 0% 50%, 10% 40%)",claw:"polygon(0% 0%, 30% 10%, 60% 30%, 100% 80%, 90% 100%, 60% 80%, 30% 50%, 10% 30%)",star:"polygon(50% 0%, 62% 35%, 100% 38%, 70% 60%, 80% 100%, 50% 76%, 20% 100%, 30% 60%, 0% 38%, 38% 35%)",spark:"polygon(50% 0%, 55% 45%, 100% 50%, 55% 55%, 50% 100%, 45% 55%, 0% 50%, 45% 45%)"},fa={grass:{shape:"leaf",count:5,size:[10,16],arcHeight:70,staggerMs:28,spinDeg:220,travelMs:360},fire:{shape:"ember",count:6,size:[10,14],arcHeight:50,staggerMs:22,spinDeg:360,travelMs:320},water:{shape:"droplet",count:5,size:[9,13],arcHeight:55,staggerMs:24,spinDeg:90,travelMs:320},ice:{shape:"flake",count:5,size:[10,14],arcHeight:60,staggerMs:26,spinDeg:360,travelMs:360},electric:{shape:"spark",count:0,size:[0,0],arcHeight:0,staggerMs:0,spinDeg:0,travelMs:0,strike:"lightning"},psychic:{shape:"star",count:0,size:[0,0],arcHeight:0,staggerMs:0,spinDeg:0,travelMs:0,strike:"pulse"},ghost:{shape:"wisp",count:4,size:[12,18],arcHeight:80,staggerMs:36,spinDeg:90,travelMs:420},dragon:{shape:"claw",count:3,size:[16,22],arcHeight:35,staggerMs:18,spinDeg:0,travelMs:280},dark:{shape:"chunk",count:5,size:[10,14],arcHeight:30,staggerMs:22,spinDeg:180,travelMs:320},fighting:{shape:"fist",count:3,size:[16,22],arcHeight:20,staggerMs:14,spinDeg:0,travelMs:240},poison:{shape:"bubble",count:5,size:[9,14],arcHeight:65,staggerMs:26,spinDeg:60,travelMs:360},rock:{shape:"chunk",count:4,size:[12,18],arcHeight:90,staggerMs:24,spinDeg:270,travelMs:380},ground:{shape:"chunk",count:4,size:[12,18],arcHeight:30,staggerMs:20,spinDeg:200,travelMs:320},steel:{shape:"gear",count:4,size:[11,15],arcHeight:28,staggerMs:18,spinDeg:360,travelMs:280},fairy:{shape:"sparkle",count:6,size:[9,13],arcHeight:45,staggerMs:22,spinDeg:180,travelMs:360},bug:{shape:"shard",count:5,size:[8,12],arcHeight:25,staggerMs:16,spinDeg:360,travelMs:260},flying:{shape:"feather",count:4,size:[12,18],arcHeight:50,staggerMs:24,spinDeg:120,travelMs:320},normal:{shape:"shard",count:4,size:[10,14],arcHeight:30,staggerMs:18,spinDeg:180,travelMs:280}};function lr(a,e){return a+Math.random()*(e-a)}function cr(a,e,t,s,i,n,r,o,l){const c=s-e,d=i-t,p=Math.hypot(c,d)||1;let u=-d/p,h=c/p;h>0&&(u=-u,h=-h);const m=(e+s)/2+u*n,v=(t+i)/2+h*n,g=(Math.random()-.5)*60;return new Promise(w=>{const A={t:0};O.to(A,{t:1,duration:r/1e3,delay:l/1e3,ease:"power1.inOut",onUpdate:()=>{const x=A.t,T=1-x,P=T*T*e+2*T*x*m+x*x*s,I=T*T*t+2*T*x*v+x*x*i;a.style.left=`${P}px`,a.style.top=`${I}px`,a.style.transform=`translate(-50%,-50%) rotate(${g+o*x}deg)`},onComplete:w})})}function di(a,e,t,s,i,n){const r=document.createElement("div");return r.className="battle-vfx pixel-vfx",r.style.cssText=`
    position: fixed;
    left: ${e}px;
    top: ${t}px;
    width: ${s}px;
    height: ${s}px;
    transform: translate(-50%,-50%);
    background: ${i};
    clip-path: ${or[a]};
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    box-shadow: inset 0 0 0 1px ${n};
    z-index: 9998;
    pointer-events: none;
  `,document.body.appendChild(r),r}function dr(a,e,t,s){const i=document.createElement("div");i.className="battle-vfx",i.style.cssText=`
    position: fixed;
    left: ${a}px; top: ${e}px;
    width: 24px; height: 24px;
    transform: translate(-50%,-50%) scale(0.4);
    border: 4px solid ${t};
    box-sizing: border-box;
    border-radius: 0;
    z-index: 9996;
    pointer-events: none;
  `,document.body.appendChild(i),O.to(i,{scale:3.6,opacity:0,duration:.36,ease:"power2.out",onComplete:()=>i.remove()});const n=8;return new Promise(r=>{let o=0;for(let l=0;l<n;l++){const c=l/n*Math.PI*2+(Math.random()-.5)*.3,d=32+Math.random()*36,p=6+Math.random()*4,u=di("shard",a,e,p,t,s);O.to(u,{x:Math.cos(c)*d,y:Math.sin(c)*d,opacity:0,scale:.4,duration:.34+Math.random()*.14,ease:"power2.out",onComplete:()=>{u.remove(),++o===n&&r()}})}})}function pr(a,e,t){const s=document.createElement("div");s.className="battle-vfx",s.style.cssText=`
    position: fixed;
    left: ${a}px;
    top: ${e-260}px;
    width: 60px;
    height: 280px;
    transform: translate(-50%, 0) scaleY(0);
    transform-origin: 50% 0%;
    background: ${t};
    clip-path: polygon(
      55% 0%,  60% 18%,  44% 22%,  60% 38%,  46% 44%,
      62% 60%,  46% 66%,  60% 80%,  40% 86%,  56% 100%,
      70% 86%,  74% 76%,  64% 64%,  78% 56%,  64% 42%,
      78% 36%,  64% 22%,  76% 14%
    );
    image-rendering: pixelated;
    z-index: 9999;
    pointer-events: none;
  `,document.body.appendChild(s);const i=document.createElement("div");return i.className="battle-vfx",i.style.cssText=`
    position: fixed;
    left: ${a}px;
    top: ${e-260}px;
    width: 30px;
    height: 280px;
    transform: translate(-50%, 0) scaleY(0);
    transform-origin: 50% 0%;
    background: #fff;
    clip-path: polygon(
      55% 0%,  60% 18%,  44% 22%,  60% 38%,  46% 44%,
      62% 60%,  46% 66%,  60% 80%,  40% 86%,  56% 100%,
      66% 86%,  74% 76%,  64% 64%,  78% 56%,  64% 42%,
      72% 36%,  64% 22%,  76% 14%
    );
    image-rendering: pixelated;
    z-index: 10000;
    pointer-events: none;
  `,document.body.appendChild(i),new Promise(n=>{O.timeline({onComplete:()=>{s.remove(),i.remove(),n()}}).to([s,i],{scaleY:1,duration:.05,ease:"none"}).to([s,i],{opacity:0,duration:.16,delay:.04,ease:"power2.out"}),ds(t,.12)})}function ur(a,e,t,s){const n=[];for(let r=0;r<3;r++){const o=document.createElement("div");o.className="battle-vfx",o.style.cssText=`
      position: fixed;
      left: ${a}px; top: ${e}px;
      width: 30px; height: 30px;
      transform: translate(-50%,-50%) scale(0.3);
      border: 4px solid ${t};
      box-shadow: inset 0 0 0 1px ${s};
      z-index: 9996;
      pointer-events: none;
    `,document.body.appendChild(o),n.push(new Promise(l=>{O.to(o,{scale:2.8+r*.6,opacity:0,duration:.42,delay:r*.08,ease:"power2.out",onComplete:()=>{o.remove(),l()}})}))}return Promise.all(n).then(()=>{})}function hr(a,e,t,s){const i=rr[a]??"#5a4f42",n="#1a1612",r=e.closest(".battle-sprite-slot")??e,o=t.closest(".battle-sprite-slot")??t,l=r.getBoundingClientRect(),c=o.getBoundingClientRect(),d=l.left+l.width/2,p=l.top+l.height/2,u=c.left+c.width/2,h=c.top+c.height/2,m=u-d,v=h-p,g=Math.hypot(m,v)||1,w=Math.min(50,l.width*.3),A=d+m/g*w,x=p+v/g*w,T=fa[a]??fa.normal,P=e.closest(".battle-field");return new Promise(I=>{const C=setTimeout(I,1600),L=()=>{clearTimeout(C),I()};s&&s.classList.add("is-attacking"),O.to(e,{scale:1.14,duration:.08,ease:"steps(2)",onComplete:()=>O.to(e,{scale:1,duration:.1,ease:"steps(2)"})});const S=()=>{s&&s.classList.remove("is-attacking"),P&&O.fromTo(P,{x:-3},{x:0,duration:.4,ease:"elastic.out(2, 0.35)"});let $;T.strike==="lightning"?$=pr(u,h,i):T.strike==="pulse"?$=ur(u,h,i,n):$=dr(u,h,i,n),$.then(L)};if(T.strike){S();return}const E=[];for(let $=0;$<T.count;$++){const H=lr(T.size[0],T.size[1]),W=di(T.shape,A,x,H,i,n),K=(Math.random()-.5)*Math.min(40,c.width*.4),N=(Math.random()-.5)*Math.min(36,c.height*.4),z=T.arcHeight+(Math.random()-.5)*T.arcHeight*.4,j=T.travelMs+(Math.random()-.5)*80;E.push(cr(W,A,x,u+K,h+N,z,j,T.spinDeg,$*T.staggerMs).then(()=>{O.to(W,{opacity:0,scale:.6,duration:.16,ease:"power2.out",onComplete:()=>W.remove()})}))}const y=Math.max(180,T.travelMs-80);setTimeout(S,y),Promise.all(E).then(()=>{})})}function ds(a="#ffffff",e=.15){const t=document.createElement("div");t.className="battle-flash-overlay battle-vfx",t.style.cssText=`
    position: fixed;
    inset: 0;
    background: ${a};
    opacity: 0;
    z-index: 9995;
    pointer-events: none;
  `,document.body.appendChild(t),O.timeline({onComplete:()=>t.remove()}).to(t,{opacity:e,duration:.05}).to(t,{opacity:0,duration:.25,ease:"power2.out"})}function B(a,e="info"){const t=document.getElementById("toast-container");if(!t)return;const s=document.createElement("div");s.className=`toast toast-${e}`,s.textContent=a,t.appendChild(s),O.fromTo(s,{y:24,opacity:0},{y:0,opacity:.94,duration:.25,ease:"back.out(1.4)"}),setTimeout(()=>{O.to(s,{y:24,opacity:0,duration:.2,ease:"power2.in",onComplete:()=>s.remove()})},1800)}const va=24,mr=/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g,fr=/[\u0000-\u001F\u007F]/g;function ya(a){if(typeof a!="string")return"";let e=a.replace(fr,"").replace(mr,"").replace(/\s+/g," ").trim();return e=e.replace(/[^\p{L}\p{M}\p{N} _.\-']/gu,""),e.length>va&&(e=e.slice(0,va)),e}function D(a){return a==null?"":String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function vr(a){try{const e=new URL(a,window.location.origin);return e.protocol!=="http:"&&e.protocol!=="https:"?"":e.toString()}catch{return""}}class yr{constructor(e,t){b(this,"container");b(this,"onAuth");b(this,"activeTab","signin");this.container=e,this.onAuth=t}mount(){const e=xs();if(e){this.onAuth(e.username,e.isGuest);return}this.container.innerHTML=this.renderHTML(),this.container.style.display="",oe(this.container),this.attachEvents()}renderHTML(){return`
      <div class="auth-screen screen">
        <div class="auth-card">
          <div class="auth-eyebrow">Issue 001 · Trainer HQ</div>
          <h1 class="auth-title">TRAINER<br><em>HEAD&shy;QUARTERS</em></h1>

          <!-- Tab strip -->
          <div class="auth-tabs">
            <button class="auth-tab active" data-tab="signin">Sign In</button>
            <button class="auth-tab" data-tab="register">Register</button>
          </div>

          <!-- Error -->
          <div class="auth-error" id="auth-error"></div>

          <!-- Form -->
          <form class="auth-form" id="auth-form" autocomplete="off" novalidate>
            <div class="auth-field">
              <label class="auth-label" for="auth-username">Trainer Name</label>
              <input
                class="auth-input"
                id="auth-username"
                type="text"
                placeholder="Your username…"
                maxlength="24"
                minlength="2"
                pattern="[p{L}p{N} _.-']{2,24}"
                inputmode="text"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                required
              />
            </div>
            <div class="auth-field">
              <label class="auth-label" for="auth-password">Password</label>
              <input
                class="auth-input"
                id="auth-password"
                type="password"
                placeholder="••••••••"
                maxlength="64"
                autocomplete="current-password"
              />
            </div>
            <div class="auth-field" id="confirm-field" style="display:none">
              <label class="auth-label" for="auth-confirm">Confirm Password</label>
              <input
                class="auth-input"
                id="auth-confirm"
                type="password"
                placeholder="••••••••"
                maxlength="64"
                autocomplete="new-password"
              />
            </div>

            <button type="submit" class="ink-btn primary auth-submit" id="auth-submit">
              Sign In →
            </button>
          </form>

          <!-- Guest divider -->
          <div class="auth-divider">or</div>
          <button class="ink-btn ghost auth-guest" id="guest-btn">
            Play as Guest →
          </button>

          <div class="auth-footer-note">Guest scores are not saved globally</div>
        </div>
      </div>
    `}attachEvents(){const e=this.container.querySelector("#auth-form"),t=this.container.querySelector("#auth-username"),s=this.container.querySelector("#auth-password"),i=this.container.querySelector("#auth-confirm"),n=this.container.querySelector("#confirm-field"),r=this.container.querySelector("#auth-submit"),o=this.container.querySelector("#auth-error"),l=this.container.querySelector("#guest-btn"),c=p=>{o.textContent=p,o.classList.add("visible")},d=()=>o.classList.remove("visible");this.container.querySelectorAll(".auth-tab").forEach(p=>{p.addEventListener("click",()=>{const u=p.dataset.tab;this.activeTab=u,this.container.querySelectorAll(".auth-tab").forEach(h=>h.classList.toggle("active",h===p)),n.style.display=u==="register"?"":"none",r.textContent=u==="register"?"Create Account →":"Sign In →",d(),t.focus()})}),e.addEventListener("submit",async p=>{p.preventDefault(),d();const u=ya(t.value),h=s.value,m=i.value;if(u.length<2){c("Username must be at least 2 characters (letters / numbers / spaces).");return}if(this.activeTab==="register"&&h.length<6){c("Password must be at least 6 characters.");return}r.disabled=!0;const v=r.textContent;r.textContent="…";try{if(this.activeTab==="register"){if(h!==m){c("Passwords do not match.");return}const g=await Qn(u,h);if(!g.ok){c(g.error);return}this.onAuth(u,!1)}else{const g=await er(u,h);if(!g.ok){c(g.error);return}this.onAuth(u,!1)}}finally{r.disabled=!1,r.textContent=v??""}}),l.addEventListener("click",()=>{const p=tr();this.onAuth(ya(p),!0)}),setTimeout(()=>t.focus(),80)}unmount(){this.container.style.display="none",this.container.innerHTML=""}}const Ts="pokerun:tutorialSeen:v1";function pi(){try{const a=localStorage.getItem(Ts);if(!a)return new Set;const e=JSON.parse(a);return new Set(Array.isArray(e)?e.map(String):[])}catch{return new Set}}function gr(a){try{localStorage.setItem(Ts,JSON.stringify(Array.from(a)))}catch{}}function Ps(a){return pi().has(a)}function Ls(a){const e=pi();e.has(a)||(e.add(a),gr(e))}function br(){try{localStorage.removeItem(Ts)}catch{}}function kr(a,e){var i;if(Ps(a))return;const t=document.createElement("div");t.className="coachmark-overlay",t.innerHTML=`
    <div class="coachmark-card" role="dialog" aria-label="${e.title}">
      <div class="coachmark-eyebrow">${e.eyebrow}</div>
      <h3 class="coachmark-title">${e.title}</h3>
      <p class="coachmark-body">${e.body}</p>
      <button type="button" class="ink-btn primary coachmark-cta">${e.cta??"Got it →"}</button>
    </div>
  `,document.body.appendChild(t);const s=()=>{Ls(a),t.classList.add("closing"),window.setTimeout(()=>t.remove(),200)};(i=t.querySelector(".coachmark-cta"))==null||i.addEventListener("click",s),t.addEventListener("click",n=>{n.target===t&&s()})}let ui=!1;function ps(a){ui=a}function Sr(){return ui}const _s="tour";let R=null;function hi(){return R!=null}function At(a="completed"){var s,i,n;if(!R)return;a==="completed"&&Ls(_s);const e=R.steps[R.index];(s=e==null?void 0:e.onExit)==null||s.call(e),ps(!1),(i=R.cleanupAnchorListener)==null||i.call(R),window.removeEventListener("resize",R.onResize),window.removeEventListener("scroll",R.onResize,!0),R.overlay.classList.add("closing");const t=R;window.setTimeout(()=>t.overlay.remove(),200),R=null,(n=t.onComplete)==null||n.call(t)}function wr(){try{const a="pokerun:tutorialSeen:v1",e=localStorage.getItem(a);if(!e)return;const t=JSON.parse(e),s=Array.isArray(t)?t.filter(i=>i!==_s):[];localStorage.setItem(a,JSON.stringify(s))}catch{}}async function $r(a,e={}){if(R||!e.force&&Ps(_s))return;const t=document.createElement("div");t.className="tour-overlay",t.innerHTML=`
    <div class="tour-spotlight"></div>
    <div class="tour-card" role="dialog" aria-live="polite">
      <div class="tour-card-arrow" aria-hidden="true"></div>
      <div class="tour-card-head">
        <span class="tour-eyebrow"></span>
        <span class="tour-progress"></span>
      </div>
      <h3 class="tour-title"></h3>
      <p class="tour-body"></p>
      <div class="tour-actions">
        <button type="button" class="ink-btn ghost sm tour-skip">Skip tour</button>
        <button type="button" class="ink-btn primary tour-next">Next ›</button>
      </div>
    </div>
  `,document.body.appendChild(t);const s=t.querySelector(".tour-spotlight"),i=t.querySelector(".tour-card");R={steps:a,index:0,overlay:t,spotlight:s,card:i,onResize:()=>fi(),cleanupAnchorListener:null,onComplete:e.onComplete},t.querySelector(".tour-skip").addEventListener("click",()=>At("skipped")),t.querySelector(".tour-next").addEventListener("click",yi),window.addEventListener("resize",R.onResize),window.addEventListener("scroll",R.onResize,!0),await mi()}async function mi(){var n,r;if(!R)return;const a=R.steps[R.index];if(!a){At("completed");return}ga(!0);const e=await Mr(a);if(!R)return;if(!e){At("completed");return}if(await new Promise(o=>requestAnimationFrame(()=>requestAnimationFrame(()=>o(null)))),!R)return;ga(!1),(n=R.cleanupAnchorListener)==null||n.call(R),R.cleanupAnchorListener=null;const t=R.card;t.querySelector(".tour-eyebrow").textContent=a.eyebrow,t.querySelector(".tour-progress").textContent=`${R.index+1} / ${R.steps.length}`,t.querySelector(".tour-title").textContent=a.title,t.querySelector(".tour-body").innerHTML=a.body;const s=t.querySelector(".tour-next"),i=R.index===R.steps.length-1;if(s.textContent=a.advanceOnClick?"— do the action —":a.cta??(i?"Got it →":"Next ›"),s.disabled=!!a.advanceOnClick,a.advanceOnClick){const o=()=>yi();e.addEventListener("click",o,{once:!0}),R.cleanupAnchorListener=()=>e.removeEventListener("click",o)}(r=a.onEnter)==null||r.call(a),fi();try{e.scrollIntoView({block:"center",inline:"center",behavior:"smooth"})}catch{}}function fi(){if(!R)return;const a=R.steps[R.index],e=vi(a);if(!e)return;const t=e.getBoundingClientRect(),s=a.pad??8,i=R.spotlight;i.style.top=`${t.top-s}px`,i.style.left=`${t.left-s}px`,i.style.width=`${t.width+s*2}px`,i.style.height=`${t.height+s*2}px`;const n=R.card;n.classList.remove("pos-top","pos-bottom","pos-left","pos-right","mobile-sheet");const r=window.innerWidth,o=window.innerHeight;if(r<=600){const w=t.top+t.height/2>o/2;n.classList.add("mobile-sheet",w?"pos-top":"pos-bottom"),n.style.top="",n.style.left="";return}const l=a.position&&a.position!=="auto"?a.position:xr(t,r,o);n.classList.add(`pos-${l}`);const c=n.getBoundingClientRect(),d=c.width||320,p=c.height||160,u=18;let h=0,m=0;switch(l){case"top":h=t.top-p-u,m=t.left+t.width/2-d/2;break;case"bottom":h=t.bottom+u,m=t.left+t.width/2-d/2;break;case"left":h=t.top+t.height/2-p/2,m=t.left-d-u;break;case"right":h=t.top+t.height/2-p/2,m=t.right+u;break}const v=12;m=Math.max(v,Math.min(r-d-v,m)),h=Math.max(v,Math.min(o-p-v,h)),n.style.top=`${h}px`,n.style.left=`${m}px`}function ga(a){R&&(R.card.style.visibility=a?"hidden":"",R.spotlight.style.visibility=a?"hidden":"")}function xr(a,e,t){const s={top:a.top,bottom:t-a.bottom,left:a.left,right:e-a.right},i=Object.entries(s);return i.sort((n,r)=>r[1]-n[1]),i[0][0]}function vi(a){return typeof a.anchor=="function"?a.anchor():document.querySelector(a.anchor)}function Mr(a){const e=a.waitMs??4e3;return new Promise(t=>{const s=Date.now(),i=()=>{const n=vi(a);if(n){t(n);return}if(Date.now()-s>e){t(null);return}window.requestAnimationFrame(i)};i()})}function yi(){var e;if(!R)return;const a=R.steps[R.index];if((e=a==null?void 0:a.onExit)==null||e.call(a),R.index+=1,R.index>=R.steps.length){At("completed");return}mi()}const Tr={male:"https://play.pokemonshowdown.com/sprites/trainers/red.png",female:"https://play.pokemonshowdown.com/sprites/trainers/leaf-gen3.png"},ba={male:"Red",female:"Leaf"};function us(a){return Tr[a]}const Pr="pokerun:save:v1";function Bs(){const a=xs(),e=a?`${a.isGuest?"guest":"user"}:${a.username.toLowerCase()}`:"anon";return`${Pr}:${e}`}let Le=null,_e=null;function gi(a){try{const e={savedAt:Date.now(),state:a};localStorage.setItem(Bs(),JSON.stringify(e))}catch(e){console.warn("[saveRun] failed to persist:",e)}}function xe(a){a.phase==="gameover"||a.phase==="leaderboard"||a.phase==="start"||(_e=a,Le!=null&&window.clearTimeout(Le),Le=window.setTimeout(()=>{_e&&gi(_e),Le=null,_e=null},400))}function ka(){Le!=null&&window.clearTimeout(Le),_e&&gi(_e),Le=null,_e=null}typeof window<"u"&&(window.addEventListener("beforeunload",ka),window.addEventListener("pagehide",ka));function Ht(){try{const a=localStorage.getItem(Bs());if(!a)return null;const e=JSON.parse(a);return!(e!=null&&e.state)||typeof e.savedAt!="number"||!Array.isArray(e.state.team)||e.state.team.length===0?null:e}catch(a){return console.warn("[loadRun] failed to parse save:",a),null}}function hs(){try{localStorage.removeItem(Bs())}catch{}}function Lr(){return Ht()!==null}const bi="pokelike_leaderboard",_r=20;function Es(){try{const a=localStorage.getItem(bi);return a?JSON.parse(a):[]}catch{return[]}}function Br(a){try{localStorage.setItem(bi,JSON.stringify(a))}catch{}}function Er(a){const e=Es(),t=e.find(i=>i.name.toLowerCase()===a.name.toLowerCase());t?a.score_waves>t.score_waves&&(t.score_waves=a.score_waves,t.score_details=a.score_details,t.created_at=new Date().toISOString()):e.push({...a,id:crypto.randomUUID(),created_at:new Date().toISOString()}),e.sort((i,n)=>n.score_waves-i.score_waves);const s=e.slice(0,_r);return Br(s),s}async function Cr(a){return Er(a),!0}async function ki(a="all_time",e=20){{const t=Es();if(a==="today"){const s=new Date().toISOString().split("T")[0];return t.filter(i=>{var n;return(n=i.created_at)==null?void 0:n.startsWith(s)}).slice(0,e)}return t.slice(0,e)}}function Ir(){return"◇ Local leaderboard (set up Supabase for global scores)"}function Si(a){return a?Es().find(t=>t.name.toLowerCase()===a.toLowerCase())??null:null}const Ke=[{id:"first_step",name:"First Step",eyebrow:"First steps.",description:"Clear your first wave. Every legend starts here."},{id:"boulder_master",name:"Boulder Master",eyebrow:"Act 1.",description:"Defeat Brock and earn the Boulder Badge."},{id:"survivor",name:"Survivor",eyebrow:"Five badges deep.",description:"Reach Act 5 (defeat Erika)."},{id:"hall_of_records",name:"Hall of Records",eyebrow:"Thirty waves clear.",description:"Survive 30+ waves in a single run."},{id:"champion",name:"Champion",eyebrow:"Hall of Fame.",description:"Defeat the Champion and complete the league."},{id:"mono_master",name:"Mono Master",eyebrow:"Pure of type.",description:"Defeat a gym leader with a mono-type team."},{id:"rich_trainer",name:"Rich Trainer",eyebrow:"Pocket full of Pokédollars.",description:"Bank 500+ coins in a single run."},{id:"spectral_dabbler",name:"Spectral Dabbler",eyebrow:"Fortune at a price.",description:"Accept a Premier Ball Spectral Curse."},{id:"synergist",name:"Synergist",eyebrow:"Catalogue complete.",description:"Trigger every synergy at least once."},{id:"field_reference",name:"Field Reference",eyebrow:"Catalogue complete.",description:"Face every Field Effect at least once."}],es=Ke.length,Ar="pokerun_achievements_",wi=new Set(Ke.map(a=>a.id));function $i(a){return`${Ar}${a.toLowerCase()}`}function Cs(a){try{const e=JSON.parse(localStorage.getItem($i(a))??"[]");return Array.isArray(e)?new Set(e.filter(t=>typeof t=="string"&&wi.has(t))):new Set}catch{return new Set}}function Hr(a,e){if(!a||!wi.has(e))return!1;const t=Cs(a);if(t.has(e))return!1;t.add(e);try{localStorage.setItem($i(a),JSON.stringify([...t]))}catch{return!1}return!0}function ue(a,e){if(!Hr(a,e))return;const t=Ke.find(s=>s.id===e);t&&B(`Achievement unlocked: ${t.name}`,"success")}function Nt(a){return a?Cs(a):new Set}function ts(a){return a?Cs(a).size:0}const Is="pokerun_discovered_synergies_",xi=_t.map(a=>a.id),ze=xi.length,As=new Set(xi),Hs="pokerun_discovered_blinds_",Mi=$e.map(a=>a.id),je=Mi.length,Ns=new Set(Mi);function ht(a,e,t){try{const s=JSON.parse(localStorage.getItem(`${a}${t.toLowerCase()}`)??"[]");return Array.isArray(s)?new Set(s.filter(i=>typeof i=="string"&&e.has(i))):new Set}catch{return new Set}}function Ti(a,e,t,s){if(!t||s.length===0)return;const i=ht(a,e,t);let n=!1;for(const r of s)e.has(r)&&!i.has(r)&&(i.add(r),n=!0);if(n)try{localStorage.setItem(`${a}${t.toLowerCase()}`,JSON.stringify([...i]))}catch{}}function Nr(a,e){Ti(Is,As,a,e),st(a)>=ze&&ue(a,"synergist")}function st(a){return a?ht(Is,As,a).size:0}function Sa(a){return a?ht(Is,As,a):new Set}function Rr(a,e){Ti(Hs,Ns,a,e),at(a)>=je&&ue(a,"field_reference")}function at(a){return a?ht(Hs,Ns,a).size:0}function wa(a){return a?ht(Hs,Ns,a):new Set}const qr="pokerun_champion_clears_";function ms(a){return`${qr}${a.toLowerCase()}`}function Dr(a){if(!a)return 0;try{const e=localStorage.getItem(ms(a)),t=e?parseInt(e,10):0,s=(Number.isFinite(t)&&t>=0?t:0)+1;return localStorage.setItem(ms(a),String(s)),s}catch{return 0}}function Fr(a){if(!a)return 0;try{const e=localStorage.getItem(ms(a));if(!e)return 0;const t=parseInt(e,10);return Number.isFinite(t)&&t>=0?t:0}catch{return 0}}const we=[{id:"standard",name:"Standard Field Kit",eyebrow:"Default",icon:"◇",description:"The classic field manual. All 5 starters, no twists."},{id:"speedrunner",name:"Speedrunner Field Kit",eyebrow:"Wave 30+",icon:"»",unlockAchievement:"hall_of_records",description:"Start with +100¢ and a Reroll Token. Each act has 3 stages instead of 4."},{id:"iron_trainer",name:"Iron Trainer Field Kit",eyebrow:"Act 5",icon:"◆",unlockAchievement:"survivor",description:"No consumables in shop. Every Pokémon starts with slot 2 unlocked."},{id:"mono_type",name:"Mono-Type Field Kit",eyebrow:"Pure of type",icon:"◈",unlockAchievement:"mono_master",requiresTypeChoice:!0,description:"Pick a type. Starter pool narrows to that type. Full-mono alive team = +25% damage."}],Rs=["grass","fire","water","electric","normal"],Or="pokerun_last_deck_",Gr="pokerun_last_mono_type_",Pi=new Set(we.map(a=>a.id));function Li(a){return`${Or}${a.toLowerCase()}`}function _i(a){return`${Gr}${a.toLowerCase()}`}function Bi(a){const e=new Set(["standard"]);if(!a)return e;const t=Nt(a);for(const s of we)s.unlockAchievement&&t.has(s.unlockAchievement)&&e.add(s.id);return e}function Ur(a,e){return Bi(a).has(e)}function Wr(a){if(!a)return"standard";try{const e=localStorage.getItem(Li(a));if(e&&Pi.has(e)&&Ur(a,e))return e}catch{}return"standard"}function Kr(a,e){if(!(!a||!Pi.has(e)))try{localStorage.setItem(Li(a),e)}catch{}}function zr(a){if(!a)return"grass";try{const e=localStorage.getItem(_i(a));if(e&&Rs.includes(e))return e}catch{}return"grass"}function jr(a,e){if(!(!a||!Rs.includes(e)))try{localStorage.setItem(_i(a),e)}catch{}}function Vr(a){var e;return!a||a==="standard"?null:((e=we.find(t=>t.id===a))==null?void 0:e.name)??null}const ee=[{id:"white",name:"Rookie",description:"Standard difficulty. The starting trial."},{id:"red",name:"Veteran",unlockAfter:"white",description:"Field Effects carry +50% HP. Coins reward +50%.",mods:{bossBlindHpMult:1.5,coinRewardMult:1.5}},{id:"black",name:"Ace",unlockAfter:"red",description:"Shop prices +50%. Enemy speed +25%. Coins reward +100%.",mods:{shopPriceMult:1.5,enemySpeedMult:1.25,coinRewardMult:2}}],qs=new Set(ee.map(a=>a.id)),Yr="pokerun_stakes_unlocked_",Xr="pokerun_last_stake_";function Ei(a){return`${Yr}${a.toLowerCase()}`}function Ci(a){return`${Xr}${a.toLowerCase()}`}function Ds(a){const e=new Set(["white"]);if(!a)return e;try{const t=JSON.parse(localStorage.getItem(Ei(a))??"[]");if(Array.isArray(t))for(const s of t)typeof s=="string"&&qs.has(s)&&e.add(s)}catch{}return e}function fs(a){return Ds(a)}function Jr(a,e){return Ds(a).has(e)}function Zr(a){if(!a)return"white";try{const e=localStorage.getItem(Ci(a));if(e&&qs.has(e)&&Jr(a,e))return e}catch{}return"white"}function Qr(a,e){if(!(!a||!qs.has(e)))try{localStorage.setItem(Ci(a),e)}catch{}}function eo(a,e){if(!a||!e)return;const t=ee.find(i=>i.unlockAfter===e);if(!t)return;const s=Ds(a);if(!s.has(t.id)){s.add(t.id);try{localStorage.setItem(Ei(a),JSON.stringify([...s]))}catch{return}B(`${t.name} rank unlocked!`,"success")}}function to(a){var e;return!a||a==="white"?null:((e=ee.find(t=>t.id===a))==null?void 0:e.name)??null}function so(a){var e;return a?((e=ee.find(t=>t.id===a))==null?void 0:e.mods)??{}:{}}function vs(a,e){var o;if(!a)return null;const t=Nt(a),s=fs(a),i=Ya(a),n=st(a),r=at(a);if(!t.has("first_step"))return{id:"first_step",title:"Clear your first wave to begin the field manual."};if(!t.has("boulder_master"))return{id:"boulder_master",title:"Defeat Brock to earn the Boulder Badge."};if(!t.has("survivor"))return{id:"survivor",title:"Reach Act 5 (defeat Erika) to unlock the Iron Trainer Field Kit."};if(!t.has("hall_of_records"))return{id:"hall_of_records",title:"Survive 30+ waves in a single run to unlock the Speedrunner Field Kit."};if(!t.has("mono_master"))return{id:"mono_master",title:"Defeat a gym leader with 2+ same-type alive teammates to unlock the Mono-Type Field Kit."};if(!t.has("champion")){const l=e?lt(e):void 0;return{id:"champion",title:`Defeat the Champion in ${(l==null?void 0:l.region)??"Kanto"} to unlock the next region and Endless.`}}if(e){const l=Ss(e);if((l==null?void 0:l.status)==="coming_soon"&&i.has(e))return{id:`region_${l.id}`,title:`Beat the Champion in ${((o=lt(e))==null?void 0:o.region)??"this region"} — ${l.region} coming soon.`}}if(!s.has("red"))return{id:"stake_red",title:"Beat the Champion as Rookie to unlock Veteran rank."};if(!s.has("black"))return{id:"stake_black",title:"Beat the Champion as Veteran to unlock Ace rank."};if(n<ze){const l=ze-n;return{id:"synergist",title:`Trigger ${l} more synerg${l===1?"y":"ies"} to complete the Synergy Codex.`}}if(r<je){const l=je-r;return{id:"field_reference",title:`Face ${l} more Field Effect${l===1?"":"s"} to complete the Field Effect Codex.`}}return null}function Ii(a,e=!1){return e?"Endless":a==null?"—":a>=10?"Champion ✓":a===9?"League":a>=1&&a<=8?`Act ${a}`:"—"}function Ai(a){return a==null?"—":`${a}/8`}const he=[{id:"boulder",name:"Boulder Badge",hint:"Earned from Brock — your team's defenses harden.",color:"#7a634a",icon:"◆",perk:{id:"badge_boulder",name:"Boulder Badge",description:"+10% Defense across the team.",icon:"◆",rarity:"rare",effect:{defenseMultiplier:1.06}}},{id:"cascade",name:"Cascade Badge",hint:"Earned from Misty — slow regen between turns.",color:"#3a6c8a",icon:"◇",perk:{id:"badge_cascade",name:"Cascade Badge",description:"+3% HP regen per turn.",icon:"◇",rarity:"rare",effect:{regenPercent:.03}}},{id:"thunder",name:"Thunder Badge",hint:"Earned from Surge — quicker reflexes.",color:"#c9a417",icon:"★",perk:{id:"badge_thunder",name:"Thunder Badge",description:"+6% Speed across the team.",icon:"★",rarity:"rare",effect:{speedMultiplier:1.06}}},{id:"rainbow",name:"Rainbow Badge",hint:"Earned from Erika — passive HP regen.",color:"#5d8266",icon:"◉",perk:{id:"badge_rainbow",name:"Rainbow Badge",description:"+4% HP regen per turn.",icon:"◉",rarity:"epic",effect:{regenPercent:.04}}},{id:"soul",name:"Soul Badge",hint:"Earned from Koga — sturdier special wall.",color:"#7a3f8a",icon:"☠",perk:{id:"badge_soul",name:"Soul Badge",description:"+6% Sp. Defense across the team.",icon:"☠",rarity:"epic",effect:{spDefMultiplier:1.06}}},{id:"marsh",name:"Marsh Badge",hint:"Earned from Sabrina — sharper psyche.",color:"#c14a8a",icon:"◆",perk:{id:"badge_marsh",name:"Marsh Badge",description:"+6% Sp. Attack across the team.",icon:"◆",rarity:"epic",effect:{statMultiplier:{spAtk:1.06}}}},{id:"volcano",name:"Volcano Badge",hint:"Earned from Blaine — coin bonuses burn brighter.",color:"#a64418",icon:"▲",perk:{id:"badge_volcano",name:"Volcano Badge",description:"+15% coin reward from every wave.",icon:"▲",rarity:"epic",effect:{coinMultiplier:1.15}}},{id:"earth",name:"Earth Badge",hint:"Earned from Giovanni — true power. League gates open.",color:"#caa15a",icon:"◉",perk:{id:"badge_earth",name:"Earth Badge",description:"+8% damage and unlocks the Pokémon League.",icon:"◉",rarity:"legendary",effect:{allDamageMultiplier:1.08}}}];function ao(a){return he.find(e=>e.id===a)}const Fs="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites",ie=a=>`${Fs}/items/${a}.png`,ys=a=>`${Fs}/pokemon/${a}.png`,io={boulder:1,cascade:2,thunder:3,rainbow:4,soul:5,marsh:6,volcano:7,earth:8},Gt=a=>{const e=io[a];return e?`${Fs}/badges/${e}.png`:void 0},Y=a=>`this.onerror=null;var d=document.createElement('span');d.className='px-emoji';d.textContent=${JSON.stringify(a).replace(/"/g,"&quot;")};this.replaceWith(d);`,no=[{id:"tour_starter",anchor:".starter-grid",eyebrow:"Setup · 01",title:"Pick a starter",body:"Three options — every starter is a viable seed. Use ‹ › to browse types. Your starter sets your run's opening move.",cta:"Got one →",position:"top"},{id:"tour_trainer",anchor:"#trainer-chip",eyebrow:"Setup · 02",title:"Your trainer card",body:"Click to swap gender. Your name &amp; trainer carry across runs and show on the leaderboard.",cta:"Cool →",position:"bottom"},{id:"tour_start",anchor:"#start-btn",eyebrow:"Setup · 03",title:"Press to begin",body:"Click <b>Start Run</b> to step onto the path. We'll explain each screen as it appears.",advanceOnClick:!0,position:"top"},{id:"tour_path_arena",anchor:()=>document.querySelector(".stage-progress")??document.querySelector(".path-header"),eyebrow:"Path · 04",title:"Road to the badge",body:"This strip shows the <b>upcoming arena</b> and your progress. Each pip is one node — when the rail fills up, the gym leader is next.",cta:"Continue →",position:"bottom",waitMs:3e4,pad:10},{id:"tour_path_cards",anchor:()=>document.querySelector(".path-cards")??document.querySelector(".path-content"),eyebrow:"Path · 05",title:"Three branches",body:"Each card is one path forward:<br><b>Battle</b> · standard fight + reward<br><b>Elite</b> · harder fight, better loot<br><b>Shop</b> · spend coins on items<br><b>Heal</b> · restore your team<br><b>Event</b> · random dilemma<br><b>Arena</b> · 4-stage gym, badge on win",cta:"Got it →",position:"top",waitMs:8e3,pad:12},{id:"tour_path_pick",anchor:()=>document.querySelector(".path-card"),eyebrow:"Path · 06",title:"Take a path",body:"Click any card to commit. Plan two steps ahead — coins are tight before arenas, HP matters before bosses. <b>Pick a Battle node now</b> so we can show you combat.",cta:"— click a card —",advanceOnClick:!0,position:"right",waitMs:8e3},{id:"tour_battle_arena",anchor:()=>document.querySelector(".battle-arena")??document.querySelector("#battle-screen-inner"),eyebrow:"Combat · 07",title:"The arena",body:"Your active mon vs. the enemy. Each card shows HP, level, status, and types. The fight is paused — take your time reading.",cta:"Show me the team →",position:"bottom",waitMs:12e3,pad:6,onEnter:()=>ps(!0)},{id:"tour_battle_team",anchor:"#battle-team-strip",eyebrow:"Combat · 08",title:"Your team",body:"Each sprite is a roster slot. Color-bar = HP. Faded sprite = fainted. Your active mon is highlighted with the oxblood border.",cta:"Show me the ticker →",position:"top",waitMs:8e3,pad:8},{id:"tour_battle_ticker",anchor:"#battle-ticker",eyebrow:"Combat · 09",title:"Live ticker",body:"Combat log. Damage rolls, type matchups, status procs, item triggers — everything resolves here. Once we resume the fight, watch this strip.",cta:"Watch the fight →",position:"top",waitMs:8e3,pad:8,onExit:()=>ps(!1)},{id:"tour_reward",anchor:()=>document.querySelector(".reward-screen")??document.querySelector("#reward-cards"),eyebrow:"Reward · 10",title:"Pick or skip",body:"Three cards drop after every win — a <b>Mon</b>, a <b>Perk</b>, or an <b>Item</b>. Skip for <b>+60¢</b> instead. Boss waves drop better loot — save your skips for normal waves.",cta:"Got it →",position:"bottom",waitMs:9e4,pad:12}];function ro(a=!1){$r(no,{force:a})}const oo="https://ko-fi.com/pokerun",$a={1:"grass",4:"fire",7:"water",25:"electric",133:"normal"};class lo{constructor(e,t,s,i,n=!1,r=null){b(this,"container");b(this,"onStart");b(this,"onLogout");b(this,"onResume");b(this,"starterData",Yt.map(e=>({id:e.id,name:e.name,displayName:e.displayName,sprite:Wa(e.id)})));b(this,"selectedStarterIndex",0);b(this,"playerName","");b(this,"isGuest",!1);b(this,"trainerGender","male");b(this,"destroyAudioBtn",null);b(this,"selectedDeck","standard");b(this,"selectedMonoType","grass");b(this,"selectedStake","white");this.container=e,this.onStart=t,this.onLogout=s,this.playerName=i,this.isGuest=n,this.onResume=r,this.selectedDeck=Wr(i),this.selectedMonoType=zr(i),this.selectedStake=Zr(i)}async mount(){this.container.innerHTML=this.renderHTML(),this.container.style.display="",document.body.classList.add("start-active"),oe(this.container),this.attachEvents(),this.refreshStarterFilter();const e=this.container.querySelector("#settings-audio-slot");if(e&&(this.destroyAudioBtn=Vi(e)),this.loadStarterData(),!Ps("intro_htp")){const t=this.container.querySelector("#howtoplay-modal");t==null||t.classList.remove("hidden"),Ls("intro_htp")}}async loadStarterData(){for(let e=0;e<Yt.length;e++)try{const t=await ot(Yt[e].id,8);this.starterData[e]={id:t.id,name:t.name,displayName:t.displayName,sprite:t.sprite,types:t.types,bst:t.bst};const s=this.container.querySelector(`[data-starter="${e}"]`);if(s){const i=s.querySelector(".starter-types"),n=s.querySelector(".starter-bst");i&&t.types&&(i.innerHTML=t.types.map((r,o)=>`<span class="type-stamp type-${r}" style="--rot:${o%2===0?"-2":"2"}deg">${r.toUpperCase()}</span>`).join("")),n&&t.bst&&(n.textContent=`BST ${t.bst}`)}}catch{}}renderSettingsModal(){const e=be(),t=(s,i)=>`<button class="settings-pill${e.animationSpeed===s?" active":""}" data-speed="${s}" type="button">${i}</button>`;return`
      <div class="modal-overlay hidden" id="settings-modal">
        <div class="modal htp-modal">
          <button class="modal-close" id="close-settings">✕</button>
          <div class="htp-eyebrow">Display · Motion · Audio</div>
          <h2 class="modal-title">◈ <em>Settings</em></h2>

          <div class="settings-row">
            <div class="settings-row-label">
              <div class="srl-title">Reduce Motion</div>
              <div class="srl-sub">Mute non-essential animations and shakes.</div>
            </div>
            <label class="settings-toggle">
              <input type="checkbox" id="setting-reduce-motion" ${e.reduceMotion?"checked":""} />
              <span class="settings-toggle-track"><span class="settings-toggle-knob"></span></span>
            </label>
          </div>

          <div class="settings-row">
            <div class="settings-row-label">
              <div class="srl-title">Animation Speed</div>
              <div class="srl-sub">Speed up battle and intro flair.</div>
            </div>
            <div class="settings-pills" id="setting-speed">
              ${t(.5,"0.5×")}
              ${t(1,"1×")}
              ${t(1.5,"1.5×")}
              ${t(2,"2×")}
            </div>
          </div>

          <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px; flex-direction:column; align-items:stretch; gap:10px;">
            <div class="settings-row-label">
              <div class="srl-title">Sound &amp; Music</div>
              <div class="srl-sub">Master · Music · SFX</div>
            </div>
            <div id="settings-audio-slot" class="settings-audio-slot"></div>
          </div>

          <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px;">
            <div class="settings-row-label">
              <div class="srl-title">Tutorial</div>
              <div class="srl-sub">Replay the how-to-play overlay and contextual hints.</div>
            </div>
            <button class="ink-btn ghost sm" id="reset-tutorial-btn" type="button">Replay Tutorial</button>
          </div>

          <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px;">
            <div class="settings-row-label">
              <div class="srl-title">Saved trainer</div>
              <div class="srl-sub">${D(this.playerName||"—")}</div>
            </div>
            <button class="ink-btn ghost sm" id="clear-name-btn" type="button">Clear Saved Name</button>
          </div>

          <div class="settings-row" style="border-top:1.5px dashed var(--ink, #1a1a1a); padding-top:14px;">
            <div class="settings-row-label">
              <div class="srl-title">Legal &amp; Disclaimer</div>
              <div class="srl-sub">Fan project · non-commercial · trademarks belong to their owners.</div>
            </div>
            <button class="ink-btn ghost sm" id="open-legal-btn" type="button">View →</button>
          </div>
        </div>
      </div>
    `}renderThreeCellStrip(){const e=st(this.playerName),t=at(this.playerName),s=ts(this.playerName),i=e+t+s,n=ze+je+es,r=we.find(d=>d.id===this.selectedDeck)??we[0],o=r.name.replace(/ Field Kit$/,""),l=r.id==="mono_type"?`${o} · ${this.selectedMonoType.toUpperCase()}`:o,c=ee.find(d=>d.id===this.selectedStake)??ee[0];return`
      <div class="ss-fr-strip">
        <button type="button" class="ss-fr-cell" id="ss-fr-codex" aria-label="Open Codex hub">
          <div class="ss-fr-eyebrow">CODEX</div>
          <div class="ss-fr-value">${i} / ${n}</div>
        </button>
        <button type="button" class="ss-fr-cell" id="ss-fr-fieldkit" aria-label="Open Field Kit picker">
          <div class="ss-fr-eyebrow">FIELD KIT</div>
          <div class="ss-fr-value">${D(l)}</div>
        </button>
        <button type="button" class="ss-fr-cell" id="ss-fr-rank" aria-label="Open Trainer Rank picker">
          <div class="ss-fr-eyebrow">TRAINER RANK</div>
          <div class="ss-fr-value">${D(c.name)}</div>
        </button>
      </div>
    `}refreshThreeCellStrip(){const e=this.container.querySelector(".ss-fr-strip");if(!e)return;const t=document.createElement("div");t.innerHTML=this.renderThreeCellStrip();const s=t.firstElementChild;s&&(e.replaceWith(s),this.wireThreeCellStripEvents())}wireThreeCellStripEvents(){var e,t,s;(e=this.container.querySelector("#ss-fr-codex"))==null||e.addEventListener("click",()=>this.openCodexHub()),(t=this.container.querySelector("#ss-fr-fieldkit"))==null||t.addEventListener("click",()=>this.openFieldKitDetail()),(s=this.container.querySelector("#ss-fr-rank"))==null||s.addEventListener("click",()=>this.openTrainerRankDetail())}renderBadgeTrophyStrip(){const e=Ht(),t=new Set((e==null?void 0:e.state.badges)??[]);return t.size===0?"":`
      <div class="trophy-strip" aria-label="Badges earned in saved run">
        <div class="trophy-strip-eyebrow">— Badges earned · ${t.size} of 8 —</div>
        <div class="trophy-strip-row">
          ${he.map(s=>{const i=t.has(s.id),n=Gt(s.id),r=i&&n?`<img src="${n}" alt="${s.name}" onerror="${Y(s.icon)}" />`:'<span class="trophy-pip-locked" aria-hidden="true"></span>';return`<span class="trophy-pip${i?" owned":""}" title="${s.name}"
              style="--badge-color:${s.color}">${r}</span>`}).join("")}
        </div>
      </div>
    `}renderResumeBanner(){if(!this.onResume||!Lr())return"";const e=Ht();if(!e)return"";const t=Math.max(1,Math.floor((Date.now()-e.savedAt)/6e4)),s=e.state.wave,i=e.state.team.length,n=e.state.currentAct;return`
      <div class="resume-banner">
        <div class="resume-banner-info">
          <div class="resume-banner-eyebrow">Saved run · ${t<60?`${t} min ago`:`${Math.floor(t/60)}h ago`}</div>
          <div class="resume-banner-meta">Wave ${s} · Act ${n} · ${i} mon</div>
        </div>
        <div class="resume-banner-actions">
          <button class="ink-btn ghost sm" id="resume-discard" type="button">Discard</button>
          <button class="ink-btn primary" id="resume-btn" type="button">↻ Resume run</button>
        </div>
      </div>
    `}openTrainerRankDetail(){var s;const e=document.createElement("div");e.className="modal-overlay codex-overlay trainer-rank-detail-overlay",e.innerHTML=`
      <div class="modal trainer-rank-detail-modal">
        <button class="modal-close" id="trd-close" type="button">✕</button>
        <div class="codex-eyebrow">— Run difficulty —</div>
        <h2 class="modal-title">Trainer <em>Rank</em></h2>
        <p class="trd-modal-sub">Difficulty rank — earned by clearing Champion at lower tiers.</p>
        ${this.renderTrainerRankBody()}
      </div>
    `,document.body.appendChild(e);const t=()=>e.remove();(s=e.querySelector("#trd-close"))==null||s.addEventListener("click",t),e.addEventListener("click",i=>{i.target===e&&t()}),this.wireTrainerRankPills(e)}renderTrainerRankBody(){const e=fs(this.playerName),t=ee.find(o=>!e.has(o.id)),s=t!=null&&t.unlockAfter?`<div class="stake-picker-hint">Unlock ${D(t.name)} rank by clearing Champion as ${D(this.stakeNameForId(t.unlockAfter))}.</div>`:"",i=ee.map(o=>{const l=e.has(o.id),c=this.selectedStake===o.id&&l,d=!l&&o.unlockAfter?`Unlock: clear Champion on ${this.stakeNameForId(o.unlockAfter)}`:o.description;return`<button type="button"
                      class="stake-pill stake-${o.id}${c?" selected":""}${l?"":" locked"}"
                      data-stake-id="${o.id}"
                      title="${D(d)}"
                      ${l?"":"disabled"}>
                ${D(l?o.name:"???")}
              </button>`}).join(""),n=ee.find(o=>o.id===this.selectedStake)??ee[0],r=`<div class="trd-stake-desc"><b>${D(n.name)}</b> · ${D(n.description)}</div>`;return`
      <div class="trd-rank-body">
        <div class="stake-picker-pills">${i}</div>
        ${r}
        ${s}
      </div>
    `}wireTrainerRankPills(e){e.querySelectorAll("[data-stake-id]").forEach(t=>{t.addEventListener("click",()=>{if(t.disabled)return;const s=t.dataset.stakeId??"white";this.selectedStake=s,Qr(this.playerName,s),this.refreshTrainerRankBody(e),this.refreshThreeCellStrip()})})}refreshTrainerRankBody(e){const t=e.querySelector(".trd-rank-body");if(!t)return;const s=document.createElement("div");s.innerHTML=this.renderTrainerRankBody();const i=s.firstElementChild;i&&(t.replaceWith(i),this.wireTrainerRankPills(e))}renderCodexHubButton(){const e=st(this.playerName),t=at(this.playerName),s=ts(this.playerName),i=ze+je+es;return`
      <button type="button" class="ss-codex-hub-button" id="ss-codex-hub-open"
              aria-label="Open Codex hub">
        <span class="ss-codex-hub-icon" aria-hidden="true">◆</span>
        <span class="ss-codex-hub-label">Codex</span>
        <span class="ss-codex-hub-progress">${`${e+t+s} / ${i}`}</span>
        <span class="ss-codex-hub-arrow" aria-hidden="true">›</span>
      </button>
    `}renderPersonalBest(){const e=Si(this.playerName);if(!e)return`
        <div class="ss-personal-best" data-empty="true">
          <div class="ss-pb-eyebrow">Best run</div>
          <div class="ss-pb-empty">Not yet set — your first wipe writes the record.</div>
        </div>
      `;const t=e.score_details??{};return`
      <div class="ss-personal-best" data-empty="false">
        <div class="ss-pb-eyebrow">Best run</div>
        <div class="ss-pb-row">
          <div class="ss-pb-stat"><span class="k">Waves</span><span class="v">${e.score_waves}</span></div>
          <div class="ss-pb-stat"><span class="v">${Ii(t.actReached,t.endless)}</span></div>
          <div class="ss-pb-stat"><span class="k">Badges</span><span class="v">${Ai(t.badgesEarned)}</span></div>
          <div class="ss-pb-stat"><span class="k">Starter</span><span class="v">${D(t.starterName??"—")}</span></div>
        </div>
      </div>
    `}refreshDeckPicker(e){const t=e.querySelector(".deck-picker-section");if(!t)return;const s=document.createElement("div");s.innerHTML=this.renderDeckPicker();const i=s.firstElementChild;i&&(t.replaceWith(i),this.wireDeckPickerEvents(e))}wireDeckPickerEvents(e){e.querySelectorAll("[data-deck-id]").forEach(t=>{t.addEventListener("click",()=>{if(t.disabled)return;const s=t.dataset.deckId??"standard";this.selectedDeck=s,Kr(this.playerName,s),this.refreshDeckPicker(e),this.refreshStarterFilter(),this.refreshThreeCellStrip()})}),e.querySelectorAll("[data-mono-type]").forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.monoType;this.selectedMonoType=s,jr(this.playerName,s),this.refreshDeckPicker(e),this.refreshStarterFilter(),this.refreshThreeCellStrip()})})}openFieldKitDetail(){var s;const e=document.createElement("div");e.className="modal-overlay codex-overlay field-kit-detail-overlay",e.innerHTML=`
      <div class="modal field-kit-detail-modal">
        <button class="modal-close" id="fk-close" type="button">✕</button>
        <div class="codex-eyebrow">— Run configuration —</div>
        <h2 class="modal-title">Field <em>Kit</em></h2>
        <p class="fk-modal-sub">Field kits bend the rules — unlocked via achievements.</p>
        ${this.renderDeckPicker()}
      </div>
    `,document.body.appendChild(e);const t=()=>e.remove();(s=e.querySelector("#fk-close"))==null||s.addEventListener("click",t),e.addEventListener("click",i=>{i.target===e&&t()}),this.wireDeckPickerEvents(e)}refreshStarterFilter(){const e=this.container.querySelector("#starter-grid"),t=this.container.querySelector("#starter-dots"),s=this.selectedDeck==="mono_type"?this.selectedMonoType:null;let i=-1;this.starterData.forEach((n,r)=>{const o=s==null||$a[n.id]===s,l=e==null?void 0:e.querySelector(`[data-starter="${r}"]`),c=t==null?void 0:t.querySelector(`[data-dot="${r}"]`);l&&(l.style.display=o?"":"none"),c&&(c.style.display=o?"":"none"),o&&i<0&&(i=r)}),i>=0&&this.starterData[this.selectedStarterIndex]&&s!=null&&$a[this.starterData[this.selectedStarterIndex].id]!==s&&(this.selectedStarterIndex=i,this.container.querySelectorAll("[data-starter]").forEach((n,r)=>{n.classList.toggle("selected",r===i)}),this.container.querySelectorAll("[data-dot]").forEach((n,r)=>{n.classList.toggle("active",r===i)}))}renderFieldKitCompactRow(){const e=we.find(s=>s.id===this.selectedDeck)??we[0],t=e.id==="mono_type"?`<span class="ss-fk-mono-chip type-chip type-${this.selectedMonoType}">${D(this.selectedMonoType.toUpperCase())}</span>`:"";return`
      <div class="ss-field-kit-row">
        <span class="ss-fk-label">Field Kit</span>
        <span class="ss-fk-selected">
          <span class="ss-fk-icon" aria-hidden="true">${e.icon}</span>
          <span class="ss-fk-name">${D(e.name)}</span>
          ${t}
        </span>
        <button type="button" class="ss-fk-change-btn" id="ss-fk-change-open"
                aria-label="Change Field Kit">Change ▾</button>
      </div>
    `}renderStakePickerRow(){const e=fs(this.playerName),t=ee.find(n=>!e.has(n.id)),s=t!=null&&t.unlockAfter?`<div class="stake-picker-hint">Unlock ${D(t.name)} rank by clearing Champion as ${D(this.stakeNameForId(t.unlockAfter))}.</div>`:"";return`
      <div class="ss-stake-row">
        <span class="stake-picker-label">Trainer Rank</span>
        <div class="stake-picker-pills">${ee.map(n=>{const r=e.has(n.id),o=this.selectedStake===n.id&&r,l=!r&&n.unlockAfter?`Unlock: clear Champion on ${this.stakeNameForId(n.unlockAfter)}`:n.description;return`<button type="button"
                      class="stake-pill stake-${n.id}${o?" selected":""}${r?"":" locked"}"
                      data-stake-id="${n.id}"
                      title="${D(l)}"
                      ${r?"":"disabled"}>
                ${D(r?n.name.split(" ")[0]:"???")}
              </button>`}).join("")}</div>
        ${s}
      </div>
    `}renderDeckPicker(){const e=Bi(this.playerName),t=we.map(i=>{const n=e.has(i.id),r=this.selectedDeck===i.id&&n,o=n?"":`<div class="deck-card-lock">Unlock: ${this.unlockHintFor(i.id)}</div>`;return`
        <button type="button"
                class="deck-card${r?" selected":""}${n?"":" locked"}"
                data-deck-id="${i.id}"
                ${n?"":"disabled"}>
          <div class="deck-card-icon" aria-hidden="true">${n?i.icon:"·"}</div>
          <div class="deck-card-eyebrow">${D(i.eyebrow)}</div>
          <div class="deck-card-name">${D(n?i.name:"???")}</div>
          <div class="deck-card-desc">${D(n?i.description:"Locked. Keep playing to unlock.")}</div>
          ${o}
        </button>
      `}).join(""),s=this.selectedDeck==="mono_type"&&e.has("mono_type")?`<div class="deck-mono-subpicker">
           <span class="deck-mono-label">Choose type:</span>
           ${Rs.map(i=>`
             <button type="button"
                     class="deck-mono-chip type-chip type-${i}${this.selectedMonoType===i?" selected":""}"
                     data-mono-type="${i}">${D(i.toUpperCase())}</button>
           `).join("")}
         </div>`:"";return`
      <div class="deck-picker-section">
        <div class="deck-picker-grid">${t}</div>
        ${s}
      </div>
    `}stakeNameForId(e){var t;return((t=ee.find(s=>s.id===e))==null?void 0:t.name)??e}renderNextGoal(){const e=vs(this.playerName);return e?`
      <div class="ss-next-goal">
        <span class="ss-next-goal-eyebrow">Next:</span>
        <span class="ss-next-goal-title">${D(e.title)}</span>
      </div>
    `:""}unlockHintFor(e){switch(e){case"speedrunner":return"Hall of Records — survive 30+ waves";case"iron_trainer":return"Survivor — reach Act 5";case"mono_type":return"Mono Master — beat a gym with 2+ same-type alive";default:return"—"}}renderSynergyGridHtml(){const e=Sa(this.playerName);return _t.map(t=>e.has(t.id)?`
          <div class="codex-card found syn-${t.color}">
            <div class="codex-card-head">
              <span class="codex-card-icon">${t.icon}</span>
              <span class="codex-card-name">${D(t.name)}</span>
            </div>
            <p class="codex-card-desc">${D(t.description)}</p>
          </div>
        `:`
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Trigger this synergy to reveal.</p>
        </div>
      `).join("")}renderBlindGridHtml(){const e=wa(this.playerName);return $e.map(t=>e.has(t.id)?`
          <div class="codex-card found codex-blind" style="--blind-color:${t.color}">
            <div class="codex-card-head">
              <span class="codex-card-icon">${t.icon}</span>
              <span class="codex-card-name">${D(t.name)}</span>
            </div>
            <p class="codex-card-desc">${D(t.description)}</p>
            <p class="codex-card-hint">${D(t.tacticalHint)}</p>
          </div>
        `:`
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Face this Field Effect in battle to reveal.</p>
        </div>
      `).join("")}renderAchievementsGridHtml(){const e=Nt(this.playerName);return Ke.map(t=>e.has(t.id)?`
          <div class="codex-card found codex-achievement">
            <div class="codex-card-head">
              <span class="codex-card-icon">★</span>
              <span class="codex-card-name">${D(t.name)}</span>
            </div>
            <div class="codex-card-eyebrow">${D(t.eyebrow)}</div>
            <p class="codex-card-desc">${D(t.description)}</p>
          </div>
        `:`
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Locked. Keep playing to unlock.</p>
        </div>
      `).join("")}openCodexHub(){var d;const e=vs(this.playerName),t=st(this.playerName),s=at(this.playerName),i=ts(this.playerName),n=Fr(this.playerName),r=e?`<div class="codex-hub-goal"><span class="codex-hub-goal-eyebrow">Next:</span> ${D(e.title)}</div>`:"",o=this.renderPersonalBest(),l=document.createElement("div");l.className="modal-overlay codex-overlay codex-hub-overlay",l.innerHTML=`
      <div class="modal codex-modal codex-hub-modal">
        <button class="modal-close" id="codex-close" type="button">✕</button>
        <div class="codex-eyebrow">— Field Reference —</div>
        <h2 class="modal-title">Codex <em>Hub</em></h2>
        ${r}
        ${o}
        <div class="codex-hub-clears">Champion clears · <b>${n}</b></div>
        <div class="codex-hub-tabs" role="tablist">
          <button type="button" class="codex-hub-tab active" data-hub-tab="synergies" role="tab">
            <span class="cht-label">Synergies</span>
            <span class="cht-count">${t}/${ze}</span>
          </button>
          <button type="button" class="codex-hub-tab" data-hub-tab="blinds" role="tab">
            <span class="cht-label">Field Effects</span>
            <span class="cht-count">${s}/${je}</span>
          </button>
          <button type="button" class="codex-hub-tab" data-hub-tab="achievements" role="tab">
            <span class="cht-label">Achievements</span>
            <span class="cht-count">${i}/${es}</span>
          </button>
        </div>
        <div class="codex-grid codex-hub-grid" data-hub-tab-content="synergies">${this.renderSynergyGridHtml()}</div>
        <div class="codex-grid codex-hub-grid hidden" data-hub-tab-content="blinds">${this.renderBlindGridHtml()}</div>
        <div class="codex-grid codex-hub-grid hidden" data-hub-tab-content="achievements">${this.renderAchievementsGridHtml()}</div>
      </div>
    `,document.body.appendChild(l);const c=()=>l.remove();(d=l.querySelector("#codex-close"))==null||d.addEventListener("click",c),l.addEventListener("click",p=>{p.target===l&&c()}),l.querySelectorAll("[data-hub-tab]").forEach(p=>{p.addEventListener("click",()=>{const u=p.dataset.hubTab??"synergies";l.querySelectorAll("[data-hub-tab]").forEach(h=>{h.classList.toggle("active",h.dataset.hubTab===u)}),l.querySelectorAll("[data-hub-tab-content]").forEach(h=>{h.classList.toggle("hidden",h.dataset.hubTabContent!==u)})})})}openSynergyCodex(){var n;const e=Sa(this.playerName),t=_t.map(r=>e.has(r.id)?`
          <div class="codex-card found syn-${r.color}">
            <div class="codex-card-head">
              <span class="codex-card-icon">${r.icon}</span>
              <span class="codex-card-name">${D(r.name)}</span>
            </div>
            <p class="codex-card-desc">${D(r.description)}</p>
          </div>
        `:`
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Trigger this synergy to reveal.</p>
        </div>
      `).join(""),s=document.createElement("div");s.className="modal-overlay codex-overlay",s.innerHTML=`
      <div class="modal codex-modal">
        <button class="modal-close" id="codex-close" type="button">✕</button>
        <div class="codex-eyebrow">— Field Reference —</div>
        <h2 class="modal-title">Synergy <em>Codex</em></h2>
        <div class="codex-progress">${e.size} / ${_t.length} discovered</div>
        <div class="codex-grid">${t}</div>
      </div>
    `,document.body.appendChild(s);const i=()=>s.remove();(n=s.querySelector("#codex-close"))==null||n.addEventListener("click",i),s.addEventListener("click",r=>{r.target===s&&i()})}openBlindCodex(){var n;const e=wa(this.playerName),t=$e.map(r=>e.has(r.id)?`
          <div class="codex-card found codex-blind" style="--blind-color:${r.color}">
            <div class="codex-card-head">
              <span class="codex-card-icon">${r.icon}</span>
              <span class="codex-card-name">${D(r.name)}</span>
            </div>
            <p class="codex-card-desc">${D(r.description)}</p>
            <p class="codex-card-hint">${D(r.tacticalHint)}</p>
          </div>
        `:`
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Face this Field Effect in battle to reveal.</p>
        </div>
      `).join(""),s=document.createElement("div");s.className="modal-overlay codex-overlay",s.innerHTML=`
      <div class="modal codex-modal">
        <button class="modal-close" id="codex-close" type="button">✕</button>
        <div class="codex-eyebrow">— Field Reference —</div>
        <h2 class="modal-title">Field Effect <em>Codex</em></h2>
        <div class="codex-progress">${e.size} / ${$e.length} faced</div>
        <div class="codex-grid">${t}</div>
      </div>
    `,document.body.appendChild(s);const i=()=>s.remove();(n=s.querySelector("#codex-close"))==null||n.addEventListener("click",i),s.addEventListener("click",r=>{r.target===s&&i()})}openAchievementsCodex(){var n;const e=Nt(this.playerName),t=Ke.map(r=>e.has(r.id)?`
          <div class="codex-card found codex-achievement">
            <div class="codex-card-head">
              <span class="codex-card-icon">★</span>
              <span class="codex-card-name">${D(r.name)}</span>
            </div>
            <div class="codex-card-eyebrow">${D(r.eyebrow)}</div>
            <p class="codex-card-desc">${D(r.description)}</p>
          </div>
        `:`
        <div class="codex-card locked">
          <div class="codex-card-head">
            <span class="codex-card-icon">·</span>
            <span class="codex-card-name">???</span>
          </div>
          <p class="codex-card-desc">Locked. Keep playing to unlock.</p>
        </div>
      `).join(""),s=document.createElement("div");s.className="modal-overlay codex-overlay",s.innerHTML=`
      <div class="modal codex-modal">
        <button class="modal-close" id="codex-close" type="button">✕</button>
        <div class="codex-eyebrow">— Field Reference —</div>
        <h2 class="modal-title">Achieve<em>ments</em></h2>
        <div class="codex-progress">${e.size} / ${Ke.length} unlocked</div>
        <div class="codex-grid">${t}</div>
      </div>
    `,document.body.appendChild(s);const i=()=>s.remove();(n=s.querySelector("#codex-close"))==null||n.addEventListener("click",i),s.addEventListener("click",r=>{r.target===s&&i()})}wireHtpPager(e){const t=e.querySelector(".htp-book");if(!t)return;const s=Array.from(t.querySelectorAll(".htp-page")),i=Array.from(t.querySelectorAll(".htp-pip")),n=t.querySelector("#htp-prev"),r=t.querySelector("#htp-next"),o=s.length-1,l=d=>{const p=Math.max(0,Math.min(o,d));t.dataset.page=String(p),s.forEach((u,h)=>{u.hidden=h!==p,h===p?u.classList.add("htp-page-in"):u.classList.remove("htp-page-in")}),i.forEach((u,h)=>u.classList.toggle("active",h===p)),n.disabled=p===0,r.textContent=p===o?"Close":"Next ›",t.scrollTop=0};n.addEventListener("click",()=>l(Number(t.dataset.page??0)-1)),r.addEventListener("click",()=>{const d=Number(t.dataset.page??0);d===o?(e.classList.add("hidden"),l(0)):l(d+1)}),i.forEach(d=>d.addEventListener("click",()=>l(Number(d.dataset.pip)))),new MutationObserver(()=>{e.classList.contains("hidden")||l(0)}).observe(e,{attributes:!0,attributeFilter:["class"]})}renderHTML(){return`
      <div class="start-screen screen">
        <div class="start-content">

          <!-- Headline: eyebrow + big title | side note -->
          <div class="game-logo">
            <div>
              <div class="logo-subtitle">Issue 001 · Field Guide Edition</div>
              <h1 class="logo-title">A <em>ROGUELIKE</em><br>GAUNTLET.</h1>
            </div>
            <div class="start-issue">
              <b>How it works</b>
              Choose a starter. Clear waves.<br>
              Pick rewards. Survive longer than<br>
              the last person who tried.
            </div>
          </div>

          <!-- Logged-in user banner -->
          <div class="start-user-banner">
            <div class="start-user-name">
              <span class="kicker">${this.isGuest?"Playing as guest":"Logged in as"}</span>
              ${D(this.playerName)}
            </div>
            <button class="trainer-chip" id="trainer-chip" type="button" title="Click to switch trainer">
              <span class="tc-sprite-wrap">
                <img class="tc-sprite" src="${us(this.trainerGender)}" alt="" draggable="false" />
              </span>
              <span class="tc-meta">
                <span class="tc-kicker">Trainer</span>
                <span class="tc-name">${ba[this.trainerGender]} ${this.trainerGender==="male"?"♂":"♀"}</span>
              </span>
              <span class="tc-swap" aria-hidden="true">↻</span>
            </button>
            <button class="ink-btn ghost sm" id="logout-btn" style="font-size:11px">
              ${this.isGuest?"← Back":"Log out"}
            </button>
          </div>

          ${this.renderResumeBanner()}
          ${this.renderBadgeTrophyStrip()}

          <!-- Field Reference strip (Take-3 Slice 3 final position) -->
          ${this.renderThreeCellStrip()}

          <!-- Starter selection -->
          <div class="starter-section">
            <div class="starter-heading">
              <div class="h">Choose your starter</div>
              <div class="s">${this.starterData.length} available · press A to confirm</div>
            </div>
            <div class="starter-carousel">
              <button class="starter-nav prev" id="starter-prev" type="button" aria-label="Previous starter">‹</button>
              <div class="starter-grid" id="starter-grid">
                ${this.starterData.map((e,t)=>`
                  <div
                    class="creature-card ${t===this.selectedStarterIndex?"selected":""}"
                    data-starter="${t}"
                    role="button"
                    tabindex="0"
                    style="--card-hover-rot:${t%2===0?"1.2":"-1.2"}deg"
                  >
                    <div class="card-head">
                      <span class="dex">№ ${String(e.id).padStart(3,"0")}</span>
                      <span class="bst starter-bst">BST …</span>
                    </div>
                    <div class="sprite-frame">
                      <img src="${e.sprite}" alt="${e.displayName}" />
                    </div>
                    <div class="card-foot">
                      <div class="name">${e.displayName}</div>
                      <div class="types starter-types"><!-- loaded async --></div>
                    </div>
                  </div>
                `).join("")}
              </div>
              <button class="starter-nav next" id="starter-next" type="button" aria-label="Next starter">›</button>
            </div>
            <div class="starter-dots" id="starter-dots" role="tablist">
              ${this.starterData.map((e,t)=>`
                <button class="starter-dot ${t===this.selectedStarterIndex?"active":""}"
                        data-dot="${t}" type="button" aria-label="Select starter ${t+1}"></button>
              `).join("")}
            </div>
          </div>

          <!-- Footer -->
          <div class="start-footer">
            <div class="logo-subtitle kb-hints" style="text-transform:uppercase;letter-spacing:.08em">
              ► D-pad select<br>► Start begins run
            </div>
            <div style="display:flex;gap:10px;justify-self:center;flex-wrap:wrap;align-items:center">
              <button class="ink-btn ghost" id="howtoplay-btn">How to play</button>
              <button class="ink-btn ghost" id="leaderboard-btn">Leaderboard</button>
              <button class="ink-btn ghost" id="settings-btn" title="Display + audio settings">⚙ Settings</button>
              <a class="ink-btn ghost donate-chip" id="donate-link" href="${vr(oo)}" target="_blank" rel="noopener noreferrer" title="Support server costs">♥ Support</a>
              <button class="ink-btn primary" id="start-btn">Begin run →</button>
            </div>
            <div class="logo-subtitle" style="text-align:right;letter-spacing:.08em;text-transform:uppercase">
              Trainer · ${D(this.playerName)}<br>Wave — · —¢
              <a href="#" id="legal-btn" class="footer-legal-link">Legal &amp; Disclaimer</a>
            </div>
          </div>

        </div>

        <!-- Settings Modal -->
        ${this.renderSettingsModal()}

        <!-- Legal / Disclaimer Modal -->
        <div class="modal-overlay hidden" id="legal-modal">
          <div class="modal htp-modal">
            <button class="modal-close" id="close-legal">✕</button>
            <div class="htp-eyebrow">Fan Project · Non-Commercial</div>
            <h2 class="modal-title">Legal &amp;<br><em>Disclaimer</em></h2>
            <div class="htp-block" style="margin-top:12px">
              <p>PokéRun is a free, fan-made tribute. <b>Pokémon</b> and all associated names, sprites, and trademarks are property of <b>Nintendo</b>, <b>Game Freak</b>, and <b>The Pokémon Company</b>. This project is not affiliated with, endorsed, or sponsored by them.</p>
              <p>Sprites are loaded from public APIs (PokéAPI). No copyrighted assets are bundled. No money is made from this game.</p>
              <p>If you are a rights-holder and want this taken down — please reach out via the donation page. We will comply.</p>
            </div>
            <div class="htp-tips">
              <div class="htp-label">Donations</div>
              <p>Donations cover server costs only and grant no in-game advantage. They are voluntary tips and not a purchase of any product or licence.</p>
            </div>
          </div>
        </div>

        <!-- How to Play Modal -->
        <div class="modal-overlay hidden" id="howtoplay-modal">
          <div class="modal htp-modal htp-book" data-page="0">
            <button class="modal-close" id="close-howtoplay">✕</button>

            <!-- Page 0 — Cover -->
            <div class="htp-page htp-cover" data-page="0">
              <div class="htp-cover-stamp">Vol. 01</div>
              <div class="htp-eyebrow">Field Manual · Issue 001</div>
              <h2 class="modal-title">How to<br><em>Play</em></h2>
              <div class="htp-cover-meta">
                <span>6 chapters</span>
                <span class="htp-cover-dot">·</span>
                <span>~ 4 min read</span>
                <span class="htp-cover-dot">·</span>
                <span>Trainer-grade</span>
              </div>
              <p class="htp-cover-blurb">A pocket guide to surviving Kanto's longest gauntlet. Read it, fold it, lose it in your bag — works either way.</p>
              <button class="ink-btn primary htp-tour-cta" id="htp-take-tour" type="button">▶ Take the interactive tour</button>
              <div class="htp-cover-toc">
                <div class="htp-label">Contents</div>
                <ol>
                  <li><span>01</span> The Run</li>
                  <li><span>02</span> Battle Basics</li>
                  <li><span>03</span> Rewards &amp; Path</li>
                  <li><span>04</span> Items &amp; Bag</li>
                  <li><span>05</span> Arenas &amp; Badges</li>
                  <li><span>06</span> Field Notes</li>
                </ol>
              </div>
            </div>

            <!-- Page 1 — The Run -->
            <div class="htp-page" data-page="1" hidden>
              <div class="htp-eyebrow">Chapter 01</div>
              <h3 class="htp-chapter-title">The <em>Run</em></h3>
              <p class="htp-lede">A run is a single life. Survive waves, clear three acts, capture badges. When your team faints — that's the run.</p>
              <ul class="htp-flow">
                <li><b>Pick a starter.</b> One mon, level 8. Your seed.</li>
                <li><b>Walk a path.</b> Each act branches: battles, shops, arenas, events.</li>
                <li><b>Clear waves.</b> Win fights, earn coins &amp; rewards.</li>
                <li><b>Beat arenas.</b> Eight gym leaders gate the acts. Win → badge.</li>
                <li><b>Face the Elite.</b> Final 4 + Champion close the run.</li>
              </ul>
              <div class="htp-tips">
                <div class="htp-label">Score</div>
                <p>Run score = waves cleared. Badges add a multiplier. Leaderboard ranks your best.</p>
              </div>
            </div>

            <!-- Page 2 — Battle Basics -->
            <div class="htp-page" data-page="2" hidden>
              <div class="htp-eyebrow">Chapter 02</div>
              <h3 class="htp-chapter-title">Battle <em>Basics</em></h3>
              <div class="htp-grid htp-grid-2">
                <div class="htp-block">
                  <div class="htp-label">Turn order</div>
                  <p>Speed decides who strikes first. Priority moves cut the line.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Type chart</div>
                  <p>Super-effective hits do <b>2×</b>. Resisted hits do <b>½×</b>. Stack types — coverage wins fights.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Status</div>
                  <p>Burn, poison, sleep, paralyse, freeze. Cure with items or switch out.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Auto-Battle</div>
                  <p>Battles resolve automatically — your team picks moves based on type matchups, items, and HP. Toggle <kbd>A</kbd> to pause and read the log.</p>
                </div>
              </div>
              <div class="htp-tips">
                <div class="htp-label">Move roster</div>
                <p>When a mon learns a new move with a full set, the picker pops up — choose what to forget or stash it in the move pool. The team-panel <b>☰</b> button opens the manager any time.</p>
              </div>
            </div>

            <!-- Page 3 — Rewards & Path -->
            <div class="htp-page" data-page="3" hidden>
              <div class="htp-eyebrow">Chapter 03</div>
              <h3 class="htp-chapter-title">Rewards &amp; <em>Path</em></h3>
              <p class="htp-lede">After every fight: pick one of three cards — or skip for coins.</p>
              <div class="htp-cardrow">
                <div class="htp-card-mock"><div class="htp-cm-label">Mon</div><div class="htp-cm-tag">+1 to team</div></div>
                <div class="htp-card-mock"><div class="htp-cm-label">Perk</div><div class="htp-cm-tag">Team buff</div></div>
                <div class="htp-card-mock"><div class="htp-cm-label">Item</div><div class="htp-cm-tag">Bag &amp; held</div></div>
              </div>
              <div class="htp-grid htp-grid-2">
                <div class="htp-block">
                  <div class="htp-label">Skip</div>
                  <p>Take no card → <b>+60¢</b>. Build a war chest for the shop.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Boss waves</div>
                  <p>Wave 5, 10, 15… higher rarity drops. Save your skips for normal waves.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Path nodes</div>
                  <p>Battle · Elite · Shop · Event · Heal · Arena. Plan two steps ahead.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Events</div>
                  <p>Random encounters: gambles, gifts, dilemmas. Read carefully.</p>
                </div>
              </div>
            </div>

            <!-- Page 4 — Items & Bag -->
            <div class="htp-page" data-page="4" hidden>
              <div class="htp-eyebrow">Chapter 04</div>
              <h3 class="htp-chapter-title">Items &amp; <em>Bag</em></h3>
              <p class="htp-lede">Your bag holds <b>5 consumables</b>. Use them mid-battle. Held items live on a Pokémon and trigger automatically.</p>
              <div class="htp-bag-mock" aria-hidden="true">
                <span class="htp-slot filled">Potion</span>
                <span class="htp-slot filled">Revive</span>
                <span class="htp-slot filled">X-Atk</span>
                <span class="htp-slot">·</span>
                <span class="htp-slot">·</span>
              </div>
              <div class="htp-grid htp-grid-2">
                <div class="htp-block">
                  <div class="htp-label">Consumables</div>
                  <p>Potions, Revives, status cures, X-stat boosters, Berries. One-shot — once spent, gone.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Held items</div>
                  <p>Leftovers, Choice Band, Focus Sash, type plates. Each mon has up to <b>5 slots</b> — slot 1 is free, the rest unlock with coins as you level.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Perks</div>
                  <p>Team-wide passives. Stack with held items. Picked from rewards.</p>
                </div>
                <div class="htp-block">
                  <div class="htp-label">Shop</div>
                  <p>Between waves. Consumables, held items, sometimes a rare mon. Coins only.</p>
                </div>
              </div>
            </div>

            <!-- Page 5 — Arenas -->
            <div class="htp-page" data-page="5" hidden>
              <div class="htp-eyebrow">Chapter 05</div>
              <h3 class="htp-chapter-title">Arenas &amp; <em>Badges</em></h3>
              <p class="htp-lede">An arena is a four-stage gauntlet. HP carries over — pack potions or grab a Pokémon Center node first.</p>
              <ol class="htp-gauntlet">
                <li><b>Junior trainer</b> — warm-up</li>
                <li><b>Restock shop</b> — discounted consumables</li>
                <li><b>Senior trainer</b> — same type, bigger team</li>
                <li><b>Gym leader</b> — boss fight, type-locked</li>
              </ol>
              <div class="htp-tips">
                <div class="htp-label">Badges</div>
                <p>Eight leaders, eight badges. Each unlocks a permanent perk (level cap, evolution, status res). Badges persist on your run-save until the run ends.</p>
              </div>
            </div>

            <!-- Page 6 — Field Notes -->
            <div class="htp-page" data-page="6" hidden>
              <div class="htp-eyebrow">Chapter 06</div>
              <h3 class="htp-chapter-title">Field <em>Notes</em></h3>
              <div class="htp-tips">
                <div class="htp-label">Pro tips · learned the hard way</div>
                <ul>
                  <li>Type diversity beats raw stats — always have an answer</li>
                  <li>Held items stack with perks. Combine deliberately</li>
                  <li>Hoard Revives &amp; Full Restores for bosses</li>
                  <li>Pause the auto-battle (<kbd>A</kbd>) to inspect the log between turns</li>
                  <li>Skip early waves for coins · spend before arenas</li>
                  <li>Read the leader's type before walking in — counter-build</li>
                  <li>Lose a mon? Don't panic. The bag is your second team</li>
                </ul>
              </div>
              <div class="htp-end">— end of manual —<br>good luck out there.</div>
            </div>

            <!-- Pager -->
            <div class="htp-pager">
              <button class="ink-btn ghost sm" id="htp-prev" type="button" disabled>‹ Prev</button>
              <div class="htp-pips" id="htp-pips" role="tablist" aria-label="Chapters">
                <button class="htp-pip active" data-pip="0" type="button" aria-label="Cover"></button>
                <button class="htp-pip" data-pip="1" type="button" aria-label="The Run"></button>
                <button class="htp-pip" data-pip="2" type="button" aria-label="Battle"></button>
                <button class="htp-pip" data-pip="3" type="button" aria-label="Rewards"></button>
                <button class="htp-pip" data-pip="4" type="button" aria-label="Items"></button>
                <button class="htp-pip" data-pip="5" type="button" aria-label="Arenas"></button>
                <button class="htp-pip" data-pip="6" type="button" aria-label="Notes"></button>
              </div>
              <button class="ink-btn primary sm" id="htp-next" type="button">Next ›</button>
            </div>
          </div>
        </div>
      </div>
    `}attachEvents(){var C,L;const e=this.container.querySelector("#start-btn"),t=this.container.querySelector("#leaderboard-btn"),s=this.container.querySelector("#howtoplay-btn"),i=this.container.querySelector("#howtoplay-modal"),n=this.container.querySelector("#close-howtoplay"),r=this.container.querySelector("#logout-btn"),o=this.container.querySelector("#trainer-chip");o==null||o.addEventListener("click",()=>{this.trainerGender=this.trainerGender==="male"?"female":"male";const S=o.querySelector(".tc-sprite"),E=o.querySelector(".tc-name");S&&(S.src=us(this.trainerGender)),E&&(E.textContent=`${ba[this.trainerGender]} ${this.trainerGender==="male"?"♂":"♀"}`),o.classList.remove("pulse"),o.offsetWidth,o.classList.add("pulse")});const l=this.container.querySelector("#starter-grid"),c=(S,E=!1)=>{if(S=Math.max(0,Math.min(this.starterData.length-1,S)),this.selectedStarterIndex=S,this.container.querySelectorAll("[data-starter]").forEach((y,$)=>{y.classList.toggle("selected",$===S)}),this.container.querySelectorAll("[data-dot]").forEach((y,$)=>{y.classList.toggle("active",$===S)}),E&&l){const y=l.querySelector(`[data-starter="${S}"]`);y==null||y.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})}};if(this.container.querySelectorAll("[data-starter]").forEach(S=>{S.addEventListener("click",()=>{const E=parseInt(S.dataset.starter??"0");c(E,!0)}),S.addEventListener("keydown",E=>{E.key==="Enter"&&S.click()})}),this.container.querySelectorAll("[data-dot]").forEach(S=>{S.addEventListener("click",()=>{const E=parseInt(S.dataset.dot??"0");c(E,!0)})}),(C=this.container.querySelector("#starter-prev"))==null||C.addEventListener("click",()=>{c(this.selectedStarterIndex-1,!0)}),(L=this.container.querySelector("#starter-next"))==null||L.addEventListener("click",()=>{c(this.selectedStarterIndex+1,!0)}),l){let S=null;l.addEventListener("scroll",()=>{S!=null&&window.clearTimeout(S),S=window.setTimeout(()=>{const E=Array.from(l.querySelectorAll("[data-starter]"));if(E.length===0)return;const y=l.scrollLeft+l.clientWidth/2;let $=0,H=1/0;E.forEach((W,K)=>{const N=W.offsetLeft+W.offsetWidth/2,z=Math.abs(N-y);z<H&&(H=z,$=K)}),$!==this.selectedStarterIndex&&c($,!1)},90)},{passive:!0})}e.addEventListener("click",()=>this.handleStart()),t.addEventListener("click",()=>{this.container.dispatchEvent(new CustomEvent("show-leaderboard"))}),s.addEventListener("click",()=>i.classList.remove("hidden")),n.addEventListener("click",()=>i.classList.add("hidden")),i.addEventListener("click",S=>{S.target===i&&i.classList.add("hidden")}),document.addEventListener("keydown",S=>{S.key==="Escape"&&!i.classList.contains("hidden")&&i.classList.add("hidden")}),this.wireHtpPager(i);const d=this.container.querySelector("#htp-take-tour");d==null||d.addEventListener("click",()=>{i.classList.add("hidden"),wr(),window.setTimeout(()=>ro(!0),220)});const p=this.container.querySelector("#legal-btn"),u=this.container.querySelector("#open-legal-btn"),h=this.container.querySelector("#legal-modal"),m=this.container.querySelector("#settings-modal"),v=this.container.querySelector("#close-legal");p==null||p.addEventListener("click",S=>{S.preventDefault(),h==null||h.classList.remove("hidden")}),u==null||u.addEventListener("click",()=>{m==null||m.classList.add("hidden"),h==null||h.classList.remove("hidden")}),v==null||v.addEventListener("click",()=>h==null?void 0:h.classList.add("hidden")),h==null||h.addEventListener("click",S=>{S.target===h&&h.classList.add("hidden")}),r==null||r.addEventListener("click",()=>{Zn(),this.onLogout()});const g=this.container.querySelector("#settings-btn"),w=this.container.querySelector("#settings-modal"),A=this.container.querySelector("#close-settings");g==null||g.addEventListener("click",()=>w==null?void 0:w.classList.remove("hidden")),A==null||A.addEventListener("click",()=>w==null?void 0:w.classList.add("hidden")),w==null||w.addEventListener("click",S=>{S.target===w&&w.classList.add("hidden")});const x=this.container.querySelector("#reset-tutorial-btn");x==null||x.addEventListener("click",()=>{br();const S=this.container.querySelector("#howtoplay-modal"),E=this.container.querySelector("#settings-modal");E==null||E.classList.add("hidden"),S==null||S.classList.remove("hidden")}),this.wireThreeCellStripEvents();const T=this.container.querySelector("#setting-reduce-motion");T==null||T.addEventListener("change",()=>{const S=be();rt({...S,reduceMotion:!!T.checked})}),this.container.querySelectorAll("#setting-speed [data-speed]").forEach(S=>{S.addEventListener("click",()=>{const E=parseFloat(S.dataset.speed??"1"),y=be();rt({...y,animationSpeed:E}),this.container.querySelectorAll("#setting-speed [data-speed]").forEach($=>$.classList.toggle("active",$===S))})});const P=this.container.querySelector("#resume-btn"),I=this.container.querySelector("#resume-discard");P==null||P.addEventListener("click",()=>{var S;(S=this.onResume)==null||S.call(this)}),I==null||I.addEventListener("click",()=>{hs();const S=this.container.querySelector(".resume-banner");S==null||S.remove()})}async handleStart(){var s;hs();const e=this.starterData[this.selectedStarterIndex],t=this.container.querySelector("#start-btn");t.disabled=!0,t.textContent="Loading...";try{const i=await ot(e.id,8),n=ye(i,[]),r={};let o=0;const l=[];this.selectedDeck==="speedrunner"?(o=100,l.push({itemId:"reroll_token",qty:1}),r.stagesPerAct=3):this.selectedDeck==="iron_trainer"?(r.shopExcludeConsumables=!0,r.startWithSlot2=!0,(s=n.itemSlots)!=null&&s[1]&&(n.itemSlots[1].unlocked=!0)):this.selectedDeck==="mono_type"&&(r.monoType=this.selectedMonoType,r.monoDamageBoost=!0);const c=l.map(({itemId:p,qty:u})=>{const h=Z.find(m=>m.id===p);return h?{item:h,quantity:u}:null}).filter(p=>p!=null),d={phase:"wave_intro",playerName:this.playerName,trainerGender:this.trainerGender,wave:1,coins:100+o,team:[n],pc:[],pendingCatch:null,inventory:c,activePerks:[],battleState:null,pendingRewards:[],shopItems:[],shopPacks:[],shopVouchers:[],runStats:{wavesCleared:0,totalKOs:0,itemsCollected:0,perksCollected:0,starterName:i.displayName,starterId:i.id,totalDamageDealt:0,chainKOCount:0},godModeAvailable:!1,zMovesAvailable:0,teamRewards:[],nextBossWave:5+Math.floor(Math.random()*3),vouchers:[],pendingWaveTag:null,queuedTags:[],investmentCoins:0,typeLevels:{},totalCoinsEarned:0,currentAct:1,actStep:0,nodeOptions:[],currentNode:null,badges:[],generation:"gen1",leagueStep:0,pendingGenGate:!1,actBossBlind:null,leagueBlinds:[],deck:this.selectedDeck,deckMods:r,stake:this.selectedStake,stakeMods:so(this.selectedStake)};this.onStart(d)}catch(i){t.disabled=!1,t.textContent="START GAUNTLET",console.error("Failed to load starter:",i)}}unmount(){var e;(e=this.destroyAudioBtn)==null||e.call(this),this.destroyAudioBtn=null,document.body.classList.remove("start-active"),this.container.style.display="none",this.container.innerHTML=""}}let Pe=null,Bt=null;function Os(){return Pe||(Pe=document.createElement("div"),Pe.className="game-tooltip",Pe.style.display="none",Pe.setAttribute("aria-hidden","true"),document.body.appendChild(Pe)),Pe}function co(a){const e=Os();e.style.visibility="hidden",e.style.display="block";const t=a.getBoundingClientRect(),s=e.offsetWidth,i=e.offsetHeight;let n=t.top-i-10,r=t.left+t.width/2-s/2;n<8&&(n=t.bottom+8),r=Math.max(8,Math.min(r,window.innerWidth-s-8)),e.style.top=`${n}px`,e.style.left=`${r}px`,e.style.visibility=""}function wt(a,e){Bt&&(clearTimeout(Bt),Bt=null);const t=Os();t.innerHTML=e,co(a)}function ss(a=80){Bt=setTimeout(()=>{const e=Os();e.style.display="none"},a)}const po={common:"var(--ink-3)",rare:"#2272c3",epic:"#6a26c8",legendary:"#c8920a"};function xa(a){const e=po[a.rarity]??"var(--ink-3)",t=a.itemType==="held"?"HELD ITEM":"CONSUMABLE";return`
    <div class="tt-eyebrow" style="color:${e}">${a.rarity.toUpperCase()} · ${t}</div>
    <div class="tt-name">${a.name}</div>
    <div class="tt-desc">${a.description}</div>
  `}function Ma(a){return`
    <div class="tt-syn-row">
      <span class="tt-syn-icon">${a.icon}</span>
      <span class="tt-name">${a.name}</span>
      <span class="tt-mult">×${a.multiplier.toFixed(2)}</span>
    </div>
    <div class="tt-desc">${a.description}</div>
  `}function uo(a,e,t){a.addEventListener("mouseover",s=>{const i=s.target,n=i.closest("[data-tooltip-item-id]");if(n){const o=e(n.dataset.tooltipItemId??"");o&&wt(n,xa(o));return}const r=i.closest("[data-synergy-id]");if(r){const o=t().find(l=>l.id===r.dataset.synergyId);o&&wt(r,Ma(o))}}),a.addEventListener("mouseout",s=>{const i=s.relatedTarget;i!=null&&i.closest("[data-tooltip-item-id],[data-synergy-id]")||ss()}),a.addEventListener("touchstart",s=>{const i=s.target,n=i.closest("[data-tooltip-item-id]");if(n){const o=e(n.dataset.tooltipItemId??"");o&&(wt(n,xa(o)),ss(1800));return}const r=i.closest("[data-synergy-id]");if(r){const o=t().find(l=>l.id===r.dataset.synergyId);o&&(wt(r,Ma(o)),ss(1800))}},{passive:!0})}function $t(a,e,t){const s=a.battleStatus?`<div class="bic-status-badge status-${a.battleStatus}">${ho(a.battleStatus)}</div>`:"",i=mo(a),n=t==="player"?Math.min(100,(a.xp??0)/Math.max(1,a.xpToNextLevel??1)*100):0,r=t==="player"?`<div class="battle-xp-bar"><div class="battle-xp-fill" id="${e}-xp-fill" style="width:${n}%"></div></div>`:"",o=a.types.length?`<div class="bic-types">${a.types.map(p=>`<span class="bic-type type-${p}">${p.toUpperCase()}</span>`).join("")}</div>`:"",l=Math.max(0,Math.min(100,a.battleHp/a.maxBattleHp*100)),c=l>50?"hp-high":l>25?"hp-mid":"hp-low",d=a.isElite?'<span class="bic-elite" title="Elite — drops 2× coins">★ ELITE</span>':"";return`
    <div class="battle-info-card ${t}-info${a.isElite?" is-elite":""}" id="${e}-info-card">
      <div class="bic-header">
        <span class="bic-name">${a.displayName}${d}</span>
        <span class="bic-level">LV · ${a.level}</span>
      </div>
      ${o}
      <div class="bic-hp-row">
        <div class="bic-hp-bar-track">
          <div class="bic-hp-fill ${c}" id="${e}-hp-fill" style="width:${l}%"></div>
        </div>
        <div class="bic-hp-num" id="${e}-hp-label">${Math.max(0,a.battleHp)}/${a.maxBattleHp}</div>
      </div>
      ${r}
      <div class="bic-bottom">
        ${s}
        ${i}
      </div>
      <div class="battle-info-teambar" id="${e}-team-bar"></div>
    </div>
  `}function xt(a,e){return`
    <img
      id="${e}-sprite"
      class="battle-sprite"
      src="${a.animatedSprite}"
      alt="${a.displayName}"
      onerror="this.src='${a.sprite}'"
    />
  `}function ho(a){return{burn:"BRN",poison:"PSN",badPoison:"TOX",paralysis:"PAR",sleep:"SLP",freeze:"FRZ",confusion:"CNF"}[a]??"???"}function mo(a){const e=a.statStages,t=[],s=(i,n,r)=>{r>0?t.push(`<span class="stage-up">▲${n}+${r}</span>`):r<0&&t.push(`<span class="stage-down">▼${n}${r}</span>`)};return s("atk","ATK",e.attack),s("def","DEF",e.defense),s("spa","SPA",e.spAtk),s("spd","SPD",e.spDef),s("spe","SPE",e.speed),t.length?`<div class="stage-indicators">${t.join("")}</div>`:""}function Ta(a,e,t){return`
    <div class="team-bar ${t}">
      ${a.map((s,i)=>`
        <div class="team-ball ${s.battleHp<=0?"fainted":""} ${i===e?"active":""}"
             title="${s.displayName} (${s.battleHp}/${s.maxBattleHp})">
        </div>
      `).join("")}
    </div>
  `}function fo(a,e){const t=document.createElement("div");t.className=`log-entry log-${e.type} latest`,t.textContent=e.text,a.appendChild(t);const s=a.querySelectorAll(".log-entry");s.length>8&&s[0].remove(),a.scrollTop=a.scrollHeight,t.style.opacity="0",t.style.transform="translateY(5px)",requestAnimationFrame(()=>{t.style.transition="opacity 0.2s, transform 0.2s",t.style.opacity="1",t.style.transform="translateY(0)"}),s.forEach((i,n)=>{n<s.length-1&&i.classList.remove("latest")})}function Be(a){return`<span class="type-badge" data-type="${a}">${a.toUpperCase()}</span>`}function ct(a){return a.map(Be).join("")}function Hi(a,e){return new Promise(t=>{const s=document.createElement("div");s.className="mlp-overlay",document.body.appendChild(s),requestAnimationFrame(()=>s.classList.add("active"));const i=[...e];let n=0;const r=()=>{s.classList.remove("active"),setTimeout(()=>{s.remove(),document.removeEventListener("keydown",l),t()},200)},o=()=>{s.innerHTML=vo(a,i,n)},l=c=>{if(c.key==="Escape"){for(const d of i)gt(a,d,-1);i.length=0,r()}};document.addEventListener("keydown",l),s.addEventListener("click",c=>{const d=c.target,p=d.closest("[data-pending-idx]");if(p){n=parseInt(p.dataset.pendingIdx,10),o();return}if(d.closest("[data-skip-armed]")){const h=i[n];h&&(gt(a,h,-1),i.splice(n,1),n=Math.min(n,i.length-1),i.length===0?r():o());return}if(d.closest("[data-skip-all]")){for(const h of i)gt(a,h,-1);i.length=0,r();return}const u=d.closest("[data-slot-idx]");if(u){const h=i[n];if(!h)return;const m=parseInt(u.dataset.slotIdx,10);gt(a,h,m),i.splice(n,1),n=Math.min(n,i.length-1),i.length===0?r():o();return}}),o()})}function vo(a,e,t){const s=a.moves.slice(0,4);for(;s.length<4;)s.push(null);const i=e[t],n=s.some(r=>!r);return`
    <div class="mlp-card mlp-batch">
      <div class="mlp-rule"></div>
      <div class="mlp-eyebrow">Field Manual · ${e.length} New Move${e.length===1?"":"s"}</div>
      <div class="mlp-headline">
        <img src="${a.sprite}" alt="" class="mlp-sprite" />
        <div>
          <div class="mlp-name">${a.displayName}</div>
          <div class="mlp-sub">Lv. ${a.level} · pick which moves to keep</div>
        </div>
      </div>

      <div class="mlp-batch-body">
        <div class="mlp-batch-col">
          <div class="mlp-col-head">New moves <span class="mlp-col-meta">${e.length} pending</span></div>
          <div class="mlp-pending-list">
            ${e.map((r,o)=>yo(r,o,o===t)).join("")}
          </div>
          ${i?`
            <div class="mlp-armed-actions">
              <button class="ink-btn ghost" data-skip-armed>Stash "${i.displayName}" in pool</button>
            </div>
          `:""}
        </div>

        <div class="mlp-batch-col">
          <div class="mlp-col-head">Current slots <span class="mlp-col-meta">${n?"free slot available":"tap to replace"}</span></div>
          <div class="mlp-grid">
            ${s.map((r,o)=>go(r,o,!!i)).join("")}
          </div>
        </div>
      </div>

      ${i?`
        <div class="mlp-instruct">Tap a slot to teach <strong>${i.displayName}</strong> there.</div>
      `:`
        <div class="mlp-instruct">Pick a new move on the left, then choose where it lands.</div>
      `}

      <div class="mlp-actions">
        <button class="ink-btn ghost" data-skip-all>Skip all · stash to Move Pool</button>
      </div>
      <div class="mlp-foot">Skipped moves go to the Move Pool — swap them in any time from the team panel.</div>
    </div>
  `}function yo(a,e,t){return`
    <button class="mlp-pending${t?" armed":""}" data-pending-idx="${e}">
      <div class="mlp-pending-name">${a.displayName}</div>
      <div class="mlp-pending-meta">
        ${Be(a.type)}
        <span class="mlp-stat">PWR ${a.power||"—"}</span>
        <span class="mlp-stat">ACC ${a.accuracy||"—"}</span>
        <span class="mlp-stat">${a.category.toUpperCase()}</span>
      </div>
    </button>
  `}function go(a,e,t){return a?`
    <button class="mlp-slot${t?" targetable":""}" data-slot-idx="${e}" ${t?"":"disabled"}>
      <div class="mlp-slot-num">Slot ${e+1}</div>
      <div class="mlp-slot-name">${a.displayName}</div>
      <div class="mlp-slot-meta">
        ${Be(a.type)}
        <span class="mlp-stat">PWR ${a.power||"—"}</span>
        <span class="mlp-stat">ACC ${a.accuracy||"—"}</span>
      </div>
      <div class="mlp-slot-cta">${t?"Replace →":""}</div>
    </button>
  `:`
      <button class="mlp-slot mlp-slot-empty${t?" targetable":""}" data-slot-idx="${e}" ${t?"":"disabled"}>
        <div class="mlp-slot-num">Slot ${e+1}</div>
        <div class="mlp-slot-name">— empty —</div>
        <div class="mlp-slot-cta">${t?"Teach here →":"Free"}</div>
      </button>
    `}async function bo(a){var e;for(const t of a){if(!((e=t.pendingLearns)!=null&&e.length))continue;const s=[...t.pendingLearns];await Hi(t,s)}}const ko="/".replace(/\/$/,""),So="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/";function Mt(a,e=""){const t=e?" "+e:"";return a.pokeapiName?`<img src="${So}${a.pokeapiName}.png" alt="${a.name}" class="item-sprite${t}" draggable="false">`:a.sprite?`<img src="${ko}${a.sprite}" alt="${a.name}" class="item-sprite${t}" draggable="false">`:`<span class="item-glyph${t}">${a.icon}</span>`}class wo{constructor(e,t,s){b(this,"container");b(this,"state");b(this,"onBattleEnd");b(this,"isAnimating",!1);b(this,"autoInterval",null);b(this,"isFirstMove",!0);b(this,"activeSynergies",[]);b(this,"xpStart",[]);this.container=e,this.state=t,this.onBattleEnd=s}mount(){var s,i;if(!this.state.battleState)return;const e=this.state.battleState;if(e.autoBattle=!0,hi()&&this.state.wave===1&&e.enemyTeam.forEach(n=>{n.battleHp=1,n.maxBattleHp=Math.max(1,Math.min(n.maxBattleHp,1)),n.effectiveStats.attack=Math.max(1,Math.floor(n.effectiveStats.attack*.4)),n.effectiveStats.spAtk=Math.max(1,Math.floor(n.effectiveStats.spAtk*.4))}),((s=e.playerTeam[e.activePlayerIndex])==null?void 0:s.battleHp)<=0){const n=e.playerTeam.findIndex(r=>r.battleHp>0);n>=0&&(e.activePlayerIndex=n)}if(((i=e.enemyTeam[e.activeEnemyIndex])==null?void 0:i.battleHp)<=0){const n=e.enemyTeam.findIndex(r=>r.battleHp>0);n>=0&&(e.activeEnemyIndex=n)}this.xpStart=this.state.battleState.playerTeam.map(n=>({level:n.level,xp:n.xp,xpToNextLevel:n.xpToNextLevel})),document.body.classList.add("battle-active"),this.container.innerHTML=this.renderHTML(),this.container.style.display="",oe(this.container),this.attachEvents(),this.renderMoveButtons(),this.renderTeamPortraits(),this.renderBattleTeamStrip(),this.refreshSynergyBar();const t=this.container.querySelector("#player-active-sprite");t&&O.set(t,{scaleX:-1})}renderHTML(){const e=this.state.battleState,t=e.playerTeam[e.activePlayerIndex],s=e.enemyTeam[e.activeEnemyIndex],i=this.state.wave,n=e.isBossWave,r=this.state.activePerks.some(o=>o.id==="god_mode")&&this.state.godModeAvailable?'<button class="ink-btn danger sm" id="god-mode-btn">↯ GOD MODE</button>':"";return`
      <div class="battle-wrap screen" id="battle-screen-inner">

        <!-- TopStrip: wave-chip | team-dots | coin-chip -->
        <div class="topstrip${n?" boss":""}">
          <div class="wave-chip${n?" boss":""}">
            <span class="wlabel">${n?"Boss wave":"Wave"}</span>
            <span class="wnum">${String(i).padStart(2,"0")}</span>
          </div>
          <div class="team-dots" id="hud-team-pills">
            ${this.renderTeamDots()}
          </div>
          <div class="coin-chip">
            <span class="coin-dot"></span>
            <span id="coin-display">${this.state.coins.toLocaleString()}</span>
          </div>
        </div>

        ${this.renderBossBlindBanner()}

        <!-- Active Perks Strip -->
        ${this.renderPerksStrip()}

        <!-- Synergy Bar (reserved height so it never shifts layout) -->
        <div class="synergy-bar" id="synergy-bar"></div>

        <!-- Battle Field -->
        <div class="battle-field">
          <!-- Enemy: info LEFT, sprite RIGHT -->
          <div class="battle-combatant enemy-combatant" id="enemy-combatant">
            ${$t(s,"enemy-active","enemy")}
            <div class="battle-sprite-slot enemy-sprite-slot" id="enemy-battle-area">
              ${xt(s,"enemy-active")}
            </div>
          </div>

          <!-- Player: sprite LEFT, info RIGHT -->
          <div class="battle-combatant player-combatant" id="player-combatant">
            ${$t(t,"player-active","player")}
            <div class="battle-sprite-slot player-sprite-slot" id="player-battle-area">
              ${xt(t,"player-active")}
            </div>
          </div>
        </div>

        <!-- Auto-battler: ticker + team strip + bag controls -->
        <div class="battle-actions auto">
          <div class="battle-ticker" id="battle-ticker">
            ${this.renderTicker(e.log)}
          </div>
          <div class="battle-team-strip" id="battle-team-strip">
            <!-- Rendered dynamically -->
          </div>
          <div class="battle-controls">
            <div id="battle-bag-row">${this.renderBagButtons()}</div>
            <button class="ink-btn ghost sm" id="battle-speed-btn" type="button"
                    aria-label="Cycle battle animation speed">
              ${this.renderSpeedLabel()}
            </button>
            ${r}
          </div>
        </div>

      </div>
    `}renderBattleTeamStrip(){const e=this.state.battleState;if(!e)return;const t=this.container.querySelector("#battle-team-strip");if(!t)return;const s=ls(e.bossBlind);t.innerHTML=e.playerTeam.map((i,n)=>{const r=n===e.activePlayerIndex,o=i.battleHp<=0,l=Math.max(0,Math.min(100,i.battleHp/i.maxBattleHp*100)),c=l>50?"high":l>20?"mid":"low";return`
        <div class="bts-card ${o?"fainted":""} ${r?"active":""}"
             data-bts-index="${n}"
             title="${i.displayName} · Lv ${i.level} · ${Math.max(0,i.battleHp)}/${i.maxBattleHp}">
          <img class="bts-sprite" src="${i.sprite}" alt="${i.displayName}" draggable="false">
          <div class="bts-info">
            <div class="bts-name">${i.displayName}</div>
            <div class="bts-types">${ct(i.types)}</div>
            <div class="bts-hp-bar">
              <div class="bts-hp-fill ${c}" style="width:${l}%"></div>
            </div>
            <div class="bts-hp-num">${Math.max(0,i.battleHp)}/${i.maxBattleHp}</div>
            ${this.renderBtsItems(i,s)}
          </div>
        </div>
      `}).join("")}renderBtsItems(e,t){const i=(e.itemSlots??[]).filter(r=>r.unlocked);if(i.length===0)return"";const n=i.map(r=>{if(!r.item)return'<span class="bts-slot empty" title="Empty slot">·</span>';const o=`bts-slot filled${t?" disabled":""}`,l=t?`${r.item.name} (disabled — Field Effect)`:r.item.name;return`<span class="${o}" title="${l}" data-tooltip-item-id="${r.item.id}">${Mt(r.item)}</span>`}).join("");return`<div class="bts-items${t?" all-disabled":""}">${n}</div>`}renderTicker(e){const t=e.slice(-3);return t.length===0?'<span class="bt-msg muted">— battle starts —</span>':t.map(s=>`<span class="bt-msg t-${s.type}">${s.text}</span>`).join("")}renderBossBlindBanner(){const e=this.state.battleState;if(!e.bossBlind)return"";const t=Ot(e.bossBlind);return t?`
      <div class="boss-blind-banner" style="--blind-color:${t.color}">
        <div class="bb-icon">${t.icon}</div>
        <div class="bb-text">
          <div class="bb-name">Field Effect · ${t.name}</div>
          <div class="bb-desc">${t.description}</div>
        </div>
        <div class="bb-hint">${t.tacticalHint}</div>
      </div>
    `:""}renderPerksStrip(){const e=this.state.activePerks??[];return e.length===0?"":`
      <div class="perks-strip" id="perks-strip">
        <span class="ps-label">Perks</span>
        ${e.map(t=>`
          <div class="ps-chip" data-perk-id="${t.id}" title="${t.name} — ${t.description??""}">
            <span class="ps-icon">${t.icon??"◈"}</span>
            <span class="ps-name">${t.name}</span>
          </div>
        `).join("")}
      </div>
    `}renderTeamDots(){const e=this.state.battleState;return e.playerTeam.map((t,s)=>{const i=s===e.activePlayerIndex,n=t.battleHp<=0;return`<div class="team-dot ${n?"fainted":"alive"}${i&&!n?" active":""}" title="${t.displayName} · ${t.battleHp}/${t.maxBattleHp}"></div>`}).join("")}renderRewardsSidebar(){const e=this.state.teamRewards??[],t=this.state.activePerks??[],s=[];return t.forEach(i=>{s.push(`
        <div class="sidebar-reward-row">
          <span class="sidebar-reward-icon">◈</span>
          <div>
            <div class="sidebar-reward-name">${i.name}</div>
          </div>
        </div>
      `)}),e.forEach(i=>{s.push(`
        <div class="sidebar-reward-row" data-tooltip-item-id="${i.item.id}">
          <span class="sidebar-reward-icon">${Mt(i.item)}</span>
          <div>
            <div class="sidebar-reward-name">${i.item.name}</div>
            <div class="sidebar-reward-desc">${i.item.description}</div>
          </div>
        </div>
      `)}),s.length===0?'<div class="sidebar-empty">No rewards yet</div>':s.join("")}renderItemsSidebar(){const e=this.state.inventory??[];return e.length===0?'<div class="sidebar-empty">No items</div>':e.map(t=>`
      <div class="sidebar-item-row" data-tooltip-item-id="${t.item.id}">
        <span class="sidebar-item-icon">${Mt(t.item)}</span>
        <div class="sidebar-item-info">
          <div class="sidebar-item-name">${t.item.name}</div>
          <div class="sidebar-item-qty">×${t.quantity}</div>
        </div>
      </div>
    `).join("")}renderSpeedLabel(){return`${be().animationSpeed}× speed`}cycleSpeed(){const e=[1,1.5,2,.5],t=be(),s=e.indexOf(t.animationSpeed),i=e[(s+1)%e.length];rt({...t,animationSpeed:i});const n=this.container.querySelector("#battle-speed-btn");n&&(n.textContent=`${i}× speed`)}renderBagButtons(){const e=this.state.battleState,t=!!e.winner||e.phase==="finished",s=(this.state.inventory??[]).filter(i=>{const n=i.item.effect;return i.item.itemType==="consumable"&&(n.healPercent||n.healAmount||n.curesStatus||i.item.id==="full_restore"||i.item.id==="revive"||i.item.id==="max_revive")});return s.length===0?"":s.map((i,n)=>`
      <button
        class="ink-btn ghost sm${t?" move-disabled":""}"
        data-bag-index="${n}"
        data-tooltip-item-id="${i.item.id}"
        ${t?"disabled":""}
      >${Mt(i.item)} ${i.item.name} ×${i.quantity}</button>
    `).join("")}renderMoveButtons(){const e=this.state.battleState,t=e.playerTeam[e.activePlayerIndex],s=this.container.querySelector("#move-grid");if(!s)return;const i=e.phase==="selecting"&&!e.autoBattle,n=e.bossBlind==="the_eye";s.innerHTML=t.moves.map((o,l)=>{const c=o.pp<=0,d=n&&e.usedMoveIds.includes(o.id),p=o.category==="physical",u=o.category==="special",h=o.pp>0&&o.pp<=o.maxPp*.3;return`
        <button
          class="move-btn${c?" move-empty":""}${d?" move-eye-locked":""}${i?"":" move-disabled"}"
          data-move-index="${l}"
          ${c||!i||d?"disabled":""}
          style="--m-color: var(--t-${o.type})"
          ${d?'title="Blocked by The Eye — already used this battle"':""}
        >
          <div class="mtop">
            <span class="mname">${o.displayName}${d?" ●":""}</span>
            <span class="type-stamp type-${o.type}">${o.type}</span>
          </div>
          <div class="mmeta">
            <span>${p?"† phys":u?"✦ spec":"● stat"}</span>
            <span>pow ${o.power>0?o.power:"—"}</span>
            <span class="pp${h?" low":""}">pp ${o.pp}/${o.maxPp}</span>
          </div>
        </button>
      `}).join("");const r=this.container.querySelector("#battle-bag-row");r&&(r.innerHTML=this.renderBagButtons())}renderTeamPortraits(){const e=this.state.battleState,t=this.container.querySelector("#enemy-active-team-bar");t&&(t.innerHTML=Ta(e.enemyTeam,e.activeEnemyIndex,"enemy"));const s=this.container.querySelector("#player-active-team-bar");s&&(s.innerHTML=Ta(e.playerTeam,e.activePlayerIndex,"player"));const i=this.container.querySelector("#hud-team-pills");i&&(i.innerHTML=this.renderTeamDots()),this.renderBattleTeamStrip()}refreshSynergyBar(){const e=this.container.querySelector("#synergy-bar");if(!e)return;const t=this.state.battleState;if(!t)return;const s=t.playerTeam[t.activePlayerIndex];if(!s||s.battleHp<=0){this.activeSynergies=[],e.innerHTML="";return}const{activeSynergies:i}=os({attacker:s,team:t.playerTeam,slotIndex:t.activePlayerIndex});this.activeSynergies=i,i.length>0&&Nr(this.state.playerName,i.map(r=>r.id));const n=i.length>0?'<span class="syn-label">Synergies</span>':"";e.innerHTML=n+i.map(r=>`
      <div class="syn-badge syn-${r.color}" data-synergy-id="${r.id}" title="Synergy — ${r.description??r.name}">
        <span class="syn-icon">${r.icon}</span>
        <span class="syn-name">${r.name}</span>
        <span class="syn-mult">×${r.multiplier.toFixed(2)}</span>
      </div>
    `).join("")}pulseSynergies(e){e.forEach(t=>{const s=this.container.querySelector(`[data-synergy-id="${t}"]`);s&&(s.classList.remove("syn-pulsing"),s.offsetWidth,s.classList.add("syn-pulsing"),s.addEventListener("animationend",()=>s.classList.remove("syn-pulsing"),{once:!0}))})}attachEvents(){var s,i;uo(this.container,n=>Z.find(r=>r.id===n),()=>this.activeSynergies),this.container.addEventListener("click",async n=>{const r=n.target.closest("[data-move-index]");if(r&&!this.isAnimating){const l=parseInt(r.dataset.moveIndex??"0");await this.executeTurn(l)}const o=n.target.closest("[data-bag-index]");if(o&&!this.isAnimating){const l=(this.state.inventory??[]).filter(p=>{const u=p.item.effect;return p.item.itemType==="consumable"&&(u.healPercent||u.healAmount||u.curesStatus||p.item.id==="full_restore"||p.item.id==="revive"||p.item.id==="max_revive")}),c=parseInt(o.dataset.bagIndex??"0"),d=l[c];d&&await this.useBattleItem(d.item)}});const e=this.container.querySelector("#battle-team-strip");e&&e.addEventListener("click",n=>{const r=n.target.closest("[data-bts-index]");if(!r)return;const o=parseInt(r.dataset.btsIndex??"-1"),l=this.state.battleState;if(!l||o<0||o===l.activePlayerIndex)return;const c=l.playerTeam[o];!c||c.battleHp<=0||this.isAnimating||l.phase!=="selecting"||l.winner||this.manualSwitchTo(o)}),(s=this.container.querySelector("#battle-speed-btn"))==null||s.addEventListener("click",()=>this.cycleSpeed());const t=this.container.querySelector("#god-mode-btn");t&&t.addEventListener("click",()=>this.activateGodMode()),(i=this.state.battleState)!=null&&i.autoBattle&&setTimeout(()=>this.startAutoMode(),500)}startAutoMode(){this.stopAutoMode();const e=async()=>{var c;if(!((c=this.state.battleState)!=null&&c.autoBattle)||this.isAnimating||Sr())return;const t=this.state.battleState;if(t.phase!=="selecting"||t.winner)return;const s=t.playerTeam[t.activePlayerIndex],i=t.enemyTeam[t.activeEnemyIndex],n=t.bossBlind==="the_eye"?s.moves.filter(d=>!t.usedMoveIds.includes(d.id)&&d.pp>0):s.moves.filter(d=>d.pp>0);if(n.length===0)return;const r={...s,moves:n},o=Gn(r,i,this.state.activePerks),l=s.moves.findIndex(d=>d.id===o.id);await this.executeTurn(l>=0?l:0)};this.autoInterval=setInterval(e,1200)}stopAutoMode(){this.autoInterval!==null&&(clearInterval(this.autoInterval),this.autoInterval=null)}async executeTurn(e){var m;if(this.isAnimating)return;const t=this.state.battleState;if(t.phase!=="selecting"||t.winner)return;this.isAnimating=!0,t.phase="animating",this.renderMoveButtons();const s=t.playerTeam[t.activePlayerIndex],i=t.enemyTeam[t.activeEnemyIndex],n=s.moves[e]??s.moves[0];if(t.bossBlind==="the_eye"&&t.usedMoveIds.includes(n.id)){B(`The Eye blocks ${n.displayName}! Pick a different move.`,"warning"),this.isAnimating=!1,t.phase="selecting",this.renderMoveButtons();return}const r=On(i,s);(_(s,"choice_band")||_(s,"choice_specs")||_(s,"choice_scarf"))&&!s.choiceLockedMove&&(s.choiceLockedMove=n);const o=Un(s,i,n,r,this.state.activePerks,((m=this.state.stakeMods)==null?void 0:m.enemySpeedMult)??1),l=this.container.querySelector("#battle-log"),c=async()=>{if(s.battleHp<=0)return;const{canMove:v,reason:g}=ca(s);if(!v){g&&this.addLog(l,{text:g,type:"normal"});return}await this.performAttack("player",s,i,n,l)},d=async()=>{if(i.battleHp<=0)return;const{canMove:v,reason:g}=ca(i);if(!v){g&&this.addLog(l,{text:g,type:"normal"});return}await this.performAttack("enemy",i,s,r,l)};o==="player"?(await c(),t.winner||await d()):(await d(),t.winner||await c()),t.bossBlind==="the_eye"&&!t.usedMoveIds.includes(n.id)&&t.usedMoveIds.push(n.id),t.turnsUsed++,this.isFirstMove=!1,t.winner||await this.applyEndOfTurnEffects(l),t.turn++;const p=t.playerTeam[t.activePlayerIndex],u=t.enemyTeam[t.activeEnemyIndex];p&&(p.turnsInBattle=(p.turnsInBattle??0)+1),u&&(u.turnsInBattle=(u.turnsInBattle??0)+1);const h=this.container.querySelector("#battle-turn-counter");h&&(h.textContent=`Turn ${t.turn}`),this.isAnimating=!1,t.winner||(t.phase="selecting",this.renderMoveButtons(),this.refreshSynergyBar())}async performAttack(e,t,s,i,n){var I;const r=this.state.battleState;this.addLog(n,{text:`${t.displayName} used ${i.displayName}!`,type:"normal"}),i.pp>0&&i.pp--;const o=this.container.querySelector(`#${e==="player"?"player":"enemy"}-active-sprite`),l=this.container.querySelector(`#${e==="player"?"enemy":"player"}-active-sprite`),c=this.container.querySelector(`#${e==="player"?"player":"enemy"}-combatant`);if(c&&c.classList.add("is-attacking"),o&&await sr(o,e==="player"?"right":"left"),c&&c.classList.remove("is-attacking"),!Dn(t,i,this.state.activePerks)){this.addLog(n,{text:`${t.displayName}'s attack missed!`,type:"normal"}),o&&ma(o),k.play("battle.miss");return}if(i.category==="status"){await this.applyStatusMove(t,s,i,n);return}let p=[];if(e==="player"){const{activeSynergies:C}=os({attacker:t,team:r.playerTeam,slotIndex:r.activePlayerIndex,moveType:i.type});p=C.map(L=>L.id)}const u=e==="player"?{team:r.playerTeam,slotIndex:r.activePlayerIndex}:void 0,h={bossBlind:r.bossBlind,isPlayerAttacker:e==="player",typeLevels:this.state.typeLevels,monoDamageBoost:!!((I=this.state.deckMods)!=null&&I.monoDamageBoost)},m=e==="player"&&!r.hasUsedFirstAttack,v=oa(t,s,i,this.state.activePerks,m,u,h);if(e==="player"&&!r.hasUsedFirstAttack&&(r.hasUsedFirstAttack=!0),v.isImmune){this.addLog(n,{text:`It has no effect on ${s.displayName}!`,type:"immune"}),l&&ma(l),k.play("battle.immune");return}const g=An(v.effectiveness);g&&(this.addLog(n,{text:`${i.displayName} — ${g}`,type:v.effectiveness>1?"super_effective":"not_effective"}),v.effectiveness>1?(ds("#ffb830",.12),k.play("battle.super_effective")):k.play("battle.not_effective")),v.isCritical?(this.addLog(n,{text:"A critical hit!",type:"critical"}),ds("#ff6bb5",.1),k.play("battle.crit")):k.play("battle.hit");const{actualDamage:w,fainted:A,log:x}=la(s,v.damage,i,this.state.activePerks);if(this.state.runStats.totalDamageDealt+=w,l){o&&await hr(i.type,o,l,c??void 0),await ua(l);const C=v.isCritical?"critical":v.effectiveness>1?"super_effective":v.effectiveness<1?"not_effective":"damage";Ye(l,w,C)}p.length>0&&this.pulseSynergies(p);const T=this.container.querySelector(`#${e==="player"?"enemy":"player"}-active-hp-fill`),P=this.container.querySelector(`#${e==="player"?"enemy":"player"}-active-hp-label`);if(T&&Ie(T,P,s.battleHp,s.maxBattleHp),this.renderTeamPortraits(),x.forEach(C=>this.addLog(n,C)),e==="player"&&!A){const C=zn(s,r.activeEnemyIndex,r);if(C.healed){if(C.log.forEach(L=>this.addLog(n,L)),l){const L=Math.floor(s.maxBattleHp*.5);Ye(l,L,"heal"),Qt(l,"#ff6bb5")}T&&Ie(T,P,s.battleHp,s.maxBattleHp)}}if(_(t,"life_orb")&&t.battleHp/t.maxBattleHp>=.2){const C=Math.max(1,Math.floor(t.battleHp*.08));t.battleHp=Math.max(0,t.battleHp-C);const L=this.container.querySelector(`#${e}-active-hp-fill`),S=this.container.querySelector(`#${e}-active-hp-label`);L&&Ie(L,S,t.battleHp,t.maxBattleHp)}if(_(t,"shell_bell")&&w>0){const C=Math.max(5,Math.floor(w/6));St(t,C);const L=this.container.querySelector(`#${e}-active-hp-fill`),S=this.container.querySelector(`#${e}-active-hp-label`);L&&Ie(L,S,t.battleHp,t.maxBattleHp),o&&Ye(o,C,"heal")}if(_(s,"rocky_helmet")&&i.isContact&&t.battleHp>0){const C=Math.max(1,Math.floor(s.maxBattleHp/6));t.battleHp=Math.max(0,t.battleHp-C),this.addLog(n,{text:`${t.displayName} was hurt by ${s.displayName}'s Rocky Helmet!`,type:"damage"}),!t.battleStatus&&Math.random()<.15&&(t.battleStatus="paralysis",this.addLog(n,{text:`${t.displayName} was paralyzed by the Rocky Helmet!`,type:"status"}))}if(i.effectChance>0&&Math.random()*100<i.effectChance&&!A&&await this.applyMoveEffect(i,s,n),!A&&i.type==="fire"&&!s.battleStatus){const C=this.state.activePerks.find(S=>S.id==="burn_cascade"),L=(C==null?void 0:C.effect.fireBurnChance)??0;L>0&&Fn(s)&&Math.random()<L&&(s.battleStatus="burn",this.addLog(n,{text:`${s.displayName} was burned by Burn Cascade!`,type:"status"}))}if(!A&&this.state.activePerks.some(C=>C.id==="double_up")&&Math.random()<.15){const C=oa(t,s,i,this.state.activePerks,!1,u,h),{actualDamage:L,fainted:S,log:E}=la(s,C.damage,i,this.state.activePerks);if(l&&(await ua(l),Ye(l,L,"damage")),T&&Ie(T,P,s.battleHp,s.maxBattleHp),E.forEach(y=>this.addLog(n,y)),this.addLog(n,{text:"Hit twice!",type:"system"}),S&&!A){await this.handleFaint(e==="player"?"enemy":"player",l,n);return}}A&&(k.play("battle.faint"),l&&await ha(l),await this.handleFaint(e==="player"?"enemy":"player",l,n))}async applyStatusMove(e,t,s,i){this.addLog(i,{text:`${e.displayName} used ${s.displayName}!`,type:"normal"}),await new Promise(n=>setTimeout(n,300))}async applyMoveEffect(e,t,s){var n;const i=((n=e.effect)==null?void 0:n.toLowerCase())??"";i.includes("burn")&&!t.battleStatus?(t.battleStatus="burn",this.addLog(s,{text:`${t.displayName} was burned!`,type:"status"})):i.includes("paralyz")&&!t.battleStatus?(t.battleStatus="paralysis",this.addLog(s,{text:`${t.displayName} was paralyzed!`,type:"status"})):i.includes("poison")&&!t.battleStatus?(t.battleStatus="poison",this.addLog(s,{text:`${t.displayName} was poisoned!`,type:"status"})):i.includes("sleep")&&!t.battleStatus?(t.battleStatus="sleep",t.sleepTurns=0,this.addLog(s,{text:`${t.displayName} fell asleep!`,type:"status"})):i.includes("freeze")&&!t.battleStatus&&(t.battleStatus="freeze",this.addLog(s,{text:`${t.displayName} was frozen!`,type:"status"}))}async applyEndOfTurnEffects(e){const t=this.state.battleState;t.bossBlind==="the_hook"&&(t.hookTurnCount++,jn(t).forEach(n=>this.addLog(e,n)));const s=[...t.playerTeam.slice(0,t.activePlayerIndex+1).slice(-1),...t.enemyTeam.slice(0,t.activeEnemyIndex+1).slice(-1)];for(const i of s){if(i.battleHp<=0)continue;let{damage:n,log:r}=Wn(i);if(r.forEach(d=>this.addLog(e,d)),t.enemyTeam.includes(i)&&n>0&&(i.battleStatus==="burn"||i.battleStatus==="poison"||i.battleStatus==="badPoison")){const d=this.state.activePerks.find(p=>p.id==="status_stacker");d!=null&&d.effect.statusStacker&&(n=Math.floor(n*d.effect.statusStacker.damageMult))}if(n>0&&(i.battleHp=Math.max(0,i.battleHp-n),this.updateHPDisplay(i,t),i.battleHp<=0)){const d=t.playerTeam.includes(i)?"player":"enemy",p=this.container.querySelector(`#${d==="player"?"player":"enemy"}-active-sprite`);if(p&&await ha(p),await this.handleFaint(d,p,e),t.winner)return}const{heal:l,log:c}=Kn(i);if(c.forEach(d=>this.addLog(e,d)),l>0){St(i,l),this.updateHPDisplay(i,t);const d=t.playerTeam.includes(i)?"player":"enemy",p=this.container.querySelector(`#${d}-active-sprite`);p&&Ye(p,l,"heal")}else l<0&&(i.battleHp=Math.max(0,i.battleHp+l),this.updateHPDisplay(i,t));if(i.leechSeedActive&&i.battleHp>0){const p=t.playerTeam.includes(i)?t.enemyTeam[t.activeEnemyIndex]:t.playerTeam[t.activePlayerIndex];if(p&&p.battleHp>0){const u=Math.max(1,Math.floor(p.maxBattleHp*.08));p.battleHp=Math.max(0,p.battleHp-u),St(i,u),this.updateHPDisplay(i,t),this.updateHPDisplay(p,t),this.addLog(e,{text:`${p.displayName} was drained by Leech Seed! (−${u} HP)`,type:"damage"})}}if(this.state.activePerks.some(d=>d.id==="grassy_carpet")&&i.battleHp<i.maxBattleHp){const d=Math.max(1,Math.floor(i.maxBattleHp*.0625));St(i,d),this.updateHPDisplay(i,t)}this.state.activePerks.some(d=>d.id==="speed_boost")&&t.playerTeam.includes(i)&&(i.statStages.speed=Math.min(6,i.statStages.speed+1))}this.renderTeamPortraits()}updateHPDisplay(e,t){if(!t)return;const i=t.playerTeam.includes(e)?"player":"enemy",n=this.container.querySelector(`#${i}-active-hp-fill`),r=this.container.querySelector(`#${i}-active-hp-label`);n&&Ie(n,r,e.battleHp,e.maxBattleHp)}async handleFaint(e,t,s){var r,o,l,c,d;const i=this.state.battleState;if(e==="player"){if(i.isBossWave&&((r=this.state.vouchers)!=null&&r.includes("boss_insurance"))&&!this.state._bossInsuranceUsed){const g=i.playerTeam[i.activePlayerIndex];if(g&&g.battleHp<=0){g.battleHp=Math.max(1,Math.floor(g.maxBattleHp*.25)),this.state._bossInsuranceUsed=!0,this.addLog(s,{text:`${g.displayName} was revived by Boss Insurance!`,type:"heal"}),this.rerenderBattleSprites();return}}if(this.state.activePerks.some(g=>g.id==="synergy_link")){const g=i.playerTeam.slice(i.activePlayerIndex+1).find(w=>w.battleHp>0);g&&(g.statStages.attack=Math.min(6,g.statStages.attack+2),g.statStages.spAtk=Math.min(6,g.statStages.spAtk+2),g.statStages.defense=Math.min(6,g.statStages.defense+2),g.statStages.spDef=Math.min(6,g.statStages.spDef+2),g.statStages.speed=Math.min(6,g.statStages.speed+2))}let p=i.activePlayerIndex+1;for(;p<i.playerTeam.length&&i.playerTeam[p].battleHp<=0;)p++;if(p>=i.playerTeam.length){i.winner="enemy",await this.endBattle(!1);return}i.activePlayerIndex=p;const u=i.playerTeam[i.activePlayerIndex];this.addLog(s,{text:`Go, ${u.displayName}!`,type:"system"});const h=i.playerTeam[i.activePlayerIndex-1];h&&_(h,"tag_team_bell")&&(u.battleHp=u.maxBattleHp,u.statStages.attack=Math.min(6,u.statStages.attack+1),this.addLog(s,{text:`${h.displayName}'s Tag-Team Bell rang! ${u.displayName} entered at full HP, Atk rose!`,type:"heal"}));const m=this.state.activePerks.find(g=>g.id==="pivot_tactics");if(m!=null&&m.effect.pivotBoost){const{atk:g,speed:w}=m.effect.pivotBoost;u.statStages.attack=Math.min(6,u.statStages.attack+g),u.statStages.speed=Math.min(6,u.statStages.speed+w),this.addLog(s,{text:`${u.displayName} pivoted in! Atk and Speed rose!`,type:"status"})}this.rerenderBattleSprites();const v=this.container.querySelector("#player-active-sprite");v&&Zt(v,!0)}else{this.state.runStats.totalKOs++,this.state.runStats.chainKOCount++;const p=this.state.activePerks.find(x=>x.id==="chain_reaction");p&&(p.effect.chainKOBonus=(p.effect.chainKOBonus??0)+.01);const u=i.enemyTeam[i.activeEnemyIndex],h=i.activePlayerIndex,m=i.playerTeam[h];if(m&&m.battleHp>0){const x=Vn(u.level),T=((o=m.itemSlots)==null?void 0:o.map(L=>L.unlocked))??[],{leveledUp:P,newLevel:I}=da(m,x,this.state.activePerks);if(this.addLog(s,{text:`${m.displayName} gained ${x} XP!`,type:"system"}),P){this.addLog(s,{text:`↑ ${m.displayName} grew to Lv.${I}!`,type:"system"}),(l=m.itemSlots)==null||l.forEach((S,E)=>{S.unlocked&&!T[E]&&this.addLog(s,{text:`◈ ${m.displayName} unlocked Item Slot ${E+1}!`,type:"system"})}),this.updateHPDisplay(m,i),this.renderTeamPortraits();const L=await Ct(m);for(const S of L){const E=S.pending?`✦ ${m.displayName} wants to learn ${S.newMove.displayName} — pick after battle!`:`✦ ${m.displayName} learned ${S.newMove.displayName}!`;this.addLog(s,{text:E,type:"system"})}!m.isFullyEvolved&&m.nextEvolutionId!==null&&m.evolutionLevel!==null&&I>=m.evolutionLevel&&(m.pendingEvolution=!0,this.addLog(s,{text:`◇ ${m.displayName} is ready to evolve!`,type:"system"}))}const C=Math.max(1,Math.floor(x*.5));for(const[L,S]of i.playerTeam.entries()){if(L===h||S.battleHp<=0)continue;const E=((c=S.itemSlots)==null?void 0:c.map(H=>H.unlocked))??[],{leveledUp:y,newLevel:$}=da(S,C,this.state.activePerks);if(y){this.addLog(s,{text:`↑ ${S.displayName} grew to Lv.${$}!`,type:"system"}),(d=S.itemSlots)==null||d.forEach((W,K)=>{W.unlocked&&!E[K]&&this.addLog(s,{text:`◈ ${S.displayName} unlocked Item Slot ${K+1}!`,type:"system"})});const H=await Ct(S);for(const W of H){const K=W.pending?`✦ ${S.displayName} wants to learn ${W.newMove.displayName} — pick after battle!`:`✦ ${S.displayName} learned ${W.newMove.displayName}!`;this.addLog(s,{text:K,type:"system"})}!S.isFullyEvolved&&S.nextEvolutionId!==null&&S.evolutionLevel!==null&&$>=S.evolutionLevel&&(S.pendingEvolution=!0,this.addLog(s,{text:`◇ ${S.displayName} is ready to evolve!`,type:"system"}))}}}let v=i.activeEnemyIndex+1;for(;v<i.enemyTeam.length&&i.enemyTeam[v].battleHp<=0;)v++;if(v>=i.enemyTeam.length){i.winner="player",await this.endBattle(!0);return}i.activeEnemyIndex=v;const g=i.enemyTeam[i.activeEnemyIndex];this.addLog(s,{text:`Enemy sent out ${g.displayName}!`,type:"system"});const w=i.playerTeam.find(x=>x.battleHp>0&&_(x,"reset_pulse")&&!x.resetPulseUsedThisWave);w&&(g.statStages={attack:0,defense:0,spAtk:0,spDef:0,speed:0,accuracy:0,evasion:0},w.resetPulseUsedThisWave=!0,this.addLog(s,{text:`${w.displayName}'s Reset Pulse cleared ${g.displayName}'s stat changes!`,type:"status"})),this.rerenderBattleSprites();const A=this.container.querySelector("#enemy-active-sprite");A&&Zt(A)}this.renderTeamPortraits()}rerenderBattleSprites(){const e=this.state.battleState,t=e.playerTeam[e.activePlayerIndex],s=e.enemyTeam[e.activeEnemyIndex],i=this.container.querySelector("#player-combatant"),n=this.container.querySelector("#enemy-combatant");if(i){i.innerHTML=$t(t,"player-active","player")+`<div class="battle-sprite-slot player-sprite-slot" id="player-battle-area">${xt(t,"player-active")}</div>`;const r=i.querySelector("#player-active-sprite");r&&O.set(r,{scaleX:-1})}n&&(n.innerHTML=$t(s,"enemy-active","enemy")+`<div class="battle-sprite-slot enemy-sprite-slot" id="enemy-battle-area">${xt(s,"enemy-active")}</div>`),this.renderMoveButtons()}pickItemTarget(e,t){return new Promise(s=>{const i=document.createElement("div");i.className="item-target-overlay",i.innerHTML=`
        <div class="itm-card">
          <div class="itm-eyebrow">◆ Use Item ◆</div>
          <div class="itm-title">${e.name}</div>
          <div class="itm-desc">${e.description}</div>
          <div class="itm-pickline">Pick a target</div>
          <div class="itm-targets">
            ${t.map((o,l)=>`
              <button class="itm-target" data-itm-idx="${l}">
                <img src="${o.sprite}" class="itm-target-sprite" alt="" draggable="false" />
                <div class="itm-target-body">
                  <div class="itm-target-name">${o.displayName}</div>
                  <div class="itm-target-hp">HP ${o.battleHp}/${o.maxBattleHp}</div>
                </div>
              </button>
            `).join("")}
          </div>
          <div class="itm-actions">
            <button class="ink-btn ghost" data-itm-cancel>Cancel</button>
          </div>
        </div>
      `,document.body.appendChild(i),requestAnimationFrame(()=>i.classList.add("active"));const n=o=>{i.classList.remove("active"),setTimeout(()=>{i.remove(),document.removeEventListener("keydown",r),s(o)},180)},r=o=>{o.key==="Escape"&&n(null)};document.addEventListener("keydown",r),i.addEventListener("click",o=>{const l=o.target;if(l.closest("[data-itm-cancel]")){n(null);return}const c=l.closest("[data-itm-idx]");if(c){const d=parseInt(c.dataset.itmIdx??"-1",10);n(t[d]??null)}})})}async useBattleItem(e){const t=this.state.battleState,s=this.container.querySelector("#battle-log"),i=e.id==="revive"||e.id==="max_revive",n=t.playerTeam.filter(c=>i?c.battleHp<=0:c.battleHp>0);if(n.length===0){B("No valid target!","warning");return}const r=n.length===1?n[0]:await this.pickItemTarget(e,n);if(!r)return;const o=e.effect;if(o.healPercent){const c=Math.floor(r.maxBattleHp*o.healPercent);r.battleHp=Math.min(r.maxBattleHp,r.battleHp+c),s&&this.addLog(s,{text:`Used ${e.name} on ${r.displayName}! (+${c} HP)`,type:"system"})}else o.healAmount?(r.battleHp=Math.min(r.maxBattleHp,r.battleHp+o.healAmount),s&&this.addLog(s,{text:`Used ${e.name} on ${r.displayName}! (+${o.healAmount} HP)`,type:"system"})):e.id==="full_restore"?(r.battleHp=r.maxBattleHp,r.battleStatus=null,s&&this.addLog(s,{text:`Used ${e.name} on ${r.displayName}! Full HP restored!`,type:"system"})):i&&(r.battleHp=e.id==="max_revive"?r.maxBattleHp:Math.floor(r.maxBattleHp/2),s&&this.addLog(s,{text:`${r.displayName} was revived!`,type:"system"}));o.curesStatus&&(r.battleStatus=null);const l=this.state.inventory.findIndex(c=>c.item.id===e.id);l>=0&&(this.state.inventory[l].quantity--,this.state.inventory[l].quantity<=0&&this.state.inventory.splice(l,1)),this.updateHPDisplay(r,t),this.renderTeamPortraits(),this.renderMoveButtons()}async showXpRecap(){const e=this.state.battleState;if(!e)return;const t=e.playerTeam,s=(d,p)=>{let u=0;for(let h=1;h<d;h++)u+=Math.floor(Math.pow(h,1.5)*10);return u+p},i=t.map((d,p)=>{const u=this.xpStart[p];return u?Math.max(0,s(d.level,d.xp)-s(u.level,u.xp)):0});if(i.every(d=>d===0))return;const n=document.createElement("div");n.className="xp-recap-overlay",n.innerHTML=`
      <div class="xpr-card">
        <div class="xpr-kicker">◆ Battle Recap ◆</div>
        <div class="xpr-title">Experience gained</div>
        <div class="xpr-list" id="xpr-list">
          ${t.map((d,p)=>{const u=this.xpStart[p]??{level:d.level,xp:d.xp,xpToNextLevel:d.xpToNextLevel};return`
              <div class="xpr-row ${d.battleHp<=0?"fainted":""}" data-xpr-row="${p}">
                <img class="xpr-sprite" src="${d.sprite}" alt="${d.displayName}" draggable="false" />
                <div class="xpr-mid">
                  <div class="xpr-name">
                    <span>${d.displayName}</span>
                    <span class="xpr-lvl" data-xpr-lvl="${p}">Lv.${u.level}</span>
                  </div>
                  <div class="xpr-bar-track">
                    <div class="xpr-bar-fill" data-xpr-fill="${p}" style="width:${u.xp/Math.max(1,u.xpToNextLevel)*100}%"></div>
                  </div>
                  <div class="xpr-meta" data-xpr-meta="${p}">
                    +${i[p]} XP
                  </div>
                </div>
              </div>
            `}).join("")}
        </div>
        <div class="xpr-skip">Tallying experience…</div>
      </div>
    `,document.body.appendChild(n);let r=!1,o=!1;const l=()=>{r||!o||(r=!0,O.to(n,{opacity:0,duration:.2,ease:"power2.in",onComplete:()=>n.remove()}))};n.addEventListener("click",()=>{if(!o){n.classList.remove("shake"),n.offsetWidth,n.classList.add("shake");return}l()}),requestAnimationFrame(()=>n.classList.add("active")),await new Promise(d=>setTimeout(d,700));for(let d=0;d<t.length&&!r;d++){if(i[d]===0)continue;const p=n.querySelector(`[data-xpr-row="${d}"]`),u=n.querySelector(`[data-xpr-fill="${d}"]`),h=n.querySelector(`[data-xpr-lvl="${d}"]`),m=n.querySelector(`[data-xpr-meta="${d}"]`);if(!p||!u||!h||!m)continue;const v=this.xpStart[d]??{level:t[d].level,xp:t[d].xp,xpToNextLevel:t[d].xpToNextLevel},g=t[d].level,w=t[d].xp,A=t[d].xpToNextLevel;p.classList.add("active"),await new Promise(L=>setTimeout(L,260));let x=v.level,T=v.xpToNextLevel,P=v.xp;for(;x<g&&!r&&(await new Promise(L=>{O.to(u,{width:"100%",duration:.85,ease:"power2.out",onComplete:()=>L()})}),!r);)x+=1,h.textContent=`Lv.${x}`,h.classList.remove("flash"),h.offsetWidth,h.classList.add("flash"),O.set(u,{width:"0%"}),P=0,T=Math.floor(Math.pow(x,1.5)*10),await new Promise(L=>setTimeout(L,320));if(r)break;const I=w/Math.max(1,A)*100,C=P/Math.max(1,T)*100;O.set(u,{width:`${C}%`}),await new Promise(L=>{O.to(u,{width:`${I}%`,duration:.7,ease:"power2.out",onComplete:()=>L()})}),m.textContent=`+${i[d]} XP · Lv.${g}`,p.classList.remove("active"),p.classList.add("done"),await new Promise(L=>setTimeout(L,260))}o=!0;const c=n.querySelector(".xpr-skip");c&&(c.classList.add("ready"),c.textContent="Click to continue"),r||(await new Promise(d=>setTimeout(d,1500)),l())}async endBattle(e){this.stopAutoMode();const t=this.container.querySelector("#battle-log");t&&(e?(this.addLog(t,{text:`You won! Wave ${this.state.wave} cleared!`,type:"system"}),Qt(this.container,"#22c55e")):(this.addLog(t,{text:"All your Pokémon fainted...",type:"system"}),Qt(this.container,"#ef4444"))),await new Promise(i=>setTimeout(i,1200)),e&&await this.showXpRecap(),this.state.battleState.phase="finished",this.state.battleState.winner=e?"player":"enemy",e&&(this.state.runStats.wavesCleared=this.state.wave);const s=this.state.battleState;for(let i=0;i<this.state.team.length;i++){const n=s.playerTeam[i];n&&(this.state.team[i].level=n.level,this.state.team[i].xp=n.xp,this.state.team[i].xpToNextLevel=n.xpToNextLevel,this.state.team[i].pendingEvolution=n.pendingEvolution,this.state.team[i].battleHp=n.battleHp,this.state.team[i].maxBattleHp=n.maxBattleHp,this.state.team[i].effectiveStats=n.effectiveStats,this.state.team[i].moves=n.moves,this.state.team[i].learnedMoveIds=n.learnedMoveIds,this.state.team[i].pendingLearns=n.pendingLearns,this.state.team[i].movePool=n.movePool,this.state.team[i].learnsetPool=n.learnsetPool,n.itemSlots&&this.state.team[i].itemSlots&&n.itemSlots.forEach((r,o)=>{var c;const l=(c=this.state.team[i].itemSlots)==null?void 0:c[o];l&&r.unlocked&&(l.unlocked=!0)}))}e&&await bo(this.state.team),this.onBattleEnd(this.state)}addLog(e,t){var s;e&&fo(e,t),(s=this.state.battleState)==null||s.log.push(t),this.refreshTicker()}refreshTicker(){const e=this.container.querySelector("#battle-ticker"),t=this.state.battleState;!e||!t||(e.innerHTML=this.renderTicker(t.log))}manualSwitchTo(e){const t=this.state.battleState;if(!t||e===t.activePlayerIndex)return;const s=t.playerTeam[e];if(!s||s.battleHp<=0)return;const i=this.container.querySelector("#battle-log"),n=t.playerTeam[t.activePlayerIndex];t.activePlayerIndex=e,s.choiceLockedMove=null,s.turnsInBattle=0,this.addLog(i,{text:`${n==null?void 0:n.displayName} retreats. Go, ${s.displayName}!`,type:"system"});const r=this.state.activePerks.find(l=>l.id==="pivot_tactics");if(r!=null&&r.effect.pivotBoost){const{atk:l,speed:c}=r.effect.pivotBoost;s.statStages.attack=Math.min(6,s.statStages.attack+l),s.statStages.speed=Math.min(6,s.statStages.speed+c)}this.rerenderBattleSprites(),this.renderTeamPortraits(),this.renderBattleTeamStrip(),this.refreshSynergyBar();const o=this.container.querySelector("#player-active-sprite");o&&Zt(o,!0)}async activateGodMode(){if(!this.state.godModeAvailable)return;this.state.godModeAvailable=!1;const e=this.state.battleState;for(const s of e.playerTeam)s.battleHp=s.maxBattleHp,s.battleStatus=null;this.rerenderBattleSprites(),this.renderTeamPortraits(),B("↯ GOD MODE ACTIVATED! Team fully restored!","success");const t=this.container.querySelector("#god-mode-btn");t&&t.remove()}unmount(){this.stopAutoMode(),document.body.classList.remove("battle-active"),this.container.style.display="none",this.container.innerHTML=""}}const $o="/".replace(/\/$/,""),xo="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/";function Mo(a){return a.pokeapiName?`<img src="${xo}${a.pokeapiName}.png" alt="${a.name}" class="item-sprite" draggable="false" onerror="${Y(a.icon)}">`:a.sprite?`<img src="${$o}${a.sprite}" alt="${a.name}" class="item-sprite" draggable="false" onerror="${Y(a.icon)}">`:`<div class="glyph">${a.icon}</div>`}class To{constructor(e,t,s){b(this,"container");b(this,"state");b(this,"onRewardChosen");this.container=e,this.state=t,this.onRewardChosen=s}mount(){this.container.innerHTML=this.renderHTML(),this.container.style.display="",oe(this.container),this.revealCards(),this.attachEvents()}renderHTML(){var r;const e=((r=this.state.battleState)==null?void 0:r.isBossWave)??!1,t=this.state.arenaState,s=e?200:60,i=e?`Skip for a <strong>${s}¢</strong> boss bounty · Stash it for the Shop.`:`Skip to continue with +${s}¢ in your pocket.`;let n;if(t){const o=t.steps.length;n=`Arena · Round ${Math.min(t.index,o)}/${o} · Cleared`}else e?n="Boss Wave · Cleared":n=`Wave ${this.state.wave} · Cleared`;return`
      <div class="reward-screen screen">
        <div class="reward-header">
          <div class="reward-wave-badge ${e?"boss":""}${t?" arena":""}">
            ${n}
          </div>
          <h2 class="reward-title">Pick a <em>prize</em></h2>
          <p class="reward-subtitle">Three cards dealt · Choose one · Skip for +${s}¢</p>
        </div>

        <div class="reward-cards" id="reward-cards">
          ${this.state.pendingRewards.map((o,l)=>this.renderRewardCard(o,l)).join("")}
        </div>

        <div class="reward-footer">
          <div class="reward-coins">
            <span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-3)">
              ► ${i}
            </span>
          </div>
          <div style="display:flex;gap:10px">
            <button class="ink-btn ${e?"primary":"ghost"}" id="skip-reward-btn" data-skip-amount="${s}">
              Skip (+${s}¢)${e?" ★":""}
            </button>
          </div>
        </div>
      </div>
    `}renderRewardCard(e,t){const s=xn(e.rarity),i=$n(e.rarity),r=[-5,0,5][t]??0;let o="",l="",c="",d="",p="";if(e.type==="pokemon"){const u=e.pokemon;o="NEW CREATURE",l=`<img src="${u.sprite}" alt="${u.displayName}" onerror="${Y("◆")}" />`,c=u.displayName,d=ct(u.types),p=`Lv.${u.level} · BST ${u.bst} · ${u.isFullyEvolved?"★ Fully Evolved":"◇ Can Evolve"}`}else e.type==="perk"?(o="TEAM PERK",l=`<div class="glyph">${e.perk.icon??"◈"}</div>`,c=e.perk.name,p=e.perk.description):e.type==="item"&&(o=e.item.itemType==="held"?"HELD ITEM":"CONSUMABLE",l=Mo(e.item),c=e.item.name,p=e.item.description);return`
      <div
        class="reward-card ${s} hidden-card"
        data-reward-index="${t}"
        role="button"
        tabindex="0"
        style="opacity:0;--tilt:${r}deg"
      >
        <div class="r-tag">
          <span>${o}</span>
          <span>№ ${String(100+t).padStart(3,"0")}</span>
        </div>
        <div class="reward-card-rarity ${s}">${i}</div>
        <div class="r-art">${l}</div>
        <div class="r-name">${c}</div>
        ${d?`<div class="r-types">${d}</div>`:""}
        <div class="r-desc">${p}</div>
      </div>
    `}async revealCards(){const e=Array.from(this.container.querySelectorAll(".reward-card"));await ar(e),e.forEach(t=>t.classList.remove("hidden-card"))}attachEvents(){this.container.addEventListener("click",e=>{const t=e.target,s=t.closest("#skip-reward-btn");if(s){const n=parseInt(s.dataset.skipAmount??"60")||60;this.state.coins+=n,this.state.pendingRewards=[],setTimeout(()=>this.onRewardChosen(this.state),200);return}const i=t.closest("[data-reward-index]");if(i){const n=parseInt(i.dataset.rewardIndex??"0");this.selectReward(n)}}),this.container.addEventListener("keydown",e=>{if(e.key==="Enter"){const t=e.target.closest("[data-reward-index]");if(t){const s=parseInt(t.dataset.rewardIndex??"0");this.selectReward(s)}}})}selectReward(e){const t=this.state.pendingRewards[e];if(t){if(this.container.querySelectorAll(".reward-card").forEach((s,i)=>{s.classList.toggle("reward-selected",i===e),i!==e&&s.classList.add("reward-dimmed")}),t.type==="pokemon"){this.state.pendingCatch=t.pokemon,this.state.pendingRewards=[],setTimeout(()=>this.onRewardChosen(this.state),600);return}else if(t.type==="perk")this.state.activePerks.find(s=>s.id===t.perk.id)||(this.state.activePerks.push(t.perk),this.state.runStats.perksCollected++,t.perk.id==="god_mode"&&(this.state.godModeAvailable=!0));else if(t.type==="item"){this.state.runStats.itemsCollected++;const s=this.state.inventory.find(i=>i.item.id===t.item.id);s?s.quantity++:this.state.inventory.push({item:t.item,quantity:1})}this.state.pendingRewards=[],setTimeout(()=>{this.onRewardChosen(this.state)},600)}}unmount(){this.container.style.display="none",this.container.innerHTML=""}}const Pa=3;function La(a){return Math.max(.3,.85-(a.bst-200)/1100)}function Po(a){const s=(a&&a>0?a:5)/17,i=Math.pow(s,.7);return Math.max(.32,Math.min(1.25,i))}class Lo{constructor(e,t,s,i){b(this,"container");b(this,"state");b(this,"pokemon");b(this,"onDone");b(this,"ballsLeft",Pa);b(this,"phase","intro");b(this,"shakeCount",0);b(this,"timers",[]);b(this,"queuedThrow",!1);this.container=e,this.state=t,this.pokemon=s,this.onDone=i}mount(){this.container.innerHTML=this.renderHTML(),this.container.style.display="",oe(this.container),this.attachEvents(),this.refresh(),this.timers.push(window.setTimeout(()=>{this.phase="idle",this.refresh(),this.queuedThrow&&(this.queuedThrow=!1,this.onThrow())},800))}clearTimers(){this.timers.forEach(e=>window.clearTimeout(e)),this.timers=[]}renderHTML(){const e=this.pokemon,t=Math.round(La(e)*100),s=100-t,i=us(this.state.trainerGender??"male");return`
      <div class="catch-screen screen" id="catch-screen-inner">

        <!-- Headline -->
        <div class="catch-headline">
          <div class="catch-kicker">— Encounter —</div>
          <h1 class="catch-title">A wild <em>${e.displayName.toUpperCase()}</em> appeared!</h1>
        </div>

        <!-- Main: arena + side -->
        <div class="catch-main">

          <!-- Arena -->
          <div class="catch-arena ${this.phase==="intro"?"intro":""}" id="catch-arena">
            <div class="ca-sky">
              <div class="ca-halftone"></div>
              <div class="ca-sun"></div>
              <div class="ca-clouds">
                <span class="ca-cloud ca-cloud-1"></span>
                <span class="ca-cloud ca-cloud-2"></span>
                <span class="ca-cloud ca-cloud-3"></span>
              </div>
              <div class="ca-mountains">
                <span class="ca-mtn ca-mtn-1"></span>
                <span class="ca-mtn ca-mtn-2"></span>
                <span class="ca-mtn ca-mtn-3"></span>
              </div>
            </div>
            <div class="ca-ground">
              <div class="ca-grass"></div>
              <div class="ca-path"></div>
              <span class="ca-tuft" style="left:8%;bottom:6%;--s:1.2;--r:-6deg"></span>
              <span class="ca-tuft" style="left:24%;bottom:12%;--s:0.8;--r:4deg"></span>
              <span class="ca-tuft" style="left:38%;bottom:5%;--s:1;--r:-2deg"></span>
              <span class="ca-tuft" style="left:55%;bottom:14%;--s:0.7;--r:8deg"></span>
              <span class="ca-tuft" style="left:72%;bottom:6%;--s:1.1;--r:-4deg"></span>
              <span class="ca-tuft" style="left:88%;bottom:11%;--s:0.9;--r:3deg"></span>
            </div>
            <div class="ca-vignette"></div>
            <div class="ca-frame"></div>

            <div class="ca-platform ca-platform-trainer"></div>
            <div class="ca-platform ca-platform-wild"></div>

            <div class="ca-trainer" id="ca-trainer">
              <img src="${i}" alt="Trainer" class="ca-trainer-sprite" draggable="false" />
              <div class="ca-trainer-label">YOU</div>
            </div>

            <div class="ca-wild" id="ca-wild" style="--mon-scale:${Po(e.heightDm).toFixed(3)}">
              <div class="ca-wild-shadow"></div>
              <img src="${e.animatedSprite||e.sprite}" alt="${e.displayName}" class="ca-wild-sprite" draggable="false" onerror="this.onerror=null;this.src='${e.sprite}';" />
              <div class="ca-entry-burst" id="ca-entry-burst">
                ${"✦✧★✦✧★".split("").map((n,r)=>`<span style="--d:${r*.06}s;--a:${(r-2.5)*35}deg">${n}</span>`).join("")}
              </div>
            </div>

            <div class="ca-ball" id="ca-ball" hidden>
              <img class="ca-ball-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokéball" draggable="false" />
            </div>

            <div class="ca-beam" id="ca-beam" hidden></div>

            <div class="ca-flash" id="ca-flash"></div>
            <div class="ca-result-layer" id="ca-result-layer"></div>

            <!-- Mobile-only: tap arena to throw, small flee chip top-right -->
            <div class="ca-tap-hint" id="ca-tap-hint" aria-hidden="true">▸ Tap to throw</div>
            <button class="ca-mobile-flee" id="ca-mobile-flee" type="button" aria-label="Run away">Run</button>
          </div>

          <!-- Side -->
          <div class="catch-side">

            <div class="catch-data-card">
              <div class="cdc-head">
                <div class="cdc-kicker">Field Notes · #${String(e.id).padStart(3,"0")}</div>
                <div class="cdc-name">${e.displayName}</div>
                <div class="cdc-types">${ct(e.types)}</div>
              </div>
              <div class="cdc-stats">
                <div class="cdc-row"><span>Level</span><b>${e.level}</b></div>
                <div class="cdc-row"><span>Base Stat Total</span><b>${e.bst}</b></div>
                <div class="cdc-row"><span>Catch Rate</span><b class="cdc-rate">~${t}%</b></div>
              </div>
              <div class="cdc-gauge">
                <div class="cdc-gauge-label">Capture difficulty</div>
                <div class="cdc-gauge-bar">
                  <div class="cdc-gauge-fill" style="width:${s}%"></div>
                  ${[20,40,60,80].map(n=>`<span class="cdc-gauge-tick" style="left:${n}%"></span>`).join("")}
                </div>
                <div class="cdc-gauge-meta"><span>Easy</span><span>Tough</span></div>
              </div>
            </div>

            <div class="catch-ball-tray">
              <div class="cbt-label">Balls remaining</div>
              <div class="cbt-balls" id="cbt-balls">
                ${Array.from({length:Pa}).map((n,r)=>`
                  <div class="cbt-ball ${r>=this.ballsLeft?"used":""}">
                    <img class="cbt-ball-img" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="Pokéball" draggable="false" />
                  </div>
                `).join("")}
              </div>
            </div>

            <div class="catch-actions">
              <button class="ink-btn primary" id="catch-throw-btn">▶ Throw Pokéball</button>
              <button class="ink-btn ghost" id="catch-run-btn">Run Away</button>
            </div>

          </div>
        </div>
      </div>
    `}attachEvents(){var i,n,r;const e=()=>this.onThrow();(i=this.container.querySelector("#catch-throw-btn"))==null||i.addEventListener("click",e),(n=this.container.querySelector("#catch-run-btn"))==null||n.addEventListener("click",()=>this.onFled());const t=this.container.querySelector("#catch-arena");t==null||t.addEventListener("click",o=>{const l=o.target;l.closest("#ca-mobile-flee")||l.closest(".catch-pc-overlay")||e()}),(r=this.container.querySelector("#ca-mobile-flee"))==null||r.addEventListener("click",o=>{o.stopPropagation(),this.onFled()});const s=o=>{(o.key==="a"||o.key==="A"||o.key===" "||o.key==="Enter")&&(o.preventDefault(),e())};document.addEventListener("keydown",s),this.container._keyHandler=s}refresh(){this.refreshArena(),this.refreshActions(),this.refreshBalls()}refreshArena(){const e=this.container.querySelector("#catch-arena"),t=this.container.querySelector("#ca-wild"),s=this.container.querySelector("#ca-ball"),i=this.container.querySelector("#ca-beam"),n=this.container.querySelector("#ca-trainer"),r=this.container.querySelector("#ca-result-layer");if(!e||!t||!s||!i||!n||!r)return;e.classList.toggle("intro",this.phase==="intro"),e.classList.toggle("idle",this.phase==="idle"&&this.ballsLeft>0);const o=["absorb","falling","wobbling","caught"].includes(this.phase);t.classList.toggle("hidden",o),t.classList.toggle("rebound",this.phase==="breakout"),n.classList.toggle("throwing",this.phase==="throwing");const l=this.phase==="throwing",c=l||["absorb","falling","wobbling","caught","breakout"].includes(this.phase);s.hidden=!c,s.className="ca-ball",l&&s.classList.add("throwing"),this.phase==="absorb"&&s.classList.add("absorb"),this.phase==="falling"&&s.classList.add("falling"),this.phase==="wobbling"&&(s.classList.add("settled"),this.shakeCount>0&&(s.classList.remove("wobble"),s.offsetWidth,s.classList.add("wobble"))),this.phase==="caught"&&s.classList.add("caught","settled"),this.phase==="breakout"&&s.classList.add("breakout"),i.hidden=this.phase!=="absorb";const d=this.container.querySelector("#ca-flash");d&&(d.classList.remove("flash"),this.phase==="caught"&&(d.offsetWidth,d.classList.add("flash"))),this.phase==="caught"?r.innerHTML=`
        <div class="ca-caught-banner">
          <div class="ca-spark-ring">
            ${"★✦✧✩★✦".split("").map((p,u)=>`<span style="--i:${u};animation-delay:${u*.07}s">${p}</span>`).join("")}
          </div>
          <div class="ca-stamp">GOTCHA!</div>
          <div class="ca-stamp-sub">${this.pokemon.displayName} was caught!</div>
        </div>
      `:this.phase==="breakout"?r.innerHTML='<div class="ca-breakout-msg">BROKE FREE</div>':this.phase==="fled"?r.innerHTML=`
        <div class="ca-fled-overlay">
          <div class="ca-stamp fled">IT GOT AWAY</div>
        </div>
      `:r.innerHTML=""}refreshActions(){const e=this.container.querySelector("#catch-throw-btn"),t=this.container.querySelector("#catch-run-btn");if(!e||!t)return;const s=this.phase==="idle";e.disabled=!s||this.ballsLeft<=0,t.disabled=!s,this.phase==="idle"?e.textContent="▶ Throw Pokéball":this.phase==="intro"?e.textContent="…":this.phase==="caught"?e.textContent="✓ Caught":this.phase==="fled"?e.textContent="Got away":e.textContent="Throwing…"}refreshBalls(){this.container.querySelectorAll("#cbt-balls .cbt-ball").forEach((e,t)=>{e.classList.toggle("used",t>=this.ballsLeft)})}onThrow(){if(this.phase==="intro"){this.queuedThrow=!0;return}if(this.phase!=="idle"||this.ballsLeft<=0)return;this.ballsLeft--,this.phase="throwing",this.refresh(),k.play("catch.throw");const e=Math.random()<La(this.pokemon),t=e?3:Math.random()<.6?2:1;this.timers.push(window.setTimeout(()=>{this.phase="absorb",this.refresh(),k.play("catch.absorb")},700)),this.timers.push(window.setTimeout(()=>{this.phase="falling",this.refresh()},1100)),this.timers.push(window.setTimeout(()=>{this.phase="wobbling",this.shakeCount=0,this.refresh(),k.play("catch.land")},1450));for(let i=1;i<=t;i++)this.timers.push(window.setTimeout(()=>{this.shakeCount=i,this.refresh(),k.play("catch.wobble")},1450+i*650));const s=1450+t*650+400;this.timers.push(window.setTimeout(()=>{e?(this.phase="caught",this.refresh(),k.play("catch.caught"),this.timers.push(window.setTimeout(()=>this.onCaught(),2400))):(this.phase="breakout",this.refresh(),k.play("catch.broke"),this.timers.push(window.setTimeout(()=>{this.ballsLeft<=0?(this.phase="fled",this.refresh(),k.play("catch.fled"),this.timers.push(window.setTimeout(()=>this.onFled(),1500))):(this.phase="idle",this.refresh())},1e3)))},s))}onCaught(){var t,s,i,n,r;this.phase="done";const e=ye(this.pokemon,this.state.activePerks);if((t=this.state.vouchers)!=null&&t.includes("grabber")&&((s=e.itemSlots)!=null&&s[1])&&(e.itemSlots[1].unlocked=!0),(i=this.state.vouchers)!=null&&i.includes("held_slot_charter")&&e.itemSlots){const o=e.itemSlots.findIndex(l=>!l.unlocked);o>=0&&(e.itemSlots[o].unlocked=!0)}(n=this.state.deckMods)!=null&&n.startWithSlot2&&((r=e.itemSlots)!=null&&r[1])&&(e.itemSlots[1].unlocked=!0),this.state.team.length<Ae?(this.state.team.push(e),this.state.pendingCatch=null,this.finish()):this.showPCChoice(e)}showPCChoice(e){const t=this.container.querySelector("#catch-screen-inner");if(!t)return;const s=document.createElement("div");s.className="catch-pc-overlay",s.innerHTML=`
      <div class="catch-pc-title">Team is full!</div>
      <div class="catch-pc-sub">What do you want to do with ${e.displayName}?</div>
      <div class="catch-pc-actions">
        <button class="ink-btn ghost" id="send-to-pc-btn">Send to PC</button>
        ${this.state.team.map((i,n)=>`
          <button class="ink-btn" data-swap-index="${n}" style="font-size:12px">
            Swap out ${i.displayName}
          </button>
        `).join("")}
      </div>
    `,t.style.position="relative",t.appendChild(s),s.addEventListener("click",i=>{const n=i.target.closest("button");if(n){if(n.id==="send-to-pc-btn")this.state.pc.push(e);else if(n.dataset.swapIndex!==void 0){const r=parseInt(n.dataset.swapIndex),o=this.state.team.splice(r,1,e);this.state.pc.push(o[0])}this.state.pendingCatch=null,this.finish()}})}onFled(){this.phase="done",this.state.pendingCatch=null,this.finish()}finish(){this.clearTimers();const e=this.container._keyHandler;e&&document.removeEventListener("keydown",e),setTimeout(()=>this.onDone(this.state),300)}unmount(){this.clearTimers();const e=this.container._keyHandler;e&&document.removeEventListener("keydown",e),this.phase="done",this.container.style.display="none",this.container.innerHTML=""}}function _a(a,e,t){return new Promise(s=>{k.duckMusic(.3,250),k.playMusic("music.evolution",{fadeMs:200,loop:!1,volume:.95});const i=document.createElement("div");i.className="evo-overlay",i.innerHTML=`
      <div class="evo-bar top"></div>
      <div class="evo-bar bot"></div>
      <div class="evo-skip">Click to skip</div>
      <div class="evo-kicker top">◇ Evolution ◇</div>
      <div class="evo-stage" id="evo-stage">
        <div class="evo-sprite-wrap">
          <img class="evo-sprite swap-out" id="evo-old-sprite" src="${a.animatedSprite||a.sprite}" alt="${a.displayName}" />
          <img class="evo-sprite swap-in"  id="evo-new-sprite" src="${e.animatedSprite||e.sprite}" alt="${e.displayName}" style="opacity:0;" />
        </div>
        <div class="evo-flash" id="evo-flash"></div>
      </div>
      <div class="evo-kicker bottom">${a.displayName} → ${e.displayName}</div>
      <div class="evo-result" id="evo-result">
        <div class="from-to">
          ${a.displayName}<span class="arrow">►</span>evolved
        </div>
        <div class="new-name">${e.displayName}</div>
      </div>
      <div class="evo-moves" id="evo-moves">
        ${t.map(h=>`
          <div class="evo-move-row">
            ${h.replacedMove?`Forgot <strong>${h.replacedMove.displayName}</strong> · Learned <strong>${h.newMove.displayName}</strong>`:`Learned <strong>${h.newMove.displayName}</strong>`}
          </div>
        `).join("")}
      </div>
    `,document.body.appendChild(i);const n=i.querySelector("#evo-old-sprite"),r=i.querySelector("#evo-new-sprite"),o=i.querySelector("#evo-flash"),l=i.querySelector("#evo-result"),c=i.querySelector("#evo-moves");let d=!1;const p=()=>{d||(d=!0,u.kill(),k.duckMusic(1,400),k.playMusic("music.shop",{fadeMs:800}),O.to(i,{opacity:0,duration:.18,ease:"power2.in",onComplete:()=>{i.remove(),s()}}))};i.addEventListener("click",p),requestAnimationFrame(()=>i.classList.add("active"));const u=O.timeline({defaults:{ease:"power2.out"}});u.fromTo(i,{opacity:0},{opacity:1,duration:.22}),u.fromTo(n,{scale:.4,x:-60,opacity:0},{scale:1,x:0,opacity:1,duration:.32},"<"),u.to({},{duration:.4}),u.add(()=>n.classList.add("silhouette")),u.fromTo(n,{scale:1,rotation:0},{scale:1.08,rotation:-2,duration:.12,repeat:5,yoyo:!0,ease:"steps(2)"}),u.to(o,{scaleY:1,duration:.18,ease:"power3.in"}),u.add(()=>{n.style.opacity="0",r.style.opacity="1"}),u.to(o,{scaleY:0,duration:.22,ease:"power3.out",transformOrigin:"top"}),u.fromTo(r,{scale:.6},{scale:1,duration:.36,ease:"back.out(2.4)"},"-=0.12"),u.fromTo(l,{y:28,opacity:0},{y:0,opacity:1,duration:.28},"+=0.05"),t.length>0&&u.fromTo(c,{y:14,opacity:0},{y:0,opacity:1,duration:.24},"-=0.12"),u.to({},{duration:1.6}),u.add(p)})}class _o{constructor(e,t){b(this,"overlay");b(this,"mon");b(this,"onClose");b(this,"selectedPoolIdx",null);b(this,"keyHandler");b(this,"close",()=>{this.overlay.classList.remove("active"),document.removeEventListener("keydown",this.keyHandler),setTimeout(()=>{this.overlay.remove(),this.onClose()},200)});b(this,"handleClick",async e=>{const t=e.target;if(t.closest("[data-mmm-close]")){this.close();return}if(t===this.overlay){this.close();return}const s=t.closest("[data-mmm-pool]");if(s){const l=parseInt(s.dataset.mmmPool,10);this.selectedPoolIdx=this.selectedPoolIdx===l?null:l,this.render();return}const i=t.closest("[data-mmm-slot]");if(i){const l=parseInt(i.dataset.mmmSlot,10);this.selectedPoolIdx!==null&&(on(this.mon,this.selectedPoolIdx,l),this.selectedPoolIdx=null,this.render());return}if(t.closest("[data-mmm-pending]")){const l=[...this.mon.pendingLearns??[]];l.length>0&&(await Hi(this.mon,l),this.render());return}const r=t.closest("[data-mmm-drop]");if(r){const l=parseInt(r.dataset.mmmDrop,10);(this.mon.movePool??[])[l]&&(this.mon.movePool=(this.mon.movePool??[]).filter((d,p)=>p!==l),this.selectedPoolIdx===l?this.selectedPoolIdx=null:this.selectedPoolIdx!==null&&this.selectedPoolIdx>l&&(this.selectedPoolIdx-=1),this.render());return}const o=t.closest("[data-mmm-teach-pending]");if(o){const l=parseInt(o.dataset.mmmTeachPending,10),c=(this.mon.pendingLearns??[])[l];if(c&&this.mon.moves.length<4){this.mon.moves.push({...c}),this.mon.pendingLearns=(this.mon.pendingLearns??[]).filter(p=>p.id!==c.id);const d=new Set(this.mon.learnedMoveIds??[]);d.add(c.id),this.mon.learnedMoveIds=Array.from(d),this.render()}return}});this.mon=e,this.onClose=t,this.overlay=document.createElement("div"),this.overlay.className="mmm-overlay",this.render(),document.body.appendChild(this.overlay),this.keyHandler=s=>{s.key==="Escape"&&this.close()},document.addEventListener("keydown",this.keyHandler),this.overlay.addEventListener("click",this.handleClick),requestAnimationFrame(()=>this.overlay.classList.add("active"))}render(){this.overlay.innerHTML=this.html()}html(){const e=this.mon.moves.slice(0,4),t=this.mon.movePool??[],s=this.mon.pendingLearns??[],i=this.selectedPoolIdx!==null?t[this.selectedPoolIdx]:null;return`
      <div class="mmm-card">
        <button class="mmm-close" data-mmm-close aria-label="Close">✕</button>
        <div class="mmm-rule"></div>
        <div class="mmm-eyebrow">Field Manual · Move Roster</div>

        <div class="mmm-headline">
          <img src="${this.mon.sprite}" alt="" class="mmm-sprite" />
          <div>
            <div class="mmm-name">${this.mon.displayName}</div>
            <div class="mmm-sub">Lv. ${this.mon.level} · ${this.mon.types.map(n=>n.toUpperCase()).join(" / ")}</div>
          </div>
        </div>

        ${s.length>0?this.renderPending(s):""}

        <div class="mmm-section-label">Active Moveset · ${e.length}/4</div>
        <div class="mmm-slots">
          ${e.map((n,r)=>this.renderSlot(n,r,i)).join("")}
          ${this.renderEmptySlots(e.length)}
        </div>

        <div class="mmm-section-label mmm-section-label-pool">
          Move Pool
          ${t.length>0?'<span class="mmm-section-hint">Tap to select, then tap an active slot to swap</span>':""}
        </div>
        ${t.length===0?'<div class="mmm-empty">No moves stashed. Forgotten or skipped moves arrive here.</div>':`<div class="mmm-pool">${t.map((n,r)=>this.renderPoolMove(n,r)).join("")}</div>`}

        ${i?`<div class="mmm-action-hint">Now tap an active slot to put <em>${i.displayName}</em> there.</div>`:""}

        <div class="mmm-actions">
          <button class="ink-btn primary" data-mmm-close>Done</button>
        </div>
      </div>
    `}renderPending(e){return`
      <div class="mmm-pending-block">
        <div class="mmm-pending-label">Pending learns</div>
        <div class="mmm-pending-list">
          ${e.map((t,s)=>{const i=this.mon.moves.length<4;return`
              <div class="mmm-pending-row">
                <div class="mmm-pending-info">
                  <div class="mmm-pending-name">${t.displayName}</div>
                  <div class="mmm-meta">
                    ${Be(t.type)}
                    ${this.statPill("PWR",t.power)}
                    ${this.statPill("ACC",t.accuracy)}
                  </div>
                </div>
                ${i?`<button class="ink-btn small" data-mmm-teach-pending="${s}">Teach</button>`:`<button class="ink-btn small" data-mmm-pending="${s}">Pick slot →</button>`}
              </div>
            `}).join("")}
        </div>
      </div>
    `}renderSlot(e,t,s){if(!e)return"";const i=s!==null,n=s?this.computeDiff(e,s):null;return`
      <button class="mmm-slot ${i?"mmm-armed":""}" data-mmm-slot="${t}">
        <div class="mmm-slot-num">Slot ${t+1}</div>
        <div class="mmm-slot-name">${e.displayName}</div>
        <div class="mmm-meta">
          ${Be(e.type)}
          ${this.statPill("PWR",e.power,n==null?void 0:n.power)}
          ${this.statPill("ACC",e.accuracy,n==null?void 0:n.accuracy)}
          <span class="mmm-stat mmm-cat">${e.category.toUpperCase()}</span>
        </div>
        ${i?'<div class="mmm-slot-cta">Swap in →</div>':""}
      </button>
    `}renderEmptySlots(e){let t="";for(let s=e;s<4;s++)t+=`<div class="mmm-slot mmm-slot-empty"><div class="mmm-slot-num">Slot ${s+1}</div><div class="mmm-slot-empty-text">— empty —</div></div>`;return t}renderPoolMove(e,t){return`
      <div class="mmm-pool-row ${this.selectedPoolIdx===t?"mmm-selected":""}">
        <button class="mmm-pool-pick" data-mmm-pool="${t}" title="Select this move">
          <div class="mmm-pool-name">${e.displayName}</div>
          <div class="mmm-meta">
            ${Be(e.type)}
            ${this.statPill("PWR",e.power)}
            ${this.statPill("ACC",e.accuracy)}
            <span class="mmm-stat mmm-cat">${e.category.toUpperCase()}</span>
          </div>
        </button>
        <button class="mmm-drop-btn" data-mmm-drop="${t}" title="Forget this move">×</button>
      </div>
    `}statPill(e,t,s){const i=t>0?t:"—";if(s==null||s===0||t===0)return`<span class="mmm-stat">${e} ${i}</span>`;const n=s>0?"+":"",r=s>0?"mmm-delta-up":"mmm-delta-down";return`<span class="mmm-stat">${e} ${i} <span class="mmm-delta ${r}">${n}${s}</span></span>`}computeDiff(e,t){return{power:t.power&&e.power?t.power-e.power:null,accuracy:t.accuracy&&e.accuracy?t.accuracy-e.accuracy:null}}}function Bo(a,e){return new _o(a,e)}const Eo="/".replace(/\/$/,""),Co="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/",as=3;function ke(a,e,t){let s;switch(a){case"legendary":s=80;break;case"epic":s=50;break;case"rare":s=30;break;default:s=15}return e&&(t!=null&&t[e])?Math.max(s,Math.floor(t[e]*.4)):s}function se(a,e=""){const t=e?" "+e:"",s=JSON.stringify(a.icon).replace(/"/g,"&quot;"),n=`this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:&quot;${`item-glyph${t}`.replace(/"/g,"&quot;")}&quot;,textContent:${s}}))`;return a.pokeapiName?`<img src="${Co}${a.pokeapiName}.png" alt="${a.name}" class="item-sprite${t}" draggable="false" onerror="${n}">`:a.sprite?`<img src="${Eo}${a.sprite}" alt="${a.name}" class="item-sprite${t}" draggable="false" onerror="${n}">`:`<span class="item-glyph${t}">${a.icon}</span>`}const qt=class qt{constructor(e,t,s){b(this,"container");b(this,"state");b(this,"onShopDone");b(this,"selectedTeamIndex",0);b(this,"selectedInventoryIndex",-1);b(this,"assigningItem",null);b(this,"openingPackIndex",null);b(this,"packOptions",[]);b(this,"packPicksRemaining",0);b(this,"packPickedKeys",new Set);b(this,"packSpectralCurse",null);b(this,"packPhase","idle");b(this,"packRevealed",new Set);b(this,"packPickedIdx",[]);b(this,"packDef",null);b(this,"packMaxPicks",0);b(this,"packTimers",[]);b(this,"packFanEntered",!1);b(this,"stashTab","items");b(this,"destroyAudioBtn",null);b(this,"mobileDrawer",null);b(this,"mobileBackdrop",null);b(this,"portaledPackModal",null);b(this,"packFanScrollLeft",0);b(this,"handleClick",async e=>{var $,H,W,K,N,z,j,re,me,ce,de;const t=e.target;if(t.closest("#bag-btn")){const M=this.container.querySelector("#bag-modal");M&&(this.refreshStash(),M.classList.remove("hidden"));return}if(t.closest("#close-bag")){($=this.container.querySelector("#bag-modal"))==null||$.classList.add("hidden");return}const n=t.closest("#bag-modal");if(n&&t===n){n.classList.add("hidden");return}if(t.closest("#pc-btn")){this.openPCBoxModal();return}const o=t.closest("[data-stash-tab]");if(o){const M=o.dataset.stashTab;M&&M!==this.stashTab&&(this.stashTab=M,this.refreshStash());return}const l=t.closest("[data-team-slot-unlock]");if(l){const M=parseInt(l.dataset.teamSlotUnlock??"0"),F=parseInt(l.dataset.teamIndex??"0"),U=Ve[M];if(this.state.coins<U){B(`Need ${U}¢ to unlock this slot.`,"error");return}const V=this.state.team[F];if(V!=null&&V.itemSlots[M]){const pe=this.state.coins;this.state.coins-=U,V.itemSlots[M].unlocked=!0;const J=this.container.querySelector("#shop-coin-display");J&&te(J,pe,this.state.coins),B(`Slot ${M+1} unlocked for ${V.displayName}!`,"success"),this.refreshTeamList()}return}const c=t.closest("[data-team-slot-remove]");if(c){const M=parseInt(c.dataset.teamSlotRemove??"0"),F=parseInt(c.dataset.teamIndex??"0"),U=this.state.team[F],V=(H=U==null?void 0:U.itemSlots[M])==null?void 0:H.item;if(!U||!V)return;U.itemSlots[M].item=null,M===0&&(U.heldItem=null);const pe=this.state.inventory.find(Kt=>Kt.item.id===V.id);pe?pe.quantity++:this.state.inventory.push({item:V,quantity:1});const J=ye({...U},this.state.activePerks);J.battleHp=Math.min(U.battleHp,J.maxBattleHp),J.battleStatus=U.battleStatus,J.xp=U.xp,J.xpToNextLevel=U.xpToNextLevel,this.state.team[F]=J,B(`${V.name} removed from ${U.displayName}.`,"success"),this.refreshTeamList(),this.refreshInventory();return}const d=t.closest("[data-team-slot-assign]");if(d){const M=parseInt(d.dataset.teamSlotAssign??"0"),F=parseInt(d.dataset.teamIndex??"0");this.openPickItemModal(F,M);return}const p=t.closest("[data-pick-item]");if(p){const M=parseInt(p.dataset.pickItem??"0"),F=parseInt(p.dataset.pickTeam??"0"),U=parseInt(p.dataset.pickSlot??"0");this.assigningItem=((W=this.state.inventory[M])==null?void 0:W.item)??null,this.selectedInventoryIndex=M,(K=this.container.querySelector("#pick-item-modal"))==null||K.classList.add("hidden"),this.assignHeldItemToSlot(F,U);return}const u=t.closest("[data-unlock-slot]");if(u){const M=parseInt(u.dataset.unlockSlot??"0"),F=parseInt(u.dataset.assignPokemon??"0"),U=Ve[M];if(this.state.coins<U){B(`Need ${U}¢ to unlock this slot.`,"error");return}const V=this.state.team[F];if(V!=null&&V.itemSlots[M]){const pe=this.state.coins;this.state.coins-=U,V.itemSlots[M].unlocked=!0;const J=this.container.querySelector("#shop-coin-display");J&&te(J,pe,this.state.coins),B(`Slot ${M+1} unlocked for ${V.displayName}!`,"success"),this.openAssignModal(this.selectedInventoryIndex)}return}const h=t.closest("[data-assign-slot]");if(h){const M=parseInt(h.dataset.assignSlot??"0"),F=parseInt(h.dataset.assignPokemon??"0");this.assignHeldItemToSlot(F,M);return}const m=t.closest("[data-shop-index]");if(m&&!t.dataset.action){const M=parseInt(m.dataset.shopIndex??"0");this.buyItem(M);return}const v=t.closest("[data-sell-perk]");if(v){const M=parseInt(v.dataset.sellPerk??"-1");this.sellTeamPerk(M);return}const g=t.closest("[data-sell-team-item]");if(g){const M=parseInt(g.dataset.sellTeamItem??"-1");this.sellTeamRewardItem(M);return}const w=t.closest("[data-sell-inv]");if(w){const M=parseInt(w.dataset.sellInv??"-1");this.sellInventoryItem(M);return}const A=t.closest("[data-pack-index]");if(A){const M=parseInt(A.dataset.packIndex??"0");this.buyAndOpenPack(M);return}const x=t.closest("[data-voucher-index]");if(x){const M=parseInt(x.dataset.voucherIndex??"0");this.buyVoucher(M);return}if(t.closest("#po-pack-wrap")&&this.packPhase==="idle"){this.startPackTear();return}const P=t.closest("[data-pack-card]");if(P){const M=parseInt(P.dataset.packCard??"0");this.toggleCardPick(M);return}if(t.id==="po-reveal-all"||t.closest("#po-reveal-all")){this.revealAllCards();return}if(t.id==="po-confirm"||t.closest("#po-confirm")){this.confirmPackPicks();return}if(t.id==="po-close"||t.closest("#po-close")){this.packPhase==="idle"&&this.closePackModal();return}if(t.id==="pack-modal"&&this.packPhase==="idle"){this.closePackModal();return}if(t.dataset.action==="assign-item"){const M=parseInt(t.dataset.invIndex??"0");this.openAssignModal(M);return}if(t.dataset.action==="use-item"){const M=parseInt(t.dataset.invIndex??"0");this.openUseModal(M);return}const I=t.closest('[data-action="open-moves"]');if(I){const M=parseInt(I.dataset.teamIndex??"0"),F=this.state.team[M];F&&this.openMoveManager(F);return}if(t.dataset.action==="move-up"){const M=parseInt(t.dataset.teamIndex??"0");M>0&&([this.state.team[M-1],this.state.team[M]]=[this.state.team[M],this.state.team[M-1]],this.refreshTeamList());return}if(t.dataset.action==="move-down"){const M=parseInt(t.dataset.teamIndex??"0");M<this.state.team.length-1&&([this.state.team[M],this.state.team[M+1]]=[this.state.team[M+1],this.state.team[M]],this.refreshTeamList());return}if(t.dataset.action==="deposit-pc"){const M=parseInt(t.dataset.teamIndex??"0"),F=this.state.team[M];if(!F)return;if(this.state.team.length<=1){B("You need at least one Pokémon on the team!","error"),k.play("ui.error");return}F.battleHp<=0?F.pcReviveCountdown=as:F.pcReviveCountdown=void 0,this.state.team.splice(M,1),this.state.pc.push(F),B(`${F.displayName} stored in the PC Box.`,"success"),k.play("ui.confirm"),this.refreshTeamList(),this.refreshPCList();return}if(t.closest("[data-pc-open]")&&!t.closest("[data-pc-retrieve]")&&!t.closest("[data-pc-swap]")){this.openPCBoxModal();return}if(t.id==="close-pc-box"||t.id==="pc-box-modal"){(N=this.container.querySelector("#pc-box-modal"))==null||N.classList.add("hidden");return}const L=t.closest("[data-pc-retrieve]");if(L){const M=parseInt(L.dataset.pcRetrieve??"0"),F=this.state.pc[M];if(!F)return;if(this.state.team.length>=Ae){B("Team is full! Swap a Pokémon first.","error");return}this.state.pc.splice(M,1),(z=this.state.deckMods)!=null&&z.startWithSlot2&&((j=F.itemSlots)!=null&&j[1])&&(F.itemSlots[1].unlocked=!0),this.state.team.push(F),B(`${F.displayName} added to team!`,"success"),this.refreshTeamList(),this.refreshPCList();return}const S=t.closest("[data-pc-swap]");if(S){const M=parseInt(S.dataset.pcSwap??"0");this.openPCSwapModal(M);return}const E=t.closest("[data-pc-swap-team]");if(E){const M=parseInt(E.dataset.pcSwapPc??"0"),F=parseInt(E.dataset.pcSwapTeam??"0"),U=this.state.pc[M],V=this.state.team[F];if(!U||!V)return;this.state.pc.splice(M,1,V),this.state.team.splice(F,1,U),B(`Swapped ${U.displayName} ↔ ${V.displayName}`,"success"),(re=this.container.querySelector("#pc-swap-modal"))==null||re.classList.add("hidden"),this.refreshTeamList(),this.refreshPCList();return}if(t.id==="reroll-btn"||t.closest("#reroll-btn")){this.rerollShop();return}if(t.id==="continue-btn"||t.closest("#continue-btn")){this.performWaveEndCleanup(),this.onShopDone(this.state);return}if(t.id==="close-assign"||t.id==="assign-modal"){(me=this.container.querySelector("#assign-modal"))==null||me.classList.add("hidden"),this.assigningItem=null;return}if(t.id==="close-pick-item"||t.id==="pick-item-modal"){(ce=this.container.querySelector("#pick-item-modal"))==null||ce.classList.add("hidden");return}if(t.id==="close-use"||t.id==="use-modal"){(de=this.container.querySelector("#use-modal"))==null||de.classList.add("hidden");return}const y=t.closest("[data-use-index]");if(y){const M=parseInt(y.dataset.useIndex??"0");this.useConsumable(M);return}});this.container=e,this.state=t,this.onShopDone=s}mount(){this.container.innerHTML=this.renderHTML(),this.container.style.display="",document.body.classList.add("shop-active"),oe(this.container),this.attachEvents();const e=this.container.querySelector("#shop-audio-slot");e&&(this.destroyAudioBtn=Yi(e)),this.attachMobileTeamDrawer(),this.portalPackModal(),this.processPendingEvolutions()}portalPackModal(){const e=this.portaledPackModal??this.container.querySelector("#pack-modal");e&&(document.body.appendChild(e),e.addEventListener("click",this.handleClick),this.portaledPackModal=e)}attachMobileTeamDrawer(){if(!window.matchMedia("(max-width: 760px)").matches)return;const t=this.container.querySelector(".shop-side"),s=this.container.querySelector(".shop-foot"),i=this.container.querySelector(".shop-wrap");if(!t||!s||!i||s.querySelector("#shop-team-toggle"))return;document.body.appendChild(t),t.addEventListener("click",this.handleClick),this.mobileDrawer=t;const n=document.createElement("div");n.className="shop-side-backdrop mobile-only-btn",document.body.appendChild(n),this.mobileBackdrop=n;const r=document.createElement("button");r.id="shop-team-toggle",r.type="button",r.className="ink-btn primary mobile-only-btn",r.textContent="▲ Team";const o=l=>{t.classList.toggle("open",l),n.classList.toggle("visible",l),r.textContent=l?"▼ Close":"▲ Team"};r.addEventListener("click",()=>o(!t.classList.contains("open"))),n.addEventListener("click",()=>o(!1)),s.insertBefore(r,s.firstChild)}openMoveManager(e){Bo(e,()=>this.refreshTeamList())}async processPendingEvolutions(){for(let e=0;e<this.state.team.length;e++){const t=this.state.team[e];if(!(!t.pendingEvolution||!t.nextEvolutionId))try{const s=await ot(t.nextEvolutionId,t.level),i=ye({...s,itemSlots:t.itemSlots,heldItem:t.heldItem,moves:t.moves,learnedMoveIds:t.learnedMoveIds??t.moves.map(r=>r.id),learnsetPool:s.learnsetPool},this.state.activePerks);i.battleHp=Math.min(i.maxBattleHp,t.battleHp),i.battleStatus=t.battleStatus,i.xp=t.xp,i.xpToNextLevel=It(s.level),i.pendingEvolution=!1;const n=await Ct(i);this.state.team[e]=i,await _a(t,s,n)}catch{t.pendingEvolution=!1,B(`Evolution of ${t.displayName} failed.`,"error")}}this.refreshTeamList()}renderHTML(){var t;const e=this.state.team.filter(s=>s.battleHp>0).length;return`
      <div class="shop-wrap screen">

        <!-- Header: kicker + title | coin-chip + leave button -->
        <div class="shop-head">
          <div>
            <div class="kicker">Rest stop · Wave ${this.state.wave}</div>
            <div class="title">The <em>PEDDLER'S</em> cart</div>
          </div>
          <div class="shop-head-right">
            <div class="coin-chip">
              <span class="coin-dot"></span>
              <span id="shop-coin-display">${this.state.coins.toLocaleString()}</span>
            </div>
            <button class="ink-btn ghost bag-btn" id="bag-btn" title="Open Bag">
              <span class="bag-btn-glyph">▤</span>
              <span class="bag-btn-label">Bag</span>
              <span class="bag-btn-count" id="bag-btn-count">${this.state.inventory.reduce((s,i)=>s+i.quantity,0)}</span>
            </button>
            <button class="ink-btn ghost bag-btn pc-btn" id="pc-btn" title="Open PC Box">
              <img class="bag-btn-glyph pc-btn-icon" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/pokemon-box-link.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'bag-btn-glyph',textContent:'◆'}))" />
              <span class="bag-btn-label">PC</span>
              <span class="bag-btn-count" id="pc-btn-count">${this.state.pc.length}</span>
            </button>
            <span class="audio-btn-slot" id="shop-audio-slot"></span>
            <button class="ink-btn primary" id="continue-btn">Leave →</button>
          </div>
        </div>

        <!-- Status strip: type levels + vouchers count -->
        ${this.renderStatusStrip()}

        <!-- Body: shelf (left) + sidebar (right) -->
        <div class="shop-body">
          <div class="shop-shelf" id="shop-items">
            ${this.renderBoosterPacks()}
            ${this.renderShopItems()}
            ${this.renderVouchers()}
          </div>

          <!-- Pack-opening overlay (full-screen) -->
          <div class="po-overlay hidden" id="pack-modal"></div>

          <div class="shop-side">
            <!-- Team panel — full sidebar height -->
            <div class="team-panel side-team">
              <div class="h">
                <span>Your team</span>
                <span class="count">${e}/${Ae}</span>
              </div>
              <div class="shop-team-list" id="shop-team-list">
                ${this.renderTeamList()}
              </div>
            </div>

            <!-- PC Box compact strip -->
            <div class="pc-strip-panel" id="pc-strip-panel" data-pc-open="1" title="Open PC Box"
                 style="${this.state.pc.length===0?"display:none":""}">
              <div class="pc-strip-h">
                <span class="pc-strip-label">PC Box</span>
                <span class="pc-strip-count">${this.state.pc.length}</span>
              </div>
              <div class="pc-strip" id="shop-pc-strip">
                ${this.renderPCStrip()}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer: tip + reroll -->
        <div class="shop-foot">
          <div class="kicker">► Items refresh next shop · Prices rise with depth</div>
          <button class="ink-btn ghost" id="reroll-btn">Reroll (${Math.floor(ra(this.state.wave)*(((t=this.state.stakeMods)==null?void 0:t.shopPriceMult)??1))}¢)</button>
        </div>

        <!-- Bag modal (inventory + equip + perks) -->
        <div class="modal-overlay hidden" id="bag-modal">
          <div class="modal bag-modal">
            <button class="modal-close" id="close-bag">×</button>
            <h3 class="modal-title">Bag</h3>
            <div class="stash-panel" id="stash-panel">
              ${this.renderStash()}
            </div>
          </div>
        </div>

        <!-- Assign item modal (inventory → pick Pokémon + slot) -->
        <div class="modal-overlay hidden" id="assign-modal">
          <div class="modal">
            <button class="modal-close" id="close-assign">×</button>
            <h3 class="modal-title" id="assign-modal-title">Assign Item</h3>
            <div id="assign-team-list"></div>
          </div>
        </div>

        <!-- Pick held item modal (empty slot → pick from inventory) -->
        <div class="modal-overlay hidden" id="pick-item-modal">
          <div class="modal">
            <button class="modal-close" id="close-pick-item">×</button>
            <h3 class="modal-title" id="pick-item-title">Equip item</h3>
            <div id="pick-item-list"></div>
          </div>
        </div>

        <!-- PC Box modal -->
        <div class="modal-overlay hidden" id="pc-box-modal">
          <div class="modal pc-box-modal">
            <button class="modal-close" id="close-pc-box">×</button>
            <h3 class="modal-title">PC Box <span class="pc-box-count" id="pc-box-count">${this.state.pc.length}</span></h3>
            <div class="pc-box-hint" id="pc-box-hint">${this.state.team.length>=Ae?"Team full — swap a Pokémon to retrieve.":"Click Retrieve to add to your team."}</div>
            <div class="pc-list" id="pc-list-container">${this.renderPCList()}</div>
            <div class="pc-deposit-section">
              <div class="pc-deposit-label">Deposit from team</div>
              <div class="pc-deposit-list" id="pc-deposit-list">${this.renderPCDepositList()}</div>
            </div>
          </div>
        </div>

        <!-- Use consumable modal -->
        <div class="modal-overlay hidden" id="use-modal">
          <div class="modal">
            <button class="modal-close" id="close-use">×</button>
            <h3 class="modal-title" id="use-modal-title">Use on:</h3>
            <div id="use-team-list"></div>
          </div>
        </div>
      </div>
    `}renderPerksStrip(){const e=this.state.activePerks??[],t=this.state.teamRewards??[],s=[];return e.forEach(i=>{s.push(`
        <div class="perk-chip" title="${i.description}">
          <span class="perk-chip-icon">◈</span>
          <span class="perk-chip-name">${i.name}</span>
        </div>
      `)}),t.forEach(i=>{s.push(`
        <div class="perk-chip" title="${i.item.description}">
          <span class="perk-chip-icon">${se(i.item)}</span>
          <span class="perk-chip-name">${i.item.name}</span>
        </div>
      `)}),s.length===0?'<span class="perks-strip-empty">No perks yet — earn them from waves!</span>':s.join("")}renderRewardsSidebarContent(){const e=this.state.activePerks??[],t=this.state.teamRewards??[],s=[];return e.forEach((i,n)=>{const r=ke(i.rarity);s.push(`
        <div class="shop-reward-entry">
          <span class="shop-reward-icon">◈</span>
          <div class="shop-reward-info">
            <div class="shop-reward-name">${i.name}</div>
          </div>
          <button class="ink-btn ghost reward-sell-btn" data-sell-perk="${n}" title="Sell ${i.name} for ${r}¢">Sell ${r}¢</button>
        </div>
      `)}),t.forEach((i,n)=>{const r=ke(i.item.rarity);s.push(`
        <div class="shop-reward-entry">
          <span class="shop-reward-icon">${se(i.item)}</span>
          <div class="shop-reward-info">
            <div class="shop-reward-name">${i.item.name}</div>
            <div class="shop-reward-desc">${i.item.description}</div>
          </div>
          <button class="ink-btn ghost reward-sell-btn" data-sell-team-item="${n}" title="Sell ${i.item.name} for ${r}¢">Sell ${r}¢</button>
        </div>
      `)}),s.length===0?'<div class="shop-rewards-empty">No rewards yet. Win waves to earn perks!</div>':s.join("")}renderStatusStrip(){const e=this.state.typeLevels??{},t=Object.entries(e).filter(([,o])=>o>0),s=this.state.vouchers??[];if(!(t.length>0||s.length>0))return"";const n=t.map(([o,l])=>`
      <span class="type-level-pill type-${o}" title="${o} type Lv.${l}">
        <span class="tlp-type">${o}</span>
        <span class="tlp-lv">Lv.${l}</span>
      </span>`).join(""),r=s.length>0?`<span class="status-strip-chip" title="Active vouchers">◈ ${s.length} voucher${s.length===1?"":"s"}</span>`:"";return`
      <div class="shop-status-strip">
        ${t.length>0?`
          <span class="status-strip-label">Type Levels</span>
          <div class="status-strip-pills">${n}</div>
        `:""}
        ${r?`<span class="status-strip-sep"></span>${r}`:""}
      </div>
    `}renderPCStrip(){const e=this.state.pc??[];return e.length===0?"":e.slice(0,12).map((t,s)=>`
      <div class="pc-chip" data-pc-open="1" data-pc-index="${s}" title="${t.displayName} · Lv.${t.level} — open PC Box">
        <img class="pc-chip-sprite" src="${t.sprite}" alt="${t.displayName}" draggable="false">
        <span class="pc-chip-lv">L${t.level}</span>
      </div>
    `).join("")+(e.length>12?`<span class="pc-chip-more" data-pc-open="1" title="Open PC Box">+${e.length-12}</span>`:"")}renderStash(){const e=this.state.inventory.reduce((o,l)=>o+l.quantity,0),t=this.state.teamRewards.length,s=this.state.activePerks.length,i=this.stashTab,n=(o,l,c)=>`
      <button class="stash-tab${i===o?" active":""}" data-stash-tab="${o}" type="button">
        <span class="stash-tab-label">${l}</span>
        <span class="stash-tab-count">${c}</span>
      </button>
    `;let r="";return i==="items"?r=this.renderStashItems():i==="equip"?r=this.renderStashEquip():r=this.renderStashPerks(),`
      <div class="stash-tabs" role="tablist">
        ${n("items","Items",e)}
        ${n("equip","Equip",t)}
        ${n("perks","Perks",s)}
      </div>
      <div class="stash-list" id="stash-list">${r}</div>
    `}renderStashItems(){return this.state.inventory.length===0?'<div class="stash-empty">No items yet — buy from the cart or open boosters.</div>':this.state.inventory.map((e,t)=>{const s=ke(e.item.rarity,e.item.id,this.state.lastPaidPrices),i=e.item.itemType==="held"?`<button class="stash-btn" data-action="assign-item" data-inv-index="${t}" title="Assign ${e.item.name}">Assign</button>`:`<button class="stash-btn" data-action="use-item" data-inv-index="${t}" title="Use ${e.item.name}">Use</button>`;return`
        <div class="stash-row" data-inv-index="${t}">
          <span class="stash-row-icon">${se(e.item)}</span>
          <div class="stash-row-info">
            <div class="stash-row-name">${e.item.name}<span class="stash-row-qty">×${e.quantity}</span></div>
            <div class="stash-row-sub">${e.item.itemType==="held"?"Held":"Consumable"} · ${e.item.rarity}</div>
          </div>
          <div class="stash-row-actions">
            ${i}
            <button class="stash-btn sell" data-sell-inv="${t}" title="Sell 1 ${e.item.name} for ${s}¢">Sell ${s}¢</button>
          </div>
        </div>
      `}).join("")}renderStashEquip(){const e=this.state.teamRewards??[];return e.length===0?'<div class="stash-empty">No team-equipped items yet.</div>':e.map((t,s)=>{const i=ke(t.item.rarity);return`
        <div class="stash-row">
          <span class="stash-row-icon">${se(t.item)}</span>
          <div class="stash-row-info">
            <div class="stash-row-name">${t.item.name}</div>
            <div class="stash-row-sub">${t.item.description}</div>
          </div>
          <div class="stash-row-actions">
            <button class="stash-btn sell" data-sell-team-item="${s}" title="Sell ${t.item.name} for ${i}¢">Sell ${i}¢</button>
          </div>
        </div>
      `}).join("")}renderStashPerks(){const e=this.state.activePerks??[];return e.length===0?'<div class="stash-empty">No perks yet — earn them between waves.</div>':e.map((t,s)=>{const i=ke(t.rarity);return`
        <div class="stash-row">
          <span class="stash-row-icon perk-icon">◈</span>
          <div class="stash-row-info">
            <div class="stash-row-name">${t.name}</div>
            <div class="stash-row-sub">${t.description}</div>
          </div>
          <div class="stash-row-actions">
            <button class="stash-btn sell" data-sell-perk="${s}" title="Sell ${t.name} for ${i}¢">Sell ${i}¢</button>
          </div>
        </div>
      `}).join("")}renderVouchers(){const e=this.state.shopVouchers??[];if(e.length===0)return"";const t=e.map((i,n)=>{const r=ia(i.voucherId);return r?`
        <div class="voucher-card${i.sold?" sold":""}" data-voucher-index="${n}">
          <div class="voucher-glyph">${r.icon}</div>
          <div class="voucher-body">
            <div class="voucher-head">
              <div class="voucher-name">${r.name}</div>
              <div class="voucher-price">${i.price}¢</div>
            </div>
            <div class="voucher-desc">${r.description}</div>
          </div>
        </div>
      `:""}).join("");return`
      <section class="shelf-section shelf-vouchers">
        <header class="shelf-section-head">
          <span class="shelf-section-glyph">◈</span>
          <span class="shelf-section-title">Vouchers</span>
          <span class="shelf-section-meta">${e.filter(i=>!i.sold).length} on offer</span>
          <span class="shelf-section-rule"></span>
        </header>
        <div class="voucher-row">${t}</div>
      </section>
    `}renderPackArt(e,t={pickN:1,outOf:1}){const s=Tn[e],i=Mn[e],n=ta[e],r=Pn[e],o=t.size??"sm",l=Array.from({length:12}).map((c,d)=>`<span style="transform:rotate(${d*30}deg) translateY(-50%)"></span>`).join("");return`
      <div class="pa pa-${o}" style="--pa-c1:${s[0]};--pa-c2:${s[1]}">
        <div class="pa-bg"></div>
        <div class="pa-halftone"></div>
        <div class="pa-foil"></div>

        <div class="pa-top">
          <div class="pa-series">${i}</div>
          <div class="pa-tear-edge"></div>
        </div>

        <div class="pa-emblem">
          <div class="pa-ball">
            <div class="pa-ball-top"></div>
            <div class="pa-ball-seam"></div>
            <div class="pa-ball-btn"></div>
            <div class="pa-ball-bot"></div>
          </div>
          <div class="pa-rays">${l}</div>
        </div>

        <div class="pa-name">
          <div class="pa-title">${n}</div>
          <div class="pa-sub">Booster</div>
        </div>

        <div class="pa-bottom">
          <span class="pa-pick">${t.pickN} of ${t.outOf}</span>
          <span class="pa-kind">${r}</span>
        </div>

        <span class="pa-star pa-star-tl">✦</span>
        <span class="pa-star pa-star-tr">✦</span>
        <span class="pa-star pa-star-bl">✦</span>
        <span class="pa-star pa-star-br">✦</span>
      </div>
    `}renderBoosterPacks(){const e=this.state.shopPacks??[];if(e.length===0)return"";const t=e.map((s,i)=>{const n=sa(s.packId);if(!n)return"";const r=s.free?"FREE":`${s.price}¢`,o=!s.free&&this.state.coins<s.price;return`
        <div class="${["pack-card",s.sold?"sold":"",s.free?"pack-free":"",o?"unaffordable":""].filter(Boolean).join(" ")}" data-pack-index="${i}" title="${n.name} — ${n.description}">
          ${this.renderPackArt(n.id,{size:"sm",price:null,pickN:n.pick,outOf:n.options})}
          <div class="pa-price${s.free?" is-free":""}">${r}</div>
        </div>
      `}).join("");return`
      <section class="shelf-section shelf-boosters">
        <header class="shelf-section-head">
          <span class="shelf-section-glyph">◇</span>
          <span class="shelf-section-title">Boosters</span>
          <span class="shelf-section-meta">${e.filter(s=>!s.sold).length} avail</span>
          <span class="shelf-section-rule"></span>
        </header>
        <div class="booster-row">${t}</div>
      </section>
    `}renderShopItems(){if(this.state.shopItems.length===0)return"";const e=this.state.shopItems.map((s,i)=>{const n=s.item.rarity??"common",r=s.item.itemType==="held"?"held":"consumable";return`
        <div class="shop-item${s.sold?" sold":""}" data-shop-index="${i}" data-item-id="${s.item.id}">
          <div class="item-art">${se(s.item)}</div>
          <div class="item-body">
            <div class="item-head">
              <div class="item-name">${s.item.name}</div>
              <div class="item-price">${s.price}¢</div>
            </div>
            <div class="item-meta">· ${n} · ${r}</div>
            <div class="item-desc">${s.item.description}</div>
          </div>
        </div>
      `}).join("");return`
      <section class="shelf-section shelf-items">
        <header class="shelf-section-head">
          <span class="shelf-section-glyph">◆</span>
          <span class="shelf-section-title">Goods</span>
          <span class="shelf-section-meta">${this.state.shopItems.filter(s=>!s.sold).length} on shelf</span>
          <span class="shelf-section-rule"></span>
        </header>
        <div class="shop-items-grid">${e}</div>
      </section>
    `}renderItemSlots(e){return`<div class="item-slots-row">${(e.itemSlots??[]).map((s,i)=>s.unlocked&&s.item?`<div class="item-slot filled" title="${s.item.name}: ${s.item.description}">${se(s.item)}</div>`:s.unlocked?`<div class="item-slot empty" title="Slot ${i+1} (empty)">·</div>`:`<div class="item-slot locked" title="Unlock: ${Ve[i]}¢">◈</div>`).join("")}</div>`}renderTeamList(){return this.state.team.map((e,t)=>{var l,c,d;const s=Math.max(0,Math.min(100,e.battleHp/e.maxBattleHp*100)),i=s>50?"high":s>20?"mid":"low",n=e.itemSlots??[],r=this.state.inventory.some(p=>p.item.itemType==="held"),o=n.map((p,u)=>{if(p.unlocked)if(p.item){const h=p.item.name.length>9?p.item.name.slice(0,8)+"…":p.item.name;return`
            <button class="stc-slot filled"
              data-team-slot-remove="${u}" data-team-index="${t}"
              title="${p.item.name} — click to remove">
              ${se(p.item,"stc-slot-glyph")}
              <span class="stc-slot-label">${h}</span>
              <span class="stc-slot-x">×</span>
            </button>`}else return`
            <button class="stc-slot empty ${r?"":"cant-afford"}"
              data-team-slot-assign="${u}" data-team-index="${t}"
              title="${r?"Equip a held item":"No held items in inventory"}">
              <span class="stc-slot-glyph">+</span>
              <span class="stc-slot-label">Equip</span>
            </button>`;else{const h=Ve[u],m=this.state.coins>=h;return`
            <button class="stc-slot locked ${m?"":"cant-afford"}"
              data-team-slot-unlock="${u}" data-team-index="${t}"
              title="${m?`Unlock Slot ${u+1} for ${h}¢`:`Need ${h}¢ to unlock`}">
              <span class="stc-slot-glyph">◈</span>
              <span class="stc-slot-label">${h}¢</span>
            </button>`}}).join("");return`
        <div class="shop-team-card ${e.battleHp<=0?"fainted":""}"
             draggable="true"
             data-team-drag="${t}">
          <div class="stc-top">
            <span class="stc-drag-handle" title="Drag to reorder">⋮⋮</span>
            <img src="${e.sprite}" class="stc-sprite" alt="${e.displayName}" />
            <div class="stc-meta">
              <div class="stc-name-row">
                <span class="stc-name">${e.displayName}</span>
                <span class="stc-types">${ct(e.types??[])}</span>
              </div>
              <span class="stc-stat">Lv ${e.level} · ${Math.max(0,e.battleHp)}/${e.maxBattleHp}</span>
              <div class="stc-hp-bar">
                <div class="stc-hp-fill ${i}" style="width:${s}%"></div>
              </div>
            </div>
            <div class="stc-actions">
              <button class="stc-order-btn stc-moves-btn ${(((l=e.pendingLearns)==null?void 0:l.length)??0)>0?"has-pending":""}"
                      data-action="open-moves" data-team-index="${t}"
                      title="${(((c=e.pendingLearns)==null?void 0:c.length)??0)>0?`${e.pendingLearns.length} move(s) waiting`:"Manage moves"}">
                ☰
                ${(((d=e.pendingLearns)==null?void 0:d.length)??0)>0?`<span class="stc-moves-badge">${e.pendingLearns.length}</span>`:""}
              </button>
              ${t>0?`<button class="stc-order-btn" data-action="move-up" data-team-index="${t}" title="Move up">↑</button>`:'<span class="stc-order-btn" style="visibility:hidden;pointer-events:none"></span>'}
              ${t<this.state.team.length-1?`<button class="stc-order-btn" data-action="move-down" data-team-index="${t}" title="Move down">↓</button>`:'<span class="stc-order-btn" style="visibility:hidden;pointer-events:none"></span>'}
            </div>
          </div>
          <div class="stc-slots-row">${o}</div>
        </div>
      `}).join("")}renderPCDepositList(){return this.state.team.length<=1?'<div class="pc-deposit-empty">Need at least 2 Pokémon in team to deposit.</div>':this.state.team.map((e,t)=>`
      <div class="pc-row pc-deposit-row" data-team-index="${t}">
        <img src="${e.sprite}" alt="${e.displayName}" class="pc-sprite" draggable="false">
        <div class="pc-info">
          <span class="pc-name">${e.displayName}</span>
          <span class="pc-meta">Lv.${e.level} · ${e.battleHp}/${e.maxBattleHp} HP</span>
        </div>
        <button class="btn btn-sm btn-secondary" data-action="deposit-pc" data-team-index="${t}">Deposit</button>
      </div>
    `).join("")}renderPCList(){const e=this.state.team.length>=Ae;return this.state.pc.map((t,s)=>{const i=t.battleHp<=0,n=i?t.pcReviveCountdown??as:0,r=i?`<span style="color:var(--oxblood)">Fainted</span> · <span style="color:var(--moss)">Revives in ${n} wave${n===1?"":"s"}</span>`:`${t.battleHp}/${t.maxBattleHp} HP`;return`
        <div class="pc-row${i?" fainted":""}" data-pc-index="${s}">
          <img src="${t.sprite}" alt="${t.displayName}" class="pc-sprite" draggable="false">
          <div class="pc-info">
            <span class="pc-name">${t.displayName}</span>
            <span class="pc-meta">Lv.${t.level} · ${r}</span>
          </div>
          ${e?`<button class="btn btn-sm btn-secondary" data-pc-swap="${s}" title="Swap with a team member">Swap</button>`:`<button class="btn btn-sm btn-secondary" data-pc-retrieve="${s}">Retrieve</button>`}
        </div>
      `}).join("")}renderInventory(){return this.state.inventory.length===0?'<div class="inventory-empty">No items in inventory</div>':this.state.inventory.map((e,t)=>`
      <div class="inventory-row ${t===this.selectedInventoryIndex?"selected":""}" data-inv-index="${t}">
        <span class="inv-icon">${se(e.item)}</span>
        <div class="inv-info">
          <span class="inv-name">${e.item.name}</span>
          <span class="inv-type">${e.item.itemType==="held"?"Held":"Consumable"}</span>
        </div>
        <span class="inv-qty">×${e.quantity}</span>
        <div class="inv-actions">
          ${e.item.itemType==="held"?`<button class="btn btn-sm btn-secondary" data-action="assign-item" data-inv-index="${t}">Assign</button>`:`<button class="btn btn-sm btn-secondary" data-action="use-item" data-inv-index="${t}">Use</button>`}
        </div>
      </div>
    `).join("")}renderTeamRewards(){const e=this.state.activePerks??[];return e.length===0?'<div class="team-rewards-empty">No perks yet — win waves to earn them!</div>':e.map(t=>`
      <div class="team-reward-row">
        <span class="inv-icon">${t.icon??"◈"}</span>
        <div class="inv-info">
          <span class="inv-name">${t.name}</span>
          <span class="inv-type">${t.description}</span>
        </div>
      </div>
    `).join("")}attachEvents(){this.container.addEventListener("click",this.handleClick)}sellTeamPerk(e){const t=this.state.activePerks??[];if(e<0||e>=t.length)return;const s=t[e],i=ke(s.rarity);t.splice(e,1);const n=this.state.coins;this.state.coins+=i;const r=this.container.querySelector("#shop-coin-display");r&&te(r,n,this.state.coins),B(`${s.name} sold (+${i}¢)`,"success"),this.refreshShop()}sellInventoryItem(e){const t=this.state.inventory??[];if(e<0||e>=t.length)return;const s=t[e],i=ke(s.item.rarity,s.item.id,this.state.lastPaidPrices);s.quantity-=1,s.quantity<=0&&t.splice(e,1);const n=this.state.coins;this.state.coins+=i;const r=this.container.querySelector("#shop-coin-display");r&&te(r,n,this.state.coins),B(`${s.item.name} sold (+${i}¢)`,"success"),this.refreshStash()}sellTeamRewardItem(e){const t=this.state.teamRewards??[];if(e<0||e>=t.length)return;const s=t[e],i=ke(s.item.rarity,s.item.id,this.state.lastPaidPrices);t.splice(e,1);const n=this.state.coins;this.state.coins+=i;const r=this.container.querySelector("#shop-coin-display");r&&te(r,n,this.state.coins),B(`${s.item.name} sold (+${i}¢)`,"success"),this.refreshShop()}buyItem(e){const t=this.state.shopItems[e];if(!t||t.sold)return;if(!kt(t.price,this.state.coins)){B("Not enough coins!","error"),k.play("shop.unaffordable");return}const{success:s,newCoins:i}=Bn(t,this.state.coins);if(!s)return;k.play("shop.buy");const n=this.state.coins;this.state.coins=i,t.sold=!0,this.state.lastPaidPrices||(this.state.lastPaidPrices={}),this.state.lastPaidPrices[t.item.id]=t.price;const r=this.state.inventory.find(l=>l.item.id===t.item.id);r?r.quantity++:this.state.inventory.push({item:t.item,quantity:1}),this.state.runStats.itemsCollected++;const o=this.container.querySelector("#shop-coin-display");o&&te(o,n,i),B(`${t.item.name} purchased!`,"success"),this.refreshShop(),this.refreshInventory()}buyVoucher(e){var r,o;const t=(r=this.state.shopVouchers)==null?void 0:r[e];if(!t||t.sold)return;const s=ia(t.voucherId);if(!s)return;if(!kt(t.price,this.state.coins)){B("Not enough coins!","error"),k.play("shop.unaffordable");return}const i=this.state.coins;this.state.coins-=t.price,t.sold=!0,k.play("shop.voucher"),this.state.vouchers||(this.state.vouchers=[]),this.state.vouchers.includes(t.voucherId)||this.state.vouchers.push(t.voucherId);const n=this.container.querySelector("#shop-coin-display");if(n&&te(n,i,this.state.coins),t.voucherId==="overstock"&&(this.state.shopItems=Jt(this.state.wave,[],this.state.vouchers,{excludeConsumables:!!((o=this.state.deckMods)!=null&&o.shopExcludeConsumables)})),t.voucherId==="grabber"&&(this.state.team.forEach(l=>{var c;(c=l.itemSlots)!=null&&c[1]&&!l.itemSlots[1].unlocked&&(l.itemSlots[1].unlocked=!0)}),this.refreshTeamList()),t.voucherId==="held_slot_charter"){const l=c=>{if(!c.itemSlots)return;const d=c.itemSlots.findIndex(p=>!p.unlocked);d>=0&&(c.itemSlots[d].unlocked=!0)};this.state.team.forEach(l),this.state.pc.forEach(l),this.refreshTeamList()}B(`${s.name} activated!`,"success"),this.refreshShop()}buyAndOpenPack(e){var i;const t=(i=this.state.shopPacks)==null?void 0:i[e];if(!t||t.sold)return;const s=sa(t.packId);if(s){if(!t.free&&!kt(t.price,this.state.coins)){B("Not enough coins!","error"),k.play("shop.unaffordable");return}if(!t.free){const n=this.state.coins;this.state.coins-=t.price;const r=this.container.querySelector("#shop-coin-display");r&&te(r,n,this.state.coins)}t.sold=!0,k.play("shop.buy"),this.refreshShop(),this.openPackModal(e,s)}}rollRarityForPack(e){const t=e.minRarity??"common",s=["common","rare","epic","legendary"],i=s.indexOf(t),n=Math.random();let r=i;return n<.1&&i<3?r=Math.min(3,i+2):n<.45&&i<3&&(r=Math.min(3,i+1)),s[r]}generatePackOptions(e){const t=[],s=new Set,i=new Set(this.state.activePerks.map(o=>o.id)),n=o=>{for(let c=0;c<6;c++){const d=this.rollRarityForPack(e),p=Z.filter(u=>u.rarity===d&&!s.has(u.id)&&!u.rewardOnly&&o(u));if(p.length)return p[Math.floor(Math.random()*p.length)]}const l=Z.filter(c=>!s.has(c.id)&&!c.rewardOnly&&o(c));return l.length?l[Math.floor(Math.random()*l.length)]:null},r=()=>{for(let o=0;o<6;o++){const l=this.rollRarityForPack(e),c=ei.filter(d=>d.rarity===l&&!i.has(d.id));if(c.length){const d=c[Math.floor(Math.random()*c.length)];return i.add(d.id),d}}return null};for(let o=0;o<e.options;o++)if(e.contents==="held_items"){const l=n(c=>c.itemType==="held");l&&(s.add(l.id),t.push({kind:"item",item:l}))}else if(e.contents==="consumables"){const l=n(c=>c.itemType==="consumable");l&&(s.add(l.id),t.push({kind:"item",item:l}))}else if(e.contents==="perks"){const l=r();l&&t.push({kind:"perk",perk:l})}else if(e.contents==="mixed"){const l=Math.random();if(l<.45){const p=n(u=>u.itemType==="held");if(p){s.add(p.id),t.push({kind:"item",item:p});continue}}if(l<.8){const p=n(u=>u.itemType==="consumable");if(p){s.add(p.id),t.push({kind:"item",item:p});continue}}const c=r();if(c){t.push({kind:"perk",perk:c});continue}const d=n(()=>!0);d&&(s.add(d.id),t.push({kind:"item",item:d}))}else if(e.contents==="spectral"){const l=n(c=>c.itemType==="held"&&(c.rarity==="epic"||c.rarity==="legendary"));l&&(s.add(l.id),t.push({kind:"item",item:l}))}return t}openPackModal(e,t){var r;this.openingPackIndex=e;const i=((r=this.state.vouchers)==null?void 0:r.includes("magic_trick"))?{...t,options:t.options+1}:t;this.packDef=i,this.packOptions=this.generatePackOptions(i),this.packMaxPicks=Math.min(t.pick,this.packOptions.length),this.packPicksRemaining=this.packMaxPicks,this.packPickedKeys=new Set,this.packPickedIdx=[],this.packRevealed=new Set,this.packSpectralCurse=t.contents==="spectral"?Ln():null,this.packPhase="idle",this.packFanEntered=!1,this.clearPackTimers(),(this.portaledPackModal??this.container.querySelector("#pack-modal")).classList.remove("hidden"),this.renderPackOverlay()}clearPackTimers(){this.packTimers.forEach(e=>window.clearTimeout(e)),this.packTimers=[]}optionLabel(e){const t={common:1,rare:3,epic:4,legendary:5};return e.kind==="item"?{name:e.item.name,eff:e.item.description,rarity:e.item.rarity??"common",type:e.item.itemType==="held"?"held":"consumable",iconHtml:se(e.item),tier:t[e.item.rarity??"common"]??1}:{name:e.perk.name,eff:e.perk.description,rarity:e.perk.rarity??"rare",type:"perk",iconHtml:'<span class="po-c-icon-glyph">◈</span>',tier:t[e.perk.rarity??"rare"]??3}}renderPackOverlay(){const e=this.portaledPackModal??this.container.querySelector("#pack-modal");if(!e||!this.packDef)return;const t=this.packDef,s=this.packPhase,i=this.packOptions,n=i.length;let r="";s==="idle"?r=`Tap the pack to tear it open. Pick ${this.packMaxPicks} of ${n}.`:s==="shake"?r="Hold on…":s==="tear"?r="Tearing the seal…":s==="fan"?r=`Revealed <b>${this.packRevealed.size}</b> / ${n} · Pick <b>${this.packPickedIdx.length}</b> / ${this.packMaxPicks}`:s==="done"&&(r="Adding to satchel…");const o=this.packSpectralCurse?`<div class="po-curse-line"><span class="pack-curse">Side-effect: ${this.packSpectralCurse.name} — ${this.packSpectralCurse.description}</span></div>`:"",l=`The <em>${ta[t.id].toUpperCase()}</em> Booster`,c=s==="idle"||s==="shake"||s==="tear",d=s==="fan"||s==="done",p=this.renderPackArt(t.id,{size:"lg",price:null,pickN:t.pick,outOf:n});let u="";if(c){const w=`po-pack-wrap ${s}`,A=s==="idle"?'<div class="po-tap-prompt"><span>▶ TAP TO OPEN</span></div>':"",x=s==="tear"?`<div class="po-rip">${Array.from({length:18}).map(()=>{const T=(Math.random()-.5)*320,P=-Math.random()*260-80,I=(Math.random()-.5)*360,C=Math.random()*.2;return`<span style="--dx:${T}px;--dy:${P}px;--r:${I}deg;--d:${C}s"></span>`}).join("")}</div>`:"";u=`
        <div class="${w}" id="po-pack-wrap">
          ${p}
          ${A}
          <div class="po-pack-top">${p}</div>
          <div class="po-pack-bot">${p}</div>
          ${x}
        </div>
      `}else if(d){const w=(n-1)/2,A=Math.min(44,18*n),x=i.map((P,I)=>{const C=I-w,L=C*(A/n),S=Math.abs(C)*6,E=this.packRevealed.has(I),y=this.packPickedIdx.includes(I),$=["po-card-slot",E?"revealed":"",y?"picked":"",s==="done"?"flyoff":""].filter(Boolean).join(" "),H=this.optionLabel(P);return`
          <div class="${$}" data-pack-card="${I}"
               style="--rot:${L}deg;--lift:${S}px;--i:${I};animation-delay:${I*90}ms">
            <div class="po-card-flip">
              <div class="po-card-back">
                ${this.renderPackArt(t.id,{size:"sm",price:null,pickN:t.pick,outOf:n})}
              </div>
              <div class="po-card-front type-${H.type}">
                <div class="po-c-head">
                  <span class="po-c-type">${H.type.toUpperCase()}</span>
                  <span class="po-c-rarity">${"✦".repeat(H.tier)}</span>
                </div>
                <div class="po-c-art">
                  <div class="po-c-art-frame">
                    <span class="po-c-icon">${H.iconHtml}</span>
                  </div>
                  <div class="po-c-art-shine"></div>
                </div>
                <div class="po-c-name">${H.name}</div>
                <div class="po-c-eff">${H.eff}</div>
                <div class="po-c-footer">
                  <span class="po-c-tier">${H.rarity.toUpperCase()}</span>
                  <span class="po-c-num">#${String(I+1).padStart(2,"0")}/${String(n).padStart(2,"0")}</span>
                </div>
                ${y?'<div class="po-c-picked-stamp">KEPT</div>':""}
              </div>
            </div>
          </div>
        `}).join("");u=`<div class="${this.packFanEntered?"po-fan":"po-fan is-entering"}">${x}</div>`,this.packFanEntered=!0}const h=this.packPickedIdx.length===this.packMaxPicks,m=s==="fan"?`
        <div class="po-actions">
          <button class="ink-btn ghost" id="po-reveal-all">Reveal all</button>
          <button class="ink-btn ${h?"primary":"ghost"}" id="po-confirm" ${h?"":"disabled"}>
            ${h?`▶ Confirm pick${this.packMaxPicks>1?"s":""}`:`Pick ${this.packMaxPicks-this.packPickedIdx.length} more`}
          </button>
        </div>
      `:"",v=s==="idle"?'<button class="po-close" id="po-close">✕ BACK</button>':"",g=e.querySelector(".po-fan");if(g&&(this.packFanScrollLeft=g.scrollLeft),e.innerHTML=`
      <div class="po-halftone"></div>
      <div class="po-vignette"></div>
      ${v}
      <div class="po-head">
        <div class="po-kicker">— Opening —</div>
        <h1 class="po-title">${l}</h1>
        <div class="po-sub">${r}</div>
        ${o}
      </div>
      <div class="po-stage">${u}</div>
      ${m}
    `,d&&this.packFanScrollLeft>0){const w=e.querySelector(".po-fan");if(w){const A=w.style.scrollSnapType;w.style.scrollSnapType="none",w.scrollLeft=this.packFanScrollLeft,requestAnimationFrame(()=>{w.style.scrollSnapType=A})}}}startPackTear(){this.packPhase==="idle"&&(this.packPhase="shake",this.renderPackOverlay(),this.packTimers.push(window.setTimeout(()=>{this.packPhase="tear",k.play("shop.pack_open"),this.renderPackOverlay()},500)),this.packTimers.push(window.setTimeout(()=>{this.packPhase="fan",this.packFanEntered=!1,this.renderPackOverlay()},1300)))}toggleCardPick(e){if(this.packPhase!=="fan")return;if(!this.packRevealed.has(e)){this.packRevealed.add(e),this.renderPackOverlay();return}const t=this.packPickedIdx.indexOf(e);t>=0?this.packPickedIdx.splice(t,1):this.packPickedIdx.length<this.packMaxPicks&&this.packPickedIdx.push(e),this.renderPackOverlay()}revealAllCards(){this.packPhase==="fan"&&(this.packOptions.forEach((e,t)=>this.packRevealed.add(t)),this.renderPackOverlay())}confirmPackPicks(){if(this.packPhase!=="fan"||this.packPickedIdx.length!==this.packMaxPicks)return;const e=[];for(const t of this.packPickedIdx){const s=this.packOptions[t];if(s)if(s.kind==="item"){const i=this.state.inventory.find(n=>n.item.id===s.item.id);i?i.quantity++:this.state.inventory.push({item:s.item,quantity:1}),this.state.runStats.itemsCollected++,e.push(s.item.name)}else this.state.activePerks.push(s.perk),this.state.runStats.perksCollected++,e.push(s.perk.name)}this.packSpectralCurse&&this.applySpectralCurse(this.packSpectralCurse),this.packPhase="done",this.renderPackOverlay(),this.packTimers.push(window.setTimeout(()=>{this.closePackModal(),e.length&&B(`Kept: ${e.join(" · ")}`,"success"),this.refreshInventory(),this.refreshTeamList()},700))}applySpectralCurse(e){if(e.id==="frayed_edge")this.state.team.forEach(t=>{t.maxBattleHp=Math.max(1,Math.floor(t.maxBattleHp*.9)),t.battleHp=Math.min(t.battleHp,t.maxBattleHp)});else if(e.id==="heavy_load")this.state.team.forEach(t=>{t.effectiveStats.speed=Math.max(1,Math.floor(t.effectiveStats.speed*.9))});else if(e.id==="blood_pact"){const t=this.state.coins;this.state.coins=Math.max(0,this.state.coins-50);const s=this.container.querySelector("#shop-coin-display");s&&te(s,t,this.state.coins)}else e.id==="time_debt"&&(this.state.curseTimeDebtWaves=(this.state.curseTimeDebtWaves??0)+2);B(`Curse: ${e.name} — ${e.description}`,"error"),ue(this.state.playerName,"spectral_dabbler")}closePackModal(){this.clearPackTimers();const e=this.portaledPackModal??this.container.querySelector("#pack-modal");e&&(e.classList.add("hidden"),e.innerHTML=""),this.openingPackIndex=null,this.packOptions=[],this.packPicksRemaining=0,this.packPickedKeys=new Set,this.packPickedIdx=[],this.packRevealed=new Set,this.packSpectralCurse=null,this.packDef=null,this.packPhase="idle",this.packMaxPicks=0,this.packFanScrollLeft=0,this.refreshTeamList()}rerollShop(){var c,d,p;const t=((c=this.state.vouchers)==null?void 0:c.includes("reroll_surplus"))&&!this.state.freeRerollUsed,s=(this.state.freeRerollsLeft??0)>0,i=t||s,n=((d=this.state.stakeMods)==null?void 0:d.shopPriceMult)??1,r=Math.floor(ra(this.state.wave)*n);if(!i&&!kt(r,this.state.coins)){B("Not enough coins to reroll!","error"),k.play("shop.unaffordable");return}k.play("shop.reroll");const o=this.state.coins;i?t?this.state.freeRerollUsed=!0:this.state.freeRerollsLeft=Math.max(0,(this.state.freeRerollsLeft??0)-1):this.state.coins-=r,this.state.shopItems=Jt(this.state.wave,[],this.state.vouchers??[],{excludeConsumables:!!((p=this.state.deckMods)!=null&&p.shopExcludeConsumables)});const l=this.container.querySelector("#shop-coin-display");l&&!i&&te(l,o,this.state.coins),this.refreshShop(),B(i?"Free reroll (Surplus)!":"Shop rerolled!","info")}openAssignModal(e){const t=this.state.inventory[e];if(!t||t.item.itemType!=="held")return;this.assigningItem=t.item,this.selectedInventoryIndex=e;const s=this.container.querySelector("#assign-modal"),i=s.querySelector("#assign-modal-title"),n=s.querySelector("#assign-team-list");i.textContent=`Assign "${t.item.name}"`;const r=t.item.rarity?`· ${t.item.rarity} `:"";n.innerHTML=`
      <div class="modal-item-preview">
        <div class="mip-glyph">${se(t.item)}</div>
        <div>
          <div class="mip-name">${t.item.name}</div>
          <div class="mip-meta">· Held Item ${r}·</div>
          <div class="mip-desc">${t.item.description}</div>
        </div>
      </div>
      ${this.state.team.map((o,l)=>{const c=Math.max(0,Math.min(100,o.battleHp/o.maxBattleHp*100)),d=c>50?"high":c>20?"mid":"low",p=(o.itemSlots??[]).map((u,h)=>{if(u.unlocked)if(u.item){const m=u.item.name.length>9?u.item.name.slice(0,8)+"…":u.item.name;return`
              <button class="assign-slot-btn filled"
                data-assign-slot="${h}" data-assign-pokemon="${l}">
                ${se(u.item,"asb-glyph")}
                <span class="asb-label">${m}</span>
                <span class="asb-action">⇄ replace</span>
              </button>`}else return`
              <button class="assign-slot-btn empty"
                data-assign-slot="${h}" data-assign-pokemon="${l}">
                <span class="asb-glyph">+</span>
                <span class="asb-label">Slot ${h+1}</span>
                <span class="asb-action">equip</span>
              </button>`;else{const m=Ve[h];return`
              <button class="assign-slot-btn locked ${this.state.coins>=m?"":"cant-afford"}"
                data-unlock-slot="${h}" data-assign-pokemon="${l}">
                <span class="asb-glyph">◈</span>
                <span class="asb-label">Slot ${h+1}</span>
                <span class="asb-action">${m}¢ unlock</span>
              </button>`}}).join("");return`
          <div class="assign-pokemon-section">
            <div class="assign-pokemon-header">
              <img src="${o.sprite}" class="assign-pokemon-sprite" alt="${o.displayName}" />
              <div style="flex:1;min-width:0">
                <div class="assign-pokemon-name-row">
                  <div class="assign-pokemon-name">${o.displayName}</div>
                  <span class="stc-types">${ct(o.types??[])}</span>
                </div>
                <div class="assign-pokemon-sub">Lv ${o.level} · ${Math.max(0,o.battleHp)}/${o.maxBattleHp} HP</div>
                <div class="stc-hp-bar" style="margin-top:5px">
                  <div class="stc-hp-fill ${d}" style="width:${c}%"></div>
                </div>
              </div>
            </div>
            <div class="assign-pokemon-slots">${p}</div>
          </div>
        `}).join("")}
    `,s.classList.remove("hidden")}openPickItemModal(e,t){const s=this.state.inventory.filter(l=>l.item.itemType==="held");if(s.length===0){B("No held items in inventory to equip.","info");return}const i=this.state.team[e];if(!i)return;const n=this.container.querySelector("#pick-item-modal"),r=n.querySelector("#pick-item-title"),o=n.querySelector("#pick-item-list");r.textContent=`Slot ${t+1} — ${i.displayName}`,o.innerHTML=s.map(l=>{const c=this.state.inventory.indexOf(l),d=l.item.rarity?`<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-4)">${l.item.rarity}</span>`:"";return`
        <div class="pick-item-row">
          <div class="pick-item-glyph">${se(l.item)}</div>
          <div class="pick-item-info">
            <div class="pick-item-name">${l.item.name} ${d}</div>
            <div class="pick-item-desc">${l.item.description}</div>
          </div>
          <button class="ink-btn ghost"
            data-pick-item="${c}"
            data-pick-team="${e}"
            data-pick-slot="${t}">
            Equip →
          </button>
        </div>
      `}).join(""),n.classList.remove("hidden")}assignHeldItemToSlot(e,t){var l,c;if(!this.assigningItem)return;const s=this.state.team[e];if(!s||!((l=s.itemSlots[t])!=null&&l.unlocked))return;const i=s.itemSlots[t].item;if(i){const d=this.state.inventory.find(p=>p.item.id===i.id);d?d.quantity++:this.state.inventory.push({item:i,quantity:1})}const n=this.assigningItem;s.itemSlots[t].item=n,t===0&&(s.heldItem=n);const r=this.state.inventory[this.selectedInventoryIndex];r&&(r.quantity--,r.quantity<=0&&this.state.inventory.splice(this.selectedInventoryIndex,1));const o=ye({...s},this.state.activePerks);o.battleHp=Math.min(s.battleHp,o.maxBattleHp),o.battleStatus=s.battleStatus,o.xp=s.xp,o.xpToNextLevel=s.xpToNextLevel,this.state.team[e]=o,this.assigningItem=null,this.selectedInventoryIndex=-1,(c=this.container.querySelector("#assign-modal"))==null||c.classList.add("hidden"),B(`${s.displayName} equipped ${n.name} in Slot ${t+1}!`,"success"),this.refreshTeamList(),this.refreshInventory()}openUseModal(e){var l;const t=this.state.inventory[e];if(!t||t.item.itemType!=="consumable")return;if(this.selectedInventoryIndex=e,qt.GLOBAL_ITEMS.has(t.item.id)){this.useGlobalConsumable();return}if(t.item.effect.planetCardType){const c=t.item.effect.planetCardType;this.state.typeLevels||(this.state.typeLevels={});const d=this.state.typeLevels[c]??0,p=(l=this.state.vouchers)!=null&&l.includes("type_atlas")?2:1;this.state.typeLevels[c]=d+p,B(`${t.item.name} used! ${c} Lv.${d+p}`,"success"),this.consumeInventoryItem(),this.refreshInventory();return}if(t.item.id==="evolution_stone"){this.openEvolutionStoneModal(e);return}const s=this.container.querySelector("#use-modal"),i=s.querySelector("#use-modal-title"),n=s.querySelector("#use-team-list");i.textContent=`Use "${t.item.name}" on:`;const o=t.item.id==="revive"||t.item.id==="max_revive"?this.state.team.filter(c=>c.battleHp<=0):this.state.team.filter(c=>c.battleHp>0);n.innerHTML=o.map(c=>{const d=this.state.team.indexOf(c),p=Math.max(0,Math.min(100,c.battleHp/c.maxBattleHp*100)),u=p>50?"high":p>20?"mid":"low";return`
        <div class="assign-pokemon-section" data-use-index="${d}">
          <div class="assign-pokemon-header">
            <img src="${c.sprite}" class="assign-pokemon-sprite" alt="${c.displayName}" />
            <div style="flex:1;min-width:0">
              <div class="assign-pokemon-name">${c.displayName}</div>
              <div class="assign-pokemon-sub">Lv ${c.level} · ${Math.max(0,c.battleHp)}/${c.maxBattleHp} HP${c.battleStatus?` · ${c.battleStatus}`:""}</div>
              <div class="stc-hp-bar" style="margin-top:5px">
                <div class="stc-hp-fill ${u}" style="width:${p}%"></div>
              </div>
            </div>
            <button class="ink-btn ghost" style="pointer-events:none;flex-shrink:0">Use →</button>
          </div>
        </div>
      `}).join("")||'<p style="padding:1rem;color:var(--ink-3);font-family:var(--font-mono);font-size:11px;letter-spacing:.1em">No valid targets.</p>',s.classList.remove("hidden")}useGlobalConsumable(){var s;const e=this.state.inventory[this.selectedInventoryIndex];if(!e)return;const{item:t}=e;if(t.id==="star_piece"){const i=this.state.coins;this.state.coins+=50;const n=this.container.querySelector("#shop-coin-display");n&&te(n,i,this.state.coins),B("+50¢ from Star Piece!","success")}else if(t.id==="big_nugget"){const i=this.state.coins;this.state.coins+=150;const n=this.container.querySelector("#shop-coin-display");n&&te(n,i,this.state.coins),B("+150¢ from Big Nugget!","success")}else t.id==="sacred_ash"?(this.state.team.forEach(i=>{i.battleHp=i.maxBattleHp,i.battleStatus=null}),B("Sacred Ash fully restored your team!","success")):t.id==="max_elixir"?(this.state.team.forEach(i=>i.moves.forEach(n=>{n.pp=n.maxPp})),B("Max Elixir restored all PP for your team!","success")):t.id==="team_vitals"?(this.state.team.forEach(i=>{i.battleHp>0&&(i.battleHp=Math.min(i.maxBattleHp,i.battleHp+Math.floor(i.maxBattleHp*.5)))}),B("Team Vitals healed 50% HP for your whole team!","success")):t.id==="reroll_token"&&(this.state.shopItems=Jt(this.state.wave,[],this.state.vouchers??[],{excludeConsumables:!!((s=this.state.deckMods)!=null&&s.shopExcludeConsumables)}),this.refreshShop(),B("Shop rerolled (free)!","info"));this.consumeInventoryItem(),this.refreshTeamList(),this.refreshInventory()}openEvolutionStoneModal(e){const t=this.container.querySelector("#use-modal"),s=t.querySelector("#use-modal-title"),i=t.querySelector("#use-team-list");s.textContent="Evolve which Pokémon?";const n=this.state.team.filter(r=>!r.isFullyEvolved&&r.nextEvolutionId!==null);i.innerHTML=n.map(r=>`
        <div class="assign-pokemon-section" data-use-index="${this.state.team.indexOf(r)}">
          <div class="assign-pokemon-header">
            <img src="${r.sprite}" class="assign-pokemon-sprite" alt="${r.displayName}" />
            <div style="flex:1;min-width:0">
              <div class="assign-pokemon-name">${r.displayName}</div>
              <div class="assign-pokemon-sub">Lv ${r.level} · Can evolve</div>
            </div>
            <button class="ink-btn ghost" style="pointer-events:none;flex-shrink:0">Evolve →</button>
          </div>
        </div>
      `).join("")||'<p style="padding:1rem;color:var(--ink-3);font-family:var(--font-mono);font-size:11px;letter-spacing:.1em">No Pokémon can evolve right now.</p>',t.classList.remove("hidden")}useConsumable(e){var l,c,d,p,u,h;const t=this.state.inventory[this.selectedInventoryIndex];if(!t)return;const s=this.state.team[e];if(!s)return;const i=t.item,n=i.effect;if(i.id==="evolution_stone"){(l=this.container.querySelector("#use-modal"))==null||l.classList.add("hidden"),this.evolveWithStone(e);return}if(i.id==="ether"){s.moves.forEach(m=>{m.pp=m.maxPp}),B(`${s.displayName}'s PP fully restored!`,"success"),this.consumeInventoryItem(),(c=this.container.querySelector("#use-modal"))==null||c.classList.add("hidden"),this.refreshTeamList(),this.refreshInventory();return}if(i.id==="item_pouch"){s.itemSlots[1]&&!s.itemSlots[1].unlocked?(s.itemSlots[1].unlocked=!0,B(`Slot 2 unlocked for ${s.displayName}!`,"success")):B(`${s.displayName} already has Slot 2 unlocked!`,"info"),this.consumeInventoryItem(),(d=this.container.querySelector("#use-modal"))==null||d.classList.add("hidden"),this.refreshTeamList(),this.refreshInventory();return}if(n.permanentStatBoost){const m=n.permanentStatBoost;m.attack&&(s.baseStats.attack=Math.floor(s.baseStats.attack*1.1)),m.defense&&(s.baseStats.defense=Math.floor(s.baseStats.defense*1.1)),m.speed&&(s.baseStats.speed=Math.floor(s.baseStats.speed*1.1)),m.spAtk&&(s.baseStats.spAtk=Math.floor(s.baseStats.spAtk*1.1)),m.spDef&&(s.baseStats.spDef=Math.floor(s.baseStats.spDef*1.1)),m.hp&&(s.baseStats.hp=Math.floor(s.baseStats.hp*1.1));const v=ye({...s},this.state.activePerks);v.battleHp=Math.min(Math.floor(s.battleHp*1.1),v.maxBattleHp),v.battleStatus=s.battleStatus,v.xp=s.xp,v.xpToNextLevel=s.xpToNextLevel,this.state.team[e]=v,B(`${s.displayName}'s stats permanently boosted!`,"success"),this.consumeInventoryItem(),(p=this.container.querySelector("#use-modal"))==null||p.classList.add("hidden"),this.refreshTeamList(),this.refreshInventory();return}if(n.healPercent&&i.id!=="team_vitals"){const m=Math.floor(s.maxBattleHp*n.healPercent);s.battleHp=Math.min(s.maxBattleHp,s.battleHp+m),B(`${s.displayName} restored ${m} HP!`,"success")}else n.healAmount&&(s.battleHp=Math.min(s.maxBattleHp,s.battleHp+n.healAmount),B(`${s.displayName} restored ${n.healAmount} HP!`,"success"));if(n.curesStatus&&(n.curesStatus==="any"||n.curesStatus===s.battleStatus)&&(s.battleStatus=null,B(`${s.displayName}'s status condition cured!`,"success")),i.id==="rare_candy"){const m=Math.min(100,s.level+1),v=ye({...s,level:m},this.state.activePerks),g=Math.max(0,v.maxBattleHp-s.maxBattleHp);if(v.battleHp=Math.min(v.maxBattleHp,s.battleHp+g),v.battleStatus=s.battleStatus,this.state.team[e]=v,B(`${s.displayName} reached Lv.${m}!`,"success"),!v.isFullyEvolved&&v.nextEvolutionId!==null&&v.evolutionLevel!==null&&m>=v.evolutionLevel){v.pendingEvolution=!0,this.consumeInventoryItem(),(u=this.container.querySelector("#use-modal"))==null||u.classList.add("hidden"),this.processPendingEvolutions(),this.refreshTeamList(),this.refreshInventory();return}}const o={x_attack:"attack",x_sp_atk:"spAtk",x_speed:"speed"}[i.id];o&&(s.statStages[o]=Math.min(6,s.statStages[o]+2),B(`${s.displayName}'s ${o} sharply rose!`,"success")),this.consumeInventoryItem(),(h=this.container.querySelector("#use-modal"))==null||h.classList.add("hidden"),this.refreshTeamList(),this.refreshInventory()}consumeInventoryItem(){const e=this.state.inventory[this.selectedInventoryIndex];e&&(e.quantity--,e.quantity<=0&&this.state.inventory.splice(this.selectedInventoryIndex,1),this.selectedInventoryIndex=-1)}async evolveWithStone(e){const t=this.state.team[e];if(!t||t.isFullyEvolved||!t.nextEvolutionId){B("This Pokémon cannot evolve!","error");return}try{const s=await ot(t.nextEvolutionId,t.level),i=ye({...s,itemSlots:t.itemSlots,heldItem:t.heldItem,moves:t.moves,learnedMoveIds:t.learnedMoveIds??t.moves.map(r=>r.id),learnsetPool:s.learnsetPool},this.state.activePerks);i.battleHp=Math.min(i.maxBattleHp,t.battleHp),i.battleStatus=t.battleStatus,i.xp=t.xp,i.xpToNextLevel=It(s.level),i.pendingEvolution=!1;const n=await Ct(i);this.state.team[e]=i,await _a(t,s,n),this.consumeInventoryItem(),B(`${t.displayName} evolved into ${s.displayName}! ◇`,"success")}catch{B("Evolution failed — please try again.","error")}this.refreshTeamList(),this.refreshInventory()}performWaveEndCleanup(){const e=this.state.wave;this.state.team.forEach(t=>{var s,i,n,r;if(t.itemSlots){if(t.focusSashBroken){for(const o of t.itemSlots)if(((s=o.item)==null?void 0:s.id)==="focus_sash"){o.item=null;break}((i=t.heldItem)==null?void 0:i.id)==="focus_sash"&&(t.heldItem=null),t.focusSashBroken=!1}if(t.reviveHeartUsed){for(const o of t.itemSlots)if(((n=o.item)==null?void 0:n.id)==="revive_heart"){o.item=null;break}((r=t.heldItem)==null?void 0:r.id)==="revive_heart"&&(t.heldItem=null)}if(_(t,"oran_berry")&&(t.usedBerries=(t.usedBerries??[]).filter(o=>o!=="oran_berry")),_(t,"sitrus_berry")&&(t.usedBerries??[]).includes("sitrus_berry")&&e-(t.sitrusBerryLastUsedWave??0)>=3&&(t.usedBerries=(t.usedBerries??[]).filter(o=>o!=="sitrus_berry")),_(t,"poke_bandage")&&t.battleHp>0){const o=Math.floor(t.maxBattleHp*.15);t.battleHp=Math.min(t.maxBattleHp,t.battleHp+o)}}}),this.state.pc.forEach(t=>{if(t.battleHp>0){t.pcReviveCountdown=void 0;return}t.pcReviveCountdown==null&&(t.pcReviveCountdown=as),t.pcReviveCountdown-=1,t.pcReviveCountdown<=0&&(t.battleHp=t.maxBattleHp,t.battleStatus=null,t.battleStatusTurns=0,t.poisonCounter=0,t.isConfused=!1,t.confusionTurns=0,t.sleepTurns=0,t.pcReviveCountdown=void 0,B(`${t.displayName} recovered in the PC!`,"success"))})}refreshShop(){const e=this.container.querySelector("#shop-items");e&&(e.innerHTML=this.renderBoosterPacks()+this.renderShopItems()+this.renderVouchers()),this.refreshStash()}refreshStash(){const e=this.container.querySelector("#stash-panel");e&&(e.innerHTML=this.renderStash());const t=this.container.querySelector("#bag-btn-count");t&&(t.textContent=String(this.state.inventory.reduce((s,i)=>s+i.quantity,0)))}refreshTeamList(){const e=this.container.querySelector("#shop-team-list");e&&(e.innerHTML=this.renderTeamList(),this.attachTeamDragHandlers(e))}attachTeamDragHandlers(e){let t=null;e.querySelectorAll("[data-team-drag]").forEach(s=>{s.addEventListener("dragstart",i=>{t=parseInt(s.dataset.teamDrag??"-1"),s.classList.add("dragging"),i.dataTransfer&&(i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",String(t)))}),s.addEventListener("dragend",()=>{s.classList.remove("dragging"),e.querySelectorAll(".drag-over").forEach(i=>i.classList.remove("drag-over"))}),s.addEventListener("dragover",i=>{i.preventDefault(),i.dataTransfer&&(i.dataTransfer.dropEffect="move"),s.classList.add("drag-over")}),s.addEventListener("dragleave",()=>{s.classList.remove("drag-over")}),s.addEventListener("drop",i=>{i.preventDefault(),s.classList.remove("drag-over");const n=parseInt(s.dataset.teamDrag??"-1"),r=t;if(t=null,r===null||r===n||r<0||n<0)return;const[o]=this.state.team.splice(r,1);this.state.team.splice(n,0,o),this.refreshTeamList()})})}refreshInventory(){this.refreshStash()}refreshPCList(){const e=this.container.querySelector("#shop-pc-strip");e&&(e.innerHTML=this.renderPCStrip());const t=this.container.querySelector("#pc-strip-panel");t&&(t.style.display=this.state.pc.length===0?"none":"");const s=t==null?void 0:t.querySelector(".pc-strip-count");s&&(s.textContent=String(this.state.pc.length));const i=this.container.querySelector("#pc-list-container");i&&(i.innerHTML=this.renderPCList());const n=this.container.querySelector("#pc-deposit-list");n&&(n.innerHTML=this.renderPCDepositList());const r=this.container.querySelector("#pc-box-count");r&&(r.textContent=String(this.state.pc.length));const o=this.container.querySelector("#pc-btn-count");o&&(o.textContent=String(this.state.pc.length));const l=this.container.querySelector("#pc-box-hint");l&&(this.state.pc.length===0?l.textContent="PC is empty.":l.textContent=this.state.team.length>=Ae?"Team full — swap a Pokémon to retrieve.":"Click Retrieve to add to your team.")}openPCBoxModal(){var e;this.refreshPCList(),(e=this.container.querySelector("#pc-box-modal"))==null||e.classList.remove("hidden")}openPCSwapModal(e){var n;let t=this.container.querySelector("#pc-swap-modal");t||(t=document.createElement("div"),t.id="pc-swap-modal",t.className="modal-overlay",t.innerHTML=`
        <div class="modal">
          <button class="modal-close" id="close-pc-swap">×</button>
          <h3 class="modal-title">Swap with team member</h3>
          <div id="pc-swap-list"></div>
        </div>
      `,(n=this.container.querySelector(".shop-wrap"))==null||n.appendChild(t),t.addEventListener("click",r=>{(r.target.id==="close-pc-swap"||r.target.id==="pc-swap-modal")&&t.classList.add("hidden")}));const s=t.querySelector("#pc-swap-list"),i=this.state.pc[e];s&&i&&(s.innerHTML=this.state.team.map((r,o)=>`
        <div class="pc-swap-row" data-pc-swap-team="${o}" data-pc-swap-pc="${e}" style="display:flex;align-items:center;gap:10px;padding:8px;cursor:pointer;border-bottom:1px dashed var(--paper-edge);">
          <img src="${r.sprite}" alt="${r.displayName}" style="width:32px;height:32px;object-fit:contain;image-rendering:pixelated;">
          <div style="flex:1;font-family:var(--font-display);font-weight:900;font-style:italic;font-size:15px;">${r.displayName}</div>
          <span style="font-family:var(--font-mono);font-size:10px;color:var(--ink-3)">Lv.${r.level}</span>
          <button class="btn btn-sm btn-secondary" data-pc-swap-team="${o}" data-pc-swap-pc="${e}">Swap</button>
        </div>
      `).join("")),t.classList.remove("hidden")}unmount(){var e;(e=this.destroyAudioBtn)==null||e.call(this),this.destroyAudioBtn=null,document.body.classList.remove("shop-active"),this.mobileDrawer&&(this.mobileDrawer.removeEventListener("click",this.handleClick),this.mobileDrawer.remove(),this.mobileDrawer=null),this.mobileBackdrop&&(this.mobileBackdrop.remove(),this.mobileBackdrop=null),this.portaledPackModal&&(this.portaledPackModal.removeEventListener("click",this.handleClick),this.portaledPackModal.remove(),this.portaledPackModal=null),document.body.querySelectorAll(".shop-side-backdrop, #shop-team-toggle").forEach(t=>t.remove()),document.body.querySelectorAll(".shop-side").forEach(t=>t.remove()),this.container.style.display="none",this.container.innerHTML=""}};b(qt,"GLOBAL_ITEMS",new Set(["star_piece","big_nugget","sacred_ash","max_elixir","team_vitals","reroll_token"]));let gs=qt;const Gs=[{id:"brock",name:"Brock",city:"Pewter City",flavour:'The rock-solid Pokémon trainer. Folds his arms. "Show me your strength."',type:"rock",acePokemonId:95,bias:["rock","ground"],teamSize:1,levelDelta:0,coinMultiplier:1.8,accent:"#7a634a",icon:"◆",spriteSlug:"brock",badgeId:"boulder"},{id:"misty",name:"Misty",city:"Cerulean City",flavour:'The tomboyish mermaid. Spins her chain. "My policy is an all-out offensive."',type:"water",acePokemonId:121,bias:["water"],teamSize:2,levelDelta:1,coinMultiplier:1.9,accent:"#3a6c8a",icon:"◇",spriteSlug:"misty",badgeId:"cascade"},{id:"surge",name:"Lt. Surge",city:"Vermilion City",flavour:'The lightning American. Salutes. "I tell ya, kid — electricity is in MY blood."',type:"electric",acePokemonId:26,bias:["electric"],teamSize:2,levelDelta:1,coinMultiplier:2,accent:"#c9a417",icon:"★",spriteSlug:"ltsurge",badgeId:"thunder"},{id:"erika",name:"Erika",city:"Celadon City",flavour:'The nature-loving princess. Bows. "I had a bad dream — but you woke me up."',type:"grass",acePokemonId:71,bias:["grass","poison"],teamSize:3,levelDelta:3,coinMultiplier:2,accent:"#5d8266",icon:"◉",spriteSlug:"erika",badgeId:"rainbow"},{id:"koga",name:"Koga",city:"Fuchsia City",flavour:'The poisonous ninja master. Bows once. "Now you witness true horror."',type:"poison",acePokemonId:89,bias:["poison","bug"],teamSize:3,levelDelta:3,coinMultiplier:2.1,accent:"#7a3f8a",icon:"☠",spriteSlug:"koga",badgeId:"soul"},{id:"sabrina",name:"Sabrina",city:"Saffron City",flavour:"The master of psychic Pokémon. Bends a spoon without touching it.",type:"psychic",acePokemonId:65,bias:["psychic"],teamSize:3,levelDelta:4,coinMultiplier:2.2,accent:"#c14a8a",icon:"◆",spriteSlug:"sabrina",badgeId:"marsh"},{id:"blaine",name:"Blaine",city:"Cinnabar Island",flavour:'The hot-headed quizmaster. "My fiery hot Pokémon will make charcoal of you!"',type:"fire",acePokemonId:59,bias:["fire"],teamSize:3,levelDelta:5,coinMultiplier:2.3,accent:"#a64418",icon:"▲",spriteSlug:"blaine",badgeId:"volcano"},{id:"giovanni",name:"Giovanni",city:"Viridian City",flavour:'Boss of Team Rocket. "So, after all your meddling — you face me at last."',type:"ground",acePokemonId:112,bias:["ground","rock"],teamSize:4,levelDelta:6,coinMultiplier:2.6,accent:"#3a3a3a",icon:"◉",spriteSlug:"giovanni",badgeId:"earth"}];function it(a){return Gs.find(e=>e.id===a)}function Ut(a){return Gs[a-1]}function Me(a){return`https://play.pokemonshowdown.com/sprites/trainers/${a}.png`}const Rt=[{id:"miner",name:"Hiker",shortLabel:"Miner",flavour:'Crusts the dust off his boots and grins. "Got a few rock-hards down here."',icon:"⛏",accent:"#7a634a",typeBias:["rock","ground","fighting"],coinMultiplier:1.25,levelDelta:0,spriteSlug:"hiker"},{id:"cop",name:"Officer",shortLabel:"Officer",flavour:'Tips his cap. "Routine inspection. Hope your Pokémon are squared away."',icon:"◆",accent:"#2a4a78",typeBias:["normal","fighting","dark"],coinMultiplier:1.3,levelDelta:1,spriteSlug:"gentleman"},{id:"swimmer",name:"Swimmer",shortLabel:"Swimmer",flavour:`Goggles up. "The current's perfect. Want to spar before I dive?"`,icon:"◇",accent:"#3a6c8a",typeBias:["water"],coinMultiplier:1.2,levelDelta:0,spriteSlug:"swimmer"},{id:"bug_catcher",name:"Bug Catcher",shortLabel:"Bug Catcher",flavour:'Holds out a net, eyes sparkling. "I just caught the perfect one!"',icon:"◉",accent:"#6e8b32",typeBias:["bug","grass"],coinMultiplier:.95,levelDelta:-1,spriteSlug:"bugcatcher"},{id:"ranger",name:"Pathfinder",shortLabel:"Ranger",flavour:'Field cap, weathered map. "Trail rules: clear battle, then we both move on."',icon:"›",accent:"#4d6b3f",typeBias:["grass","normal","flying"],coinMultiplier:1.1,levelDelta:0,spriteSlug:"acetrainer"},{id:"channeler",name:"Channeler",shortLabel:"Channeler",flavour:"Hood low. Whispers a name you don't catch.",icon:"◆",accent:"#5a3a78",typeBias:["ghost","psychic"],coinMultiplier:1.4,levelDelta:1,spriteSlug:"channeler-gen1"},{id:"school_kid",name:"Youngster",shortLabel:"Schoolkid",flavour:'Bag bouncing, gap-tooth grin. "I just got my license!"',icon:"◇",accent:"#c08a2c",typeBias:["normal","fairy"],coinMultiplier:.85,levelDelta:-2,teamSize:1,spriteSlug:"youngster"},{id:"biker",name:"Biker",shortLabel:"Biker",flavour:'Engine idles. Leather creaks. "You blocking the road, kid?"',icon:"▶",accent:"#5a2a2a",typeBias:["poison","dark","fire"],coinMultiplier:1.35,levelDelta:1,spriteSlug:"biker"},{id:"firebreather",name:"Burglar",shortLabel:"Firebreather",flavour:'Cracks his knuckles. "Light my fire, kid."',icon:"▲",accent:"#a64418",typeBias:["fire"],coinMultiplier:1.3,levelDelta:1,spriteSlug:"burglar"},{id:"sailor",name:"Sailor",shortLabel:"Sailor",flavour:'Rolls his sleeves. "Salt in the air. Salt in your tea."',icon:"⚓",accent:"#1d4f6e",typeBias:["water","fighting"],coinMultiplier:1.15,levelDelta:0,spriteSlug:"sailor"}];function bs(a){return Rt.find(e=>e.id===a)}function Ni(a){const e=Rt.filter(s=>a<=1?s.levelDelta<=0:a<=3?s.levelDelta<=1:!0),t=e.length>0?e:Rt;return t[Math.floor(Math.random()*t.length)]}function Io(a,e){const t=new Set(a),s=Rt.filter(i=>i.typeBias.some(n=>t.has(n)));return s.length>0?s[Math.floor(Math.random()*s.length)]:Ni(e)}const Us=[{id:"lorelei",name:"Lorelei",title:"Elite Four — I",flavour:'Cool, calm, collected. "Pokémon are everything to me."',acePokemonId:131,bias:["ice","water"],teamSize:4,levelDelta:12,coinMultiplier:3,accent:"#5a8acc",icon:"◇",spriteSlug:"lorelei-gen3"},{id:"bruno",name:"Bruno",title:"Elite Four — II",flavour:'Mountain-trained fists. "Hwa-cha! We will grind you down!"',acePokemonId:68,bias:["fighting","rock"],teamSize:4,levelDelta:14,coinMultiplier:3.2,accent:"#a05a2c",icon:"▲",spriteSlug:"bruno"},{id:"agatha",name:"Agatha",title:"Elite Four — III",flavour:`Old, sharp, and laughing. "Oak's grandchild?! Pokémon are for fighting!"`,acePokemonId:94,bias:["ghost","poison"],teamSize:4,levelDelta:16,coinMultiplier:3.4,accent:"#5a3a78",icon:"◈",spriteSlug:"agatha-gen1"},{id:"lance",name:"Lance",title:"Elite Four — IV",flavour:'Dragon master, last of the four. "I am the most powerful trainer."',acePokemonId:149,bias:["dragon","flying"],teamSize:4,levelDelta:18,coinMultiplier:3.6,accent:"#b21f1f",icon:"◆",spriteSlug:"lance"},{id:"champion",name:"Champion Blue",title:"Champion",flavour:`Your eternal rival. He grins. "Heh! That's right! I am the Pokémon Champion!"`,acePokemonId:6,bias:["fire","water","flying","normal"],teamSize:5,levelDelta:22,coinMultiplier:5,accent:"#caa15a",icon:"★",spriteSlug:"blue",isChampion:!0}];function ks(a){return Us.find(e=>e.id===a)}function Ws(a){return Us[a]}class Ao{constructor(e,t,s,i){b(this,"container");b(this,"state");b(this,"onChoose");b(this,"onRerollBlind");this.container=e,this.state=t,this.onChoose=s,this.onRerollBlind=i}mount(){this.container.innerHTML=this.renderHTML(),this.container.style.display="",oe(this.container),this.attachEvents()}unmount(){this.container.style.display="none",this.container.innerHTML=""}renderHTML(){var E,y;const e=this.state.wave,t=this.state.currentAct,s=this.state.actStep+1,i=this.state.nodeOptions,n=i.length===1,r=($,H)=>{const W=n?"0":H===0?"-1.4":H===1?"0.6":"-0.8",K=$.accent??"#3a3a3a",N=$.spriteUrl?`<div class="path-card-portrait" aria-hidden="true">
             <img src="${$.spriteUrl}" alt="" class="path-card-sprite"
                  onerror="this.parentElement.classList.add('sprite-failed');this.replaceWith(Object.assign(document.createElement('div'),{className:'path-card-icon px-emoji',textContent:'${$.icon}'}));" />
           </div>`:`<div class="path-card-icon px-emoji" aria-hidden="true">${$.icon}</div>`;return`
        <button class="path-card${$.spriteUrl?" has-sprite":""}" data-path-idx="${H}" type="button"
                style="--card-rot:${W}deg;--card-accent:${K}">
          <span class="path-card-corner tl" aria-hidden="true"></span>
          <span class="path-card-corner tr" aria-hidden="true"></span>
          <span class="path-card-corner bl" aria-hidden="true"></span>
          <span class="path-card-corner br" aria-hidden="true"></span>
          <div class="path-card-eyebrow">${$.eyebrow}</div>
          ${N}
          <h3 class="path-card-title">${$.title}</h3>
          <p class="path-card-hint">${$.hint}</p>
          <div class="path-card-foot">
            <span class="path-card-tag">${Ho($.kind)}</span>
            <span class="path-card-cta">Take this path →</span>
          </div>
        </button>
      `},o=new Set(this.state.badges??[]),l=he.filter($=>o.has($.id)),c=l.length===0?"":`
      <div class="badge-row" aria-label="Gym badges earned">
        ${l.map($=>{const H=Gt($.id),W=H?`<img src="${H}" alt="${$.name}" class="badge-pip-sprite" onerror="${Y($.icon)}" />`:`<span class="badge-pip-icon" aria-hidden="true">${$.icon}</span>`;return`<span class="badge-pip owned" title="${$.name}"
            style="--badge-color:${$.color}">
            ${W}
          </span>`}).join("")}
        ${l.length<he.length?`<span class="badge-pip-more" aria-label="${he.length-l.length} badges remaining">+${he.length-l.length}</span>`:""}
      </div>
    `,d=(((E=this.state.badges)==null?void 0:E.length)??0)>=8&&(this.state.leagueStep??0)<5,p=lt(this.state.generation??"gen1"),u=(p==null?void 0:p.status)==="live",h=this.state.generation==="endless",m=u&&p.id!=="gen1"&&!h,v=((y=this.state.deckMods)==null?void 0:y.stagesPerAct)??4,g=d?`— Pokémon League · Step ${(this.state.leagueStep??0)+1} of 5 —`:h?`— Endless${e>30?" · Deep run":""} · Wave ${e} —`:m?`— Region: ${p.region} · Act ${t} · Step ${s} of ${v} —`:`— Crossroads · Act ${t} · Step ${s} of ${v} —`,w=d?"Indigo <em>Plateau</em>":"Choose your <em>path</em>",A=d?"No retreat. The next door is the next opponent.":`Wave ${String(e).padStart(2,"0")} awaits. Three trails diverge.`,x=!d&&!h&&t>=1&&t<=8?Ut(t):void 0,T=x?Math.max(0,v-s):0,P=(this.state.inventory??[]).filter($=>$.item.id==="blind_lens").reduce(($,H)=>$+H.quantity,0),I=!!x&&!!this.state.actBossBlind&&P>0,C=x?Ba(this.state.actBossBlind??null,{rerollable:I,lensCount:P}):"",L=x?(()=>{const $=x.accent,H=Array.from({length:v},(K,N)=>N).map(K=>{const N=K===v-1,z=K<this.state.actStep,j=K===this.state.actStep,re=["stage-pip",N?"gym":"",z?"done":"",j?"current":""].filter(Boolean).join(" "),me=N?"ARENA":`${K+1}`;return`<span class="${re}"><span class="stage-pip-label">${me}</span></span>`}).join('<span class="stage-pip-rail" aria-hidden="true"></span>'),W=T<=0?"ENTER ARENA":`${T} STOP${T===1?"":"S"} TO ${x.name.toUpperCase()}`;return`
            <div class="stage-progress" style="--stage-color:${$}">
              <div class="stage-progress-portrait">
                <img src="${Me(x.spriteSlug)}" alt="${x.name}"
                     onerror="${Y(x.icon)}" />
              </div>
              <div class="stage-progress-body">
                <div class="stage-progress-eyebrow">
                  <span>${x.city.toUpperCase()} · ACT ${t}</span>
                  <span class="stage-progress-type">${Be(x.type)}</span>
                </div>
                <div class="stage-progress-pips">${H}</div>
                <div class="stage-progress-cta">${W}</div>
                ${C}
              </div>
            </div>
          `})():"",S=d?(()=>{var N;const $=this.state.leagueStep??0,H=Ws($);if(!H)return"";const W=((N=this.state.leagueBlinds)==null?void 0:N[$])??null;return`
            <div class="stage-progress" style="--stage-color:${H.accent}">
              <div class="stage-progress-portrait">
                <img src="${Me(H.spriteSlug)}" alt="${H.name}"
                     onerror="${Y(H.icon)}" />
              </div>
              <div class="stage-progress-body">
                <div class="stage-progress-eyebrow">
                  <span>${H.title.toUpperCase()} · STEP ${$+1}/5</span>
                </div>
                <div class="stage-progress-cta">${H.name.toUpperCase()}</div>
                ${Ba(W)}
              </div>
            </div>
          `})():"";return`
      <div class="path-screen screen">
        <div class="path-content rail-1440">
          <div class="path-header">
            <div class="path-eyebrow">${g}</div>
            <h1 class="path-title">${w}</h1>
            <div class="path-sub">${A}</div>
            ${L}
            ${S}
            ${c}
          </div>

          <div class="path-cards${n?" single":""}">
            ${i.map(($,H)=>r($,H)).join("")}
          </div>

          <div class="path-footnote">
            <span class="kbd-hint">Each path biases the encounter pool — the dice still roll.</span>
          </div>
        </div>
      </div>
    `}attachEvents(){var e;this.container.querySelectorAll("[data-path-idx]").forEach(t=>{t.addEventListener("click",()=>{const s=parseInt(t.dataset.pathIdx??"0",10),i=this.state.nodeOptions[s];i&&(k.play("ui.confirm"),t.classList.add("chosen"),this.container.querySelectorAll(".path-card").forEach(n=>{n!==t&&n.classList.add("dimmed")}),window.setTimeout(()=>this.onChoose(i),280))})}),(e=this.container.querySelector("[data-blind-reroll]"))==null||e.addEventListener("click",t=>{var s;t.stopPropagation(),k.play("ui.confirm"),(s=this.onRerollBlind)==null||s.call(this)})}}function Ho(a){switch(a){case"grass":return"Wild · Tall Grass";case"trainer":return"Trainer Battle";case"center":return"Pokémon Center";case"shop_mini":return"Pop-up Shop";case"mystery":return"Mystery Event";case"forage":return"Quick Forage";case"gym":return"Gym Leader";case"elite_four":return"Elite Four";case"champion":return"Champion"}}function Ba(a,e){if(!a)return"";const t=Ot(a);if(!t)return"";const s=e!=null&&e.rerollable?`<button type="button" class="po-blind-reroll" data-blind-reroll
              title="Blind Lens — re-roll once, blind will differ from the current one.">
         ↻ REROLL <span class="po-blind-reroll-count">×${e.lensCount??1}</span>
       </button>`:"";return`
    <div class="po-blind-chip" style="--blind-color:${t.color}" aria-label="Field Effect: ${t.name}">
      <div class="po-blind-chip-icon" aria-hidden="true">${t.icon}</div>
      <div class="po-blind-chip-body">
        <div class="po-blind-chip-eyebrow">Field Effect</div>
        <div class="po-blind-chip-name">${t.name}</div>
        <div class="po-blind-chip-desc">${t.description}</div>
        <div class="po-blind-chip-hint">${t.tacticalHint}</div>
      </div>
      ${s}
    </div>
  `}const No=[{id:"full_heal",title:"Full Recovery",hint:"Restore HP to full for every Pokémon on the team.",icon:"✚",accent:"#c43a3a"},{id:"partial_plus_status",title:"Quick Patch",hint:"+50% HP and clear all status effects across the team.",icon:"◇",accent:"#3a7a8a"},{id:"risky_supply",title:"Secret Supply",hint:"Skip healing — receive 80 coins instead. Press your luck.",icon:"◆",accent:"#c08a2c"}];class Ro{constructor(e,t,s){b(this,"container");b(this,"state");b(this,"onDone");this.container=e,this.state=t,this.onDone=s}mount(){this.container.innerHTML=this.renderHTML(),this.container.style.display="",oe(this.container),this.attachEvents()}unmount(){this.container.style.display="none",this.container.innerHTML=""}renderHTML(){const e=(t,s)=>{const i=s===0?"-1.2":s===1?"0.5":"-0.7";return`
        <button class="path-card center-card" data-choice="${t.id}" type="button"
                style="--card-rot:${i}deg;--card-accent:${t.accent}">
          <span class="path-card-corner tl"></span>
          <span class="path-card-corner tr"></span>
          <span class="path-card-corner bl"></span>
          <span class="path-card-corner br"></span>
          <div class="path-card-eyebrow">Choice 0${s+1}</div>
          <div class="path-card-icon px-emoji">${t.icon}</div>
          <h3 class="path-card-title">${t.title}</h3>
          <p class="path-card-hint">${t.hint}</p>
          <div class="path-card-foot">
            <span class="path-card-tag">Center</span>
            <span class="path-card-cta">Choose →</span>
          </div>
        </button>
      `};return`
      <div class="path-screen screen">
        <div class="path-content rail-1440">
          <div class="path-header">
            <div class="path-eyebrow">— Pokémon Center · Wave ${String(this.state.wave).padStart(2,"0")} —</div>
            <h1 class="path-title">Welcome, <em>trainer</em></h1>
            <div class="path-sub">"We can take care of your Pokémon for you. Which would you like?"</div>
          </div>

          <div class="path-cards center-grid">
            ${No.map((t,s)=>e(t,s)).join("")}
          </div>

          <div class="path-footnote">
            <span class="kbd-hint">Healing nodes do not consume a wave — choose freely.</span>
          </div>
        </div>
      </div>
    `}attachEvents(){this.container.querySelectorAll("[data-choice]").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.choice;k.play("ui.confirm"),e.classList.add("chosen"),this.container.querySelectorAll(".path-card").forEach(s=>{s!==e&&s.classList.add("dimmed")}),window.setTimeout(()=>this.applyChoice(t),320)})})}applyChoice(e){const t=this.state;e==="full_heal"?t.team.forEach(s=>{s.battleHp=s.maxBattleHp,s.battleStatus=null}):e==="partial_plus_status"?t.team.forEach(s=>{const i=Math.floor(s.maxBattleHp*.5);s.battleHp=Math.min(s.maxBattleHp,s.battleHp+i),s.battleStatus=null}):e==="risky_supply"&&(t.coins+=80),this.onDone(t)}}function qo(){const a=Math.random();if(a<.5)return{kind:"coins",amount:50+Math.floor(Math.random()*70)};if(a<.65){const e=Z.filter(s=>s.itemType==="consumable"&&s.rarity==="common");return{kind:"item",item:{item:e[Math.floor(Math.random()*e.length)],quantity:1}}}return a<.88?{kind:"heal",pct:.35}:{kind:"coins",amount:5}}class Do{constructor(e,t,s){b(this,"container");b(this,"state");b(this,"onDone");b(this,"revealed",!1);b(this,"outcome",null);this.container=e,this.state=t,this.onDone=s}mount(){this.container.innerHTML=this.renderHTML(),this.container.style.display="",oe(this.container),this.attachEvents()}unmount(){this.container.style.display="none",this.container.innerHTML=""}renderHTML(){const e=this.state.currentNode,t=(e==null?void 0:e.title)??"Mystery",s=(e==null?void 0:e.eyebrow)??"Mystery",i=(e==null?void 0:e.hint)??"Something interesting catches your eye.";return`
      <div class="path-screen screen">
        <div class="path-content rail-1440">
          <div class="path-header">
            <div class="path-eyebrow">— ${s} ·  Wave ${String(this.state.wave).padStart(2,"0")} —</div>
            <h1 class="path-title">${t}</h1>
            <div class="path-sub">${i}</div>
          </div>

          <div class="mystery-stage">
            <button class="mystery-card" id="mystery-card" type="button">
              <span class="path-card-corner tl"></span>
              <span class="path-card-corner tr"></span>
              <span class="path-card-corner bl"></span>
              <span class="path-card-corner br"></span>
              <div class="mystery-front">
                ${e!=null&&e.spriteUrl?`<div class="mystery-sprite-wrap"><img src="${e.spriteUrl}" alt="" class="mystery-sprite" onerror="${Y(e.icon??"◇")}" /></div>`:`<div class="path-card-icon px-emoji">${(e==null?void 0:e.icon)??"◇"}</div>`}
                <div class="mystery-cta">Tap to investigate</div>
              </div>
              <div class="mystery-back hidden" id="mystery-back"></div>
            </button>
          </div>

          <div class="path-footnote">
            <span class="kbd-hint">One outcome — fortune favours the curious.</span>
          </div>
        </div>
      </div>
    `}attachEvents(){const e=this.container.querySelector("#mystery-card");e&&e.addEventListener("click",()=>{this.revealed?this.commitAndExit():this.revealOutcome(e)})}revealOutcome(e){this.outcome=qo(),this.revealed=!0,k.play("ui.confirm");const t=this.container.querySelector("#mystery-back"),s=e.querySelector(".mystery-front");!t||!s||(t.innerHTML=this.renderOutcomeHtml(this.outcome),s.classList.add("hidden"),t.classList.remove("hidden"),e.classList.add("revealed"))}renderOutcomeHtml(e){const t=(s,i)=>`<div class="mystery-sprite-wrap"><img src="${ie(s)}" alt="" class="mystery-sprite" onerror="${Y(i)}" /></div>`;switch(e.kind){case"coins":return e.amount===5?`
            ${t("oran-berry","◇")}
            <h3 class="path-card-title">A stray berry</h3>
            <p class="path-card-hint">You found a stray berry and pocket change. +5¢</p>
            <div class="mystery-cta">Tap to continue →</div>
          `:`
          ${t("nugget","◆")}
          <h3 class="path-card-title">+${e.amount} coins</h3>
          <p class="path-card-hint">Lucky find — straight into the satchel.</p>
          <div class="mystery-cta">Tap to continue →</div>
        `;case"item":{const s=e.item.item.pokeapiName;return`
          ${s?t(s,e.item.item.icon??"◆"):`<div class="path-card-icon px-emoji">${e.item.item.icon??"◆"}</div>`}
          <h3 class="path-card-title">${e.item.item.name}</h3>
          <p class="path-card-hint">${e.item.item.description}</p>
          <div class="mystery-cta">Tap to continue →</div>
        `}case"heal":return`
          ${t("super-potion","✚")}
          <h3 class="path-card-title">Restorative herbs</h3>
          <p class="path-card-hint">+${Math.round(e.pct*100)}% HP across the team.</p>
          <div class="mystery-cta">Tap to continue →</div>
        `}}commitAndExit(){if(!this.outcome)return;const e=this.outcome;if(e.kind==="coins")this.state.coins+=e.amount,B(`+${e.amount} coins!`,"success");else if(e.kind==="item"){const t=this.state.inventory.find(s=>s.item.id===e.item.item.id);t?t.quantity+=1:this.state.inventory.push({...e.item}),B(`Picked up ${e.item.item.name}!`,"success")}else e.kind==="heal"&&(this.state.team.forEach(t=>{const s=Math.floor(t.maxBattleHp*e.pct);t.battleHp=Math.min(t.maxBattleHp,t.battleHp+s)}),B("Team healed!","success"));this.onDone(this.state)}}function Fo(a,e){const t=e>=2;return[{kind:"grass",weight:a<=1?7:6},{kind:"trainer",weight:a<=1?5:6},{kind:"center",weight:t?2:1},{kind:"mystery",weight:1},{kind:"shop_mini",weight:t?2:1},{kind:"forage",weight:1}]}function Oo(a,e){const t=a.filter(r=>!e.has(r.kind)),s=t.length>0?t:a,i=s.reduce((r,o)=>r+o.weight,0);let n=Math.random()*i;for(const r of s)if(n-=r.weight,n<=0)return r.kind;return s[0].kind}const Ea=[{title:"Tall Grass",eyebrow:"Wild",hint:"Rustling leaves. Wild encounter, chance for items.",icon:"◇",accent:"#5d8266",habitatBias:"grass"},{title:"Old Path",eyebrow:"Trail",hint:"Mixed terrain. Variable foes.",icon:"›",accent:"#9a7d3f"},{title:"Wooded Edge",eyebrow:"Forest",hint:"Cool shade — rarer drops, twitchy critters.",icon:"◆",accent:"#4d6b3f",habitatBias:"bug"},{title:"Rocky Outcrop",eyebrow:"Cliffs",hint:"Sharp footing favours rock & ground types.",icon:"▲",accent:"#7a634a",habitatBias:"rock"},{title:"Riverside",eyebrow:"Banks",hint:"Cattails and ripples. Water types nearby.",icon:"◇",accent:"#3a6c8a",habitatBias:"water"},{title:"Sunny Meadow",eyebrow:"Open",hint:"Wildflowers and bug song. Common pool, abundant loot.",icon:"◉",accent:"#c08a2c",habitatBias:"normal"}],Ca=[{title:"Old Signpost",eyebrow:"Mystery",hint:"Half-buried, scratched. Worth a poke?",icon:"◇",accent:"#7a4f8a",spriteUrl:ie("dusk-stone")},{title:"Lost Satchel",eyebrow:"Mystery",hint:"Someone's travel gear, abandoned in the brush.",icon:"◆",accent:"#7a4f8a",spriteUrl:ie("poke-ball")},{title:"Travelling NPC",eyebrow:"Encounter",hint:"A weary stranger waves you down. Could go either way.",icon:"◈",accent:"#7a4f8a",spriteUrl:ie("tm-normal")}],Ia=[{title:"Pokémon Center",eyebrow:"Rest",hint:"Nurse Joy waves you over. Heal up, regroup.",icon:"✚",accent:"#c43a3a",spriteUrl:ie("super-potion")},{title:"Forest Spring",eyebrow:"Rest",hint:"Cool water, rumored to mend even broken spirits.",icon:"⛲",accent:"#c43a3a",spriteUrl:ie("fresh-water")}],Aa=[{title:"Travelling Pedlar",eyebrow:"Pop-up Shop",hint:"Mules laden with curios — small but choice.",icon:"◆",accent:"#c08a2c",spriteUrl:ie("coin-case")},{title:"Roadside Stall",eyebrow:"Pop-up Shop",hint:"Half-set tent, prices already half-shouted.",icon:"◉",accent:"#c08a2c",spriteUrl:ie("great-ball")}],Ha=[{title:"Berry Bush",eyebrow:"Forage",hint:"Heavy with fruit. No fight — just leaves & loot.",icon:"◇",accent:"#5a8a3a",spriteUrl:ie("oran-berry")},{title:"Mossy Stump",eyebrow:"Forage",hint:"Look beneath. Mushrooms? Maybe a stray Pokéball.",icon:"◇",accent:"#5a8a3a",spriteUrl:ie("tiny-mushroom")}];function Na(){return{kind:"grass",...Ea[Math.floor(Math.random()*Ea.length)]}}function Go(a){const e=Ni(a);return{kind:"trainer",title:e.name,eyebrow:"Trainer",hint:e.flavour,icon:e.icon,accent:e.accent,trainerArchetypeId:e.id,spriteUrl:e.spriteSlug?Me(e.spriteSlug):void 0}}function Uo(){return{kind:"center",...Ia[Math.floor(Math.random()*Ia.length)]}}function Wo(){return{kind:"mystery",mysteryFlavourId:"random_v1",...Ca[Math.floor(Math.random()*Ca.length)]}}function Ko(){return{kind:"shop_mini",...Aa[Math.floor(Math.random()*Aa.length)]}}function zo(){return{kind:"forage",...Ha[Math.floor(Math.random()*Ha.length)]}}function jo(a,e){switch(a){case"grass":return Na();case"trainer":return Go(e);case"center":return Uo();case"mystery":return Wo();case"shop_mini":return Ko();case"forage":return zo();default:return Na()}}function Vo(a){const e=Ut(a);return e?{kind:"gym",title:`${e.name}'s Arena`,eyebrow:`${e.city} · Gym Arena`,hint:`Four-stop gauntlet: two trainers, a restock, then ${e.name} for the badge.`,icon:e.icon,accent:e.accent,gymLeaderId:e.id,spriteUrl:Me(e.spriteSlug),arenaEntry:!0}:null}function Yo(a){const e=Ws(a);return e?{kind:e.isChampion?"champion":"elite_four",title:e.name,eyebrow:e.title,hint:e.flavour,icon:e.icon,accent:e.accent,eliteId:e.id,spriteUrl:Me(e.spriteSlug)}:null}function Xo(a,e,t=0,s=0,i=4){if(t>=8&&s<5){const l=Yo(s);if(l)return[l]}if(e===i-1&&a>=1&&a<=8){const l=Vo(a);if(l)return[l]}const n=Fo(a,e),r=new Set,o=[];for(let l=0;l<3;l++){const c=Oo(n,r);r.add(c),o.push(jo(c,a))}return o}const Jo={normal:[16,19,21,39,52,84,108,113,115,132,143,162,174,190,216],fire:[4,37,58,77,126,136,146,155,218,228,240,244],water:[7,54,60,72,79,86,90,116,118,120,129,158,170,194,222,226],electric:[25,81,100,125,135,145,170,179,239,243],grass:[1,43,46,69,102,114,152,187,191,192,273,387],ice:[87,91,124,144,215,220,225,238,245,361],fighting:[56,62,66,67,106,107,214,236,237,286,296,297],poison:[13,23,29,32,41,48,88,109,167,168,316,317],ground:[27,50,74,95,104,111,220,231,232,246,449],flying:[16,17,21,22,41,84,142,163,169,198,277,333,396],psychic:[63,79,96,102,122,150,196,203,280,358,386],bug:[10,13,46,48,123,165,167,193,204,213,269,290],rock:[74,95,111,138,140,142,185,213,220,246,299,408],ghost:[92,200,292,302,353,355,425,477],dragon:[147,230,329,371,380,384,443,445,483,484],dark:[197,215,261,215,359,430,461,491,510],steel:[81,95,205,208,212,227,374,379,437,448,462],fairy:[35,39,122,173,174,175,176,183,184,280,282]};function Tt(a){const e=new Set;for(const t of a)for(const s of Jo[t]??[])e.add(s);return Array.from(e)}function Zo(a,e){const t=Ra(a,e,"Junior"),s=Qo(a),i=Ra(a,e,"Senior"),n={kind:"gym",title:a.name,eyebrow:`${a.city} · Gym Leader`,hint:a.flavour,icon:a.icon,accent:a.accent,gymLeaderId:a.id,spriteUrl:Me(a.spriteSlug),arenaRank:"Leader"};return{gymId:a.id,steps:[t,s,i,n],index:0}}function Ra(a,e,t){const s=Io(a.bias,e),i=e<=2?1:e<=4?t==="Senior"?2:1:void 0;return{kind:"trainer",title:`${t} ${s.shortLabel}`,eyebrow:`${a.city} · Arena · ${t}`,hint:`${t==="Junior"?"A warm-up fight":"No more pleasantries"} — drilled in ${a.type}-type combat.`,icon:s.icon,accent:a.accent,trainerArchetypeId:s.id,spriteUrl:s.spriteSlug?Me(s.spriteSlug):void 0,arenaRank:t,teamSizeOverride:i,rosterTypeBias:[...a.bias]}}function Qo(a){return{kind:"shop_mini",title:"Arena Atrium",eyebrow:`${a.city} · Arena · Restock`,hint:"Catch your breath. The vendor here knows what gym leaders cost.",icon:"◆",accent:a.accent,spriteUrl:ie("coin-case"),arenaRank:"Restock"}}function el(a,e,t){var o,l;const s=document.createElement("div");s.className="champion-victory-overlay";const i=a.runStats.wavesCleared,n=((o=a.badges)==null?void 0:o.length)??0;s.innerHTML=`
    <div class="champion-victory-card">
      <div class="path-eyebrow">— Hall of Fame · Run complete —</div>
      <h2 class="champion-victory-title">Champion of <em>Indigo</em>!</h2>
      <div class="champion-victory-trophy" aria-hidden="true">
        <img src="${ys(150)}" alt="" class="champion-trophy-img"
             onerror="${Y("★")}" />
      </div>
      <div class="champion-victory-summary">
        Cleared <b>${i}</b> wave${i===1?"":"s"} ·
        <b>${n}</b> badge${n===1?"":"s"} ·
        Defeated the Pokémon League
      </div>
      <div class="champion-victory-clears">Champion clears: <b>${e}</b></div>
      ${(()=>{const c=vs(a.playerName,a.generation);return c?`<div class="champion-victory-next-goal"><span class="cv-next-eyebrow">Next:</span> ${c.title}</div>`:""})()}
      <button class="ink-btn primary champion-victory-cta" type="button">Continue →</button>
    </div>
  `,document.body.appendChild(s),k.play("ui.coin");const r=()=>{s.isConnected&&(s.classList.add("closing"),setTimeout(()=>s.remove(),220),t())};(l=s.querySelector(".champion-victory-cta"))==null||l.addEventListener("click",r),s.addEventListener("click",c=>{c.target===s&&r()})}class tl{constructor(e,t,s,i){b(this,"container");b(this,"state");b(this,"onRestart");b(this,"onLeaderboard");b(this,"submitted",!1);b(this,"priorPB",null);b(this,"isNewBest",!1);var o;this.container=e,this.state=t,this.onRestart=s,this.onLeaderboard=i,this.priorPB=Si(t.playerName);const n=t.runStats.wavesCleared,r=((o=this.priorPB)==null?void 0:o.score_waves)??0;this.isNewBest=!this.priorPB||n>r}mount(){this.container.innerHTML=this.renderHTML(),this.container.style.display="",oe(this.container),this.attachEvents(),this.autoSubmitScore(),this.loadLeaderboard()}renderHTML(){var c;const e=this.state.runStats,t=this.state.wave,s=this.computeProgress(),i=new Set(this.state.badges??[]),n=he.filter(d=>i.has(d.id)),r=n.map(d=>{const p=Gt(d.id),u=p?`<img src="${p}" alt="${d.name}" class="badge-pip-sprite" onerror="${Y(d.icon)}" />`:`<span class="badge-pip-icon" aria-hidden="true">${d.icon}</span>`;return`<span class="badge-pip owned" title="${d.name}" style="--badge-color:${d.color}">${u}</span>`}).join(""),o=n.length>0?`<div class="v"><span class="gover-badge-row">${r}</span><span class="gover-badge-count">${n.length} / ${he.length}</span></div>`:`<div class="v">${n.length} / ${he.length}</div>`,l=(((c=this.state.badges)==null?void 0:c.length)??0)>=8?(()=>{const d=this.state.leagueStep??0;return`<div class="stat-row"><div class="k">League progress</div><div class="v"><div class="gover-league-row">${Us.map((u,h)=>`<span class="gover-league-cell ${h<d?"done":h===d?"current":""}" title="${u.name}">${u.icon} ${u.name.split(" ")[0]}</span>`).join('<span class="gover-league-arrow">→</span>')}</div></div></div>`})():"";return`
      <div class="gover-wrap screen">
        <div class="gover-stamp">RUN ENDED</div>

        <div class="gover-head">
          <div>
            <div class="kicker">Field log · Final entry</div>
            <h2>The last Pokémon fainted on Wave ${t}.${this.isNewBest?' <span class="gover-newbest-pill">★ NEW PERSONAL BEST</span>':""}</h2>
            <div class="gover-subhead">${Pt(s.subheadLabel)}</div>
            ${this.isNewBest?`<div class="gover-pb-delta">${this.priorPB?`Previous best · Wave ${this.priorPB.score_waves} → +${e.wavesCleared-this.priorPB.score_waves} waves`:`Your first record — Wave ${e.wavesCleared}.`}</div>`:""}
          </div>
          <div style="font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;color:var(--ink-3);text-transform:uppercase;text-align:right">
            Starter · ${e.starterName}<br/>
            Run · ${this.state.playerName}
          </div>
        </div>

        <div class="gover-body">
          <div class="gover-stats">
            <div class="h">Run stats</div>
            <div class="stat-row"><div class="k">Waves cleared</div><div class="v">${e.wavesCleared}</div></div>
            <div class="stat-row"><div class="k">Act reached</div><div class="v">${Pt(s.actLabel)}</div></div>
            <div class="stat-row"><div class="k">Badges earned</div>${o}</div>
            ${l}
            <div class="stat-row"><div class="k">Total KOs</div><div class="v">${e.totalKOs}</div></div>
            <div class="stat-row"><div class="k">Damage dealt</div><div class="v">${e.totalDamageDealt.toLocaleString()}</div></div>
            <div class="stat-row"><div class="k">Items collected</div><div class="v">${e.itemsCollected}</div></div>
            <div class="stat-row"><div class="k">Perks picked</div><div class="v">${e.perksCollected}</div></div>
            <div class="stat-row"><div class="k">Coins banked</div><div class="v">${this.state.coins.toLocaleString()}¢</div></div>
            <div id="submit-status" style="margin-top:10px;font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3)">Submitting score…</div>
          </div>

          <div class="lb-panel">
            <div class="h">
              <span class="t">Leaderboard</span>
              <span class="s">Top 7 · global</span>
            </div>
            <div class="lb-list" id="lb-list">
              <div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:.15em">Loading…</div>
            </div>
          </div>
        </div>

        <div class="gover-foot">
          <button class="ink-btn ghost" id="copy-btn">Copy results</button>
          <button class="ink-btn ghost" id="leaderboard-btn">Full leaderboard</button>
          <button class="ink-btn primary" id="restart-btn">Start new run →</button>
        </div>
      </div>
    `}computeProgress(){var o;const e=this.state.generation==="endless",t=this.state.runStats.wavesCleared;if(e)return{actLabel:"Endless",subheadLabel:`Endless · Wave ${t}`,actReached:this.state.runStats.wavesCleared,endless:!0};const s=((o=this.state.badges)==null?void 0:o.length)??0,i=this.state.leagueStep??0;if(s>=8&&i>=5)return{actLabel:"Champion ✓",subheadLabel:"League · Champion",actReached:10,endless:!1};if(s>=8){const l=Ws(i),c=(l==null?void 0:l.name)??`Step ${i+1}`;return{actLabel:`League · ${c}`,subheadLabel:`League · ${c}`,actReached:9,endless:!1}}const n=this.state.currentAct,r=Ut(n);return r?{actLabel:`Act ${n} · ${r.name}`,subheadLabel:`Act ${n} · ${r.city}`,actReached:n,endless:!1}:{actLabel:`Act ${n}`,subheadLabel:`Act ${n}`,actReached:n,endless:!1}}async autoSubmitScore(){var s;if(this.submitted)return;this.submitted=!0;const e=this.container.querySelector("#submit-status"),t=this.computeProgress();try{await Cr({name:this.state.playerName,score_waves:this.state.runStats.wavesCleared,score_details:{starterName:this.state.runStats.starterName,totalKOs:this.state.runStats.totalKOs,itemsCollected:this.state.runStats.itemsCollected,perksCollected:this.state.runStats.perksCollected,totalDamageDealt:this.state.runStats.totalDamageDealt,actReached:t.actReached,badgesEarned:((s=this.state.badges)==null?void 0:s.length)??0,endless:t.endless,deck:this.state.deck,stake:this.state.stake}}),e&&(e.textContent="✓ Score submitted")}catch{e&&(e.textContent="· Score saved locally")}}async loadLeaderboard(){const e=this.container.querySelector("#lb-list");if(e)try{const t=await ki("all_time",7);if(t.length===0){e.innerHTML='<div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:.15em">No scores yet.</div>';return}e.innerHTML=t.map((s,i)=>{var r;return`
          <div class="lb-row${s.name===this.state.playerName&&s.score_waves===this.state.runStats.wavesCleared?" me":""}">
            <div class="rank">${i+1}.</div>
            <div>
              <div class="n">${Pt(s.name)}</div>
              <div class="sub">Starter · ${Pt(((r=s.score_details)==null?void 0:r.starterName)??"—")}</div>
            </div>
            <div class="wv">W${s.score_waves??0}</div>
          </div>
        `}).join("")}catch{e.innerHTML='<div style="font-family:var(--font-mono);font-size:11px;color:var(--ink-3);letter-spacing:.15em">Failed to load.</div>'}}attachEvents(){var e,t,s;(e=this.container.querySelector("#leaderboard-btn"))==null||e.addEventListener("click",()=>{this.onLeaderboard()}),(t=this.container.querySelector("#restart-btn"))==null||t.addEventListener("click",()=>{this.onRestart()}),(s=this.container.querySelector("#copy-btn"))==null||s.addEventListener("click",()=>{var l;const i=this.state.runStats,n=this.computeProgress(),r=((l=this.state.badges)==null?void 0:l.length)??0,o=`PokeRun — ${this.state.playerName}
Waves: ${i.wavesCleared} | Act: ${n.actLabel} | Badges: ${r}/${he.length} | KOs: ${i.totalKOs} | Starter: ${i.starterName}`;navigator.clipboard.writeText(o).catch(()=>{})})}unmount(){this.container.style.display="none",this.container.innerHTML=""}}function Pt(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}class sl{constructor(e,t,s,i){b(this,"container");b(this,"onBack");b(this,"activeFilter","all_time");b(this,"currentPlayerScore",null);b(this,"currentPlayerName",null);this.container=e,this.onBack=t,this.currentPlayerScore=s??null,this.currentPlayerName=i??null}async mount(){this.container.innerHTML=this.renderShell(),this.container.style.display="",oe(this.container),this.attachEvents(),await this.loadScores()}renderShell(){return`
      <div class="lb-full-wrap screen">
        <div class="lb-full-head">
          <div>
            <div class="kicker">Field records · Global</div>
            <h2 class="lb-full-title">Leader<em>board</em></h2>
          </div>
          <div class="lb-full-head-right">
            <div class="lb-filter-strip" id="lb-filter-strip">
              <button class="lb-filter active" data-filter="all_time">All time</button>
              <button class="lb-filter" data-filter="today">Today</button>
            </div>
            <button class="ink-btn ghost sm" id="lb-back-btn">← Back</button>
          </div>
        </div>

        <div class="lb-full-body">
          <div class="lb-panel lb-full-panel">
            <div class="h">
              <span class="t" id="lb-panel-title">All-time top runs</span>
              <span class="s" id="lb-status">${Ir()}</span>
            </div>
            <div class="lb-full-cols">
              <div class="lb-col-head">
                <span>#</span>
                <span>Trainer</span>
                <span>Waves</span>
                <span>Starter</span>
                <span>KOs</span>
                <span>Act</span>
                <span>Badges</span>
                <span>Date</span>
              </div>
              <div class="lb-list" id="lb-list">
                <div class="lb-loading-row" id="lb-loading">
                  <span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--ink-3)">Loading scores…</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `}async loadScores(){const e=this.container.querySelector("#lb-list");e.innerHTML='<div class="lb-loading-row"><span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--ink-3)">Loading scores…</span></div>';const t=this.container.querySelector("#lb-panel-title");t&&(t.textContent=this.activeFilter==="today"?"Today's top runs":"All-time top runs");try{const s=await ki(this.activeFilter,20);if(s.length===0){e.innerHTML='<div class="lb-loading-row"><span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--ink-3)">No scores yet — be the first!</span></div>';return}e.innerHTML=s.map((n,r)=>this.renderRow(n,r+1)).join("");const i=Array.from(e.querySelectorAll(".lb-row"));O.fromTo(i,{opacity:0,x:-16},{opacity:1,x:0,duration:.25,stagger:.035,ease:"power2.out"})}catch{e.innerHTML='<div class="lb-loading-row"><span style="font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--oxblood)">Failed to load scores.</span></div>'}}renderRow(e,t){var d,p,u,h,m,v,g,w;const s=this.currentPlayerName!=null&&e.name===this.currentPlayerName&&(this.currentPlayerScore==null||e.score_waves===this.currentPlayerScore),i=e.created_at?new Date(e.created_at).toLocaleDateString(void 0,{month:"short",day:"numeric"}):"—",n=Vr((d=e.score_details)==null?void 0:d.deck),r=n?`<span class="lb-deck-pill">${Xe(n)}</span>`:"",o=(p=e.score_details)==null?void 0:p.stake,l=to(o),c=l?`<span class="lb-stake-pill stake-${o}">${Xe(l.split(" ")[0])}</span>`:"";return`
      <div class="lb-row lb-full-row${s?" me":""}">
        <div class="rank">${t}.</div>
        <div>
          <div class="n">${Xe(e.name)}${r}${c}</div>
          <div class="sub">Starter · ${Xe(((u=e.score_details)==null?void 0:u.starterName)??"—")}</div>
        </div>
        <div class="wv">W${e.score_waves??0}</div>
        <div class="lb-cell-starter">${Xe(((h=e.score_details)==null?void 0:h.starterName)??"—")}</div>
        <div class="lb-cell-kos">${((m=e.score_details)==null?void 0:m.totalKOs)??0}</div>
        <div class="lb-cell-act">${Ii((v=e.score_details)==null?void 0:v.actReached,(g=e.score_details)==null?void 0:g.endless)}</div>
        <div class="lb-cell-badges">${Ai((w=e.score_details)==null?void 0:w.badgesEarned)}</div>
        <div class="lb-cell-date">${i}</div>
      </div>
    `}attachEvents(){var e;(e=this.container.querySelector("#lb-back-btn"))==null||e.addEventListener("click",()=>{this.onBack()}),this.container.querySelectorAll(".lb-filter").forEach(t=>{t.addEventListener("click",async()=>{const s=t.dataset.filter;this.activeFilter=s,this.container.querySelectorAll(".lb-filter").forEach(i=>i.classList.toggle("active",i===t)),await this.loadScores()})})}unmount(){this.container.style.display="none",this.container.innerHTML=""}}function Xe(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const al=new Set([...pt.filter(a=>a.status==="live").map(a=>a.id),"endless"]);function Ee(a){const e=a==null?void 0:a.generation;return e&&al.has(e)?e:"gen1"}const dt=(a,e)=>{hi()||kr(a,e)};let f=null;const il=document.getElementById("app");let nt=null,He=null,Ne=null,Re=null,qe=null,De=null,Fe=null,Oe=null,Ge=null,Ue=null,We=null,X;async function nl(){if(O.ticker.lagSmoothing(0),vl(),yl(),Fa(),il.innerHTML=`
    <div id="screen-container" class="screen-container"></div>
  `,X=document.getElementById("screen-container"),!document.getElementById("pokerun-svg-defs")){const a=document.createElementNS("http://www.w3.org/2000/svg","svg");a.id="pokerun-svg-defs",a.setAttribute("aria-hidden","true"),a.style.cssText="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;",a.innerHTML=`
      <defs>
        <filter id="px-pixelate" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="0.55" />
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.2 0.45 0.7 0.95"/>
            <feFuncG type="discrete" tableValues="0 0.2 0.45 0.7 0.95"/>
            <feFuncB type="discrete" tableValues="0 0.2 0.45 0.7 0.95"/>
            <feFuncA type="discrete" tableValues="0 0.4 0.85 1 1"/>
          </feComponentTransfer>
          <feMorphology operator="dilate" radius="0.4"/>
        </filter>
      </defs>
    `,document.body.appendChild(a)}ji(),Qi(document.body),en(),k.prefetch(["ui.click","ui.confirm","ui.cancel","ui.error","ui.coin","music.menu"]),cn().catch(()=>{}),rl(),Ri()}function rl(){const a=document.getElementById("main-loading");a&&O.to(a,{opacity:0,duration:.4,onComplete:()=>a.remove()})}function le(a){const e=document.createElement("div");return e.id=a,e.style.position="absolute",e.style.inset="0",e}function Q(){nt==null||nt.unmount(),He==null||He.unmount(),Ne==null||Ne.unmount(),Re==null||Re.unmount(),qe==null||qe.unmount(),De==null||De.unmount(),Ue==null||Ue.unmount(),We==null||We.unmount(),Fe==null||Fe.unmount(),Oe==null||Oe.unmount(),Ge==null||Ge.unmount(),He=null,Ne=null,Re=null,qe=null,De=null,Ue=null,We=null,Fe=null,Oe=null,Ge=null,X.innerHTML="",document.querySelectorAll(".battle-vfx").forEach(a=>a.remove())}function Ri(){Q(),k.playMusic("music.menu",{fadeMs:1400});const a=le("auth-screen-mount");X.appendChild(a),nt=new yr(a,(e,t)=>{Ks(e,t)}),nt.mount()}function Ks(a,e){const t=xs();a??(a=(t==null?void 0:t.username)??""),e??(e=(t==null?void 0:t.isGuest)??!1),Q(),k.playMusic("music.menu",{fadeMs:1400});const s=le("start-screen-mount");X.appendChild(s),He=new lo(s,i=>{f=i,ne()},()=>{Ri()},a,e,()=>{const i=Ht();i&&(f=i.state,ne())}),He.mount(),s.addEventListener("show-leaderboard",()=>{Fi(()=>{Q(),Ks(a,e)})})}async function zs(){var H,W,K;if(!f)return;const a=f.wave,e=f.currentNode,s=(e==null?void 0:e.kind)==="gym"||(e==null?void 0:e.kind)==="elite_four"||(e==null?void 0:e.kind)==="champion"||a===f.nextBossWave,i=ws(a,s,Ee(f));Q();let n=null;if(i.isBossWave)if((e==null?void 0:e.kind)==="gym")n=f.actBossBlind??tt().id;else if((e==null?void 0:e.kind)==="elite_four"||(e==null?void 0:e.kind)==="champion"){const N=f.leagueStep??0;n=((H=f.leagueBlinds)==null?void 0:H[N])??tt().id}else n=tt().id;let r=null;if(f.queuedTags.length>0?r=f.queuedTags[0]??null:!i.isBossWave&&Math.random()<.18&&(r=Xn().id),i.isBossWave){k.play("wave.boss_warn");const N=n?Ot(n):void 0;await nr(N==null?void 0:N.name,N==null?void 0:N.color)}else k.play("wave.intro");const o=document.createElement("div");o.className="wave-intro";const l=r?Yn(r):void 0,c=l?`<div class="wave-intro-tag" style="--tag-color:${l.color}">
         <span class="wit-icon">${l.icon}</span>
         <span class="wit-label">
           <span class="wit-name">${l.name}</span>
           <span class="wit-desc">${l.description}</span>
         </span>
       </div>`:"",d=(e==null?void 0:e.kind)==="trainer"?bs(e.trainerArchetypeId??""):void 0,p=(e==null?void 0:e.kind)==="gym"?it(e.gymLeaderId??""):void 0,u=(e==null?void 0:e.kind)==="elite_four"||(e==null?void 0:e.kind)==="champion"?ks(e.eliteId??""):void 0,h=e==null?void 0:e.spriteUrl,m=h?`<div class="wave-trainer-portrait" aria-hidden="true">
         <img src="${h}" alt="" class="wave-trainer-sprite"
              onerror="this.style.display='none';" />
       </div>`:"";let v,g,w,A="";if(u)v=u.title,g=`${m}<div class="wn">${u.name.toUpperCase()}</div>`,w=u.flavour,A=" trainer league";else if(p)v=`${p.city} · Gym`,g=`${m}<div class="wn">${p.name.toUpperCase()}</div>`,w=p.flavour,A=" trainer gym";else if(d)v="Trainer challenges you",g=`${m}<div class="wn">${d.name.toUpperCase()}</div>`,w=d.flavour,A=" trainer";else{const N=Ee(f)==="endless";v=i.isBossWave?"Boss encounter":N?`Endless${a>30?" · Deep run":""}`:"Incoming wave",g=`<div class="wn">WAVE <em>${String(a).padStart(2,"0")}</em></div>`,w=i.isBossWave?"A monstrous challenger blocks the route.":N?"No retreat. The waves keep coming.":"Wild creatures ahead."}const x=f.arenaState,T=x?(()=>{const N=it(x.gymId),z=x.steps.length,j=x.index,re=Array.from({length:z},(me,ce)=>`<span class="arena-pip${ce<j?" done":ce===j-1?" active":""}"></span>`).join("");return`<div class="arena-progress" style="--arena-color:${(N==null?void 0:N.accent)??"#3a3a3a"}">
          <span class="arena-progress-label">Arena · ${j}/${z}</span>
          <span class="arena-progress-pips">${re}</span>
          <span class="arena-progress-target">vs ${(N==null?void 0:N.name)??"???"}</span>
        </div>`})():"",P=f.currentAct,I=f.actStep,C=!x&&Ee(f)!=="endless"&&P>=1&&P<=8?Gs[P-1]:void 0,L=C?(()=>{var ce;const N=C.accent,z=((ce=f.deckMods)==null?void 0:ce.stagesPerAct)??4,j=Math.max(0,z-I),re=Array.from({length:z},(de,M)=>M).map(de=>{const M=de===z-1,F=de<I,V=["stage-pip",M?"gym":"",F?"done":"",de===I?"current":""].filter(Boolean).join(" "),pe=M?"ARENA":`${de+1}`;return`<span class="${V}"><span class="stage-pip-label">${pe}</span></span>`}).join('<span class="stage-pip-rail" aria-hidden="true"></span>'),me=j<=0?`ENTERING ${C.name.toUpperCase()}'S ARENA`:`${j} STOP${j===1?"":"S"} TO ${C.name.toUpperCase()}`;return`<div class="stage-progress wave-intro-stage" style="--stage-color:${N}">
          <div class="stage-progress-portrait">
            <img src="${Me(C.spriteSlug)}" alt="" onerror="this.style.display='none';" />
          </div>
          <div class="stage-progress-body">
            <div class="stage-progress-eyebrow">${C.city.toUpperCase()} · ACT ${P}</div>
            <div class="stage-progress-pips">${re}</div>
            <div class="stage-progress-cta">${me}</div>
          </div>
        </div>`})():"";o.innerHTML=`
    <div class="wave-intro-card${i.isBossWave?" boss":""}${A}">
      <div class="eyebrow">${v}</div>
      ${g}
      <div class="sub">${w}</div>
      ${T}
      ${L}
      ${c}
      <div class="hint">Tap / Press A to continue</div>
    </div>
  `,X.appendChild(o),await ir(o,{hasTag:!!l}),o.remove(),a===1&&!e&&dt("first_wave",{eyebrow:"Field manual · Wave 01",title:"Battle basics",body:"Pick a move each turn — or toggle <b>Auto-Battle</b> with <kbd>A</kbd>. Speed decides who strikes first. <b>Type matchups</b> deal 2× or 0.5× damage. Items in your bag can be used in-battle.",cta:"Begin →"}),(e==null?void 0:e.kind)==="gym"&&dt("first_arena",{eyebrow:"Field manual · Arena",title:"You're at a gym leader",body:"Arenas are <b>multi-step gauntlets</b>: junior trainer → restock shop → senior trainer → leader. HP carries over between fights, so spend coins on healing items or counter the gym's type.",cta:"Got it →"});const S=document.createElement("div");S.className="wave-loading",S.innerHTML=`
    <div class="wave-loading-inner">
      <div class="pokeball-spin"></div>
      <p>Wild Pokémon appeared!</p>
    </div>
  `,X.appendChild(S);const E=(e==null?void 0:e.kind)==="trainer"?bs(e.trainerArchetypeId??""):void 0,y=(e==null?void 0:e.kind)==="gym"?it(e.gymLeaderId??""):void 0,$=(e==null?void 0:e.kind)==="elite_four"||(e==null?void 0:e.kind)==="champion"?ks(e.eliteId??""):void 0;try{let N,z=0,j=i.enemyCount;if($){const q=Tt($.bias);j=$.teamSize,N=[...q.length>0?Array.from({length:Math.max(0,j-1)},()=>q[Math.floor(Math.random()*q.length)]):Array.from({length:Math.max(0,j-1)},()=>Ce(i)[0]??1),$.acePokemonId],z=$.levelDelta}else if(y){const q=Tt(y.bias);j=y.teamSize,N=[...q.length>0?Array.from({length:Math.max(0,j-1)},()=>q[Math.floor(Math.random()*q.length)]):Array.from({length:Math.max(0,j-1)},()=>Ce(i)[0]??1),y.acePokemonId],z=y.levelDelta}else if(E){const q=new Set(i.enemyPool),fe=Tt((e==null?void 0:e.rosterTypeBias)??E.typeBias).filter(G=>q.has(G));j=(e==null?void 0:e.teamSizeOverride)??E.teamSize??i.enemyCount,N=fe.length>0?Array.from({length:j},()=>fe[Math.floor(Math.random()*fe.length)]):Ce(i).slice(0,j),z=E.levelDelta,(e==null?void 0:e.arenaRank)==="Junior"&&(f.currentAct??1)<=2&&(z=Math.min(z,0))}else if((e==null?void 0:e.kind)==="grass"&&e.habitatBias){const q=new Set(i.enemyPool),fe=Tt([e.habitatBias]).filter(G=>q.has(G));N=fe.length>0?Array.from({length:i.enemyCount},()=>fe[Math.floor(Math.random()*fe.length)]):Ce(i)}else N=Ce(i);const re=N.map(()=>kn(i)),me=z!==0?re.map(q=>Math.max(1,q+z)):re;let ce=0;const de=await rs(N,1,q=>{ce=q});let M=i.threatMultiplier??1;y&&(f.currentAct??1)<=2?M=Math.min(M,1):y&&(f.currentAct??1)<=4&&(M=Math.min(M,1+(M-1)*.6));const F=Z.filter(q=>q.itemType==="held"&&(q.rarity==="rare"||q.rarity==="epic")&&!["focus_sash","revive_heart","eviolite"].includes(q.id)),U=de.map((q,Te)=>{const fe={...q,level:me[Te]},G=ye(fe,[]);if(M!==1&&(G.effectiveStats.attack=Math.floor(G.effectiveStats.attack*M),G.effectiveStats.spAtk=Math.floor(G.effectiveStats.spAtk*M),G.effectiveStats.defense=Math.floor(G.effectiveStats.defense*Math.sqrt(M)),G.effectiveStats.spDef=Math.floor(G.effectiveStats.spDef*Math.sqrt(M)),G.maxBattleHp=Math.floor(G.maxBattleHp*M),G.battleHp=G.maxBattleHp),!i.isBossWave&&a>=3&&Math.random()<.1&&F.length>0){const Vs=F[Math.floor(Math.random()*F.length)];G.isElite=!0,G.heldItem={...Vs},G.itemSlots.length>0&&(G.itemSlots[0].unlocked=!0,G.itemSlots[0].item={...Vs}),G.effectiveStats.attack=Math.floor(G.effectiveStats.attack*1.2),G.effectiveStats.spAtk=Math.floor(G.effectiveStats.spAtk*1.2),G.effectiveStats.defense=Math.floor(G.effectiveStats.defense*1.2),G.effectiveStats.spDef=Math.floor(G.effectiveStats.spDef*1.2),G.effectiveStats.speed=Math.floor(G.effectiveStats.speed*1.2),G.maxBattleHp=Math.floor(G.maxBattleHp*1.2),G.battleHp=G.maxBattleHp}return G}),V=Ce(i).slice(0,3),pe=Math.floor((i.levelMin+i.levelMax)/2),J=r==="rare_tag"||f.pendingRareFloor,Kt=(W=f.vouchers)==null?void 0:W.includes("omen_globe"),Oi=i.isBossWave&&f.pendingBossTagBonus||Kt,js={minRarity:J?"rare":void 0,extraCard:!!Oi};f.pendingRareFloor=!1,rs(V,pe).then(async q=>{f&&(f.pendingRewards=ea(a,i.isBossWave,f.activePerks.map(Te=>Te.id),q,js))}).catch(()=>{f&&(f.pendingRewards=ea(a,i.isBossWave,[],[],js))}),S.remove();const mt=n,ft=r;ft&&f.queuedTags[0]===ft&&f.queuedTags.shift(),f.pendingWaveTag=ft,mt==="the_manacle"&&f.team.forEach(q=>{q.statStages.attack=Math.max(-6,-2),q.statStages.defense=Math.max(-6,-2),q.statStages.spAtk=Math.max(-6,-2),q.statStages.spDef=Math.max(-6,-2),q.statStages.speed=Math.max(-6,-2)}),mt==="the_wall"&&U.forEach(q=>{q.maxBattleHp=Math.floor(q.maxBattleHp*2),q.battleHp=q.maxBattleHp});const zt=(K=f.stakeMods)==null?void 0:K.bossBlindHpMult;zt&&zt!==1&&mt&&i.isBossWave&&U.forEach(q=>{q.maxBattleHp=Math.floor(q.maxBattleHp*zt),q.battleHp=q.maxBattleHp}),i.isBossWave&&(f._bossInsuranceUsed=!1),n&&Rr(f.playerName,[n]),f.battleState={playerTeam:f.team.map(q=>({...q})),enemyTeam:U,activePlayerIndex:0,activeEnemyIndex:0,turn:0,log:[{text:`Wave ${a}${i.isBossWave?" — BOSS WAVE":""}! The battle begins!`,type:"system"}],phase:"selecting",autoBattle:(()=>{try{return localStorage.getItem("pokerun.autoBattle")==="1"}catch{return!1}})(),isBossWave:i.isBossWave,winner:null,pendingDamage:null,bossBlind:mt,hasUsedFirstAttack:!1,usedMoveIds:[],toothHealedEnemies:[],hookTurnCount:0,waveTag:ft,turnsUsed:0},ol()}catch(N){S.remove(),console.error("Failed to load enemy team:",N),B("Failed to load enemy team. Retrying...","error"),setTimeout(()=>zs(),2e3)}}function ol(){var t;if(!f)return;Q();const a=((t=f.battleState)==null?void 0:t.isBossWave)??f.wave===f.nextBossWave;k.playMusic(a?"music.battle_boss":"music.battle_normal",{fadeMs:900});const e=le("battle-screen-mount");X.appendChild(e),Ne=new wo(e,f,s=>{var n;f=s;const i=s.battleState;if((i==null?void 0:i.winner)==="player"){ue(s.playerName,"first_step"),(s.runStats.wavesCleared??0)>=30&&ue(s.playerName,"hall_of_records");const r=i.isBossWave;k.playMusic("music.victory",{fadeMs:200,loop:!1,volume:.95}),ws(s.wave,r,Ee(s));const o=Sn(s.wave,r,s.activePerks,Ee(s));r&&(s.nextBossWave=s.wave+5+Math.floor(Math.random()*4));const l=s.team.filter(L=>_(L,"amulet_coin")).length*.2,c=i.enemyTeam.filter(L=>L.isElite).length,d=c,p=i.waveTag??s.pendingWaveTag??null;let u=1;p==="double_coins"&&(u=2),p==="investment"&&(s.investmentCoins=(s.investmentCoins??0)+25);let h=0;p==="speed_tag"&&i.turnsUsed<=5&&(h+=100),p==="orbit_tag"&&s.team.forEach(L=>{L.level=Math.min(100,L.level+3)}),p==="boss_tag"&&(s.pendingBossTagBonus=!0),p==="charm_tag"&&(s.pendingCharmPack=!0),p==="voucher_tag"&&(s.pendingVoucherSlot=!0),r&&s.pendingBossTagBonus&&(s.pendingBossTagBonus=!1);const m=s.investmentCoins??0,v=s.currentNode,g=(v==null?void 0:v.kind)==="trainer"?bs(v.trainerArchetypeId??""):void 0,w=(v==null?void 0:v.kind)==="gym"?it(v.gymLeaderId??""):void 0,A=(v==null?void 0:v.kind)==="elite_four"||(v==null?void 0:v.kind)==="champion"?ks(v.eliteId??""):void 0,x=(A==null?void 0:A.coinMultiplier)??(w==null?void 0:w.coinMultiplier)??(g==null?void 0:g.coinMultiplier)??1,T=((n=s.stakeMods)==null?void 0:n.coinRewardMult)??1,P=Math.floor(o*(1+l+d)*u*x*T)+h+m;if(w&&!s.badges.includes(w.badgeId)){s.badges.push(w.badgeId);const L=ao(w.badgeId);L&&(s.activePerks.some(E=>E.id===L.perk.id)||s.activePerks.push(L.perk),ml(L,w.name)),w.id==="brock"&&ue(s.playerName,"boulder_master");const S=s.team.filter(E=>E.battleHp>0);S.length>=2&&S.every(E=>E.types[0]===S[0].types[0])&&ue(s.playerName,"mono_master")}w&&(s.arenaState=null,s.actBossBlind=null,s.actStep=0,s.currentAct+=1,s.currentAct>=5&&ue(s.playerName,"survivor")),A&&(s.leagueStep=(s.leagueStep??0)+1,A.isChampion&&(s.pendingGenGate=!0,ue(s.playerName,"champion"),s.pendingChampionClears=Dr(s.playerName),s.pendingChampionVictoryScreen=!0,eo(s.playerName,s.stake),hn(s.playerName,Ee(s)))),s.coins,s.coins+=P,s.coins>=500&&ue(s.playerName,"rich_trainer"),r&&s.investmentCoins&&(s.investmentCoins=0);const I=[];c>0&&I.push(`${c} Elite`),u>1&&I.push(`${u}× Tag`),h>0&&I.push(`+${h}¢ Speed`),m>0&&I.push(`+${m}¢ Invest`);const C=I.length>0?` (${I.join(", ")})`:"";B(`+${P} coins!${C}`,"success"),qi()}else Di()}),Ne.mount()}function qi(){if(!f)return;if(f.pendingRewards.length===0){setTimeout(()=>qi(),300);return}Q();const a=le("reward-screen-mount");dt("first_reward",{eyebrow:"Field manual · Spoils",title:"Pick one of three",body:"Each card is a <b>Pokémon</b>, a <b>team perk</b>, or an <b>item</b>. You can also <b>skip</b> for +60¢. Boss waves drop better loot — save your skips for those.",cta:"Pick a card →"}),X.appendChild(a),xe(f),Re=new To(a,f,e=>{f=e,xe(f),e.pendingCatch?ll():e.arenaState?ne():Wt()}),Re.mount()}function ll(){if(!(f!=null&&f.pendingCatch))return;Q(),k.duckMusic(.35,250),k.playMusic("music.catch_intro",{fadeMs:200,loop:!1,volume:.9});const a=le("catch-screen-mount");X.appendChild(a),dt("first_catch",{eyebrow:"Field manual · Catch",title:"A wild encounter!",body:"Throw a <b>Poké Ball</b> from your bag — better balls have higher catch rates. The mon's HP and status affect the odds. Caught mons join your team if there's room, or replace a benched mon.",cta:"Got it →"}),xe(f),qe=new Lo(a,f,f.pendingCatch,e=>{f=e,xe(f),k.duckMusic(1,400),e.arenaState?ne():Wt()}),qe.mount()}function Wt(){var i,n,r;if(!f)return;const a=f.vouchers??[];if(f.shopItems.length===0){const o=f.team.reduce((g,w)=>g+w.battleHp,0),l=f.team.reduce((g,w)=>g+w.maxBattleHp,1),c=o/l,d=(f.shopsWithoutHealing??0)>=3,p=(f.shopsWithoutEpic??0)>=3,u=!!((i=f.deckMods)!=null&&i.shopExcludeConsumables);f.shopItems=ni(f.wave,[],a,{teamHpRatio:c,healingPity:d,epicPity:p,excludeConsumables:u});const h=["potion","super_potion","hyper_potion","full_restore","pokemon_food","max_potion"],m=f.shopItems.some(g=>h.includes(g.item.id)),v=f.shopItems.some(g=>g.item.rarity==="epic"||g.item.rarity==="legendary");f.shopsWithoutHealing=m?0:(f.shopsWithoutHealing??0)+1,f.shopsWithoutEpic=v?0:(f.shopsWithoutEpic??0)+1}if(!f.shopPacks||f.shopPacks.length===0){const o=!!f.pendingCharmPack;f.shopPacks=En(f.wave,o,a,{excludeConsumables:!!((n=f.deckMods)!=null&&n.shopExcludeConsumables)}),f.pendingCharmPack=!1}if(!f.shopVouchers||f.shopVouchers.length===0){const o=!!f.pendingVoucherSlot;f.shopVouchers=Cn(f.wave,a,o),f.pendingVoucherSlot=!1}const e=((r=f.stakeMods)==null?void 0:r.shopPriceMult)??1;if(e!==1){for(const o of f.shopItems)o.price=Math.floor(o.price*e);for(const o of f.shopPacks)o.free||(o.price=Math.floor(o.price*e));for(const o of f.shopVouchers)o.price=Math.floor(o.price*e)}f.freeRerollUsed=!1;const t=f.activePerks.reduce((o,l)=>o+(l.effect.extraReroll??0),0);f.freeRerollsLeft=t,Q(),k.playMusic("music.shop",{fadeMs:1e3});const s=le("shop-screen-mount");X.appendChild(s),dt("first_shop",{eyebrow:"Field manual · Shop",title:"The pop-up shop",body:"Spend coins on <b>consumables</b>, <b>held items</b>, and the occasional rare mon. <b>Reroll</b> the inventory once per visit (free), then it costs coins. Healing pity guarantees a Potion every few shops.",cta:"Got it →"}),xe(f),De=new gs(s,f,o=>{f=o,f.wave++,f.shopItems=[],f.shopPacks=[],f.shopVouchers=[],f.freeRerollUsed=!1,f.freeRerollsLeft=0,f.battleState=null;const l=f.activePerks.some(c=>c.id==="nurses_blessing");f.team.forEach(c=>{ut(c).some(d=>d.id==="momentum_badge")&&(c.momentumStacks=Math.min(10,(c.momentumStacks??0)+1)),c.resetPulseUsedThisWave=!1,c.turnsInBattle=0,c.battleHp>0&&l&&(c.battleHp=c.maxBattleHp)}),ne()}),De.mount()}function cl(){var o,l;if(!f)return;const a=f.actBossBlind;if(!a)return;const e=f.inventory.find(c=>c.item.id==="blind_lens");if(!e||e.quantity<=0)return;const t=Ot(a);if(!t)return;const s=Ut(f.currentAct),i=(s==null?void 0:s.name)??"the gym arena",n=document.createElement("div");n.className="path-overlay",n.innerHTML=`
    <div class="path-modal-card" style="--blind-color:${t.color}">
      <div class="path-eyebrow">— Use Blind Lens —</div>
      <h2 class="path-title">Re-roll <em>${i}'s</em> Field Effect</h2>
      <div class="po-blind-modal-current">
        <span class="po-blind-modal-label">Current:</span>
        <span class="po-blind-modal-name" style="color:${t.color}">
          ${t.icon} ${t.name}
        </span>
      </div>
      <p class="path-sub">Cost: 1× Blind Lens. The new blind will differ from the current one.</p>
      <div class="path-modal-actions">
        <button class="ink-btn ghost" data-cancel type="button">Cancel</button>
        <button class="ink-btn primary" data-confirm type="button">Re-roll →</button>
      </div>
    </div>
  `,document.body.appendChild(n);const r=()=>n.remove();(o=n.querySelector("[data-cancel]"))==null||o.addEventListener("click",r),n.addEventListener("click",c=>{c.target===n&&r()}),(l=n.querySelector("[data-confirm]"))==null||l.addEventListener("click",()=>{if(!f){r();return}const c=f.inventory.find(u=>u.item.id==="blind_lens");if(!c||c.quantity<=0){r();return}c.quantity-=1,c.quantity<=0&&(f.inventory=f.inventory.filter(u=>u!==c));const d=tt([a]);f.actBossBlind=d.id,k.play("ui.coin"),B(`Field Effect re-rolled: ${d.name}`,"success"),xe(f),r(),ne();const p=document.querySelector(".stage-progress .po-blind-chip");p&&(p.classList.add("shimmer"),window.setTimeout(()=>p.classList.remove("shimmer"),800))})}function dl(a){var t;if((((t=a.badges)==null?void 0:t.length)??0)>=8&&(a.leagueStep??0)<5){(!a.leagueBlinds||a.leagueBlinds.length<5)&&(a.leagueBlinds=Hn(5));return}a.currentAct>=1&&a.currentAct<=8&&!a.actBossBlind&&(a.actBossBlind=tt().id)}function ne(){var e,t;if(!f)return;if(f.pendingChampionVictoryScreen){const s=f.pendingChampionClears??0;el(f,s,()=>{f&&(f.pendingChampionVictoryScreen=!1,f.pendingChampionClears=0,xe(f),ne())});return}if(f.pendingGenGate){fl();return}if(f.arenaState){qa();return}dl(f),(!f.nodeOptions||f.nodeOptions.length===0)&&(f.nodeOptions=Xo(f.currentAct,f.actStep,((e=f.badges)==null?void 0:e.length)??0,f.leagueStep??0,((t=f.deckMods)==null?void 0:t.stagesPerAct)??4)),f.phase="path_select",xe(f),Q(),k.playMusic("music.menu",{fadeMs:700});const a=le("path-screen-mount");X.appendChild(a),Fe=new Ao(a,f,s=>{var n;if(!f)return;if(f.currentNode=s,(s.kind==="grass"||s.kind==="trainer"||s.kind==="gym"||s.kind==="elite_four"||s.kind==="champion"||s.kind==="forage")&&s.kind!=="gym"){f.actStep+=1;const r=((n=f.deckMods)==null?void 0:n.stagesPerAct)??4;f.actStep>=r&&(f.actStep=0,f.currentAct+=1)}if(f.nodeOptions=[],s.kind==="gym"&&s.arenaEntry){const r=it(s.gymLeaderId??"");if(r){f.arenaState=Zo(r,f.currentAct),qa();return}}s.kind==="center"?pl():s.kind==="mystery"?ul():s.kind==="shop_mini"?Wt():s.kind==="forage"?hl():zs()},()=>{cl()}),Fe.mount()}function qa(){if(!(f!=null&&f.arenaState))return;const a=f.arenaState;if(a.index>=a.steps.length){f.arenaState=null,ne();return}const e=a.steps[a.index];a.index+=1,f.currentNode=e,f.nodeOptions=[],e.kind==="shop_mini"?Wt():zs()}function pl(){if(!f)return;Q(),k.playMusic("music.menu",{fadeMs:700});const a=le("center-screen-mount");X.appendChild(a),Oe=new Ro(a,f,e=>{f=e,ne()}),Oe.mount()}function ul(){if(!f)return;Q(),k.playMusic("music.menu",{fadeMs:700});const a=le("mystery-screen-mount");X.appendChild(a),Ge=new Do(a,f,e=>{f=e,ne()}),Ge.mount()}function hl(){var o;if(!f)return;const a=Z.filter(l=>l.itemType==="consumable"&&l.rarity==="common"),e=a[Math.floor(Math.random()*a.length)],t=f.inventory.find(l=>l.item.id===e.id);t?t.quantity+=1:f.inventory.push({item:e,quantity:1});const s=document.createElement("div");s.className="path-overlay";const i=e.pokeapiName,n=i?`<div class="forage-sprite-wrap"><img src="${ie(i)}" alt="" class="forage-sprite" onerror="${Y(e.icon??"◇")}" /></div>`:`<div class="path-card-icon px-emoji" aria-hidden="true">${e.icon??"◇"}</div>`;s.innerHTML=`
    <div class="path-modal-card forage-modal">
      <div class="path-eyebrow">Forage</div>
      <h2 class="path-card-title">${e.name}</h2>
      ${n}
      <p class="path-card-hint">${e.description}</p>
      <button class="btn-primary forage-cta" type="button">Continue →</button>
    </div>
  `,document.body.appendChild(s),k.play("ui.coin"),B(`Foraged: ${e.name}!`,"success");const r=()=>{s.remove(),ne()};(o=s.querySelector(".forage-cta"))==null||o.addEventListener("click",r),s.addEventListener("click",l=>{l.target===s&&r()})}function ml(a,e){var n;const t=Gt(a.id),s=document.createElement("div");s.className="badge-award-overlay",s.innerHTML=`
    <div class="badge-award-card" style="--badge-accent:${a.color}">
      <div class="badge-award-eyebrow">— Badge unlocked · ${e} defeated —</div>
      <h2 class="badge-award-title">${a.name}</h2>
      <div class="badge-award-art">
        ${t?`<img src="${t}" alt="${a.name}" class="badge-award-sprite"
                  onerror="${Y(a.icon)}" />`:`<span class="badge-award-fallback px-emoji">${a.icon}</span>`}
        <span class="badge-award-burst"></span>
      </div>
      <p class="badge-award-perk"><b>Passive:</b> ${a.perk.description}</p>
      <button class="ink-btn primary badge-award-cta" type="button">Continue →</button>
    </div>
  `,document.body.appendChild(s),k.play("ui.coin");const i=()=>{s.classList.add("closing"),setTimeout(()=>s.remove(),220)};(n=s.querySelector(".badge-award-cta"))==null||n.addEventListener("click",i),s.addEventListener("click",r=>{r.target===s&&i()}),setTimeout(()=>{s.isConnected&&i()},8e3)}function fl(){if(!f)return;f.pendingGenGate=!1;const a=Ee(f),e=Ss(a),t={gen2:249,gen3:384,gen4:483,gen5:644,gen6:716,gen7:791,gen8:888,gen9:1007},s=()=>{if(!e)return"";const n=e.themeAccent,r=ys(t[e.id]??151);return e.status==="live"?`
        <button class="path-card gen-gate-card has-sprite" data-gen="${e.id}" type="button" style="--card-accent:${n}">
          <span class="path-card-corner tl"></span><span class="path-card-corner tr"></span>
          <span class="path-card-corner bl"></span><span class="path-card-corner br"></span>
          <div class="path-card-eyebrow">New Generation</div>
          <div class="path-card-portrait">
            <img src="${r}" alt="" class="path-card-sprite" onerror="${Y("◇")}" />
          </div>
          <h3 class="path-card-title">${e.region} · Gen ${e.ordinal}</h3>
          <p class="path-card-hint">Reset acts, badges fade — Pokémon roster expands to ${e.region}.</p>
          <div class="path-card-foot"><span class="path-card-tag">Continue</span><span class="path-card-cta">Choose →</span></div>
        </button>
      `:`
      <button class="path-card gen-gate-card gen-gate-coming-soon has-sprite" data-coming-soon="${e.id}" type="button" style="--card-accent:${n}">
        <span class="path-card-corner tl"></span><span class="path-card-corner tr"></span>
        <span class="path-card-corner bl"></span><span class="path-card-corner br"></span>
        <div class="path-card-eyebrow">Coming soon</div>
        <div class="path-card-portrait">
          <img src="${r}" alt="" class="path-card-sprite" onerror="${Y("◇")}" />
        </div>
        <h3 class="path-card-title">${e.region} · Gen ${e.ordinal}</h3>
        <p class="path-card-hint">${e.flavorText??"In development."}</p>
        <div class="path-card-foot"><span class="path-card-tag">Planned</span><span class="path-card-cta">Tap for info</span></div>
      </button>
    `},i=document.createElement("div");i.className="path-overlay gen-gate-overlay",i.innerHTML=`
    <div class="path-modal-card gen-gate">
      <div class="path-eyebrow">— Champion defeated · The path forks —</div>
      <h2 class="gen-gate-title">Where to <em>next</em>?</h2>
      <p class="gen-gate-sub">You stand atop the Indigo Plateau. A new generation calls — or you press deeper into Endless.</p>
      <div class="gen-gate-cards">
        ${s()}
        <button class="path-card gen-gate-card has-sprite" data-gen="endless" type="button" style="--card-accent:#7a3f8a">
          <span class="path-card-corner tl"></span><span class="path-card-corner tr"></span>
          <span class="path-card-corner bl"></span><span class="path-card-corner br"></span>
          <div class="path-card-eyebrow">Press On</div>
          <div class="path-card-portrait">
            <img src="${ys(151)}" alt="" class="path-card-sprite" onerror="${Y("♾")}" />
          </div>
          <h3 class="path-card-title">Endless Mode</h3>
          <p class="path-card-hint">Keep your team, badges, items — waves keep scaling. No new gens, just glory.</p>
          <div class="path-card-foot"><span class="path-card-tag">Endless</span><span class="path-card-cta">Choose →</span></div>
        </button>
      </div>
    </div>
  `,document.body.appendChild(i),i.querySelectorAll("[data-gen]").forEach(n=>{n.addEventListener("click",()=>{const r=n.dataset.gen??"endless";if(!f)return;k.play("ui.confirm");const o=lt(r);r==="endless"?(f.generation="endless",f.leagueStep=5,B("Endless mode engaged.","success")):o&&o.status==="live"&&(f.generation=o.id,f.currentAct=1,f.actStep=0,f.leagueStep=0,f.actBossBlind=null,f.leagueBlinds=[],f.badges=[],B(`Welcome to ${o.region}.`,"success")),f.nodeOptions=[],i.remove(),ne()})}),i.querySelectorAll("[data-coming-soon]").forEach(n=>{n.addEventListener("click",()=>{const r=n.dataset.comingSoon??"",o=lt(r),l=(o==null?void 0:o.flavorText)??`${(o==null?void 0:o.region)??"That region"} is in development.`;B(l,"info")})})}function Di(){if(!f)return;hs(),Q(),k.playMusic("music.defeat",{fadeMs:400,loop:!1,volume:.95});const a=le("gameover-screen-mount");X.appendChild(a),Ue=new tl(a,f,()=>{f=null,Ks()},()=>{const e=f;Fi(()=>{Q(),Di()},e==null?void 0:e.runStats.wavesCleared,e==null?void 0:e.playerName)}),Ue.mount()}function Fi(a,e,t){Q();const s=le("lb-screen-mount");X.appendChild(s),We=new sl(s,a,e,t),We.mount()}function vl(){var e,t;const a=()=>{const s=window.matchMedia("(max-width: 760px)").matches||window.matchMedia("(hover: none) and (pointer: coarse)").matches;document.body.classList.toggle("is-mobile",s),document.body.classList.toggle("is-desktop",!s),document.documentElement.style.setProperty("--vh",`${window.innerHeight*.01}px`),document.documentElement.style.setProperty("--app-vh",`${window.innerHeight}px`)};a(),window.addEventListener("resize",a),window.addEventListener("orientationchange",a),(t=(e=window.matchMedia("(max-width: 760px)")).addEventListener)==null||t.call(e,"change",a)}function yl(){let a=!1;const e=t=>{var n,r;if(a)return;a=!0;const s=document.createElement("div");s.className="error-boundary",s.innerHTML=`
      <div class="error-boundary-card">
        <div class="error-boundary-eyebrow">Oh no — something broke</div>
        <h2 class="error-boundary-title">A wild <em>error</em> appeared</h2>
        <pre class="error-boundary-msg"></pre>
        <div class="error-boundary-actions">
          <button class="ink-btn ghost" id="eb-reload">Reload page</button>
          <button class="ink-btn primary" id="eb-reset">Reset save &amp; reload</button>
        </div>
        <div class="error-boundary-foot">If this keeps happening, please report it on GitHub.</div>
      </div>
    `;const i=s.querySelector(".error-boundary-msg");i&&(i.textContent=t.slice(0,600)),document.body.appendChild(s),(n=s.querySelector("#eb-reload"))==null||n.addEventListener("click",()=>{window.location.reload()}),(r=s.querySelector("#eb-reset"))==null||r.addEventListener("click",()=>{try{localStorage.removeItem("pokerun:save:v1")}catch{}window.location.reload()})};window.addEventListener("error",t=>{console.error("[error-boundary]",t.error??t.message),e(t.message||String(t.error))}),window.addEventListener("unhandledrejection",t=>{var s;console.error("[error-boundary] unhandledrejection",t.reason),e(String(((s=t.reason)==null?void 0:s.message)??t.reason))})}nl().catch(console.error);
