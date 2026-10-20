(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function e(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(i){if(i.ep)return;i.ep=!0;const a=e(i);fetch(i.href,a)}})();const p={FAVORITES:"listenx_favorites",PLAYLISTS:"listenx_playlists",HISTORY:"listenx_history",SETTINGS:"listenx_settings",VOLUME:"listenx_volume",LAST_SONG:"listenx_last_song",SERVER_URL:"listenx_server_url"},A={graphicsLevel:"ULTRA_LIQUID",customBg:null,crossfadeDuration:3,streamQuality:"320",eqPreset:"Flat",eqGains:[0,0,0,0,0,0],vocalRemover:!1,musicTaste:{languages:["Hindi","Haryanvi","Punjabi","English"],singers:["Masoom Sharma","Sidhu Moosewala","Arijit Singh","Karan Aujla","Gulzaar Chhaniwala"]}};class N{constructor(){this._initDefaultPlaylists()}_initDefaultPlaylists(){const t=this.getPlaylists();if(!t||t.length===0){const e=[{id:"pl_favorites",title:"Liked Songs",description:"Your favorite tracks",isSystem:!0,coverIcon:"heart",created:Date.now(),songs:[]},{id:"pl_haryanvi_top",title:"Haryanvi Blast",description:"High energy Haryanvi beats & desi bangers",isSystem:!1,coverIcon:"music",created:Date.now(),songs:[]},{id:"pl_punjabi_vibes",title:"Punjabi Hits",description:"Moosewala, Karan Aujla, Diljit & AP Dhillon",isSystem:!1,coverIcon:"fire",created:Date.now(),songs:[]}];localStorage.setItem(p.PLAYLISTS,JSON.stringify(e))}}getFavorites(){try{const t=localStorage.getItem(p.FAVORITES);return t?JSON.parse(t):[]}catch{return[]}}isFavorite(t){return t?this.getFavorites().some(s=>s.id===t):!1}toggleFavorite(t){if(!t||!t.id)return!1;let e=this.getFavorites();const s=e.findIndex(l=>l.id===t.id);let i=!1;s>=0?(e.splice(s,1),i=!1):(e.unshift(t),i=!0),localStorage.setItem(p.FAVORITES,JSON.stringify(e));const a=this.getPlaylists(),n=a.find(l=>l.id==="pl_favorites");return n&&(n.songs=e,localStorage.setItem(p.PLAYLISTS,JSON.stringify(a))),i}getPlaylists(){try{const t=localStorage.getItem(p.PLAYLISTS);return t?JSON.parse(t):[]}catch{return[]}}createPlaylist(t,e=""){if(!t||!t.trim())return null;const s=this.getPlaylists(),i={id:"pl_"+Date.now(),title:t.trim(),description:e.trim(),isSystem:!1,coverIcon:"music",created:Date.now(),songs:[]};return s.push(i),localStorage.setItem(p.PLAYLISTS,JSON.stringify(s)),i}deletePlaylist(t){let e=this.getPlaylists();return e=e.filter(s=>s.id!==t||s.isSystem),localStorage.setItem(p.PLAYLISTS,JSON.stringify(e)),e}addSongToPlaylist(t,e){const s=this.getPlaylists(),i=s.find(a=>a.id===t);return i?i.songs.some(a=>a.id===e.id)?!1:(i.songs.unshift(e),localStorage.setItem(p.PLAYLISTS,JSON.stringify(s)),!0):!1}removeSongFromPlaylist(t,e){const s=this.getPlaylists(),i=s.find(a=>a.id===t);return i?(i.songs=i.songs.filter(a=>a.id!==e),localStorage.setItem(p.PLAYLISTS,JSON.stringify(s)),!0):!1}getHistory(){try{const t=localStorage.getItem(p.HISTORY);return t?JSON.parse(t):[]}catch{return[]}}addToHistory(t){if(!t||!t.id)return;let e=this.getHistory();e=e.filter(s=>s.id!==t.id),e.unshift({...t,playedAt:Date.now()}),e.length>100&&e.pop(),localStorage.setItem(p.HISTORY,JSON.stringify(e))}clearHistory(){localStorage.setItem(p.HISTORY,JSON.stringify([]))}getSettings(){try{const t=localStorage.getItem(p.SETTINGS);if(t)return{...A,...JSON.parse(t)}}catch{}return{...A}}saveSettings(t){const s={...this.getSettings(),...t};return localStorage.setItem(p.SETTINGS,JSON.stringify(s)),s}getVolume(){const t=localStorage.getItem(p.VOLUME);return t!==null?parseFloat(t):.85}saveVolume(t){localStorage.setItem(p.VOLUME,t.toString())}getServerUrl(){return localStorage.getItem(p.SERVER_URL)||"http://localhost:8080"}saveServerUrl(t){localStorage.setItem(p.SERVER_URL,t.trim().replace(/\/+$/,""))}}const d=new N;class V{constructor(t){this.container=document.getElementById(t),this.canvas=document.createElement("canvas"),this.canvas.className="liquid-canvas",this.ctx=this.canvas.getContext("2d"),this.container.appendChild(this.canvas),this.mode="ULTRA_LIQUID",this.blobs=[],this.animationFrameId=null,this.customBgUrl=null,this._initBlobs(),this._bindResize(),this.applySettings()}_initBlobs(){this.blobs=[{x:.2,y:.2,vx:4e-4,vy:3e-4,r:.45,color:"rgba(0, 240, 255, 0.25)"},{x:.8,y:.3,vx:-3e-4,vy:5e-4,r:.5,color:"rgba(138, 43, 226, 0.22)"},{x:.5,y:.8,vx:5e-4,vy:-4e-4,r:.48,color:"rgba(255, 0, 127, 0.18)"},{x:.3,y:.7,vx:-4e-4,vy:3e-4,r:.35,color:"rgba(0, 240, 255, 0.15)"},{x:.7,y:.6,vx:3e-4,vy:-5e-4,r:.4,color:"rgba(255, 179, 0, 0.12)"}]}_bindResize(){const t=()=>{this.width=window.innerWidth,this.height=window.innerHeight,this.canvas.width=this.width,this.canvas.height=this.height};window.addEventListener("resize",t),t()}applySettings(){const t=d.getSettings();this.mode=t.graphicsLevel||"ULTRA_LIQUID",this.customBgUrl=t.customBg||null,this.customBgUrl?(this.container.style.backgroundImage=`url("${this.customBgUrl}")`,this.container.classList.add("has-custom-bg")):(this.container.style.backgroundImage="",this.container.classList.remove("has-custom-bg")),this.mode==="ULTRA_LIQUID"?(this.canvas.style.display="block",this.container.classList.add("mode-ultra-liquid"),this.container.classList.remove("mode-balanced","mode-low"),this.start()):this.mode==="BALANCED"?(this.stop(),this.canvas.style.display="none",this.container.classList.add("mode-balanced"),this.container.classList.remove("mode-ultra-liquid","mode-low")):(this.stop(),this.canvas.style.display="none",this.container.classList.add("mode-low"),this.container.classList.remove("mode-ultra-liquid","mode-balanced"))}start(){if(this.animationFrameId)return;const t=()=>{this._render(),this.animationFrameId=requestAnimationFrame(t)};this.animationFrameId=requestAnimationFrame(t)}stop(){this.animationFrameId&&(cancelAnimationFrame(this.animationFrameId),this.animationFrameId=null)}_render(){if(!this.ctx||this.mode!=="ULTRA_LIQUID")return;const t=this.width,e=this.height;this.ctx.clearRect(0,0,t,e),this.ctx.fillStyle="#0D0E15",this.ctx.fillRect(0,0,t,e);for(let s of this.blobs){s.x+=s.vx,s.y+=s.vy,(s.x<.1||s.x>.9)&&(s.vx*=-1),(s.y<.1||s.y>.9)&&(s.vy*=-1);const i=s.x*t,a=s.y*e,n=s.r*Math.min(t,e),l=this.ctx.createRadialGradient(i,a,0,i,a,n);l.addColorStop(0,s.color),l.addColorStop(1,"transparent"),this.ctx.fillStyle=l,this.ctx.beginPath(),this.ctx.arc(i,a,n,0,Math.PI*2),this.ctx.fill()}}}const S={OFF:"OFF",ALL:"ALL",ONE:"ONE"},k={Flat:[0,0,0,0,0,0],"Bass Boost":[8,5,2,0,1,0],Vocal:[-2,1,5,4,2,0],Electronic:[7,5,0,3,6,0],Rock:[6,3,-1,3,6,0],Pop:[2,4,3,2,1,0]};class D{constructor(){this.queue=[],this.currentIndex=-1,this.isPlaying=!1,this.loopMode=S.OFF,this.isShuffle=!1,this.playbackSpeed=1,this.crossfadeDuration=3,this.isVocalRemoverEnabled=!1,this.audioA=new Audio,this.audioB=new Audio,this.activeAudio=this.audioA,this.inactiveAudio=this.audioB,this.audioA.crossOrigin="anonymous",this.audioB.crossOrigin="anonymous",this.audioCtx=null,this.analyser=null,this.preampGain=null,this.eqFilters=[],this.vocalRemoverNodes=null,this.gainA=null,this.gainB=null,this.listeners=new Set,this._initAudioElements(),this._initMediaSession();const t=d.getSettings();this.crossfadeDuration=t.crossfadeDuration??3,this.isVocalRemoverEnabled=t.vocalRemover??!1}_ensureAudioContext(){if(!this.audioCtx)try{const t=window.AudioContext||window.webkitAudioContext;this.audioCtx=new t,this.analyser=this.audioCtx.createAnalyser(),this.analyser.fftSize=128,this.analyser.smoothingTimeConstant=.8,this.preampGain=this.audioCtx.createGain(),this.preampGain.gain.value=1,this.masterGain=this.audioCtx.createGain(),this.masterGain.gain.value=d.getVolume(),this.gainA=this.audioCtx.createGain(),this.gainB=this.audioCtx.createGain(),this.gainA.gain.value=1,this.gainB.gain.value=0;const e=[60,230,910,3600,14e3],s=["lowshelf","peaking","peaking","peaking","highshelf"];this.eqFilters=e.map((l,r)=>{const c=this.audioCtx.createBiquadFilter();return c.type=s[r],c.frequency.value=l,c.Q.value=1,c.gain.value=0,c});for(let l=0;l<this.eqFilters.length-1;l++)this.eqFilters[l].connect(this.eqFilters[l+1]);const i=this.audioCtx.createMediaElementSource(this.audioA),a=this.audioCtx.createMediaElementSource(this.audioB);i.connect(this.gainA),a.connect(this.gainB),this.crossfadeMixer=this.audioCtx.createGain(),this.gainA.connect(this.crossfadeMixer),this.gainB.connect(this.crossfadeMixer),this.crossfadeMixer.connect(this.preampGain),this.preampGain.connect(this.eqFilters[0]),this.eqFilters[this.eqFilters.length-1].connect(this.analyser),this.analyser.connect(this.masterGain),this.masterGain.connect(this.audioCtx.destination);const n=d.getSettings();n.eqGains&&this.setEqualizerGains(n.eqGains)}catch(t){console.warn("Web Audio API not fully available or restricted by user gesture:",t)}}_initAudioElements(){const t=e=>{e.addEventListener("play",()=>{e===this.activeAudio&&(this.isPlaying=!0,this._emit("playStateChanged",{isPlaying:!0}))}),e.addEventListener("pause",()=>{e===this.activeAudio&&(this.isPlaying=!1,this._emit("playStateChanged",{isPlaying:!1}))}),e.addEventListener("timeupdate",()=>{var s;if(e===this.activeAudio){const i=e.currentTime,a=e.duration||((s=this.getCurrentSong())!=null&&s.durationMs?this.getCurrentSong().durationMs/1e3:0);this._emit("timeUpdate",{currentTime:i,duration:a,progress:a>0?i/a:0}),this.crossfadeDuration>0&&a>10&&i>=a-this.crossfadeDuration-.5&&!this._isCrossfadingTriggered&&this.hasNext()&&(this._isCrossfadingTriggered=!0,this.playNextWithCrossfade())}}),e.addEventListener("ended",()=>{e===this.activeAudio&&!this._isCrossfadingTriggered&&this.onTrackEnded()}),e.addEventListener("error",s=>{e===this.activeAudio&&(console.error("Audio playback error:",s),this._emit("error",{message:"Failed to play track"}))})};t(this.audioA),t(this.audioB)}_initMediaSession(){"mediaSession"in navigator&&(navigator.mediaSession.setActionHandler("play",()=>this.play()),navigator.mediaSession.setActionHandler("pause",()=>this.pause()),navigator.mediaSession.setActionHandler("previoustrack",()=>this.playPrevious()),navigator.mediaSession.setActionHandler("nexttrack",()=>this.playNext()),navigator.mediaSession.setActionHandler("seekbackward",t=>{const e=t.seekOffset||10;this.seek(Math.max(0,this.activeAudio.currentTime-e))}),navigator.mediaSession.setActionHandler("seekforward",t=>{const e=t.seekOffset||10;this.seek(this.activeAudio.currentTime+e)}),navigator.mediaSession.setActionHandler("seekto",t=>{t.seekTime!==void 0&&this.seek(t.seekTime)}))}_updateMediaSession(t){!("mediaSession"in navigator)||!t||(navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist,album:t.album||"Listen-X Stream",artwork:[{src:t.artworkUri||"assets/favicon.svg",sizes:"500x500",type:"image/jpeg"}]}))}setQueue(t,e=0){!t||t.length===0||(this.queue=[...t],this.currentIndex=Math.max(0,Math.min(e,this.queue.length-1)),this._isCrossfadingTriggered=!1,this.playCurrentTrack(),this._emit("queueChanged",{queue:this.queue,currentIndex:this.currentIndex}))}addToQueue(t){t&&(this.queue.push(t),this._emit("queueChanged",{queue:this.queue,currentIndex:this.currentIndex}))}playNextInQueue(t){t&&(this.queue.splice(this.currentIndex+1,0,t),this._emit("queueChanged",{queue:this.queue,currentIndex:this.currentIndex}))}removeFromQueue(t){t<0||t>=this.queue.length||(this.queue.splice(t,1),t<this.currentIndex?this.currentIndex--:t===this.currentIndex&&(this.queue.length>0?(this.currentIndex=Math.min(this.currentIndex,this.queue.length-1),this.playCurrentTrack()):this.stop()),this._emit("queueChanged",{queue:this.queue,currentIndex:this.currentIndex}))}clearQueue(){this.stop(),this.queue=[],this.currentIndex=-1,this._emit("queueChanged",{queue:[],currentIndex:-1})}shuffleQueue(){if(this.queue.length<=1)return;const t=this.getCurrentSong(),e=this.queue.filter((s,i)=>i!==this.currentIndex);for(let s=e.length-1;s>0;s--){const i=Math.floor(Math.random()*(s+1));[e[s],e[i]]=[e[i],e[s]]}t?(this.queue=[t,...e],this.currentIndex=0):(this.queue=e,this.currentIndex=0),this._emit("queueChanged",{queue:this.queue,currentIndex:this.currentIndex})}getCurrentSong(){return this.currentIndex>=0&&this.currentIndex<this.queue.length?this.queue[this.currentIndex]:null}async playCurrentTrack(){if(this._ensureAudioContext(),this.audioCtx&&this.audioCtx.state==="suspended")try{await this.audioCtx.resume()}catch{}const t=this.getCurrentSong();if(!t)return;this._isCrossfadingTriggered=!1;const e=t.streamUrl;if(e){this.activeAudio.src=e,this.activeAudio.playbackRate=this.playbackSpeed,this.gainA&&this.gainB&&(this.activeAudio===this.audioA?(this.gainA.gain.value=1,this.gainB.gain.value=0):(this.gainA.gain.value=0,this.gainB.gain.value=1));try{await this.activeAudio.play(),this.isPlaying=!0,d.addToHistory(t),this._updateMediaSession(t),this._emit("songChanged",{song:t,index:this.currentIndex}),this._emit("playStateChanged",{isPlaying:!0})}catch(s){console.warn("Playback initiation error:",s)}}}play(){if(this._ensureAudioContext(),this.audioCtx&&this.audioCtx.state==="suspended")try{this.audioCtx.resume()}catch{}if(!this.getCurrentSong()&&this.queue.length>0){this.currentIndex=0,this.playCurrentTrack();return}this.activeAudio.play().catch(t=>console.warn("Play failed:",t))}pause(){this.activeAudio.pause()}togglePlay(){this.isPlaying?this.pause():this.play()}seek(t){this.activeAudio&&!isNaN(t)&&(this.activeAudio.currentTime=Math.max(0,t))}setVolume(t){const e=Math.max(0,Math.min(1,t));d.saveVolume(e),this.masterGain&&this.audioCtx?this.masterGain.gain.setValueAtTime(e,this.audioCtx.currentTime):(this.audioA.volume=e,this.audioB.volume=e),this._emit("volumeChanged",{volume:e})}getVolume(){return d.getVolume()}setPlaybackSpeed(t){this.playbackSpeed=t,this.audioA.playbackRate=t,this.audioB.playbackRate=t,this._emit("speedChanged",{speed:t})}setLoopMode(t){this.loopMode=t,this._emit("loopModeChanged",{mode:t})}toggleLoopMode(){const t=[S.OFF,S.ALL,S.ONE],e=t[(t.indexOf(this.loopMode)+1)%t.length];return this.setLoopMode(e),e}hasNext(){return this.loopMode===S.ALL?!0:this.currentIndex<this.queue.length-1}playNext(){if(this.queue.length!==0){if(this.loopMode===S.ONE){this.seek(0),this.play();return}if(this.currentIndex<this.queue.length-1)this.currentIndex++;else if(this.loopMode===S.ALL)this.currentIndex=0;else return;this.playCurrentTrack()}}playPrevious(){if(this.queue.length!==0){if(this.activeAudio.currentTime>3){this.seek(0);return}if(this.currentIndex>0)this.currentIndex--;else if(this.loopMode===S.ALL)this.currentIndex=this.queue.length-1;else{this.seek(0);return}this.playCurrentTrack()}}onTrackEnded(){this.loopMode===S.ONE?(this.seek(0),this.play()):this.hasNext()?this.playNext():(this.isPlaying=!1,this._emit("playStateChanged",{isPlaying:!1}))}async playNextWithCrossfade(){if(!this.hasNext()||this.crossfadeDuration<=0||!this.audioCtx){this.playNext();return}const t=(this.currentIndex+1)%this.queue.length,e=this.queue[t];if(!e||!e.streamUrl){this.playNext();return}const s=this.activeAudio,i=this.inactiveAudio,a=s===this.audioA?this.gainA:this.gainB,n=i===this.audioA?this.gainA:this.gainB;i.src=e.streamUrl,i.playbackRate=this.playbackSpeed;const l=this.crossfadeDuration,r=this.audioCtx.currentTime;a.gain.setValueAtTime(1,r),a.gain.linearRampToValueAtTime(0,r+l),n.gain.setValueAtTime(0,r),n.gain.linearRampToValueAtTime(1,r+l);try{await i.play(),this.activeAudio=i,this.inactiveAudio=s,this.currentIndex=t,d.addToHistory(e),this._updateMediaSession(e),this._emit("songChanged",{song:e,index:this.currentIndex}),setTimeout(()=>{s.pause(),s.src="",this._isCrossfadingTriggered=!1},(l+.5)*1e3)}catch{this.playNext()}}setEqualizerGains(t){if(!(!this.eqFilters||this.eqFilters.length===0)){for(let e=0;e<5;e++)if(this.eqFilters[e]&&this.audioCtx){const s=t[e]||0;this.eqFilters[e].gain.setValueAtTime(s,this.audioCtx.currentTime)}if(this.preampGain&&this.audioCtx){const e=Math.pow(10,(t[5]||0)/20);this.preampGain.gain.setValueAtTime(e,this.audioCtx.currentTime)}d.saveSettings({eqGains:t})}}applyPreset(t){const e=k[t]||k.Flat;this.setEqualizerGains(e),d.saveSettings({eqPreset:t}),this._emit("eqPresetChanged",{preset:t,gains:e})}toggleVocalRemover(){if(this.isVocalRemoverEnabled=!this.isVocalRemoverEnabled,d.saveSettings({vocalRemover:this.isVocalRemoverEnabled}),this.isVocalRemoverEnabled)this.eqFilters[1].gain.setValueAtTime(-10,this.audioCtx.currentTime),this.eqFilters[2].gain.setValueAtTime(-14,this.audioCtx.currentTime),this.eqFilters[3].gain.setValueAtTime(-8,this.audioCtx.currentTime);else{const t=d.getSettings().eqGains||[0,0,0,0,0,0];this.setEqualizerGains(t)}return this._emit("vocalRemoverChanged",{enabled:this.isVocalRemoverEnabled}),this.isVocalRemoverEnabled}getFrequencyData(t){this.analyser?this.analyser.getByteFrequencyData(t):t.fill(0)}subscribe(t){return this.listeners.add(t),()=>this.listeners.delete(t)}_emit(t,e){for(let s of this.listeners)try{s(t,e)}catch(i){console.error("Listener error:",i)}}stop(){this.audioA.pause(),this.audioB.pause(),this.audioA.src="",this.audioB.src="",this.isPlaying=!1,this._emit("playStateChanged",{isPlaying:!1})}async downloadSong(t){if(!t||!t.streamUrl)return!1;try{const e=(t.title||"Track").replace(/[/\\?%*:|"<>]/g,""),i=`${(t.artist||"Listen-X").replace(/[/\\?%*:|"<>]/g,"")} - ${e}.mp4`,a=document.createElement("a");return a.href=t.streamUrl,a.download=i,a.target="_blank",document.body.appendChild(a),a.click(),document.body.removeChild(a),!0}catch(e){return console.error("Download failed:",e),!1}}}const o=new D,P=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],R=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],U=[1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1],q=[58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6,64,56,48,40,32,24,16,8,57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7],O=[40,8,48,16,56,24,64,32,39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25],G=[32,1,2,3,4,5,4,5,6,7,8,9,8,9,10,11,12,13,12,13,14,15,16,17,16,17,18,19,20,21,20,21,22,23,24,25,24,25,26,27,28,29,28,29,30,31,32,1],Q=[16,7,20,21,29,12,28,17,1,15,23,26,5,18,31,10,2,8,24,14,32,27,3,9,19,13,30,6,22,11,4,25],j=[[14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],[15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],[10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],[7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],[2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],[12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],[4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],[13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]];function L(h,t){const e=t-1>>3,s=7-(t-1&7);return h[e]>>s&1}function z(h){let t=0,e=0;for(let i=0;i<28;i++)t=t<<1|L(h,P[i]);for(let i=28;i<56;i++)e=e<<1|L(h,P[i]);const s=[];for(let i=0;i<16;i++){const a=U[i];t=(t<<a|t>>>28-a)&268435455,e=(e<<a|e>>>28-a)&268435455;const n=[t>>>20&255,t>>>12&255,t>>>4&255,(t&15)<<4|e>>>24&15,e>>>16&255,e>>>8&255,e&255],l=new Uint8Array(6);for(let r=0;r<48;r++){const c=L(n,R[r]);l[r>>3]|=c<<7-(r&7)}s.push(l)}return s}function J(h,t,e){let s=0,i=0;for(let l=0;l<32;l++)s=s<<1|L(h,q[l]),i=i<<1|L(h,q[l+32]);for(let l=0;l<16;l++){const r=t[15-l],c=[i>>>24&255,i>>>16&255,i>>>8&255,i&255],u=new Uint8Array(6);for(let m=0;m<48;m++){const v=L(c,G[m]);u[m>>3]|=v<<7-(m&7)}for(let m=0;m<6;m++)u[m]^=r[m];let g=0;for(let m=0;m<8;m++){const v=m*6,B=u[v>>3]>>7-(v&7)&1,w=u[v+1>>3]>>7-(v+1&7)&1,T=u[v+2>>3]>>7-(v+2&7)&1,f=u[v+3>>3]>>7-(v+3&7)&1,x=u[v+4>>3]>>7-(v+4&7)&1,_=u[v+5>>3]>>7-(v+5&7)&1,M=B<<1|_,$=w<<3|T<<2|f<<1|x,H=j[m][M*16+$];g=g<<4|H}const y=[g>>>24&255,g>>>16&255,g>>>8&255,g&255];let b=0;for(let m=0;m<32;m++)b=b<<1|L(y,Q[m]);const E=(s^b)>>>0;s=i,i=E}const a=[i>>>24&255,i>>>16&255,i>>>8&255,i&255,s>>>24&255,s>>>16&255,s>>>8&255,s&255],n=new Uint8Array(8);for(let l=0;l<64;l++){const r=L(a,O[l]);n[l>>3]|=r<<7-(l&7)}return n}function W(h){if(typeof Buffer<"u")return new Uint8Array(Buffer.from(h.trim(),"base64"));const t=atob(h.trim()),e=t.length,s=new Uint8Array(e);for(let i=0;i<e;i++)s[i]=t.charCodeAt(i);return s}const K=new Uint8Array([51,56,51,52,54,53,57,49]),Y=z(K),X=/_(96|160|320)\.mp4/g;function Z(h){if(!h||typeof h!="string")return null;try{const t=W(h);if(!t||t.length===0||t.length%8!==0)return null;const e=[];for(let a=0;a<t.length;a+=8){const n=t.subarray(a,a+8),l=J(n,Y,!0);for(let r of l)e.push(r)}const s=e[e.length-1];return s>=1&&s<=8&&e.splice(e.length-s,s),new TextDecoder("utf-8").decode(new Uint8Array(e)).trim()}catch(t){return console.error("DES decryption error:",t),null}}function tt(h,t="320"){const e=Z(h);if(!e)return null;const s=t==="160"?"_160.mp4":t==="96"?"_96.mp4":"_320.mp4";return e.replace(X,s)}class I{static parseLrc(t){if(!t||typeof t!="string")return[];const e=t.split(/\r?\n/),s=[],i=/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;for(let a of e){const n=a.trim();if(!n)continue;const l=[...n.matchAll(i)];if(l.length>0){const r=n.replace(i,"").trim();for(let c of l){const u=parseInt(c[1],10),g=parseInt(c[2],10);let y=0;c[3]&&(y=c[3].length===2?parseInt(c[3],10)*10:parseInt(c[3].padEnd(3,"0").slice(0,3),10));const b=(u*60+g)*1e3+y;s.push({timestampMs:b,text:r})}}}return s.sort((a,n)=>a.timestampMs-n.timestampMs),s}static parsePlainText(t){return!t||typeof t!="string"?[]:t.split(/\r?\n/).map(e=>e.trim()).filter(e=>e.length>0).map(e=>({timestampMs:-1,text:e}))}static getActiveLineIndex(t,e){if(!t||t.length===0)return-1;let s=0,i=t.length-1,a=-1;for(;s<=i;){const n=Math.floor((s+i)/2);t[n].timestampMs<=e?(a=n,s=n+1):i=n-1}return a}}class et{constructor(){this.corsProxies=[t=>`/api/proxy?url=${encodeURIComponent(t)}`,t=>`https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,t=>`https://corsproxy.io/?url=${encodeURIComponent(t)}`],this.memoryCache=new Map}async fetchWithProxyFallback(t,e={}){try{const s=await fetch(t,{...e,mode:"cors"});if(s.ok)return await s.text()}catch{}for(const s of this.corsProxies)try{const i=s(t),a=await fetch(i,{...e});if(a.ok)return await a.text()}catch{}return null}cleanHtml(t){if(!t)return"";const e=document.createElement("textarea");return e.innerHTML=t,e.value.replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim()}parseSongObject(t,e=1){try{const s=t.encrypted_media_url||"",i=tt(s,"320"),a=t.media_preview_url||"";let n=i||a;if(!n)return null;const l=t.song||t.title||"Unknown Title",r=t.singers||t.primary_artists||"Unknown Artist",c=t.album||"Single",u=t.image||"",g=this.cleanHtml(l),y=this.cleanHtml(r),b=this.cleanHtml(c),E=u?u.replace("150x150","500x500"):"",m=parseInt(t.duration||"0",10)||0;return{id:"online_"+(t.id||Math.random().toString(36).substring(2,9)),rawId:t.id||"",title:g,artist:y,album:b,durationMs:m*1e3,streamUrl:n,artworkUri:E||"assets/favicon.svg",mimeType:"audio/mp4",trackNumber:e,isOnline:!0,encryptedMediaUrl:s}}catch(s){return console.error("Error parsing song object:",s),null}}async searchSongs(t,e=30,s=1){const i=t.trim();if(!i)return[];const a=`search_${i.toLowerCase()}_${e}_${s}`;if(this.memoryCache.has(a))return this.memoryCache.get(a);try{const n=encodeURIComponent(i),l=`https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&n=${e}&p=${s}&q=${n}`,r=await this.fetchWithProxyFallback(l);if(!r)return[];const u=JSON.parse(r).results||[],g=[];for(let y=0;y<u.length;y++){const b=this.parseSongObject(u[y],(s-1)*e+y+1);b&&g.push(b)}return this.memoryCache.set(a,g),g}catch(n){return console.error("Search API error:",n),[]}}async getTrendingSongs(t="Trending",e=1,s=0){const i=["masoom sharma hits","gulzaar chhaniwala hits","renuka panwar hits","amit saini rohtakiya hits","kd desi rock songs","diler kharkiya hits","sapna choudhary dance hits","khasa aala chahar songs","ajay hooda haryanvi","sumit goswami songs","52 gaj ka daman","bahu kale ki","haryanvi top 50","haryanvi viral reel songs","desi records haryanvi","bintu pabra kp kundu"],a=["latest bollywood songs 2026","arijit singh romantic hits","shreya ghoshal superhits","atif aslam soulful hits","bollywood dance party","jubin nautiyal hits","bollywood top 50 chartbusters","bollywood 90s golden hits","pritam musical hits","badshah party anthems","yo yo honey singh hits"],n=["sidhu moosewala immortal hits","karan aujla superhits","diljit dosanjh chartbusters","ap dhillon brown munde","shubh still rollin hits","punjabi top 50 2026","amrit maan hits","b praak soulful hits","jass manak hits","latest punjabi songs"],l=["billboard hot 100","international pop hits 2026","viral english pop","taylor swift hits","ed sheeran acoustic","the weeknd top hits","dua lipa dance pop"],r=["lofi chill hindi","bollywood lofi mix","night vibes lofi","punjabi lofi chill","aesthetic midnight lofi","rainy day lofi hindi"],c=d.getSettings().musicTaste||{};let u;switch(t.toLowerCase()){case"haryanvi":u=i;break;case"bollywood":u=a;break;case"punjabi":u=n;break;case"pop":u=l;break;case"lofi":u=r;break;default:{const f=["trending songs hindi 2026","latest bollywood songs","viral hits india","top hindi songs","party hits hindi","masoom sharma hits","karan aujla hits","arijit singh songs","sidhu moosewala hits"];c.singers&&c.singers.length>0&&c.singers.forEach(x=>f.unshift(`${x} top hits`)),c.languages&&c.languages.length>0&&c.languages.forEach(x=>f.push(`top ${x} songs`)),u=f;break}}const g=u.length,y=Math.abs(s*7+(e-1)*2)%g,b=u[y],E=u[(y+1)%g],[m,v]=await Promise.all([this.searchSongs(b,20,1),this.searchSongs(E,20,1)]),B=[],w=new Set,T=Math.max(m.length,v.length);for(let f=0;f<T;f++)f<m.length&&!w.has(m[f].id)&&(w.add(m[f].id),B.push(m[f])),f<v.length&&!w.has(v[f].id)&&(w.add(v[f].id),B.push(v[f]));return B}async getLyrics(t){if(!t)return null;const e=t.title.replace(/\(.*?\)|\[.*?\]/g,"").trim(),s=t.artist.split(/[,&/]/)[0].trim(),i=Math.round((t.durationMs||0)/1e3);try{const a=`https://lrclib.net/api/get?track_name=${encodeURIComponent(e)}&artist_name=${encodeURIComponent(s)}`+(i>10?`&duration=${i}`:""),n=await fetch(a);if(n.ok){const l=await n.json();if(l.syncedLyrics){const r=I.parseLrc(l.syncedLyrics);if(r.length>0)return{isSynced:!0,lines:r,plainText:l.plainLyrics||r.map(c=>c.text).join(`
`),source:"LRCLIB Synced"}}else if(l.plainLyrics)return{isSynced:!1,lines:I.parsePlainText(l.plainLyrics),plainText:l.plainLyrics,source:"LRCLIB Plain"}}}catch{}try{const a=t.rawId||(t.id.startsWith("online_")?t.id.replace("online_",""):null);if(a){const n=`https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&lyrics_id=${a}&ctx=web6dot0&api_version=4&_format=json`,l=await this.fetchWithProxyFallback(n);if(l){const r=JSON.parse(l);if(r&&r.lyrics){const c=this.cleanHtml(r.lyrics).replace(/<br\s*\/?>/gi,`
`);return{isSynced:!1,lines:I.parsePlainText(c),plainText:c,source:"JioSaavn Official"}}}}}catch(a){console.warn("Lyrics fallback failed:",a)}return null}async getLaptopSongs(t="http://localhost:8080"){try{const e=t.replace(/\/+$/,""),s=await fetch(`${e}/api/songs`);if(s.ok)return(await s.json()).map(a=>({id:a.id,title:a.title,artist:a.artist,album:a.album,durationMs:a.durationMs||18e4,streamUrl:a.streamUrl,artworkUri:a.artworkUri,mimeType:a.mimeType||"audio/mpeg",isLaptop:!0}))}catch(e){console.warn("Could not connect to laptop server:",e)}return[]}}const C=new et;class F{constructor(t,e={}){this.canvas=t,this.canvas&&(this.ctx=this.canvas.getContext("2d"),this.options={barCount:e.barCount||32,barSpacing:e.barSpacing||3,glowColor:e.glowColor||"#00F0FF",secondaryColor:e.secondaryColor||"#8A2BE2",type:e.type||"bars",...e},this.dataArray=new Uint8Array(64),this.animationId=null,this._bindResize(),this.start())}_bindResize(){const t=()=>{this.canvas&&(this.width=this.canvas.clientWidth||300,this.height=this.canvas.clientHeight||60,this.canvas.width=this.width*window.devicePixelRatio,this.canvas.height=this.height*window.devicePixelRatio,this.ctx.scale(window.devicePixelRatio,window.devicePixelRatio))};window.addEventListener("resize",t),setTimeout(t,50)}start(){if(this.animationId)return;const t=()=>{this.render(),this.animationId=requestAnimationFrame(t)};this.animationId=requestAnimationFrame(t)}stop(){this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null)}render(){if(!(!this.ctx||!this.width)){if(this.ctx.clearRect(0,0,this.width,this.height),o.isPlaying)o.getFrequencyData(this.dataArray);else{const t=Date.now()*.003;for(let e=0;e<this.dataArray.length;e++)this.dataArray[e]=Math.sin(t+e*.2)*12+16}this.options.type==="mini"?this._renderMiniBars():this.options.type==="wave"?this._renderWave():this._renderBars()}}_renderBars(){const t=this.options.barCount,e=this.options.barSpacing,s=e*(t-1),i=Math.max(2,(this.width-s)/t);for(let a=0;a<t;a++){const n=this.dataArray[a%this.dataArray.length]/255,l=Math.max(3,n*(this.height-4)),r=a*(i+e),c=this.height-l,u=this.ctx.createLinearGradient(0,c,0,this.height);u.addColorStop(0,"#00F0FF"),u.addColorStop(.6,"#8A2BE2"),u.addColorStop(1,"#FF007F"),this.ctx.fillStyle=u,this.ctx.shadowBlur=o.isPlaying?8:2,this.ctx.shadowColor="#00F0FF",this.ctx.beginPath();const g=Math.min(2,i/2);this.ctx.roundRect?this.ctx.roundRect(r,c,i,l,[g,g,0,0]):this.ctx.rect(r,c,i,l),this.ctx.fill()}this.ctx.shadowBlur=0}_renderMiniBars(){for(let i=0;i<4;i++){const a=o.isPlaying?this.dataArray[i*4]/255:.2,n=Math.max(4,a*(this.height-2)),l=i*5,r=(this.height-n)/2;this.ctx.fillStyle="#00F0FF",this.ctx.fillRect(l,r,3,n)}}_renderWave(){const e=this.width/32;this.ctx.beginPath(),this.ctx.lineWidth=2.5,this.ctx.strokeStyle="#00F0FF",this.ctx.shadowBlur=10,this.ctx.shadowColor="#00F0FF";let s=0;for(let i=0;i<32;i++){const a=this.dataArray[i%this.dataArray.length]/255,n=this.height/2+(a-.5)*(this.height*.8);i===0?this.ctx.moveTo(s,n):this.ctx.lineTo(s,n),s+=e}this.ctx.stroke(),this.ctx.shadowBlur=0}}class st{constructor(){this.isExpanded=!1,this.activeTab="art",this.currentLyrics=null,this.activeLyricIndex=-1,this.isUserScrollingLyrics=!1,this.userScrollTimeout=null,this._createDOM(),this._bindEvents()}_createDOM(){this.miniPlayer=document.createElement("div"),this.miniPlayer.className="floating-mini-player hidden",this.miniPlayer.innerHTML=`
      <div class="mini-progress-bar"><div class="mini-progress-fill" id="miniProgressFill"></div></div>
      <div class="mini-content">
        <div class="mini-art-wrapper">
          <img class="mini-art" id="miniArt" src="assets/favicon.svg" alt="Cover" />
          <div class="mini-live-wave"><canvas id="miniWaveCanvas" width="24" height="16"></canvas></div>
        </div>
        <div class="mini-info">
          <div class="mini-title" id="miniTitle">Select a track</div>
          <div class="mini-artist" id="miniArtist">Listen-X Player</div>
        </div>
        <div class="mini-controls">
          <button class="icon-btn mini-fav-btn" id="miniFavBtn" title="Favorite">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="icon-btn mini-play-btn" id="miniPlayBtn" title="Play/Pause">
            <i class="fa-solid fa-play"></i>
          </button>
          <button class="icon-btn mini-next-btn" id="miniNextBtn" title="Next">
            <i class="fa-solid fa-forward-step"></i>
          </button>
        </div>
      </div>
    `,document.body.appendChild(this.miniPlayer),this.sheet=document.createElement("div"),this.sheet.className="now-playing-sheet hidden",this.sheet.innerHTML=`
      <div class="sheet-scrim"></div>
      <div class="sheet-container">
        <!-- Top Navigation -->
        <div class="sheet-header">
          <button class="icon-btn sheet-down-btn" id="sheetDownBtn" title="Minimize">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="sheet-header-title">
            <span>NOW PLAYING</span>
            <small id="sheetHeaderQuality">320 KBPS HI-FI</small>
          </div>
          <div class="sheet-tab-buttons">
            <button class="sheet-tab-btn active" id="tabArtBtn" title="Album Art"><i class="fa-solid fa-compact-disc"></i></button>
            <button class="sheet-tab-btn" id="tabLyricsBtn" title="Live Lyrics"><i class="fa-solid fa-align-left"></i></button>
            <button class="sheet-tab-btn" id="tabQueueBtn" title="Up Next Queue"><i class="fa-solid fa-list-ul"></i></button>
          </div>
        </div>

        <!-- Sheet Body Views -->
        <div class="sheet-body">
          <!-- View 1: Vinyl Art -->
          <div class="sheet-view sheet-view-art active" id="viewArt">
            <div class="vinyl-container">
              <div class="vinyl-ambient-glow" id="vinylGlow"></div>
              <div class="vinyl-disc" id="vinylDisc">
                <div class="vinyl-grooves"></div>
                <img class="vinyl-art" id="sheetArt" src="assets/favicon.svg" alt="Album Art" />
                <div class="vinyl-center-hole"></div>
              </div>
            </div>
            <div class="track-meta">
              <div class="track-title-wrapper">
                <h2 class="sheet-track-title" id="sheetTitle">No Song Selected</h2>
                <button class="icon-btn sheet-fav-btn" id="sheetFavBtn" title="Favorite">
                  <i class="fa-regular fa-heart"></i>
                </button>
              </div>
              <p class="sheet-track-artist" id="sheetArtist">Listen-X Universal Streamer</p>
              <p class="sheet-track-album" id="sheetAlbum">Online</p>
            </div>
          </div>

          <!-- View 2: Lyrics Panel -->
          <div class="sheet-view sheet-view-lyrics" id="viewLyrics">
            <div class="lyrics-toolbar">
              <span class="lyrics-source" id="lyricsSource">LRCLIB Synced</span>
              <button class="glass-pill-btn" id="copyLyricsBtn"><i class="fa-regular fa-copy"></i> Copy</button>
            </div>
            <div class="lyrics-scroll-container" id="lyricsContainer">
              <div class="lyrics-placeholder">Loading synced lyrics...</div>
            </div>
          </div>

          <!-- View 3: Up Next Queue -->
          <div class="sheet-view sheet-view-queue" id="viewQueue">
            <div class="queue-toolbar">
              <span class="queue-count" id="queueCount">Queue (0 tracks)</span>
              <div class="queue-actions">
                <button class="glass-pill-btn" id="queueShuffleBtn"><i class="fa-solid fa-shuffle"></i> Shuffle</button>
                <button class="glass-pill-btn" id="queueClearBtn"><i class="fa-solid fa-trash-can"></i> Clear</button>
              </div>
            </div>
            <div class="queue-list" id="queueList"></div>
          </div>
        </div>

        <!-- Visualizer Bar -->
        <div class="sheet-visualizer">
          <canvas id="sheetVisualizerCanvas" height="36"></canvas>
        </div>

        <!-- Progress Scrubber -->
        <div class="sheet-scrubber">
          <input type="range" class="sheet-slider" id="sheetProgressSlider" min="0" max="100" value="0" step="0.1" />
          <div class="sheet-time-labels">
            <span id="sheetTimeCurrent">0:00</span>
            <span id="sheetTimeTotal">0:00</span>
          </div>
        </div>

        <!-- Main Controls -->
        <div class="sheet-controls">
          <button class="icon-btn sheet-control-btn" id="sheetShuffleBtn" title="Shuffle">
            <i class="fa-solid fa-shuffle"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetPrevBtn" title="Previous">
            <i class="fa-solid fa-backward-step"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetRewind10Btn" title="Rewind 10s">
            <i class="fa-solid fa-rotate-left"></i>
          </button>
          <button class="sheet-main-play-btn" id="sheetPlayBtn" title="Play/Pause">
            <i class="fa-solid fa-play"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetForward10Btn" title="Forward 10s">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetNextBtn" title="Next">
            <i class="fa-solid fa-forward-step"></i>
          </button>
          <button class="icon-btn sheet-control-btn" id="sheetLoopBtn" title="Loop Mode">
            <i class="fa-solid fa-repeat"></i>
          </button>
        </div>

        <!-- Bottom Utility Toolbar -->
        <div class="sheet-bottom-bar">
          <!-- Volume -->
          <div class="sheet-volume-wrapper">
            <button class="icon-btn sheet-mute-btn" id="sheetMuteBtn" title="Mute/Unmute">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            <input type="range" class="sheet-slider volume-slider" id="sheetVolumeSlider" min="0" max="1" step="0.01" value="0.85" />
          </div>

          <!-- DSP Tools -->
          <div class="sheet-dsp-tools">
            <button class="glass-pill-btn dsp-btn" id="sheetVocalBtn" title="Karaoke Vocal Remover">
              <i class="fa-solid fa-microphone-slash"></i> Vocal
            </button>
            <button class="glass-pill-btn dsp-btn" id="sheetSpeedBtn" title="Playback Speed">
              <span id="speedLabel">1.0x</span>
            </button>
            <button class="glass-pill-btn dsp-btn" id="sheetEqBtn" title="6-Band Equalizer">
              <i class="fa-solid fa-sliders"></i> EQ
            </button>
            <button class="glass-pill-btn dsp-btn" id="sheetDownloadBtn" title="Download Song">
              <i class="fa-solid fa-download"></i>
            </button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.sheet)}_bindEvents(){this.miniPlayer.querySelector(".mini-content").addEventListener("click",a=>{a.target.closest("button")||this.open()}),document.getElementById("miniPlayBtn").addEventListener("click",()=>o.togglePlay()),document.getElementById("miniNextBtn").addEventListener("click",()=>o.playNext()),document.getElementById("miniFavBtn").addEventListener("click",()=>this._toggleFavCurrent()),document.getElementById("sheetDownBtn").addEventListener("click",()=>this.close()),this.sheet.querySelector(".sheet-scrim").addEventListener("click",()=>this.close()),document.getElementById("tabArtBtn").addEventListener("click",()=>this.switchTab("art")),document.getElementById("tabLyricsBtn").addEventListener("click",()=>this.switchTab("lyrics")),document.getElementById("tabQueueBtn").addEventListener("click",()=>this.switchTab("queue")),document.getElementById("sheetPlayBtn").addEventListener("click",()=>o.togglePlay()),document.getElementById("sheetNextBtn").addEventListener("click",()=>o.playNext()),document.getElementById("sheetPrevBtn").addEventListener("click",()=>o.playPrevious()),document.getElementById("sheetRewind10Btn").addEventListener("click",()=>{o.seek(Math.max(0,o.activeAudio.currentTime-10))}),document.getElementById("sheetForward10Btn").addEventListener("click",()=>{o.seek(o.activeAudio.currentTime+10)}),document.getElementById("sheetShuffleBtn").addEventListener("click",()=>{o.shuffleQueue()}),document.getElementById("sheetLoopBtn").addEventListener("click",()=>{const a=o.toggleLoopMode();this._updateLoopButton(a)}),document.getElementById("sheetFavBtn").addEventListener("click",()=>this._toggleFavCurrent());const t=document.getElementById("sheetProgressSlider");t.addEventListener("input",()=>{const a=o.activeAudio.duration||0,n=t.value/100*a;document.getElementById("sheetTimeCurrent").textContent=this._formatTime(n)}),t.addEventListener("change",()=>{const a=o.activeAudio.duration||0,n=t.value/100*a;o.seek(n)});const e=document.getElementById("sheetVolumeSlider");e.value=o.getVolume(),e.addEventListener("input",a=>{o.setVolume(parseFloat(a.target.value)),this._updateVolumeIcon(parseFloat(a.target.value))}),document.getElementById("sheetMuteBtn").addEventListener("click",()=>{const a=o.getVolume();if(a>0)this._preMuteVol=a,o.setVolume(0),e.value=0,this._updateVolumeIcon(0);else{const n=this._preMuteVol||.85;o.setVolume(n),e.value=n,this._updateVolumeIcon(n)}});const s=[.75,1,1.25,1.5,2];document.getElementById("sheetSpeedBtn").addEventListener("click",()=>{const a=o.playbackSpeed,n=(s.indexOf(a)+1)%s.length,l=s[n];o.setPlaybackSpeed(l),document.getElementById("speedLabel").textContent=`${l}x`}),document.getElementById("sheetVocalBtn").addEventListener("click",()=>{const a=o.toggleVocalRemover();document.getElementById("sheetVocalBtn").classList.toggle("active",a)}),document.getElementById("sheetEqBtn").addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("open-equalizer-modal"))}),document.getElementById("sheetDownloadBtn").addEventListener("click",()=>{const a=o.getCurrentSong();a&&o.downloadSong(a)}),document.getElementById("copyLyricsBtn").addEventListener("click",()=>{this.currentLyrics&&this.currentLyrics.plainText&&navigator.clipboard.writeText(this.currentLyrics.plainText).then(()=>{const a=document.getElementById("copyLyricsBtn");a.innerHTML='<i class="fa-solid fa-check"></i> Copied!',setTimeout(()=>{a.innerHTML='<i class="fa-regular fa-copy"></i> Copy'},2e3)})}),document.getElementById("queueShuffleBtn").addEventListener("click",()=>o.shuffleQueue()),document.getElementById("queueClearBtn").addEventListener("click",()=>o.clearQueue());const i=document.getElementById("lyricsContainer");i.addEventListener("wheel",()=>this._handleUserLyricsScroll()),i.addEventListener("touchmove",()=>this._handleUserLyricsScroll()),this.miniVisualizer=new F(document.getElementById("miniWaveCanvas"),{type:"mini"}),this.sheetVisualizer=new F(document.getElementById("sheetVisualizerCanvas"),{type:"bars",barCount:40}),o.subscribe((a,n)=>this._onPlayerEvent(a,n))}_handleUserLyricsScroll(){this.isUserScrollingLyrics=!0,clearTimeout(this.userScrollTimeout),this.userScrollTimeout=setTimeout(()=>{this.isUserScrollingLyrics=!1},3500)}_toggleFavCurrent(){const t=o.getCurrentSong();if(!t)return;const e=d.toggleFavorite(t);this._updateFavButton(e),window.dispatchEvent(new CustomEvent("favorites-changed"))}_updateFavButton(t){const e=document.getElementById("miniFavBtn"),s=document.getElementById("sheetFavBtn"),i=t?"fa-solid fa-heart active-heart":"fa-regular fa-heart";e.innerHTML=`<i class="${i}"></i>`,s.innerHTML=`<i class="${i}"></i>`}_updateLoopButton(t){const e=document.getElementById("sheetLoopBtn");t===S.ALL?(e.className="icon-btn sheet-control-btn active",e.innerHTML='<i class="fa-solid fa-repeat"></i>'):t===S.ONE?(e.className="icon-btn sheet-control-btn active",e.innerHTML='<i class="fa-solid fa-repeat"></i><span class="loop-one-badge">1</span>'):(e.className="icon-btn sheet-control-btn",e.innerHTML='<i class="fa-solid fa-repeat"></i>')}_updateVolumeIcon(t){const e=document.getElementById("sheetMuteBtn").querySelector("i");t<=0?e.className="fa-solid fa-volume-xmark":t<.5?e.className="fa-solid fa-volume-low":e.className="fa-solid fa-volume-high"}_onPlayerEvent(t,e){switch(t){case"songChanged":this._updateTrackInfo(e.song),this._loadLyrics(e.song),this._renderQueue(),this.miniPlayer.classList.remove("hidden");break;case"playStateChanged":this._updatePlayButtons(e.isPlaying);break;case"timeUpdate":this._updateProgress(e.currentTime,e.duration),this._updateActiveLyric(e.currentTime*1e3);break;case"queueChanged":this._renderQueue();break}}_updateTrackInfo(t){if(!t)return;const e=d.isFavorite(t.id);this._updateFavButton(e),document.getElementById("miniTitle").textContent=t.title,document.getElementById("miniArtist").textContent=t.artist,document.getElementById("miniArt").src=t.artworkUri||"assets/favicon.svg",document.getElementById("sheetTitle").textContent=t.title,document.getElementById("sheetArtist").textContent=t.artist,document.getElementById("sheetAlbum").textContent=t.album||"Single",document.getElementById("sheetArt").src=t.artworkUri||"assets/favicon.svg",document.getElementById("vinylGlow").style.backgroundImage="radial-gradient(circle, rgba(0, 240, 255, 0.45) 0%, rgba(138, 43, 226, 0.25) 50%, transparent 75%)"}_updatePlayButtons(t){const e=document.getElementById("miniPlayBtn").querySelector("i"),s=document.getElementById("sheetPlayBtn").querySelector("i"),i=document.getElementById("vinylDisc");t?(e.className="fa-solid fa-pause",s.className="fa-solid fa-pause",i.classList.add("playing")):(e.className="fa-solid fa-play",s.className="fa-solid fa-play",i.classList.remove("playing"))}_updateProgress(t,e){if(isNaN(e)||e<=0)return;const s=Math.min(100,Math.max(0,t/e*100));document.getElementById("miniProgressFill").style.width=`${s}%`;const i=document.getElementById("sheetProgressSlider");i.value=s,document.getElementById("sheetTimeCurrent").textContent=this._formatTime(t),document.getElementById("sheetTimeTotal").textContent=this._formatTime(e)}async _loadLyrics(t){const e=document.getElementById("lyricsContainer");e.innerHTML='<div class="lyrics-placeholder"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading synced lyrics...</div>',this.currentLyrics=null,this.activeLyricIndex=-1;const s=await C.getLyrics(t);if(this.currentLyrics=s,!s||!s.lines||s.lines.length===0){e.innerHTML='<div class="lyrics-placeholder">No lyrics available for this song.</div>',document.getElementById("lyricsSource").textContent="No Lyrics";return}document.getElementById("lyricsSource").textContent=s.source||(s.isSynced?"LRCLIB Synced":"Plain Text"),e.innerHTML="",s.lines.forEach((i,a)=>{const n=document.createElement("div");n.className=`lyric-line ${i.timestampMs<0?"plain-line":""}`,n.id=`lyricLine_${a}`,n.textContent=i.text,i.timestampMs>=0&&(n.title=`Jump to ${this._formatTime(i.timestampMs/1e3)}`,n.addEventListener("click",()=>{o.seek(i.timestampMs/1e3)})),e.appendChild(n)})}_updateActiveLyric(t){if(!this.currentLyrics||!this.currentLyrics.isSynced||!this.currentLyrics.lines)return;const e=I.getActiveLineIndex(this.currentLyrics.lines,t);if(e!==this.activeLyricIndex){if(this.activeLyricIndex>=0){const s=document.getElementById(`lyricLine_${this.activeLyricIndex}`);s&&s.classList.remove("active","past")}if(this.activeLyricIndex=e,e>=0){const s=document.getElementById(`lyricLine_${e}`);if(s&&(s.classList.add("active"),!this.isUserScrollingLyrics)){const i=document.getElementById("lyricsContainer"),a=s.offsetTop-i.clientHeight/2+s.clientHeight/2;i.scrollTo({top:Math.max(0,a),behavior:"smooth"})}}}}_renderQueue(){const t=document.getElementById("queueList"),e=document.getElementById("queueCount"),s=o.queue,i=o.currentIndex;if(e.textContent=`Queue (${s.length} tracks)`,t.innerHTML="",s.length===0){t.innerHTML='<div class="queue-empty">Queue is empty. Select songs to play.</div>';return}s.forEach((a,n)=>{const l=n===i,r=document.createElement("div");r.className=`queue-item ${l?"active-track":""}`,r.innerHTML=`
        <span class="queue-track-num">${l?'<i class="fa-solid fa-volume-high active-wave-icon"></i>':n+1}</span>
        <img class="queue-art" src="${a.artworkUri||"assets/favicon.svg"}" alt="art" />
        <div class="queue-meta">
          <div class="queue-title">${a.title}</div>
          <div class="queue-artist">${a.artist}</div>
        </div>
        <div class="queue-actions">
          <button class="icon-btn queue-play-btn" title="Play"><i class="fa-solid fa-play"></i></button>
          <button class="icon-btn queue-remove-btn" title="Remove"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `,r.querySelector(".queue-play-btn").addEventListener("click",c=>{c.stopPropagation(),o.setQueue(s,n)}),r.querySelector(".queue-remove-btn").addEventListener("click",c=>{c.stopPropagation(),o.removeFromQueue(n)}),r.addEventListener("click",()=>{o.setQueue(s,n)}),t.appendChild(r)})}switchTab(t){this.activeTab=t,document.getElementById("tabArtBtn").classList.toggle("active",t==="art"),document.getElementById("tabLyricsBtn").classList.toggle("active",t==="lyrics"),document.getElementById("tabQueueBtn").classList.toggle("active",t==="queue"),document.getElementById("viewArt").classList.toggle("active",t==="art"),document.getElementById("viewLyrics").classList.toggle("active",t==="lyrics"),document.getElementById("viewQueue").classList.toggle("active",t==="queue"),t==="lyrics"&&this.activeLyricIndex>=0&&setTimeout(()=>{const e=document.getElementById(`lyricLine_${this.activeLyricIndex}`),s=document.getElementById("lyricsContainer");e&&s&&s.scrollTo({top:e.offsetTop-s.clientHeight/2,behavior:"smooth"})},50)}open(){this.isExpanded=!0,this.sheet.classList.remove("hidden"),requestAnimationFrame(()=>this.sheet.classList.add("visible")),document.body.style.overflow="hidden"}close(){this.isExpanded=!1,this.sheet.classList.remove("visible"),setTimeout(()=>{this.sheet.classList.add("hidden"),document.body.style.overflow=""},300)}_formatTime(t){if(isNaN(t)||t<0)return"0:00";const e=Math.floor(t/60),s=Math.floor(t%60);return`${e}:${s.toString().padStart(2,"0")}`}}class it{constructor(t){this.container=document.getElementById(t),this.currentCategory="Trending",this.searchQuery="",this.songs=[],this.currentPage=1,this.isLoading=!1,this.hasMore=!0,this.refreshSeed=Math.floor(Math.random()*1e4),this.debounceTimer=null,this.artistPicks={Haryanvi:["Masoom Sharma","Gulzaar Chhaniwala","Renuka Panwar","Amit Saini Rohtakiya","KD Desi Rock","Diler Kharkiya","Sapna Choudhary","Khasa Aala Chahar","Ajay Hooda","Sumit Goswami"],Punjabi:["Sidhu Moosewala","Karan Aujla","Diljit Dosanjh","AP Dhillon","Shubh","Amrit Maan","B Praak","Jass Manak"],Bollywood:["Arijit Singh","Shreya Ghoshal","Atif Aslam","Jubin Nautiyal","Badshah","Kishore Kumar","Pritam"],Pop:["Taylor Swift","Ed Sheeran","The Weeknd","Dua Lipa","Justin Bieber"],Trending:["Masoom Sharma","Sidhu Moosewala","Arijit Singh","Karan Aujla","Gulzaar Chhaniwala","Shreya Ghoshal","Diljit Dosanjh"],LoFi:["Bollywood LoFi","Midnight LoFi","Rainy Day LoFi","Punjabi Chill LoFi"]},this._createDOM(),this._bindEvents(),this.loadSongs(!0)}_createDOM(){this.container.innerHTML=`
      <div class="online-screen">
        <!-- Top Search Bar -->
        <div class="search-bar-wrapper">
          <div class="search-input-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" class="search-input" id="onlineSearchInput" placeholder="Search songs, artists, Haryanvi, Punjabi, Bollywood..." />
            <button class="search-clear-btn hidden" id="searchClearBtn" title="Clear">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Quick Action Shortcuts -->
        <div class="quick-shortcuts-row">
          <div class="shortcut-card" id="shortcutLiked">
            <div class="shortcut-icon heart-glow"><i class="fa-solid fa-heart"></i></div>
            <div class="shortcut-meta">
              <span class="shortcut-title">Liked Songs</span>
              <small class="shortcut-sub" id="shortcutLikedCount">0 tracks</small>
            </div>
          </div>
          <div class="shortcut-card" id="shortcutHistory">
            <div class="shortcut-icon history-glow"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <div class="shortcut-meta">
              <span class="shortcut-title">Recent History</span>
              <small class="shortcut-sub">Played tracks</small>
            </div>
          </div>
          <div class="shortcut-card" id="shortcutLaptop">
            <div class="shortcut-icon laptop-glow"><i class="fa-solid fa-laptop"></i></div>
            <div class="shortcut-meta">
              <span class="shortcut-title">Laptop Stream</span>
              <small class="shortcut-sub">D:\\music Library</small>
            </div>
          </div>
          <div class="shortcut-card" id="shortcutLocal">
            <div class="shortcut-icon local-glow"><i class="fa-solid fa-folder-open"></i></div>
            <div class="shortcut-meta">
              <span class="shortcut-title">Pick Local Files</span>
              <small class="shortcut-sub">From your computer</small>
            </div>
          </div>
        </div>

        <!-- Category Filter Pills -->
        <div class="categories-row">
          <button class="category-pill active" data-cat="Trending"><i class="fa-solid fa-fire"></i> Trending</button>
          <button class="category-pill" data-cat="Haryanvi"><i class="fa-solid fa-bolt"></i> Haryanvi</button>
          <button class="category-pill" data-cat="Punjabi"><i class="fa-solid fa-music"></i> Punjabi</button>
          <button class="category-pill" data-cat="Bollywood"><i class="fa-solid fa-film"></i> Bollywood</button>
          <button class="category-pill" data-cat="Pop"><i class="fa-solid fa-globe"></i> Pop</button>
          <button class="category-pill" data-cat="LoFi"><i class="fa-solid fa-moon"></i> LoFi</button>
        </div>

        <!-- Artist Quick Picks -->
        <div class="artists-quick-row" id="artistsQuickRow"></div>

        <!-- Section Header with Shuffle & Sorting -->
        <div class="section-header-bar">
          <div class="section-title-group">
            <h3 class="section-title" id="sectionHeaderTitle">Trending Hits</h3>
            <span class="section-badge" id="sectionHeaderCount">0 Songs</span>
          </div>
          <div class="section-actions-group">
            <button class="glass-pill-btn" id="sectionShuffleBtn" title="In-place list shuffle">
              <i class="fa-solid fa-shuffle"></i> Shuffle Order
            </button>
            <div class="sort-dropdown-wrapper">
              <select class="sort-select" id="sortSelect">
                <option value="default">Default Order</option>
                <option value="title_asc">Title (A - Z)</option>
                <option value="title_desc">Title (Z - A)</option>
                <option value="artist">Artist Name</option>
                <option value="duration">Longest Track</option>
              </select>
            </div>
            <button class="icon-btn refresh-feed-btn" id="refreshFeedBtn" title="Refresh Feed">
              <i class="fa-solid fa-arrows-rotate"></i>
            </button>
          </div>
        </div>

        <!-- Song Cards Grid / List -->
        <div class="songs-grid" id="songsGrid">
          <div class="loading-shimmer-container">
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
          </div>
        </div>

        <!-- Load More Button -->
        <div class="load-more-row">
          <button class="glass-pill-btn load-more-btn" id="loadMoreBtn">
            <i class="fa-solid fa-plus"></i> Load More Songs
          </button>
        </div>
      </div>
    `}_bindEvents(){const t=document.getElementById("onlineSearchInput"),e=document.getElementById("searchClearBtn");t.addEventListener("input",s=>{const i=s.target.value.trim();e.classList.toggle("hidden",i.length===0),clearTimeout(this.debounceTimer),this.debounceTimer=setTimeout(()=>{this.searchQuery=i,this.currentPage=1,this.loadSongs(!0)},400)}),e.addEventListener("click",()=>{t.value="",this.searchQuery="",e.classList.add("hidden"),this.currentPage=1,this.loadSongs(!0)}),this.container.querySelectorAll(".category-pill").forEach(s=>{s.addEventListener("click",()=>{this.container.querySelectorAll(".category-pill").forEach(i=>i.classList.remove("active")),s.classList.add("active"),this.currentCategory=s.dataset.cat,t.value="",this.searchQuery="",e.classList.add("hidden"),this.currentPage=1,this._renderArtistPicks(),this.loadSongs(!0)})}),document.getElementById("sectionShuffleBtn").addEventListener("click",()=>{this.shuffleVisibleSongs()}),document.getElementById("sortSelect").addEventListener("change",s=>{this.sortVisibleSongs(s.target.value)}),document.getElementById("refreshFeedBtn").addEventListener("click",()=>{this.refreshSeed=Math.floor(Math.random()*1e4),this.currentPage=1;const s=document.getElementById("refreshFeedBtn").querySelector("i");s.classList.add("fa-spin"),this.loadSongs(!0).finally(()=>s.classList.remove("fa-spin"))}),document.getElementById("loadMoreBtn").addEventListener("click",()=>{this.isLoading||(this.currentPage++,this.loadSongs(!1))}),document.getElementById("shortcutLiked").addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("nav-tab-change",{detail:{tab:"playlists",sub:"liked"}}))}),document.getElementById("shortcutHistory").addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("nav-tab-change",{detail:{tab:"playlists",sub:"history"}}))}),document.getElementById("shortcutLaptop").addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("nav-tab-change",{detail:{tab:"playlists",sub:"laptop"}}))}),document.getElementById("shortcutLocal").addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("nav-tab-change",{detail:{tab:"playlists",sub:"local"}}))}),window.addEventListener("favorites-changed",()=>this._updateShortcutCounts()),o.subscribe(s=>{(s==="songChanged"||s==="playStateChanged")&&this._highlightActiveSong()}),this._renderArtistPicks(),this._updateShortcutCounts()}_updateShortcutCounts(){const t=d.getFavorites().length,e=document.getElementById("shortcutLikedCount");e&&(e.textContent=`${t} tracks`)}_renderArtistPicks(){const t=document.getElementById("artistsQuickRow"),e=this.artistPicks[this.currentCategory]||this.artistPicks.Trending;t.innerHTML="",e.forEach(s=>{const i=document.createElement("button");i.className="artist-pill",i.innerHTML=`<i class="fa-solid fa-microphone-lines"></i> ${s}`,i.addEventListener("click",()=>{document.getElementById("onlineSearchInput").value=s,document.getElementById("searchClearBtn").classList.remove("hidden"),this.searchQuery=s,this.currentPage=1,this.loadSongs(!0)}),t.appendChild(i)})}async loadSongs(t=!1){if(this.isLoading)return;this.isLoading=!0;const e=document.getElementById("songsGrid"),s=document.getElementById("loadMoreBtn"),i=document.getElementById("sectionHeaderTitle");t&&(e.innerHTML=`
        <div class="loading-shimmer-container">
          <div class="shimmer-card"></div>
          <div class="shimmer-card"></div>
          <div class="shimmer-card"></div>
          <div class="shimmer-card"></div>
        </div>
      `),s.innerHTML='<i class="fa-solid fa-circle-notch fa-spin"></i> Loading...';let a=[];if(this.searchQuery.trim()?(i.textContent=`Search: "${this.searchQuery}"`,a=await C.searchSongs(this.searchQuery,30,this.currentPage)):(i.textContent=`${this.currentCategory} Hits`,a=await C.getTrendingSongs(this.currentCategory,this.currentPage,this.refreshSeed)),t)this.songs=a;else{const n=new Set(this.songs.map(l=>l.id));for(let l of a)n.has(l.id)||(this.songs.push(l),n.add(l.id))}this.isLoading=!1,s.innerHTML='<i class="fa-solid fa-plus"></i> Load More Songs',document.getElementById("sectionHeaderCount").textContent=`${this.songs.length} Songs`,this._renderSongsGrid()}_renderSongsGrid(){const t=document.getElementById("songsGrid");if(t.innerHTML="",this.songs.length===0){t.innerHTML=`
        <div class="empty-results-box">
          <i class="fa-solid fa-compact-disc empty-icon"></i>
          <h4>No songs found</h4>
          <p>Try searching for a different track, artist, or category</p>
        </div>
      `;return}const e=o.getCurrentSong();this.songs.forEach((s,i)=>{const a=e&&e.id===s.id,n=d.isFavorite(s.id),l=document.createElement("div");l.className=`song-card ${a?"active-playing-card":""}`,l.dataset.id=s.id,l.innerHTML=`
        <div class="song-card-art-box">
          <img class="song-card-art" src="${s.artworkUri||"assets/favicon.svg"}" alt="${s.title}" loading="lazy" />
          <div class="song-card-play-overlay">
            <button class="card-play-btn" title="Play">
              <i class="fa-solid ${a&&o.isPlaying?"fa-pause":"fa-play"}"></i>
            </button>
          </div>
          ${a?'<div class="card-wave-indicator"><span class="bar b1"></span><span class="bar b2"></span><span class="bar b3"></span></div>':""}
        </div>
        <div class="song-card-info">
          <div class="song-card-title" title="${s.title}">${s.title}</div>
          <div class="song-card-artist" title="${s.artist}">${s.artist}</div>
          <div class="song-card-meta">
            <span class="badge-quality">320K</span>
            <span class="song-duration">${this._formatDuration(s.durationMs)}</span>
          </div>
        </div>
        <div class="song-card-actions">
          <button class="icon-btn card-fav-btn ${n?"active-heart":""}" title="Favorite">
            <i class="fa-${n?"solid":"regular"} fa-heart"></i>
          </button>
          <button class="icon-btn card-download-btn" title="Download Audio">
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="icon-btn card-menu-btn" title="Options">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </div>
      `,l.addEventListener("click",c=>{c.target.closest("button")||o.setQueue(this.songs,i)}),l.querySelector(".card-play-btn").addEventListener("click",c=>{c.stopPropagation(),a?o.togglePlay():o.setQueue(this.songs,i)});const r=l.querySelector(".card-fav-btn");r.addEventListener("click",c=>{c.stopPropagation();const u=d.toggleFavorite(s);r.classList.toggle("active-heart",u),r.innerHTML=`<i class="fa-${u?"solid":"regular"} fa-heart"></i>`,this._updateShortcutCounts(),window.dispatchEvent(new CustomEvent("favorites-changed"))}),l.querySelector(".card-download-btn").addEventListener("click",c=>{c.stopPropagation(),o.downloadSong(s)}),l.querySelector(".card-menu-btn").addEventListener("click",c=>{c.stopPropagation(),this._openSongMenu(s,c)}),t.appendChild(l)})}_highlightActiveSong(){const t=o.getCurrentSong();document.querySelectorAll(".song-card").forEach(e=>{const s=t&&e.dataset.id===t.id;e.classList.toggle("active-playing-card",s);const i=e.querySelector(".card-play-btn i");i&&(i.className=`fa-solid ${s&&o.isPlaying?"fa-pause":"fa-play"}`)})}shuffleVisibleSongs(){if(!(this.songs.length<=1)){for(let t=this.songs.length-1;t>0;t--){const e=Math.floor(Math.random()*(t+1));[this.songs[t],this.songs[e]]=[this.songs[e],this.songs[t]]}this._renderSongsGrid()}}sortVisibleSongs(t){t==="title_asc"?this.songs.sort((e,s)=>e.title.localeCompare(s.title)):t==="title_desc"?this.songs.sort((e,s)=>s.title.localeCompare(e.title)):t==="artist"?this.songs.sort((e,s)=>e.artist.localeCompare(s.artist)):t==="duration"&&this.songs.sort((e,s)=>(s.durationMs||0)-(e.durationMs||0)),this._renderSongsGrid()}_openSongMenu(t,e){const s=document.getElementById("floatingSongMenu");s&&s.remove();const i=document.createElement("div");i.id="floatingSongMenu",i.className="floating-context-menu";const a=d.isFavorite(t.id);i.innerHTML=`
      <div class="menu-item" id="mPlayNext"><i class="fa-solid fa-forward-step"></i> Play Next</div>
      <div class="menu-item" id="mAddToQueue"><i class="fa-solid fa-list-ul"></i> Add to Queue</div>
      <div class="menu-item" id="mAddToPlaylist"><i class="fa-solid fa-folder-plus"></i> Add to Playlist</div>
      <div class="menu-item" id="mToggleFav"><i class="fa-${a?"solid":"regular"} fa-heart"></i> ${a?"Remove Favorite":"Save to Favorites"}</div>
      <div class="menu-item" id="mDownload"><i class="fa-solid fa-download"></i> Download Track</div>
      <div class="menu-item" id="mDetails"><i class="fa-solid fa-circle-info"></i> Track Details</div>
    `;const n=e.target.getBoundingClientRect();i.style.top=`${Math.min(window.innerHeight-250,n.bottom+8)}px`,i.style.left=`${Math.max(16,n.left-160)}px`,document.body.appendChild(i);const l=r=>{i.contains(r.target)||(i.remove(),document.removeEventListener("click",l))};setTimeout(()=>document.addEventListener("click",l),50),i.querySelector("#mPlayNext").addEventListener("click",()=>{o.playNextInQueue(t),i.remove()}),i.querySelector("#mAddToQueue").addEventListener("click",()=>{o.addToQueue(t),i.remove()}),i.querySelector("#mAddToPlaylist").addEventListener("click",()=>{i.remove(),this._openAddToPlaylistDialog(t)}),i.querySelector("#mToggleFav").addEventListener("click",()=>{d.toggleFavorite(t),this._updateShortcutCounts(),this._renderSongsGrid(),window.dispatchEvent(new CustomEvent("favorites-changed")),i.remove()}),i.querySelector("#mDownload").addEventListener("click",()=>{o.downloadSong(t),i.remove()}),i.querySelector("#mDetails").addEventListener("click",()=>{i.remove(),this._openTrackDetailsModal(t)})}_openAddToPlaylistDialog(t){const e=d.getPlaylists().filter(i=>!i.isSystem),s=document.createElement("div");s.className="glass-modal-overlay",s.innerHTML=`
      <div class="glass-modal-card">
        <div class="modal-header">
          <h3>Add to Playlist</h3>
          <button class="icon-btn modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p class="modal-subtext">Select a playlist for <b>${t.title}</b></p>
          <div class="playlist-picker-list">
            ${e.length===0?'<p class="empty-note">No custom playlists yet. Create one in Playlists tab.</p>':""}
            ${e.map(i=>`
              <div class="playlist-picker-item" data-id="${i.id}">
                <i class="fa-solid fa-music"></i>
                <div class="picker-item-info">
                  <strong>${i.title}</strong>
                  <small>${i.songs.length} tracks</small>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `,document.body.appendChild(s),s.querySelector(".modal-close-btn").addEventListener("click",()=>s.remove()),s.addEventListener("click",i=>{i.target===s&&s.remove()}),s.querySelectorAll(".playlist-picker-item").forEach(i=>{i.addEventListener("click",()=>{const a=i.dataset.id;d.addSongToPlaylist(a,t),s.remove()})})}_openTrackDetailsModal(t){const e=document.createElement("div");e.className="glass-modal-overlay",e.innerHTML=`
      <div class="glass-modal-card">
        <div class="modal-header">
          <h3>Track Details</h3>
          <button class="icon-btn modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body details-body">
          <img class="details-art" src="${t.artworkUri||"assets/favicon.svg"}" alt="Art" />
          <table class="details-table">
            <tr><th>Title</th><td>${t.title}</td></tr>
            <tr><th>Artist</th><td>${t.artist}</td></tr>
            <tr><th>Album</th><td>${t.album||"Single"}</td></tr>
            <tr><th>Duration</th><td>${this._formatDuration(t.durationMs)}</td></tr>
            <tr><th>Quality</th><td>320 kbps High-Fidelity Audio</td></tr>
            <tr><th>Audio Engine</th><td>Media3 / Web Audio API</td></tr>
            <tr><th>Source</th><td>${t.isLaptop?"Laptop D:\\music":"Listen-X Stream Engine"}</td></tr>
          </table>
        </div>
      </div>
    `,document.body.appendChild(e),e.querySelector(".modal-close-btn").addEventListener("click",()=>e.remove()),e.addEventListener("click",s=>{s.target===e&&e.remove()})}_formatDuration(t){const e=Math.round((t||0)/1e3),s=Math.floor(e/60),i=e%60;return`${s}:${i.toString().padStart(2,"0")}`}}class at{constructor(t){this.container=document.getElementById(t),this.activePlaylist=null,this.activeSubView=null,this.laptopSongs=[],this.localFiles=[],this._createDOM(),this._bindEvents(),this.refresh()}_createDOM(){this.container.innerHTML=`
      <div class="playlists-screen">
        <!-- Sub-View Detail Header (Hidden by default, shown when viewing a specific playlist/category) -->
        <div class="subview-header hidden" id="subviewHeader">
          <button class="icon-btn subview-back-btn" id="subviewBackBtn" title="Back">
            <i class="fa-solid fa-arrow-left"></i> Back to Library
          </button>
          <div class="subview-meta-row">
            <div class="subview-icon-box" id="subviewIconBox"><i class="fa-solid fa-heart"></i></div>
            <div class="subview-info">
              <h2 class="subview-title" id="subviewTitle">Liked Songs</h2>
              <p class="subview-desc" id="subviewDesc">Tracks you love</p>
              <div class="subview-actions">
                <button class="glass-pill-btn subview-play-all-btn" id="subviewPlayAllBtn">
                  <i class="fa-solid fa-play"></i> Play All
                </button>
                <button class="glass-pill-btn subview-clear-btn hidden" id="subviewClearBtn">
                  <i class="fa-solid fa-trash"></i> Clear History
                </button>
              </div>
            </div>
          </div>
          <div class="subview-songs-list" id="subviewSongsList"></div>
        </div>

        <!-- Main Library View -->
        <div class="library-main" id="libraryMain">
          <!-- Library Header -->
          <div class="library-header-row">
            <div>
              <h2 class="library-title">Your Music Library</h2>
              <p class="library-subtitle">Playlists, Laptop streamer, and local files</p>
            </div>
            <button class="glass-pill-btn create-playlist-btn" id="createPlaylistBtn">
              <i class="fa-solid fa-plus"></i> New Playlist
            </button>
          </div>

          <!-- Pinned System Playlists Row -->
          <div class="system-playlists-grid">
            <!-- Liked Songs -->
            <div class="system-card heart-card" id="cardLikedSongs">
              <div class="system-card-icon"><i class="fa-solid fa-heart"></i></div>
              <div class="system-card-info">
                <h3>Liked Songs</h3>
                <span id="likedSongsBadge">0 Tracks</span>
              </div>
              <button class="system-card-play-btn" title="Play All"><i class="fa-solid fa-play"></i></button>
            </div>

            <!-- Recently Played History -->
            <div class="system-card history-card" id="cardHistory">
              <div class="system-card-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
              <div class="system-card-info">
                <h3>Listening History</h3>
                <span id="historyBadge">0 Tracks</span>
              </div>
              <button class="system-card-play-btn" title="Play All"><i class="fa-solid fa-play"></i></button>
            </div>

            <!-- Laptop D:music Server -->
            <div class="system-card laptop-card" id="cardLaptop">
              <div class="system-card-icon"><i class="fa-solid fa-laptop"></i></div>
              <div class="system-card-info">
                <h3>Laptop D:\\music</h3>
                <span id="laptopBadge">Connect to server</span>
              </div>
              <button class="system-card-play-btn" title="Stream"><i class="fa-solid fa-satellite-dish"></i></button>
            </div>

            <!-- Local Computer Files -->
            <div class="system-card local-card" id="cardLocalFiles">
              <div class="system-card-icon"><i class="fa-solid fa-folder-open"></i></div>
              <div class="system-card-info">
                <h3>Local Computer Audio</h3>
                <span id="localFilesBadge">Play offline MP3s</span>
              </div>
              <button class="system-card-play-btn" title="Browse"><i class="fa-solid fa-file-audio"></i></button>
            </div>
          </div>

          <!-- Custom User Playlists Section -->
          <div class="custom-playlists-section">
            <h3 class="section-heading">Custom Playlists</h3>
            <div class="custom-playlists-grid" id="customPlaylistsGrid"></div>
          </div>
        </div>
      </div>

      <!-- Hidden Local Audio File Input -->
      <input type="file" id="localAudioFileInput" multiple accept="audio/*" class="hidden" />
    `}_bindEvents(){document.getElementById("cardLikedSongs").addEventListener("click",()=>this.openSubView("liked")),document.getElementById("cardHistory").addEventListener("click",()=>this.openSubView("history")),document.getElementById("cardLaptop").addEventListener("click",()=>this.openSubView("laptop")),document.getElementById("cardLocalFiles").addEventListener("click",()=>{document.getElementById("localAudioFileInput").click()}),document.getElementById("localAudioFileInput").addEventListener("change",t=>{this.handleLocalFiles(t.target.files)}),document.getElementById("subviewBackBtn").addEventListener("click",()=>this.closeSubView()),document.getElementById("subviewPlayAllBtn").addEventListener("click",()=>{this.currentSubViewSongs&&this.currentSubViewSongs.length>0&&o.setQueue(this.currentSubViewSongs,0)}),document.getElementById("subviewClearBtn").addEventListener("click",()=>{d.clearHistory(),this.openSubView("history")}),document.getElementById("createPlaylistBtn").addEventListener("click",()=>{this.openCreatePlaylistModal()}),window.addEventListener("nav-tab-change",t=>{t.detail&&t.detail.tab==="playlists"&&(t.detail.sub?this.openSubView(t.detail.sub):this.closeSubView())}),window.addEventListener("favorites-changed",()=>this.refresh())}refresh(){const t=d.getFavorites(),e=d.getHistory(),s=d.getPlaylists().filter(a=>!a.isSystem);document.getElementById("likedSongsBadge").textContent=`${t.length} Tracks`,document.getElementById("historyBadge").textContent=`${e.length} Tracks`;const i=document.getElementById("customPlaylistsGrid");if(i.innerHTML="",s.length===0){i.innerHTML=`
        <div class="empty-playlist-box">
          <i class="fa-solid fa-folder-plus"></i>
          <p>No custom playlists yet. Click "New Playlist" to create one!</p>
        </div>
      `;return}s.forEach(a=>{const n=document.createElement("div");n.className="custom-playlist-card",n.innerHTML=`
        <div class="custom-card-art">
          <i class="fa-solid fa-${a.coverIcon||"music"}"></i>
          <button class="custom-card-play-btn" title="Play All"><i class="fa-solid fa-play"></i></button>
        </div>
        <div class="custom-card-body">
          <h4 class="custom-card-title">${a.title}</h4>
          <p class="custom-card-desc">${a.description||`${a.songs.length} tracks`}</p>
          <div class="custom-card-footer">
            <span class="custom-card-count">${a.songs.length} songs</span>
            <button class="icon-btn delete-playlist-btn" title="Delete Playlist">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `,n.addEventListener("click",l=>{l.target.closest("button")||this.openPlaylist(a)}),n.querySelector(".custom-card-play-btn").addEventListener("click",l=>{l.stopPropagation(),a.songs.length>0&&o.setQueue(a.songs,0)}),n.querySelector(".delete-playlist-btn").addEventListener("click",l=>{l.stopPropagation(),confirm(`Delete playlist "${a.title}"?`)&&(d.deletePlaylist(a.id),this.refresh())}),i.appendChild(n)})}openSubView(t){this.activeSubView=t,document.getElementById("libraryMain").classList.add("hidden"),document.getElementById("subviewHeader").classList.remove("hidden");const s=document.getElementById("subviewIconBox"),i=document.getElementById("subviewTitle"),a=document.getElementById("subviewDesc"),n=document.getElementById("subviewClearBtn");n.classList.add("hidden"),t==="liked"?(s.innerHTML='<i class="fa-solid fa-heart"></i>',s.className="subview-icon-box heart-icon",i.textContent="Liked Songs",a.textContent="All your saved favorites",this.currentSubViewSongs=d.getFavorites(),this._renderSubViewSongs(this.currentSubViewSongs)):t==="history"?(s.innerHTML='<i class="fa-solid fa-clock-rotate-left"></i>',s.className="subview-icon-box history-icon",i.textContent="Listening History",a.textContent="Recently played songs",n.classList.remove("hidden"),this.currentSubViewSongs=d.getHistory(),this._renderSubViewSongs(this.currentSubViewSongs)):t==="laptop"?(s.innerHTML='<i class="fa-solid fa-laptop"></i>',s.className="subview-icon-box laptop-icon",i.textContent="Laptop D:\\music Streamer",a.textContent="Connecting to listenx_server.py...",this._loadLaptopSongs()):t==="local"&&(s.innerHTML='<i class="fa-solid fa-folder-open"></i>',s.className="subview-icon-box local-icon",i.textContent="Local Computer Audio",a.textContent=`${this.localFiles.length} loaded offline tracks`,this.currentSubViewSongs=this.localFiles,this._renderSubViewSongs(this.localFiles))}openPlaylist(t){this.activePlaylist=t,document.getElementById("libraryMain").classList.add("hidden"),document.getElementById("subviewHeader").classList.remove("hidden");const s=document.getElementById("subviewIconBox"),i=document.getElementById("subviewTitle"),a=document.getElementById("subviewDesc");document.getElementById("subviewClearBtn").classList.add("hidden"),s.innerHTML=`<i class="fa-solid fa-${t.coverIcon||"music"}"></i>`,s.className="subview-icon-box playlist-icon",i.textContent=t.title,a.textContent=t.description||`${t.songs.length} tracks`,this.currentSubViewSongs=t.songs,this._renderSubViewSongs(t.songs,t.id)}closeSubView(){this.activePlaylist=null,this.activeSubView=null,document.getElementById("subviewHeader").classList.add("hidden"),document.getElementById("libraryMain").classList.remove("hidden"),this.refresh()}_renderSubViewSongs(t,e=null){const s=document.getElementById("subviewSongsList");if(s.innerHTML="",!t||t.length===0){s.innerHTML='<div class="subview-empty"><i class="fa-solid fa-compact-disc"></i><p>No songs found in this collection.</p></div>';return}const i=o.getCurrentSong();t.forEach((a,n)=>{const l=i&&i.id===a.id,r=d.isFavorite(a.id),c=document.createElement("div");c.className=`subview-song-row ${l?"active-track":""}`,c.innerHTML=`
        <span class="subview-track-index">${l?'<i class="fa-solid fa-volume-high active-wave-icon"></i>':n+1}</span>
        <img class="subview-art" src="${a.artworkUri||"assets/favicon.svg"}" alt="Art" />
        <div class="subview-song-meta">
          <div class="subview-song-title">${a.title}</div>
          <div class="subview-song-artist">${a.artist}</div>
        </div>
        <span class="subview-song-album">${a.album||"Single"}</span>
        <span class="subview-song-duration">${this._formatDuration(a.durationMs)}</span>
        <div class="subview-song-actions">
          <button class="icon-btn row-fav-btn ${r?"active-heart":""}" title="Favorite">
            <i class="fa-${r?"solid":"regular"} fa-heart"></i>
          </button>
          <button class="icon-btn row-play-btn" title="Play">
            <i class="fa-solid fa-play"></i>
          </button>
          ${e?'<button class="icon-btn row-remove-btn" title="Remove from playlist"><i class="fa-solid fa-xmark"></i></button>':""}
        </div>
      `,c.addEventListener("click",u=>{u.target.closest("button")||o.setQueue(t,n)}),c.querySelector(".row-play-btn").addEventListener("click",u=>{u.stopPropagation(),o.setQueue(t,n)}),c.querySelector(".row-fav-btn").addEventListener("click",u=>{u.stopPropagation();const g=d.toggleFavorite(a);c.querySelector(".row-fav-btn").classList.toggle("active-heart",g),c.querySelector(".row-fav-btn").innerHTML=`<i class="fa-${g?"solid":"regular"} fa-heart"></i>`,this.refresh()}),e&&c.querySelector(".row-remove-btn").addEventListener("click",u=>{u.stopPropagation(),d.removeSongFromPlaylist(e,a.id);const g=d.getPlaylists().find(y=>y.id===e);g&&this.openPlaylist(g)}),s.appendChild(c)})}async _loadLaptopSongs(){var i;const t=document.getElementById("subviewSongsList");t.innerHTML='<div class="subview-empty"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Scanning D:\\music on Listen-X Server...</p></div>';const e=d.getServerUrl(),s=await C.getLaptopSongs(e);this.laptopSongs=s,this.currentSubViewSongs=s,s.length>0?(document.getElementById("subviewDesc").textContent=`Connected to ${e} (${s.length} tracks)`,document.getElementById("laptopBadge").textContent=`${s.length} Tracks ready`,this._renderSubViewSongs(s)):(document.getElementById("subviewDesc").textContent=`Could not connect to ${e}`,t.innerHTML=`
        <div class="subview-empty">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h4>Listen-X Laptop Server Not Detected</h4>
          <p>Make sure <code>python listenx_server.py</code> is running on port 8080 or check your server URL in Settings.</p>
          <button class="glass-pill-btn retry-server-btn" id="retryServerBtn"><i class="fa-solid fa-rotate-right"></i> Retry Connection</button>
        </div>
      `,(i=document.getElementById("retryServerBtn"))==null||i.addEventListener("click",()=>this._loadLaptopSongs()))}handleLocalFiles(t){if(!(!t||t.length===0)){this.localFiles=[];for(let e=0;e<t.length;e++){const s=t[e],i=URL.createObjectURL(s),a=s.name.replace(/\.[^/.]+$/,"");let n=a,l="Local Computer";if(a.includes(" - ")){const r=a.split(" - ");l=r[0].trim(),n=r.slice(1).join(" - ").trim()}this.localFiles.push({id:`local_${Date.now()}_${e}`,title:n,artist:l,album:"Local Storage",durationMs:0,streamUrl:i,artworkUri:"assets/favicon.svg",mimeType:s.type||"audio/mpeg",isLocalFile:!0})}document.getElementById("localFilesBadge").textContent=`${this.localFiles.length} Tracks loaded`,this.openSubView("local"),this.localFiles.length>0&&o.setQueue(this.localFiles,0)}}openCreatePlaylistModal(){const t=document.createElement("div");t.className="glass-modal-overlay",t.innerHTML=`
      <div class="glass-modal-card">
        <div class="modal-header">
          <h3>Create New Playlist</h3>
          <button class="icon-btn modal-close-btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Playlist Name</label>
            <input type="text" class="glass-input" id="newPlTitle" placeholder="e.g. Late Night Vibe" autofocus />
          </div>
          <div class="form-group">
            <label>Description (Optional)</label>
            <input type="text" class="glass-input" id="newPlDesc" placeholder="e.g. My favorite midnight tunes" />
          </div>
          <button class="glass-pill-btn primary-action-btn" id="submitCreatePlBtn">
            <i class="fa-solid fa-check"></i> Create Playlist
          </button>
        </div>
      </div>
    `,document.body.appendChild(t),t.querySelector(".modal-close-btn").addEventListener("click",()=>t.remove()),t.addEventListener("click",s=>{s.target===t&&t.remove()});const e=t.querySelector("#newPlTitle");setTimeout(()=>e.focus(),50),t.querySelector("#submitCreatePlBtn").addEventListener("click",()=>{const s=e.value.trim(),i=t.querySelector("#newPlDesc").value.trim();s&&(d.createPlaylist(s,i),t.remove(),this.refresh())})}_formatDuration(t){if(!t||t<=0)return"--:--";const e=Math.round(t/1e3),s=Math.floor(e/60),i=e%60;return`${s}:${i.toString().padStart(2,"0")}`}}class nt{constructor(){this.modal=null,this.bands=[{label:"60 Hz",sub:"Sub Bass",index:0},{label:"230 Hz",sub:"Bass",index:1},{label:"910 Hz",sub:"Mids",index:2},{label:"3.6 kHz",sub:"Presence",index:3},{label:"14 kHz",sub:"Brilliance",index:4},{label:"Preamp",sub:"Master Gain",index:5}],window.addEventListener("open-equalizer-modal",()=>this.open())}open(){this.modal&&this.modal.remove();const t=d.getSettings(),e=t.eqGains||[0,0,0,0,0,0],s=t.eqPreset||"Flat";this.modal=document.createElement("div"),this.modal.className="glass-modal-overlay",this.modal.innerHTML=`
      <div class="glass-modal-card eq-modal-card">
        <div class="modal-header">
          <div class="header-icon-group">
            <i class="fa-solid fa-sliders eq-icon-glow"></i>
            <div>
              <h3>6-Band Graphic Equalizer</h3>
              <p class="modal-subtext">Precision 32-bit DSP audio enhancement</p>
            </div>
          </div>
          <button class="icon-btn modal-close-btn" id="eqCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <!-- Presets Row -->
          <div class="eq-presets-row">
            ${Object.keys(k).map(i=>`
              <button class="glass-pill-btn eq-preset-btn ${i===s?"active":""}" data-preset="${i}">
                ${i}
              </button>
            `).join("")}
          </div>

          <!-- Equalizer Sliders -->
          <div class="eq-sliders-container">
            ${this.bands.map(i=>{const a=e[i.index]||0;return`
                <div class="eq-band-col">
                  <span class="eq-val-badge" id="eqVal_${i.index}">${a>0?"+":""}${a} dB</span>
                  <div class="eq-slider-wrapper">
                    <input type="range" class="eq-slider" orient="vertical" id="eqSlider_${i.index}"
                           min="-12" max="12" step="0.5" value="${a}" />
                  </div>
                  <span class="eq-band-freq">${i.label}</span>
                  <small class="eq-band-sub">${i.sub}</small>
                </div>
              `}).join("")}
          </div>

          <!-- Reset Button -->
          <div class="eq-modal-footer">
            <button class="glass-pill-btn reset-eq-btn" id="resetEqBtn">
              <i class="fa-solid fa-rotate-left"></i> Reset to Flat
            </button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.modal),this._bindEvents()}_bindEvents(){this.modal.querySelector("#eqCloseBtn").addEventListener("click",()=>this.close()),this.modal.addEventListener("click",t=>{t.target===this.modal&&this.close()}),this.modal.querySelectorAll(".eq-preset-btn").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.preset;this.modal.querySelectorAll(".eq-preset-btn").forEach(i=>i.classList.remove("active")),t.classList.add("active"),o.applyPreset(e);const s=k[e]||[0,0,0,0,0,0];this._updateSliderValues(s)})});for(let t=0;t<6;t++){const e=this.modal.querySelector(`#eqSlider_${t}`),s=this.modal.querySelector(`#eqVal_${t}`);e.addEventListener("input",i=>{const a=parseFloat(i.target.value);s.textContent=`${a>0?"+":""}${a} dB`;const n=[];for(let l=0;l<6;l++)n.push(parseFloat(this.modal.querySelector(`#eqSlider_${l}`).value));o.setEqualizerGains(n),this.modal.querySelectorAll(".eq-preset-btn").forEach(l=>l.classList.remove("active"))})}this.modal.querySelector("#resetEqBtn").addEventListener("click",()=>{o.applyPreset("Flat"),this._updateSliderValues([0,0,0,0,0,0]),this.modal.querySelectorAll(".eq-preset-btn").forEach(t=>{t.classList.toggle("active",t.dataset.preset==="Flat")})})}_updateSliderValues(t){for(let e=0;e<6;e++){const s=t[e]||0,i=this.modal.querySelector(`#eqSlider_${e}`),a=this.modal.querySelector(`#eqVal_${e}`);i&&a&&(i.value=s,a.textContent=`${s>0?"+":""}${s} dB`)}}close(){this.modal&&(this.modal.remove(),this.modal=null)}}class lt{constructor(t){this.liquidBg=t,this.modal=null,window.addEventListener("open-settings-modal",()=>this.open())}open(){this.modal&&this.modal.remove();const t=d.getSettings(),e=d.getServerUrl();this.modal=document.createElement("div"),this.modal.className="glass-modal-overlay",this.modal.innerHTML=`
      <div class="glass-modal-card settings-modal-card">
        <div class="modal-header">
          <div class="header-icon-group">
            <i class="fa-solid fa-gear settings-icon-glow"></i>
            <div>
              <h3>Settings & Customization</h3>
              <p class="modal-subtext">Visual physics, audio DSP, and server connectivity</p>
            </div>
          </div>
          <button class="icon-btn modal-close-btn" id="settingsCloseBtn"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body settings-body">
          <!-- 1. Graphics & Performance -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-wand-magic-sparkles"></i> Visual Graphics & Performance</h4>
            <div class="graphics-mode-selector">
              <div class="graphics-card ${t.graphicsLevel==="ULTRA_LIQUID"?"active":""}" data-level="ULTRA_LIQUID">
                <div class="graphics-card-header">
                  <i class="fa-solid fa-water"></i>
                  <strong>Ultra Liquid</strong>
                </div>
                <p>Full ambient animated neon fluid mesh background, glowing border strokes, dynamic floating depth.</p>
              </div>

              <div class="graphics-card ${t.graphicsLevel==="BALANCED"?"active":""}" data-level="BALANCED">
                <div class="graphics-card-header">
                  <i class="fa-solid fa-scale-balanced"></i>
                  <strong>Balanced</strong>
                </div>
                <p>Smooth Compose springs, translucent frosted glass surfaces, and responsive micro-animations.</p>
              </div>

              <div class="graphics-card ${t.graphicsLevel==="LOW"?"active":""}" data-level="LOW">
                <div class="graphics-card-header">
                  <i class="fa-solid fa-bolt"></i>
                  <strong>Performance (Low)</strong>
                </div>
                <p>Ultra-minimal flat dark AMOLED UI with zero canvas animations, engineered for battery saving.</p>
              </div>
            </div>
          </div>

          <!-- 2. Custom Photo Background -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-image"></i> Custom Wallpaper Background</h4>
            <p class="section-desc">Personalize player background with an automatic dark scrim overlay.</p>
            <div class="custom-bg-controls">
              <button class="glass-pill-btn" id="uploadBgBtn"><i class="fa-solid fa-cloud-arrow-up"></i> Upload Photo</button>
              <button class="glass-pill-btn ${t.customBg?"":"hidden"}" id="resetBgBtn"><i class="fa-solid fa-trash"></i> Reset to Liquid</button>
              <input type="file" id="customBgFileInput" accept="image/*" class="hidden" />
            </div>
          </div>

          <!-- 3. DJ Crossfader -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-sliders"></i> Real-Time DJ Crossfader</h4>
            <p class="section-desc">Adjust transition blend duration between ending and upcoming songs.</p>
            <div class="slider-row">
              <input type="range" class="sheet-slider" id="crossfadeSlider" min="0" max="12" step="1" value="${t.crossfadeDuration||3}" />
              <span class="slider-badge" id="crossfadeBadge">${t.crossfadeDuration||3}s</span>
            </div>
          </div>

          <!-- 4. Music Taste Profile -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-heart"></i> Music Taste Profile</h4>
            <p class="section-desc">Selected languages influence your dynamic Trending home feed.</p>
            <div class="taste-chips-container" id="tasteChipsContainer">
              ${["Hindi","Haryanvi","Punjabi","English","Bhojpuri","Rajasthani"].map(s=>{var a;return`<button class="taste-chip ${(((a=t.musicTaste)==null?void 0:a.languages)||[]).includes(s)?"active":""}" data-lang="${s}">${s}</button>`}).join("")}
            </div>
          </div>

          <!-- 5. Laptop Server Connection -->
          <div class="settings-section">
            <h4 class="section-label"><i class="fa-solid fa-laptop"></i> Laptop Streaming Server</h4>
            <p class="section-desc">Target URL for <code>listenx_server.py</code> (D:\\music library).</p>
            <div class="server-input-row">
              <input type="text" class="glass-input" id="serverUrlInput" value="${e}" placeholder="http://localhost:8080" />
              <button class="glass-pill-btn" id="saveServerUrlBtn">Save</button>
            </div>
          </div>

          <!-- 6. Developer Info -->
          <div class="settings-section dev-info-box">
            <div class="dev-info-header">
              <img src="assets/favicon.svg" alt="Listen-X Logo" class="dev-logo" />
              <div>
                <h4>Listen-X Music Web</h4>
                <p>Version 2.0.0 — Universal Audio Streamer</p>
                <small>Developed by Tanish Nandal</small>
              </div>
            </div>
            <p class="dev-description">
              Listen-X combines dynamic liquid glassmorphism, 320kbps JioSaavn audio streaming,
              LRCLIB synchronized lyrics, 6-band graphic DSP equalization, and zero-config laptop broadcasting.
            </p>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.modal),this._bindEvents()}_bindEvents(){this.modal.querySelector("#settingsCloseBtn").addEventListener("click",()=>this.close()),this.modal.addEventListener("click",i=>{i.target===this.modal&&this.close()}),this.modal.querySelectorAll(".graphics-card").forEach(i=>{i.addEventListener("click",()=>{this.modal.querySelectorAll(".graphics-card").forEach(n=>n.classList.remove("active")),i.classList.add("active");const a=i.dataset.level;d.saveSettings({graphicsLevel:a}),this.liquidBg&&this.liquidBg.applySettings()})});const t=this.modal.querySelector("#customBgFileInput");this.modal.querySelector("#uploadBgBtn").addEventListener("click",()=>t.click()),t.addEventListener("change",i=>{const a=i.target.files[0];if(a){const n=new FileReader;n.onload=l=>{const r=l.target.result;d.saveSettings({customBg:r}),this.liquidBg&&this.liquidBg.applySettings(),this.modal.querySelector("#resetBgBtn").classList.remove("hidden")},n.readAsDataURL(a)}}),this.modal.querySelector("#resetBgBtn").addEventListener("click",()=>{d.saveSettings({customBg:null}),this.liquidBg&&this.liquidBg.applySettings(),this.modal.querySelector("#resetBgBtn").classList.add("hidden")});const e=this.modal.querySelector("#crossfadeSlider"),s=this.modal.querySelector("#crossfadeBadge");e.addEventListener("input",i=>{const a=parseInt(i.target.value,10);s.textContent=`${a}s`,o.crossfadeDuration=a,d.saveSettings({crossfadeDuration:a})}),this.modal.querySelectorAll(".taste-chip").forEach(i=>{i.addEventListener("click",()=>{i.classList.toggle("active");const a=Array.from(this.modal.querySelectorAll(".taste-chip.active")).map(l=>l.dataset.lang),n=d.getSettings().musicTaste||{};n.languages=a,d.saveSettings({musicTaste:n})})}),this.modal.querySelector("#saveServerUrlBtn").addEventListener("click",()=>{const i=this.modal.querySelector("#serverUrlInput").value.trim();if(i){d.saveServerUrl(i);const a=this.modal.querySelector("#saveServerUrlBtn");a.innerHTML='<i class="fa-solid fa-check"></i> Saved',setTimeout(()=>{a.textContent="Save"},1500)}})}close(){this.modal&&(this.modal.remove(),this.modal=null)}}class ot{constructor(){this.currentTab="online",this._init()}_init(){this.liquidBg=new V("liquidBgContainer"),this.nowPlaying=new st,this.equalizerModal=new nt,this.settingsModal=new lt(this.liquidBg),this.onlineView=new it("onlineViewContainer"),this.playlistView=new at("playlistViewContainer"),this._bindNavigation(),this._bindHeader(),this._bindKeyboardShortcuts(),this.switchTab("online")}_bindNavigation(){const t=document.getElementById("navTabOnline"),e=document.getElementById("navTabPlaylists");t.addEventListener("click",()=>this.switchTab("online")),e.addEventListener("click",()=>this.switchTab("playlists")),window.addEventListener("nav-tab-change",s=>{s.detail&&s.detail.tab&&this.switchTab(s.detail.tab)})}switchTab(t){this.currentTab=t;const e=document.getElementById("navTabOnline"),s=document.getElementById("navTabPlaylists"),i=document.getElementById("onlineViewContainer"),a=document.getElementById("playlistViewContainer");t==="online"?(e.classList.add("active"),s.classList.remove("active"),i.classList.remove("hidden"),a.classList.add("hidden")):(s.classList.add("active"),e.classList.remove("active"),a.classList.remove("hidden"),i.classList.add("hidden"),this.playlistView.refresh())}_bindHeader(){document.getElementById("headerBrand").addEventListener("click",()=>{this.switchTab("online"),window.scrollTo({top:0,behavior:"smooth"})}),document.getElementById("headerEqBtn").addEventListener("click",()=>{this.equalizerModal.open()}),document.getElementById("headerSettingsBtn").addEventListener("click",()=>{this.settingsModal.open()})}_bindKeyboardShortcuts(){window.addEventListener("keydown",t=>{if(!["INPUT","TEXTAREA","SELECT"].includes(t.target.tagName)){if(t.code==="Space")t.preventDefault(),o.togglePlay();else if(t.code==="ArrowRight"&&t.ctrlKey)o.playNext();else if(t.code==="ArrowLeft"&&t.ctrlKey)o.playPrevious();else if(t.code==="ArrowRight")o.seek(o.activeAudio.currentTime+5);else if(t.code==="ArrowLeft")o.seek(Math.max(0,o.activeAudio.currentTime-5));else if(t.key==="m"||t.key==="M"){const e=o.getVolume();o.setVolume(e>0?0:.85)}}})}}document.addEventListener("DOMContentLoaded",()=>{window.app=new ot});
