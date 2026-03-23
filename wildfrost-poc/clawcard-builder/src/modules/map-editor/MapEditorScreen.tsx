import { useRef, useEffect, useState, useCallback } from 'react'

const NODE_COLORS: Record<string,string> = {
  battle:'#9090aa', miniboss:'#E2873A', boss:'#E2C23A',
  camp:'#4CAF50', fountain:'#378ADD', shop:'#F4C700',
  loot:'#A67C52', event:'#8B5CF6', portal:'#3B82F6',
  start:'#ffffff', finalboss:'#cc2266'
}
const NODE_EMOJI: Record<string,string> = {
  battle:'⚔', miniboss:'💀', boss:'👑', camp:'🏕',
  fountain:'💧', shop:'🛍', loot:'📦', event:'📜',
  portal:'🌀', start:'🚩', finalboss:'🍝'
}
const NODE_SIZE: Record<string,number> = {
  battle:18, miniboss:24, boss:28, camp:20, fountain:18,
  shop:20, loot:20, event:18, portal:20, start:22, finalboss:32
}

interface MapNode {
  id:number; type:string; label:string; x:number; y:number
  note:string; img?:string
}
interface MapEdge { id:number; from:number; to:number }

let _nid = 1
let _eid = 1

function buildDefault(): { nodes: MapNode[]; edges: MapEdge[] } {
  _nid = 1; _eid = 1
  const nodes: MapNode[] = []
  const edges: MapEdge[] = []
  const CX=700, CY=460, RX=500, RY=360

  function n(type:string, label:string, deg:number, dx=0, dy=0): number {
    const r = deg*Math.PI/180
    nodes.push({id:_nid++,type,label,x:CX+RX*Math.cos(r)+dx,y:CY+RY*Math.sin(r)+dy,note:''})
    return _nid-1
  }
  function e(a:number,b:number){ edges.push({id:_eid++,from:a,to:b}) }

  // START at 12:30 = ~75deg, Final Boss at 11:30 = ~55deg
  const nStart = n('start','START',75)
  const nFB    = n('finalboss','Flying Spaghetti\nMonster',55)

  // ARC 1 — NORDIC (75 → 165)
  const n1  = n('battle','Draugr Patrol',90)
  const n2  = n('battle','Frozen Scouts',105)
  const n3  = n('miniboss','Jotun Warlord\n❄ Fury Stack',120)
  // before boss: branch camp vs fountain
  const n4a = n('camp','Longhouse\n+steps +hp',137,-30,20)
  const n4b = n('fountain','Frozen Well\n+steps',137,30,-20)
  const n5  = n('boss','Ymir Fragment\n👑 Nordic Boss',155)

  // ARC 2 — EGYPTIAN (165 → 255)
  const n6  = n('battle','Ushabti Guard',175)
  const n7  = n('battle','Sand Shade',190)
  const n8  = n('miniboss','Devourer\n☥ Deck Eater',205)
  const n9  = n('shop','Tomb Merchant',220)
  const n10a = n('camp','Oasis Camp\n+steps +hp',235,-35,15)
  const n10b = n('fountain','Sacred Spring\n+steps',235,35,-15)
  const n11 = n('boss','Duat Guardian\n👑 Egyptian Boss',250)

  // ARC 3 — JAPANESE/MESO (255 → 345)
  const n12 = n('battle','Tsukumogami',265)
  const n13 = n('battle','Jade Warrior',278)
  const n14 = n('miniboss','Ritual Priest\n🎴 Object Memory',292)
  const n15 = n('portal','Ancient Portal',305)
  const n16a = n('camp','Temple Rest\n+steps +hp',320,-30,-15)
  const n16b = n('loot','Hidden Cache',320,30,15)
  const n17 = n('boss','Ritual King\n👑 Meso Boss',338)

  // ARC 4 — GREEK (345 → 55)
  const n18 = n('battle','Titan Shard',355)
  const n19 = n('battle','Fallen Olympian',10)
  const n20 = n('miniboss','Titan Hand\n⚡ Rage Titan',22)
  const n21a = n('camp','Ruins Camp\n+steps +hp',38,-30,-20)
  const n21b = n('fountain','Ichor Spring\n+steps',38,30,20)
  const n22 = n('event','Olympus Gates\nFallen',50)

  // branch from nordic n2
  const nb1 = n('loot','Frozen Cache',97, 0, 70)
  const nb2 = n('battle','Ice Troll',110, 0, 75)

  // branch from egyptian n7
  const nb3 = n('event','Cursed Scroll',195, 55, 0)
  const nb4 = n('shop','Black Market',215, 60, 0)

  // branch from japanese n13
  const nb5 = n('battle','Ghost Blade',282, 0, -65)
  const nb6 = n('loot','Spirit Chest',295, 0, -70)

  // main ring
  e(nStart,n1); e(n1,n2); e(n2,n3); e(n3,n4a); e(n3,n4b); e(n4a,n5); e(n4b,n5)
  e(n5,n6); e(n6,n7); e(n7,n8); e(n8,n9); e(n9,n10a); e(n9,n10b); e(n10a,n11); e(n10b,n11)
  e(n11,n12); e(n12,n13); e(n13,n14); e(n14,n15); e(n15,n16a); e(n15,n16b); e(n16a,n17); e(n16b,n17)
  e(n17,n18); e(n18,n19); e(n19,n20); e(n20,n21a); e(n20,n21b); e(n21a,n22); e(n21b,n22)
  e(n22,nFB); e(nFB,nStart)

  // branches
  e(n2,nb1); e(nb1,nb2); e(nb2,n3)
  e(n7,nb3); e(nb3,nb4); e(nb4,n9)
  e(n13,nb5); e(nb5,nb6); e(nb6,n15)

  return { nodes, edges }
}

