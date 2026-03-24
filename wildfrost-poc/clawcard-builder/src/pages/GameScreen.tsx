// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================
// CARD DEFINITIONS (30 cards)
// ============================================================
const CARDS = [
  // NORDIC
  {id:'n1',name:'Uderzenie Mjolnira',cost:2,myth:'nordic',type:'attack',color:'#3b82f6',emoji:'⚡',
   desc:'8 dmg',harmonyDesc:'+stun 1t',resonanceDesc:'15 dmg + stun all',
   effect:(s)=>applyDmg(s,8), harmonyEffect:(s)=>applyStatus(s,'enemy','frozen',1),
   resonanceEffect:(s)=>applyDmg(applyStatus(s,'enemy','frozen',1),7)},
  {id:'n2',name:'Lodowy Oddech',cost:1,myth:'nordic',type:'attack',color:'#3b82f6',emoji:'❄️',
   desc:'Freeze + 3 dmg',harmonyDesc:'–',resonanceDesc:'Freeze all',
   effect:(s)=>applyDmg(applyStatus(s,'enemy','frozen',1),3)},
  {id:'n3',name:'Szał Berserkera',cost:2,myth:'nordic',type:'skill',color:'#3b82f6',emoji:'🪓',
   desc:'+4 dmg this turn, -3 hp',harmonyDesc:'draw 1',resonanceDesc:'+8 dmg, draw 2',
   effect:(s)=>({...s,bonusDmg:(s.bonusDmg||0)+4,hp:s.hp-3})},
  {id:'n4',name:'Runa Ochrony',cost:1,myth:'nordic',type:'defense',color:'#3b82f6',emoji:'🛡️',
   desc:'5 armor',harmonyDesc:'8 armor',resonanceDesc:'12 armor + reflect',
   effect:(s)=>applyArmor(s,5)},
  {id:'n5',name:'Wołanie Walkiry',cost:3,myth:'nordic',type:'skill',color:'#3b82f6',emoji:'👼',
   desc:'Heal 8 + draw 2',harmonyDesc:'draw 3',resonanceDesc:'Full heal',
   effect:(s)=>drawCards({...s,hp:Math.min(s.maxHp,s.hp+8)},2)},
  {id:'n6',name:'Fragment Ragnaröku',cost:3,myth:'nordic',type:'attack',color:'#3b82f6',emoji:'💥',
   desc:'15 dmg, discard hand',harmonyDesc:'–',resonanceDesc:'Exhaust: 25 dmg',
   effect:(s)=>applyDmg({...s,hand:[]},15)},
  // EGYPTIAN
  {id:'e1',name:'Rój Skarabeuszy',cost:2,myth:'egyptian',type:'attack',color:'#f59e0b',emoji:'🪲',
   desc:'6 dmg + Corrode 2',harmonyDesc:'8 dmg',resonanceDesc:'Corrode all 3t',
   effect:(s)=>applyStatus(applyDmg(s,6),'enemy','corroded',2)},
  {id:'e2',name:'Odrodzenie Ankh',cost:2,myth:'egyptian',type:'skill',color:'#f59e0b',emoji:'☥',
   desc:'Heal 6 + clear status',harmonyDesc:'draw 1',resonanceDesc:'Heal 15',
   effect:(s)=>({...s,hp:Math.min(s.maxHp,s.hp+6),playerStatus:{...s.playerStatus,frozen:0,haunted:0,burning:0,bleeding:0}})},
  {id:'e3',name:'Klątwa Faraona',cost:3,myth:'egyptian',type:'skill',color:'#f59e0b',emoji:'𓂀',
   desc:'-2 enemy energy + 4 dmg',harmonyDesc:'–',resonanceDesc:'-3 energy 2t',
   effect:(s)=>applyDmg({...s,enemyDebuff:(s.enemyDebuff||0)+2},4)},
  {id:'e4',name:'Zasłona Piasku',cost:1,myth:'egyptian',type:'defense',color:'#f59e0b',emoji:'🏜️',
   desc:'6 armor',harmonyDesc:'8 armor',resonanceDesc:'reflect next attack',
   effect:(s)=>applyArmor(s,6)},
  {id:'e5',name:'Oko Ra',cost:2,myth:'egyptian',type:'attack',color:'#f59e0b',emoji:'👁️',
   desc:'10 dmg to all',harmonyDesc:'–',resonanceDesc:'15 dmg to all',
   effect:(s)=>applyDmg(s,10)},
  {id:'e6',name:'Księga Umarłych',cost:3,myth:'egyptian',type:'skill',color:'#f59e0b',emoji:'📜',
   desc:'Shuffle discard→deck, draw 3',harmonyDesc:'–',resonanceDesc:'draw 5, Blessed 2t',
   effect:(s)=>{const s2={...s,deck:[...s.deck,...s.discardPile],discardPile:[]};return drawCards(s2,3)}},
  // JAPANESE
  {id:'j1',name:'Cios Katany',cost:1,myth:'japanese',type:'attack',color:'#ec4899',emoji:'⚔️',
   desc:'5 dmg + Bleed 2',harmonyDesc:'7 dmg',resonanceDesc:'Bleed 5',
   effect:(s)=>applyStatus(applyDmg(s,5),'enemy','bleeding',2)},
  {id:'j2',name:'Fala Duchów',cost:2,myth:'japanese',type:'attack',color:'#ec4899',emoji:'👻',
   desc:'4 dmg x2',harmonyDesc:'4 dmg x3',resonanceDesc:'4 dmg x5',
   effect:(s)=>applyDmg(applyDmg(s,4),4)},
  {id:'j3',name:'Echo Tsukumogami',cost:1,myth:'japanese',type:'skill',color:'#ec4899',emoji:'🔮',
   desc:'Kopiuj ostatnią kartę',harmonyDesc:'–',resonanceDesc:'x2 kopiuj',
   effect:(s)=>s.lastCardEffect?s.lastCardEffect(s):s},
  {id:'j4',name:'Cios Oni',cost:3,myth:'japanese',type:'attack',color:'#ec4899',emoji:'👹',
   desc:'18 dmg, Haunt self 2t',harmonyDesc:'–',resonanceDesc:'25 dmg, no self-haunt',
   effect:(s)=>applyStatus(applyDmg(s,18),'player','haunted',2)},
  {id:'j5',name:'Kwiat Wiśni',cost:1,myth:'japanese',type:'skill',color:'#ec4899',emoji:'🌸',
   desc:'Draw 2 + Heal 2',harmonyDesc:'draw 3',resonanceDesc:'Blessed 2t + draw 4',
   effect:(s)=>drawCards({...s,hp:Math.min(s.maxHp,s.hp+2)},2)},
  {id:'j6',name:'Brama Torii',cost:2,myth:'japanese',type:'defense',color:'#ec4899',emoji:'⛩️',
   desc:'8 armor + reflect next',harmonyDesc:'12 armor',resonanceDesc:'12 armor + reflect 2',
   effect:(s)=>applyArmor({...s,playerReflect:(s.playerReflect||0)+1},8)},
  // MESOAMERICAN
  {id:'m1',name:'Obsydianowe Ostrze',cost:1,myth:'meso',type:'attack',color:'#ef4444',emoji:'🗡️',
   desc:'7 dmg + Bleed 3',harmonyDesc:'9 dmg',resonanceDesc:'Bleed 6',
   effect:(s)=>applyStatus(applyDmg(s,7),'enemy','bleeding',3)},
  {id:'m2',name:'Ogień Rytualny',cost:2,myth:'meso',type:'attack',color:'#ef4444',emoji:'🔥',
   desc:'5 dmg + Burn 3t',harmonyDesc:'7 dmg',resonanceDesc:'Burn all 3t',
   effect:(s)=>applyStatus(applyDmg(s,5),'enemy','burning',3)},
  {id:'m3',name:'Skok Jaguara',cost:1,myth:'meso',type:'skill',color:'#ef4444',emoji:'🐆',
   desc:'4 dmg + free next card',harmonyDesc:'–',resonanceDesc:'3x free plays',
   effect:(s)=>applyDmg({...s,freeCards:(s.freeCards||0)+1},4)},
  {id:'m4',name:'Cykl Tzolkin',cost:3,myth:'meso',type:'power',color:'#ef4444',emoji:'🌀',
   desc:'Double effects this turn',harmonyDesc:'–',resonanceDesc:'Triple effects',
   effect:(s)=>({...s,dmgMultiplier:(s.dmgMultiplier||1)*2})},
  {id:'m5',name:'Ofiara',cost:0,myth:'meso',type:'attack',color:'#ef4444',emoji:'💀',
   desc:'Poświęć 10 hp → 15 dmg',harmonyDesc:'–',resonanceDesc:'25 dmg, nie płay hp',
   effect:(s)=>applyDmg({...s,hp:s.hp-10},15)},
  {id:'m6',name:'Koniec Kalendarza',cost:3,myth:'meso',type:'attack',color:'#ef4444',emoji:'🌑',
   desc:'20 dmg (instant kill <30% hp)',harmonyDesc:'–',resonanceDesc:'instant kill <30%',
   effect:(s)=>s.enemy&&s.enemy.hp<s.enemy.maxHp*0.3?{...s,enemy:{...s.enemy,hp:0}}:applyDmg(s,20)},
  // GREEK
  {id:'g1',name:'Piorun Olimpu',cost:2,myth:'greek',type:'attack',color:'#8b5cf6',emoji:'⚡',
   desc:'9 dmg',harmonyDesc:'Stun all 1t',resonanceDesc:'15 dmg + stun all 2t',
   effect:(s)=>applyDmg(s,9)},
  {id:'g2',name:'Tarcza Egidy',cost:2,myth:'greek',type:'defense',color:'#8b5cf6',emoji:'🔰',
   desc:'10 armor',harmonyDesc:'14 armor',resonanceDesc:'20 armor + reflect',
   effect:(s)=>applyArmor(s,10)},
  {id:'g3',name:'Ugryzienie Hydry',cost:1,myth:'greek',type:'attack',color:'#8b5cf6',emoji:'🐍',
   desc:'3 dmg (wraca do ręki)',harmonyDesc:'–',resonanceDesc:'6 dmg, x2 odbudowa',
   effect:(s)=>{const s2=applyDmg(s,3);return {...s2,hand:[...s2.hand,CARDS.find(c=>c.id==='g3')]}}},
  {id:'g4',name:'Dar Prometeusza',cost:2,myth:'greek',type:'skill',color:'#8b5cf6',emoji:'🔥',
   desc:'Burn enemy 3t + heal 3',harmonyDesc:'heal 6',resonanceDesc:'Burn 5t + heal 10',
   effect:(s)=>applyStatus({...s,hp:Math.min(s.maxHp,s.hp+3)},'enemy','burning',3)},
  {id:'g5',name:'Pięta Achillesa',cost:3,myth:'greek',type:'skill',color:'#8b5cf6',emoji:'🏹',
   desc:'+50% dmg this turn + 5 dmg',harmonyDesc:'–',resonanceDesc:'+100% dmg + ignore armor',
   effect:(s)=>applyDmg({...s,dmgMultiplier:(s.dmgMultiplier||1)*1.5},5)},
  {id:'g6',name:'Pięść Tytana',cost:3,myth:'greek',type:'attack',color:'#8b5cf6',emoji:'👊',
   desc:'25 dmg, Frozen self next turn',harmonyDesc:'–',resonanceDesc:'35 dmg, no self-freeze',
   effect:(s)=>applyStatus(applyDmg(s,25),'player','frozen',1)},
]

