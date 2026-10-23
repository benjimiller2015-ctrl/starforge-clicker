const catalog=[{name:'Reinforced pickaxe',icon:'⚒',desc:'+1 stardust per click',base:15,click:1,rate:0},{name:'Mining drone',icon:'⌘',desc:'+1 stardust per second',base:50,click:0,rate:1},{name:'Laser drill',icon:'ϟ',desc:'+8 stardust per second',base:350,click:0,rate:8},{name:'Orbital station',icon:'◎',desc:'+50 stardust per second',base:2000,click:0,rate:50},{name:'Star harvester',icon:'✦',desc:'+300 stardust per second',base:12000,click:0,rate:300}];
const KEY='starforge-v1';let state={dust:0,total:0,owned:[0,0,0,0,0],saved:Date.now()};let storageOK=true;
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Number.isFinite(s.dust)&&s.dust>=0&&Number.isFinite(s.total)&&s.total>=s.dust&&Array.isArray(s.owned)&&s.owned.length===5&&s.owned.every(n=>Number.isInteger(n)&&n>=0&&n<10000)&&Number.isFinite(s.saved))state=s;}catch{}
const labs=['Diamond edges','Drone intelligence','Focused optics','Station overclock','Stellar fusion'];
state.research=Array.isArray(state.research)&&state.research.length===5&&state.research.every(n=>Number.isInteger(n)&&n>=0&&n<=10)?state.research:[0,0,0,0,0];
const $=id=>document.getElementById(id);const fmt=n=>n<1000?Math.floor(n).toLocaleString():Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(n);const multiplier=i=>2**(state.research?.[i]||0);const power=()=>1+state.owned[0]*multiplier(0);const rate=()=>catalog.reduce((n,u,i)=>n+u.rate*state.owned[i]*multiplier(i),0);const cost=i=>Math.ceil(catalog[i].base*1.16**state.owned[i]);const researchCost=i=>catalog[i].base*10*4**(state.research?.[i]||0);let toastTimer;
function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.opacity=0,3500)}
function earn(n){state.dust+=n;state.total+=n}function save(){state.saved=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state))}catch{storageOK=false;$('saveStatus').textContent='Saving unavailable'}}
catalog.forEach((u,i)=>{const b=document.createElement('button');b.className='upgrade';b.innerHTML=`<span class="icon" aria-hidden="true">${u.icon}</span><span class="info"><strong>${u.name}</strong><small>${u.desc}</small></span><span class="price"><span id="cost${i}"></span><small id="owned${i}"></small></span>`;b.onclick=()=>{const c=cost(i);if(state.dust<c)return;state.dust-=c;state.owned[i]++;save();render();toast(`${u.name} added to your fleet`)};$('upgrades').append(b)});
const goals=[[100,'First light'],[1000,'Cosmic explorer'],[10000,'Rising empire'],[100000,'Stellar architect'],[1000000,'Galactic legend'],[10000000,'Master of the cosmos']];function render(){$('balance').textContent=fmt(state.dust);$('power').textContent='+'+fmt(power());$('rate').textContent=fmt(rate());[...$('upgrades').children].forEach((b,i)=>{b.disabled=state.dust<cost(i);$('cost'+i).textContent='✦ '+fmt(cost(i));$('owned'+i).textContent='Owned '+state.owned[i];b.setAttribute('aria-label',`${catalog[i].name}, costs ${cost(i)} stardust, owned ${state.owned[i]}`)});const g=goals.find(g=>state.total<g[0])||goals.at(-1);$('goalTitle').textContent=state.total>=10000000?'Master of the cosmos · All milestones reached!':`${g[1]} · Mine ${fmt(g[0])} stardust`;$('progress').textContent=fmt(Math.min(state.total,g[0]))+' / '+fmt(g[0]);$('fill').style.width=Math.min(100,state.total/g[0]*100)+'%'}
$('mine').onclick=e=>{const n=power();earn(n);render();const p=document.createElement('span');p.className='pop';p.textContent='+'+fmt(n);const r=$('mine').getBoundingClientRect();p.style.left=(e.clientX||r.x+r.width/2)+'px';p.style.top=(e.clientY||r.y+r.height/2)+'px';document.body.append(p);setTimeout(()=>p.remove(),850)};
$('reset').onclick=()=>{if(confirm('Reset your stardust and all upgrades?')){state={dust:0,total:0,owned:[0,0,0,0,0],saved:Date.now()};save();render();toast('A fresh universe awaits.')}};
labs.forEach((name,i)=>{const b=document.createElement('button');b.className='upgrade';b.onclick=()=>{const c=researchCost(i);if(!state.owned[i]||state.dust<c||(state.research?.[i]||0)>=10)return;state.dust-=c;state.research??=[0,0,0,0,0];state.research[i]++;save();render();toast(`${name}: ${multiplier(i)}× ${catalog[i].name.toLowerCase()} output`)};$('research').append(b)});
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
  if(changed)save();
};
const offline=Math.min(28800000,Math.max(0,Date.now()-state.saved))/1000*rate();if(offline>=1){earn(offline);toast(`Welcome back! Your fleet mined ${fmt(offline)} stardust.`)}let last=Date.now();render();save();setInterval(()=>{const now=Date.now();earn(rate()*Math.min(28800,Math.max(0,(now-last)/1000)));last=now;render()},100);setInterval(save,5000);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});