const TYPES = ['battle','miniboss','boss','camp','fountain','shop','loot','event','portal','start','finalboss']

export default function MapEditorScreen() {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ nodes:[] as MapNode[], edges:[] as MapEdge[], vx:0, vy:0, vz:1 })
  const [sel, setSel] = useState<MapNode|null>(null)
  const [hov, setHov] = useState<number|null>(null)
  const [connecting, setConnecting] = useState<number|null>(null)
  const [tool, setTool] = useState<'select'|'pan'|'deledge'>('select')
  const drag = useRef<{node:MapNode,ox:number,oy:number}|null>(null)
  const pan  = useRef<{sx:number,sy:number,vx0:number,vy0:number}|null>(null)
  const imgs = useRef<Record<number,HTMLImageElement>>({})

  const s2w = (sx:number,sy:number) => {
    const {vx,vy,vz}=stateRef.current
    return {x:(sx-vx)/vz, y:(sy-vy)/vz}
  }
  const w2s = (wx:number,wy:number) => {
    const {vx,vy,vz}=stateRef.current
    return {x:wx*vz+vx, y:wy*vz+vy}
  }

  const draw = useCallback(() => {
    const cv = cvRef.current; if(!cv) return
    const ctx = cv.getContext('2d')!
    const {nodes,edges,vx,vy,vz} = stateRef.current
    const W=cv.width, H=cv.height
    ctx.clearRect(0,0,W,H)

    // grid
    ctx.save()
    ctx.strokeStyle='rgba(60,55,90,0.25)'; ctx.lineWidth=0.5
    const gs=40*vz, ox=((vx%gs)+gs)%gs, oy=((vy%gs)+gs)%gs
    for(let x=ox;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    for(let y=oy;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    ctx.restore()

    ctx.save(); ctx.translate(vx,vy); ctx.scale(vz,vz)

    // edges
    for(const e of edges){
      const a=nodes.find(n=>n.id===e.from), b=nodes.find(n=>n.id===e.to)
      if(!a||!b) continue
      const dx=b.x-a.x, dy=b.y-a.y, len=Math.sqrt(dx*dx+dy*dy)
      if(len<1) continue
      const nx=dx/len, ny=dy/len
      const sz=(NODE_SIZE[b.type]||20)+3
      const ex=b.x-nx*sz, ey=b.y-ny*sz
      const mx=(a.x+b.x)/2-dy*0.08, my=(a.y+b.y)/2+dx*0.08
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.quadraticCurveTo(mx,my,ex,ey)
      ctx.strokeStyle = tool==='deledge' ? 'rgba(220,80,80,0.5)' : 'rgba(120,100,180,0.45)'
      ctx.lineWidth=1.5; ctx.stroke()
      const ang=Math.atan2(ey-my,ex-mx)
      ctx.beginPath(); ctx.moveTo(ex,ey)
      ctx.lineTo(ex-7*Math.cos(ang-0.4),ey-7*Math.sin(ang-0.4))
      ctx.lineTo(ex-7*Math.cos(ang+0.4),ey-7*Math.sin(ang+0.4))
      ctx.closePath(); ctx.fillStyle='rgba(120,100,180,0.55)'; ctx.fill()
    }

    // nodes
    for(const n of nodes){
      const sz=NODE_SIZE[n.type]||20
      const col=NODE_COLORS[n.type]||'#888'
      const isSel = sel?.id===n.id
      const isHov = hov===n.id
      const isConn = connecting===n.id

      if(isHov||isSel||isConn){
        ctx.beginPath(); ctx.arc(n.x,n.y,sz+8,0,Math.PI*2)
        ctx.fillStyle = isConn?'rgba(80,200,80,0.15)':isSel?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.07)'
        ctx.fill()
      }

      if(imgs.current[n.id]){
        ctx.save(); ctx.beginPath(); ctx.arc(n.x,n.y,sz,0,Math.PI*2); ctx.clip()
        ctx.drawImage(imgs.current[n.id],n.x-sz,n.y-sz,sz*2,sz*2); ctx.restore()
        ctx.beginPath(); ctx.arc(n.x,n.y,sz,0,Math.PI*2)
        ctx.strokeStyle=col; ctx.lineWidth=2; ctx.stroke()
      } else {
        ctx.beginPath(); ctx.arc(n.x,n.y,sz,0,Math.PI*2)
        ctx.fillStyle=col+'25'; ctx.fill()
        ctx.strokeStyle=col; ctx.lineWidth=isSel?2.5:1.5; ctx.stroke()
        ctx.font=`${sz*0.95}px sans-serif`
        ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText(NODE_EMOJI[n.type]||'?',n.x,n.y+1)
      }

      // hover connect button
      if(isHov && tool==='select' && !connecting){
        ctx.beginPath(); ctx.arc(n.x+sz+2,n.y-sz-2,9,0,Math.PI*2)
        ctx.fillStyle='#4CAF50'; ctx.fill()
        ctx.font='bold 13px sans-serif'; ctx.fillStyle='white'
        ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText('+',n.x+sz+2,n.y-sz-1)
      }

      // label (multiline)
      if(n.label){
        const lines=n.label.split('\n')
        ctx.font=`${Math.max(9,sz*0.48)}px sans-serif`
        ctx.fillStyle='rgba(210,200,255,0.9)'
        ctx.textAlign='center'
        lines.forEach((line,i)=>{
          ctx.fillText(line,n.x,n.y+sz+5+i*11)
        })
      }
    }

    ctx.restore()
  }, [sel, hov, connecting, tool])

  useEffect(() => {
    const def = buildDefault()
    stateRef.current.nodes = def.nodes
    stateRef.current.edges = def.edges
    fitView()
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current; if(!wrap) return
    const ro = new ResizeObserver(() => {
      const cv=cvRef.current; if(!cv) return
      cv.width=wrap.clientWidth; cv.height=wrap.clientHeight; draw()
    })
    ro.observe(wrap)
    return ()=>ro.disconnect()
  }, [draw])

  useEffect(()=>{ draw() }, [draw, sel, hov, connecting, tool])

  function fitView(){
    const {nodes}=stateRef.current; if(!nodes.length) return
    const wrap=wrapRef.current; if(!wrap) return
    const xs=nodes.map(n=>n.x), ys=nodes.map(n=>n.y)
    const minX=Math.min(...xs)-60, maxX=Math.max(...xs)+60
    const minY=Math.min(...ys)-60, maxY=Math.max(...ys)+60
    const W=wrap.clientWidth, H=wrap.clientHeight
    const nz=Math.min(W/(maxX-minX),H/(maxY-minY),2)*0.88
    stateRef.current.vz=nz
    stateRef.current.vx=W/2-(minX+maxX)/2*nz
    stateRef.current.vy=H/2-(minY+maxY)/2*nz
    draw()
  }

  function nodeAt(sx:number,sy:number):MapNode|null{
    const {nodes}=stateRef.current
    const w=s2w(sx,sy)
    for(let i=nodes.length-1;i>=0;i--){
      const n=nodes[i], sz=(NODE_SIZE[n.type]||20)+4
      if((w.x-n.x)**2+(w.y-n.y)**2<=sz*sz) return n
    }
    return null
  }

  function plusBtnAt(sx:number,sy:number):MapNode|null{
    const {nodes,vz}=stateRef.current
    for(const n of nodes){
      const sz=NODE_SIZE[n.type]||20
      const bp=w2s(n.x+sz+2,n.y-sz-2)
      const dx=sx-bp.x, dy=sy-bp.y
      if(dx*dx+dy*dy<=(9*vz+3)**2) return n
    }
    return null
  }

  function edgeNear(sx:number,sy:number){
    const {nodes,edges}=stateRef.current
    const w=s2w(sx,sy)
    for(const e of edges){
      const a=nodes.find(n=>n.id===e.from), b=nodes.find(n=>n.id===e.to)
      if(!a||!b) continue
      const dx=b.x-a.x, dy=b.y-a.y, len=dx*dx+dy*dy
      if(len<1) continue
      const t=((w.x-a.x)*dx+(w.y-a.y)*dy)/len
      if(t<0||t>1) continue
      const px=a.x+t*dx-w.x, py=a.y+t*dy-w.y
      if(px*px+py*py<64) return e
    }
    return null
  }

  const onMouseDown=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    const rect=cvRef.current!.getBoundingClientRect()
    const sx=e.clientX-rect.left, sy=e.clientY-rect.top

    if(tool==='deledge'){
      const ed=edgeNear(sx,sy)
      if(ed){ stateRef.current.edges=stateRef.current.edges.filter(x=>x.id!==ed.id); draw() }
      return
    }

    // check + button first
    if(tool==='select' && !connecting){
      const pb=plusBtnAt(sx,sy)
      if(pb){ setConnecting(pb.id); return }
    }

    const n=nodeAt(sx,sy)

    if(connecting!==null){
      if(n && n.id!==connecting){
        stateRef.current.edges.push({id:_eid++,from:connecting,to:n.id})
        draw()
      }
      setConnecting(null); return
    }

    if(n && tool==='select'){
      const w2=s2w(sx,sy)
      setSel(n); drag.current={node:n,ox:w2.x-n.x,oy:w2.y-n.y}
    } else {
      setSel(null)
      pan.current={sx,sy,vx0:stateRef.current.vx,vy0:stateRef.current.vy}
    }
  }

  const onMouseMove=(e:React.MouseEvent<HTMLCanvasElement>)=>{
    const rect=cvRef.current!.getBoundingClientRect()
    const sx=e.clientX-rect.left, sy=e.clientY-rect.top

    if(pan.current){
      stateRef.current.vx=pan.current.vx0+(sx-pan.current.sx)
      stateRef.current.vy=pan.current.vy0+(sy-pan.current.sy)
      draw(); return
    }

    if(drag.current){
      const w=s2w(sx,sy)
      drag.current.node.x=w.x-drag.current.ox
      drag.current.node.y=w.y-drag.current.oy
      draw(); return
    }

    const n=nodeAt(sx,sy)
    setHov(n?n.id:null)
  }

  const onMouseUp=()=>{ drag.current=null; pan.current=null }

  const onWheel=(e:React.WheelEvent<HTMLCanvasElement>)=>{
    e.preventDefault()
    const rect=cvRef.current!.getBoundingClientRect()
    const sx=e.clientX-rect.left, sy=e.clientY-rect.top
    const d=e.deltaY<0?1.1:0.91
    const nz=Math.max(0.15,Math.min(3,stateRef.current.vz*d))
    stateRef.current.vx=sx-(sx-stateRef.current.vx)*(nz/stateRef.current.vz)
    stateRef.current.vy=sy-(sy-stateRef.current.vy)*(nz/stateRef.current.vz)
    stateRef.current.vz=nz; draw()
  }

  function addNode(type:string){
    const wrap=wrapRef.current!
    const w=s2w(wrap.clientWidth/2+Math.random()*60-30,wrap.clientHeight/2+Math.random()*60-30)
    const n:MapNode={id:_nid++,type,label:'',x:w.x,y:w.y,note:''}
    stateRef.current.nodes.push(n); setSel(n); draw()
  }

  function deleteSelected(){
    if(!sel) return
    stateRef.current.nodes=stateRef.current.nodes.filter(n=>n.id!==sel.id)
    stateRef.current.edges=stateRef.current.edges.filter(e=>e.from!==sel.id&&e.to!==sel.id)
    delete imgs.current[sel.id]; setSel(null); draw()
  }

  function updateSel(k:keyof MapNode,v:string){
    if(!sel) return
    ;(sel as any)[k]=v
    const n=stateRef.current.nodes.find(x=>x.id===sel.id)
    if(n)(n as any)[k]=v
    setSel({...sel,[k]:v}); draw()
  }

  function uploadImg(inp:HTMLInputElement){
    if(!inp.files?.[0]||!sel) return
    const r=new FileReader()
    r.onload=ev=>{
      const img=new Image(); img.src=ev.target!.result as string
      img.onload=()=>{ imgs.current[sel.id]=img; updateSel('img',img.src) }
    }
    r.readAsDataURL(inp.files[0])
  }

  function exportJSON(){
    const data={
      nodes:stateRef.current.nodes.map(n=>({id:n.id,type:n.type,label:n.label,x:Math.round(n.x),y:Math.round(n.y),note:n.note})),
      edges:stateRef.current.edges.map(e=>({from:e.from,to:e.to}))
    }
    const a=document.createElement('a')
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}))
    a.download='clawcard_map.json'; a.click()
  }

  const cur = tool==='pan'?'grab':connecting!==null?'crosshair':'default'

  return (
    <div style={{display:'flex',height:'100%',fontFamily:'sans-serif',background:'var(--bg,#111)'}}>
      {/* sidebar */}
      <div style={{width:190,flexShrink:0,background:'#1a1a2e',borderRight:'1px solid #2a2a4a',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',borderBottom:'1px solid #2a2a4a'}}>
          <div style={{fontSize:13,fontWeight:600,color:'#c8c0f0'}}>Map Editor</div>
          <div style={{fontSize:10,color:'#6a6a9a',marginTop:2}}>Hover node → + łączy</div>
        </div>

        {/* tools */}
        <div style={{padding:'6px 8px',borderBottom:'1px solid #2a2a4a',display:'flex',gap:4}}>
          {(['select','pan','deledge'] as const).map(t=>(
            <button key={t} onClick={()=>setTool(t)} style={{flex:1,padding:'4px 2px',fontSize:10,border:'1px solid',borderColor:tool===t?'#6060cc':'#2a2a4a',borderRadius:4,background:tool===t?'#2a2a5a':'#111',color:tool===t?'#a0a0ff':'#7070aa',cursor:'pointer'}}>
              {t==='select'?'Move':t==='pan'?'Pan':'Del Edge'}
            </button>
          ))}
        </div>

        {/* add nodes */}
        <div style={{padding:'6px 8px',borderBottom:'1px solid #2a2a4a',overflowY:'auto',flex:1}}>
          <div style={{fontSize:10,color:'#6a6a9a',fontWeight:600,marginBottom:5}}>Add node</div>
          {TYPES.map(t=>(
            <button key={t} onClick={()=>addNode(t)} style={{display:'flex',alignItems:'center',gap:5,width:'100%',padding:'3px 6px',border:'1px solid #2a2a4a',borderRadius:4,background:'#111',cursor:'pointer',marginBottom:3,fontSize:11,color:'#b0b0d0'}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:NODE_COLORS[t],flexShrink:0}}/>
              {t} {NODE_EMOJI[t]}
            </button>
          ))}
        </div>

        {/* detail */}
        {sel ? (
          <div style={{padding:'8px',borderTop:'1px solid #2a2a4a',background:'#12122a'}}>
            <div style={{fontSize:10,color:'#6a6a9a',fontWeight:600,marginBottom:6}}>Edit node #{sel.id}</div>
            <div style={{marginBottom:5}}>
              <div style={{fontSize:10,color:'#6a6a9a',marginBottom:2}}>Label</div>
              <textarea value={sel.label} onChange={e=>updateSel('label',e.target.value)} rows={2} style={{width:'100%',fontSize:11,padding:'3px 5px',background:'#0a0a1a',border:'1px solid #3a3a5a',borderRadius:3,color:'#c0c0e0',resize:'none'}}/>
            </div>
            <div style={{marginBottom:5}}>
              <div style={{fontSize:10,color:'#6a6a9a',marginBottom:2}}>Typ</div>
              <select value={sel.type} onChange={e=>updateSel('type',e.target.value)} style={{width:'100%',fontSize:11,padding:'3px 5px',background:'#0a0a1a',border:'1px solid #3a3a5a',borderRadius:3,color:'#c0c0e0'}}>
                {TYPES.map(t=><option key={t} value={t}>{t} {NODE_EMOJI[t]}</option>)}
              </select>
            </div>
            <div style={{marginBottom:5}}>
              <div style={{fontSize:10,color:'#6a6a9a',marginBottom:2}}>Grafika</div>
              <input type="file" accept="image/*" onChange={e=>uploadImg(e.target)} style={{fontSize:10,color:'#a0a0c0',width:'100%'}}/>
            </div>
            <button onClick={deleteSelected} style={{width:'100%',padding:'4px',border:'1px solid #cc4444',borderRadius:3,background:'transparent',color:'#cc4444',fontSize:11,cursor:'pointer'}}>Usuń node</button>
          </div>
        ) : (
          <div style={{padding:'10px',textAlign:'center',fontSize:10,color:'#4a4a6a',borderTop:'1px solid #2a2a4a'}}>Kliknij node</div>
        )}

        {/* bottom */}
        <div style={{padding:'6px 8px',borderTop:'1px solid #2a2a4a',display:'flex',flexDirection:'column',gap:3}}>
          <button onClick={fitView} style={{padding:'4px',border:'1px solid #2a2a4a',borderRadius:3,background:'#111',color:'#8080b0',fontSize:10,cursor:'pointer'}}>Fit widok</button>
          <button onClick={()=>{const d=buildDefault();stateRef.current.nodes=d.nodes;stateRef.current.edges=d.edges;setSel(null);fitView()}} style={{padding:'4px',border:'1px solid #2a2a4a',borderRadius:3,background:'#111',color:'#8080b0',fontSize:10,cursor:'pointer'}}>Reset layout</button>
          <button onClick={exportJSON} style={{padding:'4px',border:'1px solid #3a3a6a',borderRadius:3,background:'#1a1a4a',color:'#9090d0',fontSize:10,cursor:'pointer'}}>Export JSON ↗</button>
        </div>
      </div>

      {/* canvas */}
      <div ref={wrapRef} style={{flex:1,position:'relative',overflow:'hidden',background:'#090914'}}>
        <canvas ref={cvRef} style={{position:'absolute',top:0,left:0,cursor:cur}}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp} onWheel={onWheel}/>
        <div style={{position:'absolute',bottom:8,left:8,fontSize:10,color:'rgba(150,140,200,0.5)',pointerEvents:'none'}}>
          Scroll=zoom · Drag tło=pan · Hover node → + connect
          {connecting!==null && <span style={{color:'#4CAF50',marginLeft:8}}>● Wybierz cel połączenia...</span>}
        </div>
      </div>
    </div>
  )
}