// ============================================================
// ENEMY DEFINITIONS
// ============================================================
const ENEMIES = {
  draugr:{id:'draugr',name:'Draugr',maxHp:28,myth:'nordic',emoji:'💀',
    intents:[{type:'attack',val:8},{type:'defense',val:5},{type:'attack',val:10}]},
  frozen_scout:{id:'frozen_scout',name:'Frozen Scout',maxHp:22,myth:'nordic',emoji:'🧊',
    intents:[{type:'special',val:0,label:'Freeze'},{type:'attack',val:6},{type:'attack',val:6}]},
  ushabti:{id:'ushabti',name:'Ushabti',maxHp:30,myth:'egyptian',emoji:'🏺',
    intents:[{type:'attack',val:7},{type:'special',val:0,label:'Corrode'},{type:'attack',val:9}]},
  sand_shade:{id:'sand_shade',name:'Sand Shade',maxHp:20,myth:'egyptian',emoji:'🌫️',
    intents:[{type:'defense',val:8},{type:'attack',val:5},{type:'special',val:3,label:'Buff +3dmg'}]},
  tsukumogami:{id:'tsukumogami',name:'Tsukumogami',maxHp:25,myth:'japanese',emoji:'👘',
    intents:[{type:'attack',val:6},{type:'special',val:0,label:'Copy'},{type:'attack',val:8}]},
  jade_warrior:{id:'jade_warrior',name:'Jade Warrior',maxHp:32,myth:'japanese',emoji:'🗿',
    intents:[{type:'defense',val:6},{type:'attack',val:9},{type:'special',val:0,label:'Bleed'}]},
  ritual_priest:{id:'ritual_priest',name:'Ritual Priest',maxHp:35,myth:'meso',emoji:'🎭',
    intents:[{type:'attack',val:8},{type:'special',val:0,label:'Burn'},{type:'special',val:0,label:'+2 energy'}]},
  jaguar:{id:'jaguar',name:'Jaguar',maxHp:28,myth:'meso',emoji:'🐆',
    intents:[{type:'attack',val:5},{type:'attack',val:5},{type:'attack',val:12}]},
  titan_shard:{id:'titan_shard',name:'Titan Shard',maxHp:40,myth:'greek',emoji:'🏛️',
    intents:[{type:'attack',val:10},{type:'defense',val:8},{type:'attack',val:14}]},
  fallen_olympian:{id:'fallen_olympian',name:'Fallen Olympian',maxHp:38,myth:'greek',emoji:'⚡',
    intents:[{type:'attack',val:9},{type:'special',val:0,label:'Thunder'},{type:'attack',val:11}]},
  // MINIBOSSES
  jotun:{id:'jotun',name:'Jotun Warlord',maxHp:70,myth:'nordic',emoji:'🏔️',isBoss:true,
    intents:[{type:'attack',val:12},{type:'special',val:0,label:'Fury +2'},{type:'attack',val:15},{type:'special',val:15,label:'AoE Slam'}]},
  devourer:{id:'devourer',name:'Devourer',maxHp:80,myth:'egyptian',emoji:'🌑',isBoss:true,
    intents:[{type:'attack',val:14},{type:'attack',val:10},{type:'special',val:0,label:'Deck Eater'},{type:'attack',val:16}]},
  ritual_king:{id:'ritual_king',name:'Ritual King',maxHp:85,myth:'meso',emoji:'👑',isBoss:true,
    intents:[{type:'attack',val:13},{type:'special',val:0,label:'Summon'},{type:'attack',val:16},{type:'attack',val:10}]},
  titan_hand:{id:'titan_hand',name:'Titan Hand',maxHp:90,myth:'greek',emoji:'✊',isBoss:true,
    intents:[{type:'attack',val:11},{type:'attack',val:11},{type:'defense',val:15},{type:'attack',val:28}]},
  ymir:{id:'ymir',name:'Ymir Fragment',maxHp:100,myth:'nordic',emoji:'🧊',isBoss:true,
    intents:[{type:'attack',val:15},{type:'special',val:0,label:'Blizzard'},{type:'attack',val:12},{type:'attack',val:18}]},
  duat:{id:'duat',name:'Duat Guardian',maxHp:110,myth:'egyptian',emoji:'⚖️',isBoss:true,
    intents:[{type:'attack',val:14},{type:'special',val:0,label:'Weigh Souls'},{type:'attack',val:16},{type:'special',val:0,label:'Curse'}]},
  fsp:{id:'fsp',name:'Flying Spaghetti Monster',maxHp:200,myth:'pasta',emoji:'🍝',isBoss:true,finalBoss:true,
    intents:[{type:'attack',val:18},{type:'attack',val:12},{type:'special',val:0,label:'Tentacle'},{type:'attack',val:20}]},
}

