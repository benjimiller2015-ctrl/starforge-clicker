const catalog=[{name:'Reinforced pickaxe',icon:'⚒',desc:'+1 stardust per click',base:15,click:1,rate:0},{name:'Mining drone',icon:'⌘',desc:'+1 stardust per second',base:50,click:0,rate:1},{name:'Laser drill',icon:'ϟ',desc:'+8 stardust per second',base:350,click:0,rate:8},{name:'Orbital station',icon:'◎',desc:'+50 stardust per second',base:2000,click:0,rate:50},{name:'Star harvester',icon:'✦',desc:'+300 stardust per second',base:12000,click:0,rate:300}];
const advancedEquipment=[
 ['Meteor miner','☄',75000,1800,'Meteor extraction'],
 ['Asteroid refinery','⬡',450000,10000,'Perfect extraction'],
 ['Lunar colony','☾',2800000,55000,'Colony automation'],
 ['Solar collector','☀',18000000,300000,'Radiant conversion'],
 ['Nebula siphon','≋',120000000,1700000,'Nebula compression'],
 ['Planet cracker','◉',850000000,9500000,'Core resonance'],
 ['Dyson swarm','✺',6000000000,54000000,'Swarm coordination'],
 ['Wormhole rig','⟡',45000000000,310000000,'Stable gateways'],
 ['Pulsar engine','✷',350000000000,1800000000,'Pulse synchronization'],
 ['Black hole forge','◌',2800000000000,11000000000,'Event horizon taps'],
 ['Galaxy foundry','✧',24000000000000,68000000000,'Galactic assembly'],
 ['Dark matter reactor','◆',220000000000000,430000000000,'Invisible catalysts'],
 ['Quantum duplicator','⚛',2100000000000000,2800000000000,'Quantum entanglement'],
 ['Universe loom','∞',22000000000000000,19000000000000,'Spacetime weaving'],
 ['Eternity engine','✵',250000000000000000,135000000000000,'Infinite harmonics']
];
advancedEquipment.forEach(([name,icon,base,rate])=>catalog.push({name,icon,base,rate,click:0,desc:`+${rate} stardust per second`}));
const emptyLevels=()=>catalog.map(()=>0);
const freshState=()=>({dust:0,total:0,owned:emptyLevels(),research:emptyLevels(),stats:{clicks:0,clickDust:0,comets:0,cometDust:0,playSeconds:0},saved:Date.now()});
const KEY='starforge-v1';let state=freshState();let storageOK=true;
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Number.isFinite(s.dust)&&s.dust>=0&&Number.isFinite(s.total)&&s.total>=s.dust&&Array.isArray(s.owned)&&s.owned.length>=5&&s.owned.length<=catalog.length&&s.owned.every(n=>Number.isInteger(n)&&n>=0&&n<10000)&&Number.isFinite(s.saved))state=s;}catch{}
state.stats=Object.fromEntries(['clicks','clickDust','comets','cometDust','playSeconds'].map(k=>[k,Number.isFinite(state.stats?.[k])&&state.stats[k]>=0?state.stats[k]:0]));
state.owned=catalog.map((_,i)=>state.owned[i]||0);
const labs=['Diamond edges','Drone intelligence','Focused optics','Station overclock','Stellar fusion',...advancedEquipment.map(u=>u[4])];
state.research=Array.isArray(state.research)&&state.research.length>=5&&state.research.length<=catalog.length&&state.research.every(n=>Number.isInteger(n)&&n>=0&&n<=10)?catalog.map((_,i)=>state.research[i]||0):emptyLevels();
const $=id=>document.getElementById(id);const fmt=n=>n<1000?Math.floor(n).toLocaleString('en-US'):Intl.NumberFormat('en',{notation:'compact',minimumFractionDigits:3,maximumFractionDigits:3}).format(n).replace(/([A-Za-z]+)$/,suffix=>' '+(suffix==='K'?'k':suffix));const multiplier=i=>2**(state.research?.[i]||0);const power=()=>1+state.owned[0]*multiplier(0);let cometBoostUntil=0;const cometFactor=()=>Date.now()<cometBoostUntil?10:1;const baseRate=()=>catalog.reduce((n,u,i)=>n+u.rate*state.owned[i]*multiplier(i),0);const rate=()=>baseRate()*cometFactor();const cost=i=>Math.ceil(catalog[i].base*1.16**state.owned[i]);const researchCost=i=>catalog[i].base*10*4**(state.research?.[i]||0);let toastTimer;
const optionsKey='starforge-options-v1';
let options={animations:true,comets:true};
try{const saved=JSON.parse(localStorage.getItem(optionsKey));if(saved)for(const k of ['animations','comets'])if(typeof saved[k]==='boolean')options[k]=saved[k]}catch{}
for(const k of ['animations','comets']){
  const toggle=$(k+'Toggle');toggle.checked=options[k];
  toggle.onchange=()=>{options[k]=toggle.checked;if(k==='comets'&&!options.comets)hideComet();try{localStorage.setItem(optionsKey,JSON.stringify(options))}catch{}};
}
function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.opacity=0,3500)}
function earn(n){state.dust+=n;state.total+=n}function save(){state.saved=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state))}catch{storageOK=false;$('saveStatus').textContent='Saving unavailable'}}
catalog.forEach((u,i)=>{const b=document.createElement('button');b.className='upgrade';b.innerHTML=`<span class="icon" aria-hidden="true">${u.icon}</span><span class="info"><strong>${u.name}</strong><small>${u.desc}</small></span><span class="price"><span id="cost${i}"></span><small id="owned${i}"></small></span>`;b.onclick=()=>{const c=cost(i);if(state.dust<c)return;state.dust-=c;state.owned[i]++;window.starforgeAudio?.upgrade();save();render();toast(`${u.name} added to your fleet`)};$('upgrades').append(b)});
const goals=[[100,'First light'],[1000,'Cosmic explorer'],[10000,'Rising empire'],[100000,'Stellar architect'],[1000000,'Galactic legend'],[10000000,'Master of the cosmos'],[1e8,'Comet commander'],[1e9,'Lunar pioneer'],[1e10,'Solar sovereign'],[1e11,'Nebula navigator'],[1e12,'Planet sculptor'],[1e13,'Dyson dreamer'],[1e14,'Wormhole wanderer'],[1e15,'Pulsar pioneer'],[1e16,'Galaxy guardian'],[1e17,'Quantum voyager'],[1e18,'Universe weaver'],[1e19,'Beyond eternity']];function render(){$('balance').textContent=fmt(state.dust);$('power').textContent='+'+fmt(power());$('rate').textContent=fmt(rate());[...$('upgrades').children].forEach((b,i)=>{b.disabled=state.dust<cost(i);$('cost'+i).textContent='✦ '+fmt(cost(i));$('owned'+i).textContent='Owned '+state.owned[i];b.setAttribute('aria-label',`${catalog[i].name}, costs ${cost(i)} stardust, owned ${state.owned[i]}`)});const g=goals.find(g=>state.total<g[0])||goals.at(-1);$('goalTitle').textContent=state.total>=goals.at(-1)[0]?'Beyond eternity · All milestones reached!':`${g[1]} · Mine ${fmt(g[0])} stardust`;$('progress').textContent=fmt(Math.min(state.total,g[0]))+' / '+fmt(g[0]);$('fill').style.width=Math.min(100,state.total/g[0]*100)+'%'}
$('mine').onclick=e=>{window.starforgeAudio?.click();const n=power();state.stats.clicks++;state.stats.clickDust+=n;earn(n);render();if(!options.animations)return;const p=document.createElement('span');p.className='pop';p.textContent='+'+fmt(n);const r=$('mine').getBoundingClientRect();p.style.left=(e.clientX||r.x+r.width/2)+'px';p.style.top=(e.clientY||r.y+r.height/2)+'px';document.body.append(p);setTimeout(()=>p.remove(),850)};
$('reset').onclick=()=>{if(confirm('Permanently wipe all stardust, equipment, research, discoveries, and stats? This cannot be undone.')){state=freshState();cometBoostUntil=0;hideComet();save();render();toast('A fresh universe awaits.')}};
labs.forEach((name,i)=>{const b=document.createElement('button');b.className='upgrade';b.onclick=()=>{const c=researchCost(i);if(!state.owned[i]||state.dust<c||(state.research?.[i]||0)>=10)return;state.dust-=c;state.research??=emptyLevels();state.research[i]++;window.starforgeAudio?.upgrade();save();render();toast(`${name}: ${multiplier(i)}× ${catalog[i].name.toLowerCase()} output`)};$('research').append(b)});
const renderBase=render;
function discoveries(key, owned) {
  const previous=state[key];
  state[key]=catalog.map((_,i)=>Boolean(previous?.[i])||owned(i));
}
render=function(){
  renderBase();
  discoveries('discovered',i=>state.owned[i]>0);
  discoveries('researchDiscovered',i=>(state.research?.[i]||0)>0);
  let changed=false;
  function revealed(key,i,price){
    if(!state[key][i]&&state.dust>=Math.ceil(price*3/5)){state[key][i]=true;changed=true;}
    return state[key][i];
  }
  [...$('upgrades').children].forEach((b,i)=>{
    const known=revealed('discovered',i,cost(i));
    const production=catalog[i].rate*state.owned[i]*multiplier(i)*cometFactor();
    const share=rate()>0?production/rate()*100:0;
    const productionHint=i===0?'Click-only equipment: 0.00% of your stardust per second.':`${share.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}% of your total stardust per second (${fmt(production)} / second from all owned).`;
    b.title=productionHint;
    // Inner elements also carry the hint so it works on unaffordable buttons.
    b.querySelectorAll('.icon, .info, .price').forEach(part=>part.title=productionHint);
    b.querySelector('.icon').textContent=known?catalog[i].icon:'?';
    b.querySelector('.info strong').textContent=known?catalog[i].name:'Unknown upgrade';
    b.querySelector('.info small').textContent=known?(i===0?`+${fmt(multiplier(i))} stardust per click each`:`+${fmt(catalog[i].rate*multiplier(i))} stardust per second each`):`Reveals at ${fmt(Math.ceil(cost(i)*3/5))} stardust`;
    b.setAttribute('aria-label',known?`${catalog[i].name}, costs ${cost(i)} stardust, owned ${state.owned[i]}`:`Unknown upgrade, costs ${cost(i)} stardust, reveals at ${Math.ceil(cost(i)*3/5)} stardust`);
  });
  [...$('research').children].forEach((b,i)=>{
    const level=state.research?.[i]||0,max=level>=10,locked=!state.owned[i];
    const known=revealed('researchDiscovered',i,researchCost(i));
    b.disabled=max||locked||state.dust<researchCost(i);
    b.innerHTML=`<span class="icon" aria-hidden="true">${known?catalog[i].icon:'?'}</span><span class="info"><strong>${known?labs[i]:'Unknown research'}</strong><small>${known?`${catalog[i].name}: ${multiplier(i)}×${max?' (maximum)':' → '+multiplier(i)*2+'× output'}`:`Reveals at ${fmt(Math.ceil(researchCost(i)*3/5))} stardust`}</small>${known?`<small>${locked?'Buy matching equipment first':'Applies to all owned and future equipment'}</small>`:''}</span><span class="price">${max?'Max level':'✦ '+fmt(researchCost(i))}<small>Level ${level} / 10</small></span>`;
  });
  if($('playerStats').open){
    const exact=n=>Math.floor(n).toLocaleString('en-US');
    const equipment=state.owned.reduce((a,b)=>a+b,0);
    const research=state.research.reduce((a,b)=>a+b,0);
    const seconds=Math.floor(state.stats.playSeconds);
    const stats=[
      ['Stardust in your bank',exact(state.dust)],
      ['Lifetime stardust earned',exact(state.total)],
      ['Stardust spent',exact(Math.max(0,state.total-state.dust))],
      ['Asteroid clicks',exact(state.stats.clicks)],
      ['Stardust from clicks',exact(state.stats.clickDust)],
      ['Stardust per click',fmt(power())],
      ['Current stardust per second',fmt(rate())],
      ['Normal stardust per second',fmt(baseRate())],
      ['Equipment owned',exact(equipment)],
      ['Equipment types owned',`${state.owned.filter(n=>n>0).length} / ${catalog.length}`],
      ['Research levels purchased',`${exact(research)} / ${catalog.length*10}`],
      ['Golden comets caught',exact(state.stats.comets)],
      ['Stardust from comets',exact(state.stats.cometDust)],
      ['Milestones reached',`${goals.filter(g=>state.total>=g[0]).length} / ${goals.length}`],
      ['Active time played',`${Math.floor(seconds/3600)}h ${Math.floor(seconds/60)%60}m ${seconds%60}s`]
    ];
    $('statsList').innerHTML=stats.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  }
  if(changed)save();
};
// Golden comets appear after 2–4 minutes of active play and drift for 30 seconds.
const comet=document.createElement('button');
comet.id='goldenComet';comet.type='button';comet.hidden=true;
comet.setAttribute('aria-label','Catch golden comet: 10 minutes of normal earnings and 10 times mining for one minute');
comet.innerHTML='<span aria-hidden="true">☄</span><small>Catch me!</small>';
document.body.append(comet);
const boostNotice=document.createElement('div');
boostNotice.id='cometBoost';boostNotice.hidden=true;boostNotice.setAttribute('role','status');
document.body.append(boostNotice);
let cometWait=120+Math.random()*120,cometAge=0;
function hideComet(){comet.hidden=true;cometAge=0;cometWait=120+Math.random()*120;}
function updateComet(elapsed){
  const remaining=Math.max(0,Math.ceil((cometBoostUntil-Date.now())/1000));
  boostNotice.hidden=remaining===0;
  const label=`Golden comet · 10× mining · ${remaining}s left`;
  if(boostNotice.textContent!==label)boostNotice.textContent=label;
  if(document.hidden||!options.comets)return;
  if(comet.hidden){
    cometWait-=elapsed;
    if(cometWait<=0 && remaining===0){
      cometAge=0;comet.hidden=false;comet.style.top=(20+Math.random()*45)+'vh';
      comet.style.left='-100px';
    }
  }else{
    cometAge+=elapsed;
    comet.style.left=`calc(${cometAge/30*120}vw - 100px)`;
    if(cometAge>=30)hideComet();
  }
}
comet.onclick=()=>{
  if(comet.hidden)return;
  const reward=baseRate()*600;
  hideComet();state.stats.comets++;state.stats.cometDust+=reward;earn(reward);cometBoostUntil=Date.now()+60000;
  window.starforgeAudio?.upgrade();updateComet(0);save();render();
  toast(`Golden comet! +${fmt(reward)} stardust and 10× mining for 60 seconds.`);
};
// Earn only on live browser ticks, never from saved timestamps or long pauses.
let last=performance.now();
render();save();
setInterval(()=>{
  const now=performance.now();
  const elapsed=Math.min(1,Math.max(0,(now-last)/1000));
  last=now;
  updateComet(elapsed);
  state.stats.playSeconds+=elapsed;
  earn(rate()*elapsed);
  render();
},100);
setInterval(save,5000);
window.addEventListener('pagehide',save);
window.addEventListener('pageshow',()=>{last=performance.now()});
function restartMiningClock(){last=performance.now()}
document.addEventListener('resume',restartMiningClock);
document.addEventListener('visibilitychange',()=>{restartMiningClock();if(document.hidden)save()});





