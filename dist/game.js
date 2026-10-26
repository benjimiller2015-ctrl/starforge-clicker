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
const mineAdjectives=['Goofy','Sleepy','Wobbly','Cosmic','Sneaky','Bouncy','Sparkly','Dizzy','Silly','Grumpy','Jolly','Fuzzy'];
const mineCreatures=['Pirate','Space Sloth','Moon Goblin','Robot Duck','Star Wizard','Alien Penguin','Comet Cowboy','Astro Hamster','Space Potato','Rocket Raccoon','Disco Dragon','Meteor Monkey'];
const randomMineOwner=()=>mineAdjectives[Math.floor(Math.random()*mineAdjectives.length)]+' '+mineCreatures[Math.floor(Math.random()*mineCreatures.length)];
const freshState=()=>({mineOwner:randomMineOwner(),dust:0,total:0,owned:emptyLevels(),research:emptyLevels(),stats:{clicks:0,clickDust:0,comets:0,cometDust:0,playSeconds:0},saved:Date.now()});
const KEY='starforge-v1';let state=freshState();let storageOK=true;
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Number.isFinite(s.dust)&&s.dust>=0&&Number.isFinite(s.total)&&s.total>=s.dust&&Array.isArray(s.owned)&&s.owned.length>=5&&s.owned.length<=catalog.length&&s.owned.every(n=>Number.isInteger(n)&&n>=0&&n<10000)&&Number.isFinite(s.saved))state=s;}catch{}
state.stats=Object.fromEntries(['clicks','clickDust','comets','cometDust','playSeconds'].map(k=>[k,Number.isFinite(state.stats?.[k])&&state.stats[k]>=0?state.stats[k]:0]));
state.owned=catalog.map((_,i)=>state.owned[i]||0);
const labs=['Diamond edges','Drone intelligence','Focused optics','Station overclock','Stellar fusion',...advancedEquipment.map(u=>u[4])];
state.research=Array.isArray(state.research)&&state.research.length>=5&&state.research.length<=catalog.length&&state.research.every(n=>Number.isInteger(n)&&n>=0&&n<=10)?catalog.map((_,i)=>state.research[i]||0):emptyLevels();
const romanTiers=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
function purchasedTiers(i){
  if(!Array.isArray(state.researchTiers))state.researchTiers=[];
  if(!Array.isArray(state.researchTiers[i]))state.researchTiers[i]=Array.from({length:10},(_,t)=>t<state.research[i]);
  return state.researchTiers[i];
}
catalog.forEach((_,i)=>{state.research[i]=purchasedTiers(i).filter(Boolean).length});const $=id=>document.getElementById(id);const fmt=n=>n<1000?Math.floor(n).toLocaleString('en-US'):Intl.NumberFormat('en',{notation:'compact',minimumFractionDigits:3,maximumFractionDigits:3}).format(n).replace(/([A-Za-z]+)$/,suffix=>' '+(suffix==='K'?'k':suffix));const multiplier=i=>2**(state.research?.[i]||0);let clickBoostUntil=0,clickBoostValue=1,miningBoostValue=10;const basePower=()=>1+state.owned[0]*multiplier(0);const power=()=>basePower()*(Date.now()<clickBoostUntil?clickBoostValue:1);let cometBoostUntil=0;const cometFactor=()=>Date.now()<cometBoostUntil?miningBoostValue:1;const baseRate=()=>catalog.reduce((n,u,i)=>n+u.rate*state.owned[i]*multiplier(i),0);const rate=()=>baseRate()*cometFactor();const cost=i=>Math.ceil(catalog[i].base*1.16**state.owned[i]);const researchCost=i=>catalog[i].base*10*4**(state.research?.[i]||0);let toastTimer;
state.cometResearch=[0,1].map(i=>state.cometResearch?.[i]===true);
const cometStudies=[{name:'Golden attraction',catches:7},{name:'Celestial beacon',catches:28}];
const cometFrequency=()=>2**(state.cometResearch||[]).filter(Boolean).length;
const superLucky=()=>state.mineOwner.trim().toLowerCase()==='super lucky';
function cometDelay(){return superLucky()?5:(120+Math.random()*120)/cometFrequency()}
const cometResearchPanel=document.createElement('div');
cometResearchPanel.id='cometResearch';
$('research').parentElement.append(cometResearchPanel);
cometStudies.forEach((study,i)=>{
  const button=document.createElement('button');button.className='upgrade';
  button.onclick=()=>{
    if(state.stats.comets<study.catches||state.cometResearch?.[i])return;
    const before=cometFrequency();state.cometResearch??=[false,false];state.cometResearch[i]=true;
    if(!superLucky())cometWait*=before/cometFrequency();
    window.starforgeAudio?.upgrade();save();render();toast(`${study.name}: golden comets now appear ${cometFrequency()}× as often!`);
  };
  cometResearchPanel.append(button);
});
function cleanMineOwner(value){
  return String(value).replace(/[\u0000-\u001f\u007f]/g,'').trim().replace(/['’]s (?:asteroid )?mine$/i,'').trim().slice(0,30);
}
state.mineOwner=typeof state.mineOwner==='string'&&cleanMineOwner(state.mineOwner)?cleanMineOwner(state.mineOwner):randomMineOwner();
function updateMineName(){
  $('mineName').textContent=state.mineOwner+"'s asteroid mine";
}
$('mineName').onclick=()=>{
  const entered=prompt("Choose the first part of your mine name (up to 30 characters). It will always end in 's asteroid mine.",state.mineOwner);
  if(entered===null)return;
  const name=cleanMineOwner(entered);
  if(!name){toast('Please enter a name for your mine.');return;}
  const wasLucky=superLucky();state.mineOwner=name;if(wasLucky!==superLucky())hideComet();updateMineName();save();
};
updateMineName();const optionsKey='starforge-options-v1';
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
$('reset').onclick=()=>{if(confirm('Permanently wipe all stardust, equipment, research, discoveries, and stats? This cannot be undone.')){state=freshState();updateMineName();cometBoostUntil=0;clickBoostUntil=0;$('mine').classList.remove('frenzy');hideComet();save();render();toast('A fresh universe awaits.')}};
const researchRequirements=[1,5,10,25,50,75,100,125,150,175];
const researchRequired=i=>researchRequirements[state.research?.[i]||0]??Infinity;
labs.forEach((name,i)=>romanTiers.forEach((roman,tier)=>{
  const b=document.createElement('button');b.className='upgrade';
  b.onclick=()=>{
    const price=catalog[i].base*10*4**tier;
    if(purchasedTiers(i)[tier]||state.owned[i]<researchRequirements[tier]||state.dust<price)return;
    state.dust-=price;purchasedTiers(i)[tier]=true;
    state.research[i]=purchasedTiers(i).filter(Boolean).length;
    window.starforgeAudio?.upgrade();save();render();toast(`${name} · Tier ${roman} purchased!`);
  };
  $('research').append(b);
}));const renderBase=render;
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
    b.querySelector('.info small').textContent=known?(i===0?`+${fmt(multiplier(i))} stardust per click each`:`+${fmt(catalog[i].rate*multiplier(i))} stardust per second each`):`???`;
    b.setAttribute('aria-label',known?`${catalog[i].name}, costs ${cost(i)} stardust, owned ${state.owned[i]}`:`Unknown upgrade, costs ${cost(i)} stardust`);
  });
  [...$('research').children].forEach((b,index)=>{
    const i=Math.floor(index/10),tier=index%10;
    const available=state.owned[i]>=researchRequirements[tier]&&!purchasedTiers(i)[tier];
    const price=catalog[i].base*10*4**tier;
    b.style.display=available?'':'none';b.disabled=!available||state.dust<price;
    b.title=`Requires ${researchRequirements[tier]} matching equipment (${state.owned[i]} owned)`;
    b.innerHTML=`<span class="icon" aria-hidden="true">${catalog[i].icon}</span><span class="info"><strong>${labs[i]} · Tier ${romanTiers[tier]}</strong><small>Doubles output of every ${catalog[i].name.toLowerCase()}</small><small>Applies to owned and future equipment</small></span><span class="price">✦ ${fmt(price)}</span>`;
  });  cometStudies.forEach((study,i)=>{
    const button=cometResearchPanel.children[i];
    button.style.display=state.stats.comets>=study.catches&&!state.cometResearch?.[i]?'':'none';
    button.innerHTML=`<span class="icon" aria-hidden="true">☄</span><span class="info"><strong>${study.name} · Tier ${i===0?'I':'II'}</strong><small>Golden comets appear twice as often. Stacks with other comet research.</small><small>Unlocked after ${study.catches} golden comet catches</small></span><span class="price">Free</span>`;
  });  // Keep just two mystery boxes beyond the furthest discovery in each shop.
  for(const [container,key] of [['upgrades','discovered']]){
    const lastKnown=state[key].reduce((last,known,i)=>known?i:last,-1);
    [...$(container).children].forEach((button,i)=>{
      button.style.display=i<=lastKnown+2?'':'none';
    });
  }
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
  if($('playerStats').open){
    const purchased=catalog.flatMap((_,i)=>purchasedTiers(i).flatMap((bought,tier)=>bought?[`<li><strong>${labs[i]} · Tier ${romanTiers[tier]}</strong> — doubles ${catalog[i].name.toLowerCase()} output</li>`]:[]));
    cometStudies.forEach((study,i)=>{if(state.cometResearch?.[i])purchased.push(`<li><strong>${study.name} · Tier ${i===0?'I':'II'}</strong> — golden comets appear twice as often</li>`)});
    $('researchHistory').innerHTML=purchased.length?`<ul>${purchased.join('')}</ul>`:'No research purchased yet.';
  }  if(changed)save();
};
// Golden comets appear after 2–4 minutes of active play and drift for 30 seconds.
const comet=document.createElement('button');
comet.id='goldenComet';comet.type='button';comet.hidden=true;
comet.setAttribute('aria-label','Catch golden comet for one random reward');
comet.innerHTML='<span aria-hidden="true">☄</span><small>Catch me!</small>';
document.body.append(comet);
const boostNotice=document.createElement('div');
boostNotice.id='cometBoost';boostNotice.hidden=true;boostNotice.setAttribute('role','status');
document.body.append(boostNotice);
let cometWait=cometDelay(),cometAge=0;
function hideComet(){comet.hidden=true;cometAge=0;cometWait=cometDelay();}
function updateComet(elapsed){
  $('mine').classList.toggle('frenzy',cometFactor()>1||Date.now()<clickBoostUntil);
  const remaining=Math.max(0,Math.ceil((cometBoostUntil-Date.now())/1000));
  const clickRemaining=Math.max(0,Math.ceil((clickBoostUntil-Date.now())/1000));
  boostNotice.hidden=remaining===0&&clickRemaining===0;
  const label=[remaining?`${miningBoostValue}× mining · ${remaining}s left`:'',clickRemaining?`${clickBoostValue}× clicks · ${clickRemaining}s left`:''].filter(Boolean).join(' | ');
  if(boostNotice.textContent!==label)boostNotice.textContent=label;  if(document.hidden||!options.comets)return;
  if(superLucky()){
    cometWait-=elapsed;
    if(cometWait<=0){
      comet.hidden=false;cometAge=0;cometWait=5;
      comet.style.top=(20+Math.random()*45)+'vh';comet.style.left='-100px';
    }else if(!comet.hidden){
      cometAge+=elapsed;comet.style.left=`calc(${cometAge/30*120}vw - 100px)`;
    }
    return;
  }
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
const rewardBanner=document.createElement('div');rewardBanner.id='rewardBanner';rewardBanner.hidden=true;
rewardBanner.setAttribute('role','status');rewardBanner.setAttribute('aria-live','polite');
rewardBanner.innerHTML='<span class="reward-star" aria-hidden="true">✦</span><div><strong id="rewardHeading"></strong><p id="rewardDescription"></p></div><button type="button" aria-label="Dismiss reward announcement">×</button>';
document.body.append(rewardBanner);
let rewardBannerTimer;
rewardBanner.querySelector('button').onclick=()=>{rewardBanner.hidden=true;clearTimeout(rewardBannerTimer)};
function announceReward(reward,message){
  $('rewardHeading').textContent=reward.name.toUpperCase()+'!';
  $('rewardDescription').textContent=message;
  rewardBanner.hidden=false;
  clearTimeout(rewardBannerTimer);
  rewardBannerTimer=setTimeout(()=>{rewardBanner.hidden=true},6500);
}
const cometRewards=[
  {name:'Mining frenzy',kind:'mining',factor:10,seconds:60},
  {name:'Stardust windfall',kind:'instant',seconds:600},
  {name:'Click frenzy',kind:'click',factor:100,seconds:15},
  {name:'Power surge',kind:'mining',factor:25,seconds:15},
  {name:'Lucky fingers',kind:'click',factor:10,seconds:60}
];
function claimCometReward(reward){
  if(reward.kind==='instant'){
    const amount=Math.max(baseRate()*reward.seconds,basePower()*100);
    state.stats.cometDust+=amount;earn(amount);
    return `${reward.name}! +${fmt(amount)} stardust.`;
  }
  if(reward.kind==='mining'){
    miningBoostValue=reward.factor;cometBoostUntil=Date.now()+reward.seconds*1000;
  }else{
    clickBoostValue=reward.factor;clickBoostUntil=Date.now()+reward.seconds*1000;
  }
  return `${reward.name}! ${reward.factor}× ${reward.kind==='mining'?'mining':'click power'} for ${reward.seconds} seconds.`;
}
comet.onclick=()=>{
  if(comet.hidden)return;
  hideComet();state.stats.comets++;
  const reward=cometRewards[Math.floor(Math.random()*cometRewards.length)];
  const message=claimCometReward(reward);announceReward(reward,message);
  window.starforgeAudio?.upgrade();updateComet(0);save();render();toast(message);
};// Earn only on live browser ticks, never from saved timestamps or long pauses.
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




