// ============================================================
// MAP DATA
// ============================================================
const MAP_NODES = [
  {id:0,type:'start',label:'START',arc:'start',x:500,y:480},
  // Arc 1 — Nordic
  {id:1,type:'battle',label:'Draugr',arc:'nordic',enemy:'draugr',x:590,y:420},
  {id:2,type:'battle',label:'Frozen Scout',arc:'nordic',enemy:'frozen_scout',x:640,y:340},
  {id:3,type:'loot',label:'Frozen Cache',arc:'nordic',x:700,y:290},
  {id:4,type:'miniboss',label:'Jotun Warlord',arc:'nordic',enemy:'jotun',x:620,y:240},
  {id:5,type:'camp',label:'Longhouse',arc:'nordic',x:520,y:200},
  {id:6,type:'fountain',label:'Frozen Well',arc:'nordic',x:580,y:180},
  {id:7,type:'boss',label:'Ymir Fragment',arc:'nordic',enemy:'ymir',x:420,y:170},
  // Arc 2 — Egyptian
  {id:8,type:'battle',label:'Ushabti',arc:'egyptian',enemy:'ushabti',x:320,y:200},
  {id:9,type:'shop',label:'Tomb Merchant',arc:'egyptian',x:240,y:250},
  {id:10,type:'battle',label:'Sand Shade',arc:'egyptian',enemy:'sand_shade',x:180,y:320},
  {id:11,type:'event',label:'Cursed Scroll',arc:'egyptian',x:140,y:400},
  {id:12,type:'miniboss',label:'Devourer',arc:'egyptian',enemy:'devourer',x:150,y:490},
  {id:13,type:'camp',label:'Oasis Camp',arc:'egyptian',x:160,y:570},
  {id:14,type:'boss',label:'Duat Guardian',arc:'egyptian',enemy:'duat',x:220,y:640},
  // Arc 3 — Japanese/Meso
  {id:15,type:'battle',label:'Tsukumogami',arc:'japanese',enemy:'tsukumogami',x:320,y:700},
  {id:16,type:'battle',label:'Jade Warrior',arc:'japanese',enemy:'jade_warrior',x:420,y:740},
  {id:17,type:'treasure',label:'Spirit Chest',arc:'japanese',x:520,y:750},
  {id:18,type:'miniboss',label:'Ritual Priest',arc:'meso',enemy:'ritual_king',x:620,y:720},
  {id:19,type:'camp',label:'Temple Rest',arc:'meso',x:700,y:670},
  {id:20,type:'boss',label:'Ritual King',arc:'meso',enemy:'ritual_king',x:760,y:590},
  // Arc 4 — Greek
  {id:21,type:'battle',label:'Titan Shard',arc:'greek',enemy:'titan_shard',x:780,y:490},
  {id:22,type:'battle',label:'Fallen Olympian',arc:'greek',enemy:'fallen_olympian',x:760,y:400},
  {id:23,type:'event',label:'Olympus Gates',arc:'greek',x:720,y:320},
  {id:24,type:'miniboss',label:'Titan Hand',arc:'greek',enemy:'titan_hand',x:660,y:260},
  {id:25,type:'fountain',label:'Ichor Spring',arc:'greek',x:580,y:240},
  {id:26,type:'finalboss',label:'Flying Spaghetti Monster',enemy:'fsp',arc:'final',x:490,y:440},
]

const MAP_EDGES = [
  [0,1],[1,2],[2,3],[2,4],[3,4],[4,5],[4,6],[5,7],[6,7],
  [7,8],[8,9],[9,10],[10,11],[10,12],[11,12],[12,13],[12,14],[13,14],
  [14,15],[15,16],[16,17],[16,18],[17,18],[18,19],[18,20],[19,20],
  [20,21],[21,22],[22,23],[22,24],[23,24],[24,25],[24,26],[25,26],
]

const ARC_COLORS = {nordic:'#3b82f6',egyptian:'#f59e0b',japanese:'#ec4899',meso:'#ef4444',greek:'#8b5cf6',start:'#22c55e',final:'#dc2626'}
const NODE_ICONS = {battle:'⚔️',miniboss:'💀',boss:'👑',camp:'🏕',fountain:'💧',shop:'🛒',loot:'📦',treasure:'💎',event:'📜',start:'🚩',finalboss:'🍝'}

// ============================================================
// STORY EVENTS
// ============================================================
const EVENTS = {
  nordic_event:{
    title:'Nordykczyk w Lodzie',
    text:'Znajdziesz zamrożonego wojownika. Szyba lodu jest gruba ale przejrzysta. Wciąż żyje.',
    choices:[
      {label:'Rozmroź go (+15 HP)',effect:(s)=>({...s,hp:Math.min(s.maxHp,s.hp+15),log:[...s.log,'Wojownik przeżył. Uzdrowił cię przed odejściem.']})},
      {label:'Zostaw (nic)',effect:(s)=>({...s,log:[...s.log,'Zostawiłeś go w lodzie. Może to lepiej.']})},
    ]
  },
  egyptian_event:{
    title:'Zwój z Duat',
    text:'Znalazłeś mapę zaświatów Duat. Wartość kolekcjonerska: ogromna. Cieniarze by zapłacili krocie.',
    choices:[
      {label:'Odczytaj (+1 karta reward)',effect:(s)=>{const pool=getRewardPool(s);const c=pool[Math.floor(Math.random()*pool.length)];return {...s,deck:[...s.deck,{...c,instanceId:Date.now()}],log:[...s.log,'Odczytałeś zwój. Wiedza to potęga.']}}},
      {label:'Oddaj Cieniarze (+30 gold, -10 max HP)',effect:(s)=>({...s,gold:s.gold+30,maxHp:s.maxHp-10,hp:Math.min(s.hp,s.maxHp-10),log:[...s.log,'Złoto jest w ręku. Zdrowie trochę mniej.']})},
    ]
  },
  greek_event:{
    title:'Olimp w Gruzach',
    text:'Brama Olimpu leży obalona. Coś napisało na niej: "Nikt nie wrócił. Pozdrowienia."',
    choices:[
      {label:'Szukaj skarbów (+20 gold, ryzyko: 5 dmg)',effect:(s)=>({...s,gold:s.gold+20,hp:s.hp-5,log:[...s.log,'Znalazłeś trochę złota. I kila siniaków.']})},
      {label:'Medytuj (+5 max HP)',effect:(s)=>({...s,maxHp:s.maxHp+5,hp:s.hp+5,log:[...s.log,'Spokój przyszedł w ciszy ruin.']})},
    ]
  },
}

