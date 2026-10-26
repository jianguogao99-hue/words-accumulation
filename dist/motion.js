const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
// Two sharp particle strands share an axis and rotate in opposite phase.
const ambient=document.createElement('canvas');ambient.className='particle-ocean';ambient.setAttribute('aria-hidden','true');document.body.prepend(ambient);
let oceanHost=document.body;
const ocean=ambient.getContext('2d');let oceanWidth=0,oceanHeight=0,oceanFrame=0,oceanTime=0,lastOceanFrame=0;
const ripples=[];let pointer=null;
function resizeOcean(){const bounds=oceanHost===document.body?null:oceanHost.getBoundingClientRect();oceanWidth=bounds?bounds.width:innerWidth;oceanHeight=bounds?bounds.height:innerHeight;const scale=Math.min(devicePixelRatio||1,3);ambient.width=Math.round(oceanWidth*scale);ambient.height=Math.round(oceanHeight*scale);ocean.setTransform(scale,0,0,scale,0,0);drawOcean(oceanTime);}
let ribbonSeed=1947;
function ribbonRandom(){ribbonSeed=(Math.imul(1664525,ribbonSeed)+1013904223)>>>0;return ribbonSeed/4294967296;}
const ribbonParticles=Array.from({length:4200},()=>({u:ribbonRandom(),lane:(ribbonRandom()+ribbonRandom()+ribbonRandom()-1.5)/1.5,phase:ribbonRandom()*Math.PI*2,speed:.75+ribbonRandom()*.5,size:.45+ribbonRandom()*.8,glow:ribbonRandom()}));
// Smooth random targets replace the repeating sine-wave drift. No frame-by-frame jitter.
const floatingSeed=Math.floor(Math.random()*1000000);
function floatNoise(time,salt){
 const step=Math.floor(time),fraction=time-step,blend=fraction*fraction*(3-2*fraction);
 const value=index=>{let n=Math.imul(index+floatingSeed+salt,374761393);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295*2-1;};
 return value(step)*(1-blend)+value(step+1)*blend;
}
function helixFloat(t,width,height){return{
 x:width*.34*(floatNoise(t/6.7,173)*.76+floatNoise(t/3.3,911)*.24),
 y:height*.22*(floatNoise(t/8.1,377)*.78+floatNoise(t/4.6,601)*.22),
 tilt:t*.055+floatNoise(t/11.3,827)*.95,
 scale:1+floatNoise(t/10.7,439)*.08
};}
// Each strand retains the changing cross-section and soft scattered edges of a ribbon.
function strandProfile(u,t,strand,mobile){
 const fold=u*11.5-t*.53+strand*2.1;
 const openness=.5+.5*Math.sin(fold);
 return {width:(mobile?47:72)*(.15+.85*openness),openness};
}
function drawOcean(t){
 ocean.clearRect(0,0,oceanWidth,oceanHeight);
 const mobile=oceanWidth<801,count=mobile?1800:2600,points=[];
 const floating=helixFloat(t,oceanWidth,oceanHeight);
 const driftX=floating.x,driftY=floating.y,cosTilt=Math.cos(floating.tilt),sinTilt=Math.sin(floating.tilt),breath=floating.scale;
 for(let i=0;i<count;i++){
  const p=ribbonParticles[i],travel=(p.u+t*.018*p.speed)%1;
  for(let strand=0;strand<2;strand++){
   // Nonuniform longitudinal spacing creates traveling pockets of density.
   const u=travel+.021*Math.sin(travel*Math.PI*6-t*.32+strand*1.8);
   const profile=strandProfile(u,t,strand,mobile);
   const angle=u*Math.PI*5.6-t*.45+strand*Math.PI,depth=(Math.cos(angle)+1)*.5;
   const axisX=oceanWidth*(.15+.7*u)+Math.sin(u*5.2+t*.15)*oceanWidth*.07;
   const axisY=oceanHeight*(1.1-1.2*u);
   const radius=mobile?oceanWidth*.18:Math.min(oceanWidth*.15,160);
   // Opposite phases share one axis: two genuine intertwined strands.
   const crossTwist=u*10.2-t*.37+strand*2.3;
   const flutter=Math.sin(p.phase+t*.72+u*16)*3+Math.cos(p.phase*1.9-t*.43)*1.5;
   let x=axisX+Math.sin(angle)*radius+p.lane*profile.width+flutter;
   let y=axisY+Math.sin(angle)*radius*.17+p.lane*Math.cos(crossTwist)*profile.width*.42+Math.sin(p.phase+t*.48)*2.5;
   const localX=(x-oceanWidth*.5)*breath,localY=(y-oceanHeight*.5)*breath;
   x=oceanWidth*.5+localX*cosTilt-localY*sinTilt+driftX;
   y=oceanHeight*.5+localX*sinTilt+localY*cosTilt+driftY;
   let light=0;
   for(const ripple of ripples){const age=t-ripple.time;if(age<0||age>2.8)continue;const dx=x-ripple.x,dy=y-ripple.y,d=Math.hypot(dx,dy),force=Math.exp(-Math.pow((d-age*180)/42,2))*(1-age/2.8);x+=dx/Math.max(d,1)*force*20;y+=dy/Math.max(d,1)*force*20;light+=force*.25;}
   if(pointer){const dx=x-pointer.x,dy=y-pointer.y,d=Math.hypot(dx,dy);if(d<100){const force=(1-d/100)*10;x+=dx/Math.max(d,1)*force;y+=dy/Math.max(d,1)*force;}}
   const edge=1-Math.pow(Math.abs(p.lane),.7),shimmer=.88+.12*Math.sin(p.phase+t*.9);
   const alpha=Math.min(.95,(.21+depth*.29+edge*.24+(1-profile.openness)*.12)*shimmer+light);
   points.push({x,y,depth,alpha,size:(.55+p.size*.5)*(.85+depth*.2),green:p.glow>.86});
  }
 }
 // Back-to-front paint order makes the crossing legible without blur or glow.
 points.sort((a,b)=>a.depth-b.depth);
 for(const p of points){ocean.fillStyle=p.green?`rgba(116,237,159,${p.alpha})`:`rgba(236,247,240,${p.alpha})`;ocean.beginPath();ocean.arc(p.x,p.y,p.size,0,Math.PI*2);ocean.fill();}
}
function animateOcean(now){oceanFrame=0;if(document.hidden||reducedMotion.matches)return;if(now-lastOceanFrame>=32){const delta=lastOceanFrame?Math.min((now-lastOceanFrame)/1000,.06):0;oceanTime+=delta;lastOceanFrame=now;while(ripples.length&&oceanTime-ripples[0].time>2.8)ripples.shift();drawOcean(oceanTime);}oceanFrame=requestAnimationFrame(animateOcean);}
function startOcean(){if(!oceanFrame&&!document.hidden&&!reducedMotion.matches){lastOceanFrame=0;oceanFrame=requestAnimationFrame(animateOcean);}}
function oceanVisibility(){if(oceanFrame)cancelAnimationFrame(oceanFrame);oceanFrame=0;drawOcean(oceanTime);startOcean();}
window.addEventListener('resize',resizeOcean,{passive:true});document.addEventListener('visibilitychange',oceanVisibility);reducedMotion.addEventListener('change',oceanVisibility);
window.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')pointer=oceanPoint(event.clientX,event.clientY)},{passive:true});document.addEventListener('pointerleave',()=>pointer=null);
let oceanDown=null;
window.addEventListener('pointerdown',event=>{if(event.isPrimary===false||event.button>0||event.target.closest('button,a,input,select,textarea,label,[role="button"],nav'))return;oceanDown={x:event.clientX,y:event.clientY,time:performance.now()};},{passive:true});
window.addEventListener('pointerup',event=>{if(oceanDown&&Math.hypot(event.clientX-oceanDown.x,event.clientY-oceanDown.y)<12&&performance.now()-oceanDown.time<600&&!reducedMotion.matches){ripples.push({...oceanPoint(event.clientX,event.clientY),time:oceanTime});if(ripples.length>6)ripples.shift();}oceanDown=null;},{passive:true});window.addEventListener('pointercancel',()=>oceanDown=null,{passive:true});
function oceanPoint(x,y){const rect=ambient.getBoundingClientRect();return{x:x-rect.left,y:y-rect.top};}
function syncOceanHost(){const dialogs=[...document.querySelectorAll('dialog[open]')];const next=dialogs.at(-1)||document.body;if(next!==oceanHost||ambient.parentElement!==next){oceanHost=next;next.prepend(ambient);ripples.length=0;pointer=null;resizeOcean();}}
new MutationObserver(syncOceanHost).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
resizeOcean();startOcean();
const reviewMobile=document.createElement('button');reviewMobile.className='ghost mobile-review';reviewMobile.textContent='Review a random word';reviewMobile.onclick=()=>document.querySelector('#review').click();document.querySelector('.note').after(reviewMobile);
let toastTimer;
function celebrateMastery(rect){
 document.querySelector('.toast')?.remove();clearTimeout(toastTimer);const toast=document.createElement('div');toast.className='toast';toast.setAttribute('role','status');toast.textContent='One more word mastered. Keep going.';const detail=document.querySelector('#detail');detail.append(toast);toastTimer=setTimeout(()=>toast.remove(),2300);
 if(reducedMotion.matches)return;
 const layer=document.createElement('div');layer.className='celebration';layer.setAttribute('aria-hidden','true');detail.append(layer);
 const box=detail.getBoundingClientRect();for(let i=0;i<26;i++){const a=Math.PI*2*i/26,d=35+Math.random()*90;const p=document.createElement('i');p.className='spark';p.style.cssText=`--x:${rect.left-box.left+rect.width/2}px;--y:${rect.top-box.top+rect.height/2}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-25}px;--c:${['#1ed760','#a0efb8','#ffffff'][i%3]}`;layer.append(p)}setTimeout(()=>layer.remove(),950);
}
