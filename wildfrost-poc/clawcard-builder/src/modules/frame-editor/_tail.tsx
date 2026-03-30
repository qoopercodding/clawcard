            <img ref={imgRef} src={imgSrc} alt="Frame" className="fe-frame-img" draggable={false} />
            {renderOverlay()}
          </div>
        ) : (
          <div className="fe-empty">
            <div className="fe-empty__icon">🖼</div>
            <div className="fe-empty__title">{mode==='new'&&!newTypeName?'Najpierw wpisz nazwę nowego typu':'Wgraj PNG ramki żeby zacząć'}</div>
            <div className="fe-empty__hint">{mode==='new'?'Wgraj PNG przez drag&drop':'Użyj przycisków "Wczytaj szybko" lub przeciągnij własny PNG.'}</div>
          </div>
        )}
      </main>

      {/* ── VERSION BADGE ── */}
      <div style={{
        position:'fixed', bottom:8, right:8, zIndex:9999,
        background:'#1a1208cc', border:'1px solid #3a2510',
        borderRadius:4, padding:'3px 8px',
        fontSize:10, color:'#6a5040', fontFamily:'monospace',
        pointerEvents:'none', userSelect:'none',
      }}>
        Frame Editor · v1.4 · 2026-03-30
      </div>
    </div>
  )
}