// ============================================================
// STORY FRAGMENTS (persist)
// ============================================================
const STORY_FRAGMENTS = [
  {id:'ymir_frag',title:'Fragment Ymira',text:'"Był czas gdy mróz budował światy. Kadłub zabrał budulec, zostawił tylko gruz."'},
  {id:'duat_frag',title:'Fragment Duat',text:'"Dusze wciąż się ważą. Nikt ich nie odbiera. Szala przechyla się w nieskończoność."'},
  {id:'ritual_frag',title:'Fragment Rytuału',text:'"Rytuały trwają choć bogowie umarli. Może rytuał jest ważniejszy od boga."'},
  {id:'fsp_frag',title:'Fragment Końca',text:'"Spaghetti Monster nie jest złe. Jest głodne. Kadłub zgłodniał."'},
]

// ============================================================
// STARTER DECK
// ============================================================
const STARTER_CARDS = ['n4','n2','e4','e1','j1','j5','m1','m5','g2','g1']

// ============================================================
// GAME ENGINE HELPERS
// ============================================================
function shuffle(arr) {
  const a=[...arr]
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a
}

function makeInstance(cardId,idx) {
  const c=CARDS.find(x=>x.id===cardId)
  if(!c)return null
  return {...c,instanceId:`${cardId}_${idx}_${Date.now()}`}
}

function makeDeck(cardIds) {
  return cardIds.map((id,i)=>makeInstance(id,i)).filter(Boolean)
}

function drawCards(state,n) {
  let s={...state,deck:[...state.deck],hand:[...state.hand],discardPile:[...state.discardPile]}
  for(let i=0;i<n;i++){
    if(s.hand.length>=7)break
    if(s.deck.length===0){
      if(s.discardPile.length===0)break
      s={...s,deck:shuffle(s.discardPile),discardPile:[]}
    }
    s={...s,hand:[...s.hand,s.deck[0]],deck:s.deck.slice(1)}
  }
  return s
}

function applyDmg(state,dmg) {
  if(!state.enemy)return state
  const mult=state.dmgMultiplier||1
  const bonusDmg=state.bonusDmg||0
  let totalDmg=Math.round((dmg+bonusDmg)*mult)
  if(state.enemyStatus?.corroded>0)totalDmg+=2
  const armor=state.enemy.armor||0
  const absorbed=Math.min(armor,totalDmg)
  const remaining=totalDmg-absorbed
  const newEnemy={...state.enemy,hp:Math.max(0,state.enemy.hp-remaining),armor:armor-absorbed}
  return {...state,enemy:newEnemy,
    log:[...state.log,`⚔️ ${remaining} dmg → ${newEnemy.name} (${newEnemy.hp}/${newEnemy.maxHp} hp)`]}
}

function applyArmor(state,armor) {
  return {...state,playerArmor:(state.playerArmor||0)+armor,
    log:[...state.log,`🛡️ +${armor} armor`]}
}

function applyStatus(state,target,status,turns) {
  if(target==='enemy'){
    const es={...(state.enemyStatus||{})}
    es[status]=(es[status]||0)+turns
    return {...state,enemyStatus:es,log:[...state.log,`💫 ${state.enemy?.name||'Enemy'} gets ${status} ${turns}t`]}
  } else {
    const ps={...(state.playerStatus||{})}
    ps[status]=(ps[status]||0)+turns
    return {...state,playerStatus:ps,log:[...state.log,`💫 You get ${status} ${turns}t`]}
  }
}

function getRewardPool(state) {
  return shuffle(CARDS).slice(0,10)
}

function initEnemy(enemyId) {
  const def=ENEMIES[enemyId]
  if(!def)return null
  return {...def,hp:def.maxHp,armor:0,intentIndex:0}
}

function getIntent(enemy,offset=0) {
  if(!enemy)return null
  const idx=(enemy.intentIndex+offset)%enemy.intents.length
  return enemy.intents[idx]
}

function tickStatuses(state) {
  let s={...state}
  const ps={...(s.playerStatus||{})}
  let log=[...s.log]
  if(ps.burning>0){s={...s,hp:s.hp-3};log=[...log,'🔥 Burning: -3 hp'];ps.burning--}
  if(ps.bleeding>0){s={...s,hp:s.hp-2};log=[...log,'🩸 Bleeding: -2 hp'];ps.bleeding--}
  Object.keys(ps).forEach(k=>{if(ps[k]>0&&k!=='burning'&&k!=='bleeding')ps[k]--})
  s={...s,playerStatus:ps,log}
  if(s.enemy){
    const es={...(s.enemyStatus||{})}
    let elog=[...s.log]
    if(es.burning>0){s={...s,enemy:{...s.enemy,hp:Math.max(0,s.enemy.hp-3)}};elog=[...elog,'🔥 Enemy burning: -3 hp'];es.burning--}
    if(es.bleeding>0){s={...s,enemy:{...s.enemy,hp:Math.max(0,s.enemy.hp-2)}};elog=[...elog,'🩸 Enemy bleeding: -2 hp'];es.bleeding--}
    Object.keys(es).forEach(k=>{if(es[k]>0&&k!=='burning'&&k!=='bleeding')es[k]--})
    s={...s,enemyStatus:es,log:elog}
  }
  return s
}

function enemyTurn(state) {
  if(!state.enemy)return state
  let s={...state}
  const intent=getIntent(s.enemy)
  if(!intent)return s
  s={...s,log:[...s.log,`👹 ${s.enemy.name}: ${intent.label||intent.type} ${intent.val||''}`]}
  if(intent.type==='attack'){
    let dmg=intent.val
    if(s.playerStatus?.corroded>0)dmg+=2
    const armor=s.playerArmor||0
    const absorbed=Math.min(armor,dmg)
    const remaining=dmg-absorbed
    if(s.playerReflect>0&&remaining>0){
      s={...s,enemy:{...s.enemy,hp:Math.max(0,s.enemy.hp-Math.floor(remaining/2))},
        playerReflect:s.playerReflect-1,
        log:[...s.log,`🪞 Reflected ${Math.floor(remaining/2)} dmg!`]}
    }
    s={...s,hp:s.hp-remaining,playerArmor:armor-absorbed}
    s={...s,log:[...s.log,`💔 You take ${remaining} dmg (${s.hp}/${s.maxHp} hp)`]}
  } else if(intent.type==='defense'){
    s={...s,enemy:{...s.enemy,armor:(s.enemy.armor||0)+intent.val}}
    s={...s,log:[...s.log,`🛡️ ${s.enemy.name} gains ${intent.val} armor`]}
  } else if(intent.type==='special'){
    if(intent.label==='Freeze'){s=applyStatus(s,'player','frozen',1)}
    else if(intent.label==='Corrode'){s=applyStatus(s,'player','corroded',2)}
    else if(intent.label==='Burn'){s=applyStatus(s,'player','burning',2)}
    else if(intent.label==='Bleed'){s=applyStatus(s,'player','bleeding',3)}
    else if(intent.label==='Thunder'){s=applyStatus(s,'player','frozen',1);s={...s,hp:s.hp-8}}
    else if(intent.label==='Fury +2'){s={...s,enemy:{...s.enemy,furyStack:(s.enemy.furyStack||0)+2}}}
    else if(intent.label==='Deck Eater'){
      if(s.deck.length>1){const newDeck=[...s.deck];newDeck.splice(Math.floor(Math.random()*newDeck.length),1);s={...s,deck:newDeck};s={...s,log:[...s.log,'💀 A card was consumed!']}}
    }
    else if(intent.label==='Summon'){s={...s,log:[...s.log,'A Jaguar was summoned! (Visual only in this build)']}}
    else if(intent.label==='Weigh Souls'){s=applyStatus(s,'player','haunted',2)}
    else if(intent.label==='Curse'){s=applyStatus(s,'player','corroded',3)}
    else if(intent.label==='Tentacle'){s={...s,hp:s.hp-10,log:[...s.log,'🍝 Tentacle slap! -10 hp']}}
    else if(intent.label==='Blizzard'){s={...s,hp:s.hp-15};s=applyStatus(s,'player','frozen',1)}
    else if(intent.label==='AoE Slam'){s={...s,hp:s.hp-15,log:[...s.log,'💥 AoE Slam! -15 hp']}}
  }
  s={...s,enemy:{...s.enemy,intentIndex:(s.enemy.intentIndex+1)%s.enemy.intents.length}}
  s=tickStatuses(s)
  return s
}

