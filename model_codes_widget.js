/**
 * SAC Custom Widget — Model Codes Delivery View
 * Web Component (main) — compatible con SAP Analytics Cloud Optimized Stories
 *
 * Feeds esperados en myDataBinding:
 *   feed_material, feed_fecha, feed_docdate, feed_frozen,
 *   feed_yearmonth, feed_cod_texto, feed_cod_fondo, feed_qty
 */

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  :host { display: block; width: 100%; height: 100%; font-family: 'IBM Plex Sans', sans-serif; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .root { padding: 16px; background: #f4f6fa; min-height: 100%; color: #1a2233; }

  .widget-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #d1d9e6; flex-wrap: wrap; gap: 10px; }
  .widget-title  { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
  .widget-subtitle { font-size: 10px; color: #8a9ab5; font-family: 'IBM Plex Mono', monospace; margin-top: 2px; }

  .legend { display: flex; gap: 16px; flex-wrap: wrap; }
  .legend-group { display: flex; flex-direction: column; gap: 3px; }
  .legend-group-title { font-size: 9px; font-family: 'IBM Plex Mono', monospace; text-transform: uppercase; letter-spacing: 0.12em; color: #8a9ab5; }
  .legend-items { display: flex; gap: 8px; flex-wrap: wrap; }
  .legend-item  { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #4a5568; font-family: 'IBM Plex Mono', monospace; }
  .legend-dot   { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .legend-swatch{ width: 13px; height: 9px; border-radius: 2px; border: 1px solid #b0bcd4; flex-shrink: 0; }
  .ld-txt1 { background: #c0392b; }
  .ld-txt2 { background: #1a6bb5; }
  .ld-txt3 { background: #1e8449; }
  .ld-bg2  { background: #e8ecf0; }
  .ld-bg4  { background: #fde8e8; border-color: #e8a0a0; }

  .state-msg { display: flex; align-items: center; justify-content: center; height: 80px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8a9ab5; letter-spacing: 0.1em; }
  .state-msg.error { color: #c0392b; }

  .table-wrapper { overflow-x: auto; background: #fff; border-radius: 8px; border: 1px solid #d1d9e6; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  table { border-collapse: collapse; width: 100%; min-width: 600px; }

  thead tr.header-row-1 th { background: #1a3a5c; color: #e8f0fb; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; padding: 8px 10px; text-align: center; border-right: 1px solid rgba(255,255,255,0.12); white-space: nowrap; }
  thead tr.header-row-1 th.dim-header { text-align: left; border-right: 2px solid rgba(255,255,255,0.25); }
  thead tr.header-row-2 th { background: #2d5f9a; color: #e8f0fb; font-family: 'IBM Plex Mono', monospace; font-size: 10px; padding: 5px 10px; text-align: center; border-right: 1px solid rgba(255,255,255,0.1); border-bottom: 2px solid #b0bcd4; white-space: nowrap; }
  thead tr.header-row-2 th.dim-header { text-align: left; border-right: 2px solid rgba(255,255,255,0.25); }

  tbody tr { border-bottom: 1px solid #d1d9e6; }
  tbody tr:nth-child(odd)  { background: #fff; }
  tbody tr:nth-child(even) { background: #f7f9fc; }
  tbody tr:hover { background: #eef3fb !important; }
  tbody tr:last-child { border-bottom: none; }

  td.dim-cell { padding: 8px 10px; font-size: 12px; white-space: nowrap; border-right: 2px solid #d1d9e6; }
  td.dim-cell.material { font-weight: 600; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #1a3a5c; min-width: 100px; }
  td.dim-cell.date     { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4a5568; min-width: 90px; }
  td.dim-cell.frozen   { font-family: 'IBM Plex Mono', monospace; font-size: 11px; min-width: 90px; }
  td.dim-cell.frozen-active { color: #c0392b; font-weight: 500; }

  td.qty-cell { padding: 0; text-align: right; border-right: 1px solid #d1d9e6; min-width: 90px; }
  td.qty-cell:last-child { border-right: none; }
  .qty-inner { display: flex; align-items: center; justify-content: flex-end; padding: 8px 10px; height: 100%; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500; }
  .qty-inner.empty { color: #8a9ab5; font-weight: 400; }

  .widget-footer { margin-top: 10px; display: flex; justify-content: space-between; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #8a9ab5; flex-wrap: wrap; gap: 4px; }

  /* Tooltip */
  .tooltip { position: fixed; background: #1a2233; border: 1px solid #2d3a52; border-radius: 6px; padding: 9px 13px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #e8f0fb; pointer-events: none; z-index: 9999; opacity: 0; transition: opacity 0.12s; box-shadow: 0 8px 24px rgba(0,0,0,0.3); white-space: nowrap; }
  .tooltip.visible { opacity: 1; }
  .tt-title { color: #6b7c99; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .tt-row   { display: flex; gap: 10px; margin-bottom: 3px; }
  .tt-label { color: #6b7c99; min-width: 90px; }
  .tt-value { font-weight: 500; }
  .tt-red   { color: #e87070; }
  .tt-blue  { color: #6baee8; }
  .tt-green { color: #5dbf7a; }
  .tt-gray  { color: #8a9ab5; }
</style>

<div class="root">
  <div class="widget-header">
    <div>
      <div class="widget-title">Model Codes — Delivery View</div>
      <div class="widget-subtitle">Quantity · text color by Código Texto · bg color by Código Fondo</div>
    </div>
    <div class="legend">
      <div class="legend-group">
        <div class="legend-group-title">Texto (color)</div>
        <div class="legend-items">
          <div class="legend-item"><div class="legend-dot ld-txt1"></div>Código 1</div>
          <div class="legend-item"><div class="legend-dot ld-txt2"></div>Código 2</div>
          <div class="legend-item"><div class="legend-dot ld-txt3"></div>Código 3</div>
        </div>
      </div>
      <div class="legend-group">
        <div class="legend-group-title">Fondo</div>
        <div class="legend-items">
          <div class="legend-item"><div class="legend-swatch ld-bg2"></div>Código 2</div>
          <div class="legend-item"><div class="legend-swatch ld-bg4"></div>Código 4</div>
        </div>
      </div>
    </div>
  </div>

  <div class="state-msg" id="stateMsg">Cargando datos…</div>

  <div class="table-wrapper" id="tableWrapper" style="display:none;">
    <table>
      <thead>
        <tr class="header-row-1" id="headerRow1"></tr>
        <tr class="header-row-2" id="headerRow2"></tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <div class="widget-footer">
    <span>SAC Custom Widget · Model Codes</span>
    <span id="footerSummary"></span>
  </div>
</div>

<div class="tooltip" id="tooltip"></div>
`;

// ── Color maps ────────────────────────────────────────────────
const TEXT_COLOR   = { '1':'#c0392b', '2':'#1a6bb5', '3':'#1e8449' };
const BG_COLOR     = { '2':'#e8ecf0', '4':'#fde8e8' };
const DEFAULT_TEXT = '#1a2233';
const DEFAULT_BG   = 'transparent';

class ModelCodesWidget extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this._rows      = [];
    this._periods   = [];
    this._rowGroups = [];
    this._ready     = false;
  }

  connectedCallback() {
    this._ready = true;
    this._loadDemoData();
  }

  // ── SAC Lifecycle ─────────────────────────────────────────────
  onCustomWidgetBeforeUpdate(changedProperties) {
    this._showState('Cargando…', false);
  }

  onCustomWidgetAfterUpdate(changedProperties) {
    try {
      const db = this.dataBinding ?? this.myDataBinding ?? null;
      if (!db) { this._loadDemoData(); return; }
      const rows = this._extractRows(db);
      if (!rows || rows.length === 0) {
        this._showState('Sin datos. Verifica el data binding y los filtros.', true);
        return;
      }
      this._processRows(rows);
      this._renderTable();
    } catch (err) {
      console.error('[ModelCodesWidget]', err);
      this._showState('Error: ' + err.message, true);
    }
  }

  // ── Data extraction ───────────────────────────────────────────
  _extractRows(db) {
    // SAC passes dataBinding as the object — try myDataBinding first
    const binding = db.myDataBinding ?? db;
    const data    = Array.isArray(binding) ? binding : (binding.data ?? []);

    if (!Array.isArray(data) || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const feedVal = (row, id) => {
      const k = keys.find(k => k.startsWith(id));
      return k ? row[k] : undefined;
    };

    return data.map(row => {
      const qtyItem = feedVal(row, 'feed_qty');
      return {
        material:  this._label(feedVal(row, 'feed_material')),
        fecha:     this._label(feedVal(row, 'feed_fecha')),
        docDate:   this._label(feedVal(row, 'feed_docdate')),
        frozen:    this._label(feedVal(row, 'feed_frozen')),
        yearMonth: this._label(feedVal(row, 'feed_yearmonth')),
        qty:       qtyItem?.rawValue ?? qtyItem?.raw ?? null,
        codTexto:  String(this._label(feedVal(row, 'feed_cod_texto'))).trim(),
        codFondo:  String(this._label(feedVal(row, 'feed_cod_fondo'))).trim(),
      };
    });
  }

  _label(item) {
    if (!item && item !== 0) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return item.label ?? item.id ?? item.formattedValue ?? item.rawValue ?? '';
  }

  // ── Data processing ───────────────────────────────────────────
  _processRows(rows) {
    this._rows = rows;
    const periodSet = new Map();
    rows.forEach(r => { if (!periodSet.has(r.yearMonth)) periodSet.set(r.yearMonth, periodSet.size); });
    this._periods = [...periodSet.keys()];

    const groupMap = new Map();
    rows.forEach(r => {
      const key = [r.material, r.fecha, r.docDate, r.frozen].join('||');
      if (!groupMap.has(key)) groupMap.set(key, { material:r.material, fecha:r.fecha, docDate:r.docDate, frozen:r.frozen, cells:{} });
      groupMap.get(key).cells[r.yearMonth] = { qty:r.qty, codTexto:r.codTexto, codFondo:r.codFondo };
    });
    this._rowGroups = [...groupMap.values()];
  }

  // ── Render ────────────────────────────────────────────────────
  _renderTable() {
    if (this._rowGroups.length === 0) { this._showState('Sin datos.', false); return; }
    this._hideState();

    const hr1   = this._shadow.getElementById('headerRow1');
    const hr2   = this._shadow.getElementById('headerRow2');
    const tbody = this._shadow.getElementById('tableBody');
    hr1.innerHTML = ''; hr2.innerHTML = ''; tbody.innerHTML = '';

    const DIMS = ['Material', 'Fecha Entrega', 'Document Date', 'Frozen End'];

    DIMS.forEach(h => {
      const th = document.createElement('th'); th.textContent = h; th.className = 'dim-header';
      hr1.appendChild(th);
      const th2 = document.createElement('th'); th2.className = 'dim-header';
      hr2.appendChild(th2);
    });

    const thM = document.createElement('th');
    thM.textContent = 'Measures — Quantity'; thM.colSpan = this._periods.length;
    hr1.appendChild(thM);

    this._periods.forEach(p => {
      const th = document.createElement('th'); th.textContent = p; hr2.appendChild(th);
    });

    const today = new Date();

    this._rowGroups.forEach(group => {
      const tr = document.createElement('tr');
      const frozenDate   = this._parseDate(group.frozen);
      const frozenActive = frozenDate && frozenDate >= today;

      [
        { val: group.material, cls: 'material' },
        { val: group.fecha,    cls: 'date'     },
        { val: group.docDate,  cls: 'date'     },
        { val: group.frozen,   cls: 'frozen' + (frozenActive ? ' frozen-active' : '') },
      ].forEach(({ val, cls }) => {
        const td = document.createElement('td');
        td.className = `dim-cell ${cls}`; td.textContent = val || '—';
        tr.appendChild(td);
      });

      this._periods.forEach(p => {
        const cell  = group.cells[p];
        const tdC   = document.createElement('td'); tdC.className = 'qty-cell';
        const inner = document.createElement('div'); inner.className = 'qty-inner';

        if (!cell || cell.qty === null || cell.qty === undefined) {
          inner.textContent = '–'; inner.classList.add('empty');
          inner.style.background = DEFAULT_BG; inner.style.color = DEFAULT_TEXT;
        } else {
          inner.textContent      = typeof cell.qty === 'number'
            ? cell.qty.toLocaleString('es-ES', { minimumFractionDigits:0, maximumFractionDigits:3 })
            : cell.qty;
          inner.style.color      = TEXT_COLOR[cell.codTexto] ?? DEFAULT_TEXT;
          inner.style.background = BG_COLOR[cell.codFondo]   ?? DEFAULT_BG;
          inner.addEventListener('mouseenter', e => this._showTooltip(e, group, p, cell));
          inner.addEventListener('mousemove',  e => this._moveTooltip(e));
          inner.addEventListener('mouseleave', () => this._hideTooltip());
        }
        tdC.appendChild(inner); tr.appendChild(tdC);
      });

      tbody.appendChild(tr);
    });

    const colored = this._rows.filter(r => r.codTexto || r.codFondo).length;
    this._shadow.getElementById('footerSummary').textContent =
      `${this._rowGroups.length} filas · ${this._periods.length} períodos · ${colored} celdas con código`;
  }

  // ── Demo data ─────────────────────────────────────────────────
  _loadDemoData() {
    this._processRows([
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'September 2025', qty:null,  codTexto:'',  codFondo:'4' },
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'November 2025',  qty:10342, codTexto:'1', codFondo:''  },
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'September 2026', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'September 2025', qty:19500, codTexto:'3', codFondo:'2' },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'November 2025',  qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'September 2026', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'September 2025', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'November 2025',  qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'September 2026', qty:20897, codTexto:'2', codFondo:'4' },
    ]);
    this._renderTable();
  }

  // ── Tooltip ───────────────────────────────────────────────────
  _showTooltip(e, group, period, cell) {
    const tt       = this._shadow.getElementById('tooltip');
    const txtClass = { '1':'tt-red','2':'tt-blue','3':'tt-green' }[cell.codTexto] ?? 'tt-gray';
    const bgClass  = cell.codFondo === '4' ? 'tt-red' : cell.codFondo ? 'tt-gray' : 'tt-gray';
    const qty      = typeof cell.qty === 'number'
      ? cell.qty.toLocaleString('es-ES', { minimumFractionDigits:0, maximumFractionDigits:3 })
      : cell.qty;

    tt.innerHTML = `
      <div class="tt-title">${group.material} · ${period}</div>
      <div class="tt-row"><span class="tt-label">Quantity</span><span class="tt-value">${qty}</span></div>
      <div class="tt-row"><span class="tt-label">Fecha Entrega</span><span class="tt-value">${group.fecha||'—'}</span></div>
      <div class="tt-row"><span class="tt-label">Frozen End</span><span class="tt-value">${group.frozen||'—'}</span></div>
      <div class="tt-row"><span class="tt-label">Cód. Texto</span><span class="tt-value ${txtClass}">${cell.codTexto ? 'Código '+cell.codTexto : 'Sin código'}</span></div>
      <div class="tt-row"><span class="tt-label">Cód. Fondo</span><span class="tt-value ${bgClass}">${cell.codFondo ? 'Código '+cell.codFondo : 'Sin código'}</span></div>
    `;
    tt.classList.add('visible');
    this._moveTooltip(e);
  }
  _moveTooltip(e) {
    const tt = this._shadow.getElementById('tooltip');
    tt.style.left = Math.min(e.clientX + 16, window.innerWidth - 300) + 'px';
    tt.style.top  = Math.max(e.clientY - 10, 8) + 'px';
  }
  _hideTooltip() { this._shadow.getElementById('tooltip').classList.remove('visible'); }

  // ── Helpers ───────────────────────────────────────────────────
  _parseDate(str) {
    if (!str) return null;
    const d = new Date(str);
    if (!isNaN(d)) return d;
    const p = str.split('.');
    return p.length === 3 ? new Date(`${p[2]}-${p[1]}-${p[0]}`) : null;
  }

  _showState(msg, isError) {
    const el = this._shadow.getElementById('stateMsg');
    el.textContent = msg; el.className = 'state-msg' + (isError ? ' error' : '');
    el.style.display = 'flex';
    this._shadow.getElementById('tableWrapper').style.display = 'none';
  }
  _hideState() {
    this._shadow.getElementById('stateMsg').style.display = 'none';
    this._shadow.getElementById('tableWrapper').style.display = '';
  }
}

customElements.define('com-yourcompany-modelcodes', ModelCodesWidget);
