// Reorder only visible entries; hidden words keep their slots. Persist by word identity.
let reorderMode=false,wordDrag=null;
const reorderButton=document.querySelector('#reorder');
const reorderStatus=document.createElement('p');reorderStatus.id='reorder-status';reorderStatus.className='reorder-status';reorderStatus.setAttribute('role','status');reorderStatus.setAttribute('aria-live','polite');reorderStatus.hidden=true;document.querySelector('.tools').before(reorderStatus);
function syncReorder(){
 document.body.classList.toggle('reordering',reorderMode);reorderButton.textContent=reorderMode?'Done':'Reorder';reorderButton.setAttribute('aria-pressed',String(reorderMode));reorderStatus.hidden=!reorderMode;
 if(!reorderMode)return;
 reorderStatus.textContent='Drag the handles to reorder. Saved on this device.';
 for(const row of document.querySelectorAll('#rows > tr')){
  row.removeAttribute('role');row.removeAttribute('tabindex');row.removeAttribute('aria-label');
  const cell=document.createElement('td');cell.className='reorder-cell';const handle=document.createElement('button');handle.type='button';handle.className='reorder-handle';handle.setAttribute('aria-label',`Move ${row.dataset.word}. Use the up and down arrow keys to reorder.`);handle.title='Drag to reorder';handle.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/></svg>';
  handle.onpointerdown=event=>beginWordDrag(event,row,handle);
  handle.onkeydown=event=>{if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;event.preventDefault();event.stopPropagation();const other=event.key==='ArrowUp'?row.previousElementSibling:row.nextElementSibling;if(!other)return;if(event.key==='ArrowUp')other.before(row);else other.after(row);saveVisibleOrder();const name=row.dataset.word;render();focusHandle(name);reorderStatus.textContent=`${name} moved ${event.key==='ArrowUp'?'up':'down'}.`;};
  cell.append(handle);row.append(cell);
 }
}
function focusHandle(name){const row=[...document.querySelectorAll('#rows > tr')].find(r=>r.dataset.word===name);row?.querySelector('.reorder-handle')?.focus({preventScroll:true});}
function saveVisibleOrder(){const byName=new Map(words.map(w=>[w.word,w])),order=[...document.querySelectorAll('#rows > tr')].map(r=>r.dataset.word),visible=new Set(order);let i=0;words=words.map(w=>visible.has(w.word)?byName.get(order[i++]):w);persist();}
function positionWordDrag(){
 const drag=wordDrag;if(!drag)return;
 drag.ghost.style.top=`${drag.y-drag.offset}px`;
 const other=[...document.querySelectorAll('#rows > tr')].filter(r=>r!==drag.row);
 const next=other.find(r=>{const box=r.getBoundingClientRect();return drag.y<box.top+box.height/2});
 if(next)document.querySelector('#rows').insertBefore(drag.row,next);else document.querySelector('#rows').append(drag.row);
}
function wordDragFrame(){const drag=wordDrag;if(!drag)return;const edge=85;const speed=drag.y<edge?-Math.min(15,(edge-drag.y)/5):drag.y>innerHeight-edge?Math.min(15,(drag.y-innerHeight+edge)/5):0;if(speed){window.scrollBy(0,speed);positionWordDrag()}drag.frame=requestAnimationFrame(wordDragFrame);}
function beginWordDrag(event,row,handle){
 if(event.button!==0||wordDrag)return;event.preventDefault();event.stopPropagation();
 const rect=row.getBoundingClientRect(),ghost=document.createElement('div');ghost.className='reorder-ghost';ghost.style.left=`${rect.left}px`;ghost.style.width=`${rect.width}px`;const title=document.createElement('strong');title.textContent=row.dataset.word;const summary=document.createElement('span');summary.textContent=words.find(w=>w.word===row.dataset.word)?.summary||'';ghost.append(title,summary);document.body.append(ghost);
 wordDrag={row,handle,ghost,id:event.pointerId,y:event.clientY,offset:Math.min(event.clientY-rect.top,45),frame:0};row.classList.add('reorder-placeholder');document.body.classList.add('word-dragging');handle.setPointerCapture(event.pointerId);positionWordDrag();wordDrag.frame=requestAnimationFrame(wordDragFrame);
}
window.addEventListener('pointermove',event=>{if(!wordDrag||event.pointerId!==wordDrag.id)return;event.preventDefault();wordDrag.y=event.clientY;positionWordDrag();},{passive:false});
function finishWordDrag(event,cancelled=false){const drag=wordDrag;if(!drag||event.pointerId!==drag.id)return;wordDrag=null;cancelAnimationFrame(drag.frame);drag.ghost.remove();drag.row.classList.remove('reorder-placeholder');document.body.classList.remove('word-dragging');if(drag.handle.hasPointerCapture(drag.id))drag.handle.releasePointerCapture(drag.id);if(!cancelled)saveVisibleOrder();render();focusHandle(drag.row.dataset.word);if(!cancelled)reorderStatus.textContent='Order saved on this device.';}
window.addEventListener('pointerup',event=>finishWordDrag(event));window.addEventListener('pointercancel',event=>finishWordDrag(event,true));
reorderButton.onclick=()=>{if(wordDrag)return;reorderMode=!reorderMode;render();};
// Filter changes rerender the list. A drag is cancelled before changing its visible subset.
for(const element of document.querySelectorAll('#search,#pos,#state,[data-view]'))element.addEventListener(element.matches('[data-view]')?'click':'input',()=>{if(wordDrag)finishWordDrag({pointerId:wordDrag.id},true)},{capture:true});
syncReorder();