// ============================================================
// INITIAL STATE
// ============================================================
function makeInitialState() {
  const deck=shuffle(makeDeck(STARTER_CARDS))
  const fragments=JSON.parse(localStorage.getItem('kadlub_fragments')||'[]')
  return {
    screen:'map',
    hp:70,maxHp:70,gold:50,energy:3,maxEnergy:3,
    deck:deck.slice(5),hand:deck.slice(0,5),
    discardPile:[],exhaustPile:[],
    mapPosition:0,visitedNodes:new Set([0]),
    floor:0,
    relics:[],
    enemy:null,enemyStatus:{},
    playerArmor:0,playerReflect:0,
    playerStatus:{},
    bonusDmg:0,dmgMultiplier:1,freeCards:0,
    harmonyThisTurn:[],
    battlePhase:'player',
    turnNumber:1,
    lastCardEffect:null,
    log:['Witaj na Kadłubie, Archiwisto.'],
    pendingNode:null,
    rewardCards:[],
    shopCards:[],
    currentEvent:null,
    memoryFragments:fragments,
    enemyDebuff:0,
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function GameScreen() {
  const [state,setState]=useState(()=>makeInitialState())
  
  const go=(updater)=>setState(s=>typeof updater==='function'?updater(s):{...s,...updater})

  // ---- MAP SCREEN ----
  function handleNodeClick(node) {
    if(state.visitedNodes.has(node.id))return
    const accessible=MAP_EDGES.some(([a,b])=>
      (a===state.mapPosition&&b===node.id)||(b===state.mapPosition&&a===node.id))
    if(!accessible)return
    
    go(s=>({...s,mapPosition:node.id,visitedNodes:new Set([...s.visitedNodes,node.id]),floor:s.floor+1}))
    
    setTimeout(()=>{
      if(node.type==='battle'||node.type==='miniboss'||node.type==='boss'||node.type==='finalboss'){
        startBattle(node.enemy)
      } else if(node.type==='camp'){
        go({screen:'camp'})
      } else if(node.type==='shop'){
        const cards=shuffle(CARDS).slice(0,4)
        go({screen:'shop',shopCards:cards})
      } else if(node.type==='treasure'){
        const cards=shuffle(CARDS).slice(0,3)
        go({screen:'treasure',rewardCards:cards})
      } else if(node.type==='loot'){
        go(s=>({...s,gold:s.gold+30,log:[...s.log,'📦 Found 30 gold!']}))
      } else if(node.type==='fountain'){
        go(s=>({...s,hp:Math.min(s.maxHp,s.hp+20),floor:Math.max(0,s.floor-10),log:[...s.log,'💧 Fountain: +20 HP, -10 steps']}))
      } else if(node.type==='event'){
        const ev=node.arc==='nordic'?EVENTS.nordic_event:node.arc==='egyptian'?EVENTS.egyptian_event:EVENTS.greek_event
        go({screen:'event',currentEvent:ev})
      }
    },50)
  }
  
  function startBattle(enemyId) {
    const enemy=initEnemy(enemyId)
    if(!enemy)return
    go(s=>drawCards({...s,screen:'battle',enemy,enemyStatus:{},playerArmor:0,playerReflect:0,
      playerStatus:{},bonusDmg:0,dmgMultiplier:1,freeCards:0,harmonyThisTurn:[],
      battlePhase:'player',turnNumber:1,
      log:[`⚔️ ${enemy.name} pojawia się! (${enemy.maxHp} HP)`]},
      Math.max(0,5-s.hand.length)))
  }

  // ---- BATTLE ----
  function playCard(card) {
    if(state.battlePhase!=='player')return
    const cardCost=Math.max(0,card.cost-(state.playerStatus?.blessed>0?1:0)+(state.playerStatus?.haunted>0?1:0))
    const actualCost=state.freeCards>0?0:cardCost
    if(state.energy<actualCost)return
    
    let s={...state,energy:state.energy-actualCost,
      hand:state.hand.filter(c=>c.instanceId!==card.instanceId),
      discardPile:[...state.discardPile,card],
      harmonyThisTurn:[...state.harmonyThisTurn,card.myth],
      lastCardEffect:card.effect,
      freeCards:Math.max(0,(state.freeCards||0)-(state.freeCards>0?1:0)),
    }
    s=card.effect(s)
    const mythCount=s.harmonyThisTurn.filter(m=>m===card.myth).length
    if(mythCount>=3&&card.resonanceEffect){
      s=card.resonanceEffect(s)
      s={...s,log:[...s.log,`✨ REZONANS! ${card.myth.toUpperCase()}`]}
    } else if(mythCount===2&&card.harmonyEffect){
      s=card.harmonyEffect(s)
      s={...s,log:[...s.log,`🌟 HARMONIA! ${card.myth}`]}
    }
    if(s.enemy&&s.enemy.hp<=0){
      s={...s,battlePhase:'won'}
      setTimeout(()=>endBattle(s),500)
    }
    setState(s)
  }

  function endTurn() {
    if(state.battlePhase!=='player')return
    let s={...state,battlePhase:'enemy',bonusDmg:0,dmgMultiplier:1,freeCards:0,harmonyThisTurn:[]}
    if(s.playerStatus?.frozen>0){
      s={...s,playerStatus:{...s.playerStatus,frozen:s.playerStatus.frozen-1},
        log:[...s.log,'🧊 Zamrożony! Pomijasz turę.']}
    } else {
      s=enemyTurn(s)
    }
    if(s.hp<=0){
      s={...s,screen:'death'}
      setState(s); return
    }
    if(s.enemy&&s.enemy.hp<=0){
      endBattle(s); return
    }
    s=drawCards(s,5-s.hand.length)
    s={...s,energy:s.maxEnergy,battlePhase:'player',turnNumber:s.turnNumber+1}
    setState(s)
  }

  function endBattle(s=state) {
    const goldGain=s.enemy?.isBoss?50:25
    const fragment=s.enemy?.id==='ymir'?STORY_FRAGMENTS[0]:
      s.enemy?.id==='duat'?STORY_FRAGMENTS[1]:
      s.enemy?.id==='ritual_king'?STORY_FRAGMENTS[2]:
      s.enemy?.finalBoss?STORY_FRAGMENTS[3]:null
    
    let frags=[...(s.memoryFragments||[])]
    if(fragment&&!frags.find(f=>f.id===fragment.id)){
      frags.push(fragment)
      try{localStorage.setItem('kadlub_fragments',JSON.stringify(frags))}catch(e){}
    }
    
    const pool=shuffle(CARDS).slice(0,3)
    const newState={...s,gold:s.gold+goldGain,screen:'reward',rewardCards:pool,
      enemy:null,battlePhase:null,memoryFragments:frags,
      log:[`✅ Zwycięstwo! +${goldGain} gold`+(fragment?` | Fragment: "${fragment.title}"`:'')+
        (s.enemy?.finalBoss?' 🎉 KONIEC RUNU!':'')]}
    
    if(s.enemy?.finalBoss){
      setState({...newState,screen:'victory'})
    } else {
      setState(newState)
    }
  }

  function pickReward(card) {
    go(s=>({...s,deck:[...s.deck,{...card,instanceId:`${card.id}_r_${Date.now()}`}],screen:'map'}))
  }

  function skipReward() {
    go(s=>({...s,gold:s.gold+15,screen:'map'}))
  }

  function startNewRun() {
    const frags=state.memoryFragments||[]
    try{localStorage.setItem('kadlub_fragments',JSON.stringify(frags))}catch(e){}
    const newState=makeInitialState()
    setState({...newState,memoryFragments:frags})
  }

  // ============================================================
  // RENDER
  // ============================================================
  if(state.screen==='map') return <MapView state={state} onNodeClick={handleNodeClick}/>
  if(state.screen==='battle') return <BattleView state={state} onPlayCard={playCard} onEndTurn={endTurn}/>
  if(state.screen==='reward') return <RewardView state={state} onPick={pickReward} onSkip={skipReward}/>
  if(state.screen==='camp') return <CampView state={state} onHeal={()=>go(s=>({...s,hp:Math.min(s.maxHp,s.hp+Math.round(s.maxHp*0.3)),screen:'map'}))} onUpgrade={()=>go({screen:'map'})}/>
  if(state.screen==='shop') return <ShopView state={state} onBuy={(card,cost)=>go(s=>({...s,gold:s.gold-cost,deck:[...s.deck,{...card,instanceId:`${card.id}_sh_${Date.now()}`}]}))} onHeal={()=>go(s=>({...s,hp:Math.min(s.maxHp,s.hp+15),gold:s.gold-40,screen:'map'}))} onLeave={()=>go({screen:'map'})}/>
  if(state.screen==='treasure') return <TreasureView state={state} onPick={pickReward}/>
  if(state.screen==='event') return <EventView state={state} onChoice={(effect)=>go(s=>({...effect(s),screen:'map',currentEvent:null}))}/>
  if(state.screen==='death') return <DeathView state={state} onRewind={startNewRun}/>
  if(state.screen==='victory') return <VictoryView state={state} onRewind={startNewRun}/>
  return <div style={{color:'#fff',padding:20}}>Unknown screen: {state.screen}</div>
}

// ============================================================
// MAP VIEW
// ============================================================
function MapView({state,onNodeClick}) {
  const svgW=900,svgH=860
  const accessible=new Set()
  MAP_EDGES.forEach(([a,b])=>{
    if(a===state.mapPosition)accessible.add(b)
    if(b===state.mapPosition)accessible.add(a)
  })
  return (
    <div style={{display:'flex',height:'100%',background:'#0f172a',color:'#e2e8f0',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',gap:16,padding:'8px 16px',background:'#1e293b',borderBottom:'1px solid #334155',flexShrink:0}}>
        <span style={{fontSize:13,color:'#94a3b8'}}>❤️ {state.hp}/{state.maxHp}</span>
        <div style={{flex:1,height:8,background:'#334155',borderRadius:4}}>
          <div style={{width:`${(state.hp/state.maxHp)*100}%`,height:'100%',background:state.hp<20?'#ef4444':'#22c55e',borderRadius:4,transition:'width 0.3s'}}/>
        </div>
        <span style={{fontSize:13,color:'#fbbf24'}}>💰 {state.gold}</span>
        <span style={{fontSize:13,color:'#94a3b8'}}>📚 {state.deck.length+state.hand.length+state.discardPile.length} kart</span>
        <span style={{fontSize:13,color:'#94a3b8'}}>👣 {state.floor}/100</span>
      </div>
      <div style={{flex:1,overflow:'hidden',position:'relative'}}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{width:'100%',height:'100%'}}>
          <rect width={svgW} height={svgH} fill="#0f172a"/>
          {Array.from({length:20}).map((_,i)=>(
            <line key={`gx${i}`} x1={i*50} y1={0} x2={i*50} y2={svgH} stroke="#1e293b" strokeWidth={0.5}/>
          ))}
          {Array.from({length:18}).map((_,i)=>(
            <line key={`gy${i}`} x1={0} y1={i*50} x2={svgW} y2={i*50} stroke="#1e293b" strokeWidth={0.5}/>
          ))}
          {MAP_EDGES.map(([a,b],i)=>{
            const na=MAP_NODES[a],nb=MAP_NODES[b]
            const visited=state.visitedNodes.has(a)&&state.visitedNodes.has(b)
            const live=(a===state.mapPosition&&accessible.has(b))||(b===state.mapPosition&&accessible.has(a))
            return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={visited?'#475569':live?'#60a5fa':'#1e293b'} strokeWidth={live?2:1.5} strokeDasharray={visited?'none':'4,2'}/>
          })}
          {MAP_NODES.map(node=>{
            const visited=state.visitedNodes.has(node.id)
            const current=node.id===state.mapPosition
            const canGo=accessible.has(node.id)&&!visited
            const col=ARC_COLORS[node.arc]||'#475569'
            return (
              <g key={node.id} onClick={()=>onNodeClick(node)} style={{cursor:canGo?'pointer':'default'}}>
                {current&&<circle cx={node.x} cy={node.y} r={22} fill="none" stroke="#fff" strokeWidth={2} opacity={0.5}>
                  <animate attributeName="r" values="20;26;20" dur="2s" repeatCount="indefinite"/>
                </circle>}
                <circle cx={node.x} cy={node.y} r={18}
                  fill={visited?'#1e293b':canGo?col+'33':'#0f172a'}
                  stroke={current?'#fff':visited?'#334155':canGo?col:'#334155'}
                  strokeWidth={current?2.5:1.5} opacity={visited&&!current?0.5:1}/>
                <text x={node.x} y={node.y+6} textAnchor="middle" fontSize={14}>{NODE_ICONS[node.type]||'?'}</text>
                {canGo&&<circle cx={node.x} cy={node.y} r={18} fill="none" stroke={col} strokeWidth={1} opacity={0.4}>
                  <animate attributeName="stroke-opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite"/>
                </circle>}
                <text x={node.x} y={node.y+30} textAnchor="middle" fontSize={9} fill={canGo?'#cbd5e1':'#475569'}>{node.label}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div style={{padding:'6px 12px',background:'#1e293b',borderTop:'1px solid #334155',fontSize:11,color:'#94a3b8',flexShrink:0}}>
        {state.log.slice(-2).map((l,i)=><div key={i}>{l}</div>)}
      </div>
    </div>
  )
}

// ============================================================
// BATTLE VIEW
// ============================================================
function BattleView({state,onPlayCard,onEndTurn}) {
  const intent0=getIntent(state.enemy,0)
  const intent1=getIntent(state.enemy,1)
  const mythCounts={}
  state.harmonyThisTurn.forEach(m=>{mythCounts[m]=(mythCounts[m]||0)+1})
  const maxCombo=Math.max(0,...Object.values(mythCounts))
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#0f172a',color:'#e2e8f0',userSelect:'none'}}>
      <div style={{display:'flex',gap:12,padding:'6px 12px',background:'#1e293b',borderBottom:'1px solid #334155',flexShrink:0}}>
        <span>❤️ {state.hp}/{state.maxHp}</span>
        <div style={{flex:1,height:8,background:'#334155',borderRadius:4,alignSelf:'center'}}>
          <div style={{width:`${(state.hp/state.maxHp)*100}%`,height:'100%',background:state.hp<20?'#ef4444':'#22c55e',borderRadius:4}}/>
        </div>
        {state.playerArmor>0&&<span>🛡️ {state.playerArmor}</span>}
        <StatusBadges statuses={state.playerStatus}/>
        <span style={{color:'#fbbf24'}}>Tura {state.turnNumber}</span>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{flex:'0 0 220px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:16,gap:8,borderBottom:'1px solid #1e293b'}}>
          {state.enemy&&<>
            <div style={{fontSize:48}}>{state.enemy.emoji}</div>
            <div style={{fontSize:16,fontWeight:700}}>{state.enemy.name}</div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{width:200,height:10,background:'#334155',borderRadius:5}}>
                <div style={{width:`${(state.enemy.hp/state.enemy.maxHp)*100}%`,height:'100%',
                  background:state.enemy.hp/state.enemy.maxHp<0.3?'#ef4444':state.enemy.hp/state.enemy.maxHp<0.6?'#f59e0b':'#22c55e',borderRadius:5,transition:'width 0.3s'}}/>
              </div>
              <span style={{fontSize:12,color:'#94a3b8'}}>{state.enemy.hp}/{state.enemy.maxHp}</span>
            </div>
            {state.enemy.armor>0&&<span>🛡️ {state.enemy.armor}</span>}
            <StatusBadges statuses={state.enemyStatus}/>
            <div style={{display:'flex',gap:12,marginTop:4}}>
              {[intent0,intent1].map((intent,i)=>intent&&(
                <div key={i} style={{display:'flex',alignItems:'center',gap:4,padding:'3px 8px',
                  background:i===0?'#1e3a5f':'#0f172a',border:'1px solid #334155',borderRadius:6,fontSize:12}}>
                  <span>{i===0?'▶':'⏭'}</span>
                  <span>{intent.type==='attack'?'⚔️':intent.type==='defense'?'🛡️':'✨'}</span>
                  <span>{intent.val||''} {intent.label||''}</span>
                </div>
              ))}
            </div>
          </>}
        </div>
        <div style={{flex:'0 0 80px',display:'flex',alignItems:'center',gap:16,padding:'0 16px',background:'#0a0f1a'}}>
          <div style={{display:'flex',gap:6}}>
            {Array.from({length:state.maxEnergy}).map((_,i)=>(
              <div key={i} style={{width:28,height:28,borderRadius:'50%',border:'2px solid #3b82f6',
                background:i<state.energy?'#3b82f6':'transparent',transition:'background 0.2s'}}/>
            ))}
          </div>
          {maxCombo>=2&&<div style={{padding:'3px 10px',background:'#7c3aed',borderRadius:6,fontSize:12,fontWeight:700}}>
            {maxCombo>=3?'✨ REZONANS!':'🌟 HARMONIA!'}
          </div>}
          <div style={{flex:1,fontSize:11,color:'#64748b',overflow:'hidden'}}>
            {state.log.slice(-3).map((l,i)=><div key={i} style={{opacity:1-(0.35*(2-i))}}>{l}</div>)}
          </div>
          <button onClick={onEndTurn} disabled={state.battlePhase!=='player'}
            style={{padding:'8px 18px',background:state.battlePhase==='player'?'#ef4444':'#334155',
              color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>
            Koniec tury
          </button>
        </div>
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'8px 12px',overflowX:'auto'}}>
          {state.hand.map(card=><CardUI key={card.instanceId} card={card} state={state} onClick={()=>onPlayCard(card)}/>)}
          {state.hand.length===0&&<div style={{color:'#475569',fontSize:14}}>Pusta ręka — kliknij Koniec tury aby dobrać</div>}
        </div>
      </div>
    </div>
  )
}

function CardUI({card,state,onClick}) {
  const cardCost=Math.max(0,card.cost-(state.playerStatus?.blessed>0?1:0)+(state.playerStatus?.haunted>0?1:0))
  const actualCost=state.freeCards>0?0:cardCost
  const canPlay=state.energy>=actualCost&&state.battlePhase==='player'
  const [hov,setHov]=useState(false)
  return (
    <div onClick={canPlay?onClick:null}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{width:100,minWidth:100,height:140,borderRadius:10,border:`2px solid ${canPlay?card.color:'#334155'}`,
        background:canPlay?`${card.color}22`:'#0f172a',cursor:canPlay?'pointer':'not-allowed',
        display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 6px',gap:4,
        transition:'transform 0.1s,box-shadow 0.1s',
        transform:hov&&canPlay?'translateY(-8px)':'translateY(0)',
        boxShadow:hov&&canPlay?`0 8px 20px ${card.color}66`:'none',
        position:'relative',flexShrink:0}}>
      <div style={{position:'absolute',top:4,left:4,width:20,height:20,borderRadius:'50%',
        background:canPlay?card.color:'#334155',display:'flex',alignItems:'center',justifyContent:'center',
        fontSize:11,fontWeight:700}}>{actualCost}</div>
      <div style={{fontSize:28,marginTop:4}}>{card.emoji}</div>
      <div style={{fontSize:10,fontWeight:700,color:card.color,textAlign:'center',lineHeight:1.2}}>{card.name}</div>
      <div style={{fontSize:9,color:'#94a3b8',textAlign:'center',lineHeight:1.3}}>{card.desc}</div>
      {hov&&card.harmonyDesc&&card.harmonyDesc!=='–'&&<div style={{fontSize:8,color:'#fbbf24',textAlign:'center'}}>🌟 {card.harmonyDesc}</div>}
    </div>
  )
}

function StatusBadges({statuses}) {
  if(!statuses)return null
  const active=Object.entries(statuses).filter(([_,v])=>v>0)
  if(!active.length)return null
  const icons={frozen:'🧊',corroded:'🟤',haunted:'👻',blessed:'✨',burning:'🔥',bleeding:'🩸'}
  return <div style={{display:'flex',gap:3}}>
    {active.map(([k,v])=><span key={k} style={{fontSize:11}}>{icons[k]||k}{v}</span>)}
  </div>
}

// ============================================================
// REWARD VIEW
// ============================================================
function RewardView({state,onPick,onSkip}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:'#0f172a',color:'#e2e8f0',gap:24}}>
      <div style={{fontSize:28,fontWeight:700}}>⭐ Wybierz nagrodę</div>
      <div style={{fontSize:14,color:'#94a3b8'}}>Dodaj kartę do talii lub pomiń za +15 gold</div>
      <div style={{display:'flex',gap:20}}>
        {state.rewardCards.map((card,i)=>(
          <div key={i} onClick={()=>onPick(card)} style={{width:140,padding:16,border:`2px solid ${card.color}`,borderRadius:12,background:`${card.color}11`,cursor:'pointer',textAlign:'center',transition:'transform 0.1s'}}>
            <div style={{fontSize:40}}>{card.emoji}</div>
            <div style={{fontSize:14,fontWeight:700,color:card.color,marginTop:8}}>{card.name}</div>
            <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{card.desc}</div>
            <div style={{fontSize:10,color:'#475569',marginTop:4,fontStyle:'italic'}}>{card.myth.toUpperCase()}</div>
          </div>
        ))}
      </div>
      <button onClick={onSkip} style={{padding:'8px 20px',background:'transparent',border:'1px solid #334155',color:'#94a3b8',borderRadius:8,cursor:'pointer',fontSize:12}}>
        Pomiń (+15 gold)
      </button>
    </div>
  )
}

// ============================================================
// CAMP VIEW
// ============================================================
function CampView({state,onHeal,onUpgrade}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:'#0f172a',color:'#e2e8f0',gap:20}}>
      <div style={{fontSize:36}}>🏕️</div>
      <div style={{fontSize:24,fontWeight:700}}>Obóz</div>
      <div style={{fontSize:14,color:'#94a3b8'}}>Odpocznij lub ulepsz kartę</div>
      <div style={{display:'flex',gap:16}}>
        <button onClick={onHeal} style={{padding:'12px 24px',background:'#16a34a',color:'#fff',border:'none',borderRadius:10,cursor:'pointer',fontSize:14,fontWeight:700}}>
          ❤️ Odpocznij (+{Math.round(state.maxHp*0.3)} HP)
        </button>
        <button onClick={onUpgrade} style={{padding:'12px 24px',background:'#1e293b',color:'#94a3b8',border:'1px solid #334155',borderRadius:10,cursor:'pointer',fontSize:14}}>
          ⬆️ Ulepsz kartę (soon)
        </button>
      </div>
    </div>
  )
}

// ============================================================
// SHOP VIEW
// ============================================================
function ShopView({state,onBuy,onHeal,onLeave}) {
  const canHeal=state.gold>=40
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:'#0f172a',color:'#e2e8f0',gap:20,padding:20}}>
      <div style={{fontSize:36}}>🛒</div>
      <div style={{fontSize:24,fontWeight:700}}>Sklep Kadłubu</div>
      <div style={{fontSize:14,color:'#fbbf24'}}>💰 {state.gold} gold</div>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',justifyContent:'center'}}>
        {state.shopCards.map((card,i)=>{
          const cost=50+i*15
          const canAfford=state.gold>=cost
          return (
            <div key={i} onClick={canAfford?()=>{onBuy(card,cost)}:null}
              style={{width:130,padding:12,border:`2px solid ${canAfford?card.color:'#334155'}`,borderRadius:12,
                background:canAfford?`${card.color}11`:'#0f172a',cursor:canAfford?'pointer':'not-allowed',textAlign:'center'}}>
              <div style={{fontSize:32}}>{card.emoji}</div>
              <div style={{fontSize:13,fontWeight:700,color:card.color}}>{card.name}</div>
              <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>{card.desc}</div>
              <div style={{marginTop:8,fontSize:13,fontWeight:700,color:canAfford?'#fbbf24':'#475569'}}>💰 {cost}</div>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:12}}>
        <button onClick={canHeal?onHeal:null} disabled={!canHeal}
          style={{padding:'8px 16px',background:canHeal?'#16a34a':'#334155',color:'#fff',border:'none',borderRadius:8,cursor:canHeal?'pointer':'not-allowed',fontSize:12}}>
          ❤️ Heal +15 HP (40 gold)
        </button>
        <button onClick={onLeave} style={{padding:'8px 16px',background:'#334155',color:'#94a3b8',border:'none',borderRadius:8,cursor:'pointer',fontSize:12}}>
          Wyjdź
        </button>
      </div>
    </div>
  )
}

// ============================================================
// TREASURE VIEW
// ============================================================
function TreasureView({state,onPick}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:'#0f172a',color:'#e2e8f0',gap:20}}>
      <div style={{fontSize:36}}>💎</div>
      <div style={{fontSize:24,fontWeight:700}}>Skarb</div>
      <div style={{display:'flex',gap:16}}>
        {state.rewardCards.map((card,i)=>(
          <div key={i} onClick={()=>onPick(card)} style={{width:130,padding:14,border:`2px solid ${card.color}`,borderRadius:12,background:`${card.color}11`,cursor:'pointer',textAlign:'center'}}>
            <div style={{fontSize:36}}>{card.emoji}</div>
            <div style={{fontSize:13,fontWeight:700,color:card.color}}>{card.name}</div>
            <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>{card.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// EVENT VIEW
// ============================================================
function EventView({state,onChoice}) {
  const ev=state.currentEvent
  if(!ev)return null
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:'#0f172a',color:'#e2e8f0',gap:20,padding:40}}>
      <div style={{fontSize:24,fontWeight:700}}>{ev.title}</div>
      <div style={{fontSize:15,color:'#94a3b8',maxWidth:500,textAlign:'center',lineHeight:1.6}}>{ev.text}</div>
      <div style={{display:'flex',gap:12,flexDirection:'column',width:'100%',maxWidth:400}}>
        {ev.choices.map((choice,i)=>(
          <button key={i} onClick={()=>onChoice(choice.effect)}
            style={{padding:'12px 20px',background:'#1e293b',color:'#e2e8f0',border:'1px solid #334155',borderRadius:10,cursor:'pointer',fontSize:14,textAlign:'left'}}>
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// DEATH VIEW
// ============================================================
function DeathView({state,onRewind}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:'#0a0a0a',color:'#e2e8f0',gap:20}}>
      <div style={{fontSize:48}}>💀</div>
      <div style={{fontSize:28,fontWeight:700,color:'#ef4444'}}>Rozproszony</div>
      <div style={{fontSize:15,color:'#94a3b8',textAlign:'center',maxWidth:400,lineHeight:1.6}}>
        Archiwista rozproszył się w Kadłubie. Ale pamięć przetrwa.<br/>
        Dotarłeś do nodu #{state.mapPosition}, tura {state.floor}.
      </div>
      {state.memoryFragments?.length>0&&(
        <div style={{padding:16,background:'#1e293b',borderRadius:12,maxWidth:400}}>
          <div style={{fontSize:13,color:'#fbbf24',marginBottom:8}}>📜 Zebrane Fragmenty Pamięci:</div>
          {state.memoryFragments.map(f=>(
            <div key={f.id} style={{fontSize:12,color:'#94a3b8',marginBottom:6,fontStyle:'italic'}}>
              {f.text}
            </div>
          ))}
        </div>
      )}
      <button onClick={onRewind} style={{padding:'12px 32px',background:'#7c3aed',color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontSize:16,fontWeight:700}}>
        🔄 Rewind — Nowy Run
      </button>
    </div>
  )
}

// ============================================================
// VICTORY VIEW
// ============================================================
function VictoryView({state,onRewind}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:'#0f172a',color:'#e2e8f0',gap:20}}>
      <div style={{fontSize:64}}>🏆</div>
      <div style={{fontSize:28,fontWeight:700,color:'#fbbf24'}}>Kadłub Ocalony</div>
      <div style={{fontSize:15,color:'#94a3b8',textAlign:'center',maxWidth:500,lineHeight:1.8}}>
        Spaghetti Monster nasycony. Archipelag spokojny.<br/>
        Na razie.<br/><br/>
        <em style={{color:'#7c3aed'}}>"Archiwista to nie nazwa. To rola. Ktoś musi pamiętać."</em>
      </div>
      <button onClick={onRewind} style={{padding:'12px 32px',background:'#fbbf24',color:'#0f172a',border:'none',borderRadius:12,cursor:'pointer',fontSize:16,fontWeight:700}}>
        🔄 Nowy Run
      </button>
    </div>
  )
}
