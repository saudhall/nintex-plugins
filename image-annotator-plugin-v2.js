/**
 * Nintex Form Plugin: Image Annotator v2
 * Enhanced annotation tools: pencil, line, arrow, rectangle, highlight, text, eraser
 * Colours: Red, Green, Blue, Orange, Purple
 *
 * REGISTRATION DETAILS:
 *   Element name: org-image-annotator-v2
 *   Source URL:   https://saudhall.github.io/nintex-plugins/image-annotator-plugin-v2.js
 */

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class OrgImageAnnotatorV2 extends LitElement {

  static properties = {
    label: {},
    description: {},
    readOnly: {},
    required: {},
    _imageDataUrl:    { state: true },
    _annotatedDataUrl:{ state: true },
    _modalOpen:       { state: true },
    _tool:            { state: true },
    _color:           { state: true },
    _lineWidth:       { state: true },
    _fontSize:        { state: true },
    _isDrawing:       { state: true },
    _startX:          { state: true },
    _startY:          { state: true },
    _error:           { state: true },
    _textInput:       { state: true },
    _textX:           { state: true },
    _textY:           { state: true },
    _showTextBox:     { state: true },
    _undoStack:       { state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .upload-zone {
      border: 2px dashed #a0aec0;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: #f7fafc;
    }
    .upload-zone:hover { border-color: #4a90d9; background: #ebf4ff; }
    .upload-zone.readonly { cursor: default; opacity: 0.7; }
    .upload-icon { font-size: 32px; margin-bottom: 8px; }
    .upload-text { color: #4a5568; font-size: 14px; margin: 0; }
    .upload-hint { color: #a0aec0; font-size: 12px; margin: 4px 0 0; }
    input[type="file"] { display: none; }

    .preview-wrap { position: relative; display: inline-block; margin-top: 12px; max-width: 100%; }
    .preview-img { max-width: 100%; max-height: 220px; border-radius: 6px; border: 1px solid #e2e8f0; display: block; }
    .preview-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .btn { padding: 7px 14px; border-radius: 6px; border: none; font-size: 13px; cursor: pointer; font-weight: 500; transition: opacity 0.15s, transform 0.1s; }
    .btn:hover { opacity: 0.87; transform: translateY(-1px); }
    .btn-primary { background: #3182ce; color: #fff; }
    .btn-danger  { background: #e53e3e; color: #fff; }
    .btn-ghost   { background: #edf2f7; color: #2d3748; }
    .error-msg   { color: #e53e3e; font-size: 12px; margin-top: 6px; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 99999; padding: 12px; box-sizing: border-box;
    }
    .modal {
      background: #1a202c; border-radius: 12px;
      display: flex; flex-direction: column;
      max-width: 96vw; max-height: 96vh; overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.55);
      width: 900px;
    }

    /* Header */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 18px; background: #2d3748;
      border-bottom: 1px solid #4a5568;
    }
    .modal-title { color: #e2e8f0; font-size: 15px; font-weight: 600; margin: 0; }
    .modal-close { background: none; border: none; color: #a0aec0; font-size: 20px; cursor: pointer; padding: 2px 6px; border-radius: 4px; line-height: 1; }
    .modal-close:hover { background: #4a5568; color: #fff; }

    /* Toolbar */
    .toolbar {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; background: #2d3748;
      flex-wrap: wrap; border-bottom: 1px solid #4a5568;
    }
    .tool-group { display: flex; gap: 3px; }
    .tool-btn {
      padding: 6px 11px; border-radius: 6px;
      border: 2px solid transparent;
      font-size: 12px; cursor: pointer;
      background: #4a5568; color: #e2e8f0;
      font-weight: 500;
      transition: background 0.15s, border-color 0.15s;
      display: flex; align-items: center; gap: 4px;
      white-space: nowrap;
    }
    .tool-btn:hover { background: #718096; }
    .tool-btn.active { background: #2b6cb0; border-color: #63b3ed; color: #fff; }
    .separator { width: 1px; height: 28px; background: #4a5568; flex-shrink: 0; }

    /* Colour swatches */
    .color-group { display: flex; gap: 5px; align-items: center; }
    .color-swatch {
      width: 24px; height: 24px; border-radius: 50%;
      border: 3px solid transparent; cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;
      flex-shrink: 0;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.active { border-color: #fff; transform: scale(1.2); }
    .swatch-red    { background: #e53e3e; }
    .swatch-green  { background: #38a169; }
    .swatch-blue   { background: #3182ce; }
    .swatch-orange { background: #dd6b20; }
    .swatch-purple { background: #805ad5; }

    /* Size + font size */
    .ctrl-label { color: #a0aec0; font-size: 11px; white-space: nowrap; }
    .ctrl-select {
      background: #4a5568; color: #e2e8f0;
      border: 1px solid #718096; border-radius: 4px;
      padding: 4px 5px; font-size: 12px; cursor: pointer;
    }

    /* Undo / Clear */
    .btn-undo  { background: #2c5282; color: #bee3f8; border: 1px solid #2b6cb0; }
    .btn-clear { background: #744210; color: #fbd38d; border: 1px solid #975a16; }
    .btn-undo:hover  { background: #2b6cb0; }
    .btn-clear:hover { background: #975a16; }

    /* Canvas */
    .canvas-wrap {
      flex: 1; overflow: auto;
      display: flex; align-items: center; justify-content: center;
      background: #171923; padding: 14px; position: relative;
    }
    canvas {
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      display: block; max-width: 100%;
    }
    canvas.cursor-crosshair { cursor: crosshair; }
    canvas.cursor-text       { cursor: text; }
    canvas.cursor-eraser     { cursor: cell; }

    /* Floating text input */
    .text-input-overlay {
      position: absolute;
      background: rgba(255,255,255,0.12);
      border: 2px dashed #63b3ed;
      border-radius: 4px;
      padding: 2px 4px;
      z-index: 10;
    }
    .text-input-overlay input {
      background: transparent;
      border: none; outline: none;
      font-size: 18px;
      color: #fff;
      min-width: 120px;
      font-family: inherit;
    }

    /* Footer */
    .modal-footer {
      display: flex; justify-content: space-between; align-items: center;
      gap: 10px; padding: 10px 18px;
      background: #2d3748; border-top: 1px solid #4a5568;
    }
    .footer-hint { color: #718096; font-size: 11px; }
    .footer-btns { display: flex; gap: 8px; }
    .btn-save   { background: #38a169; color: #fff; }
    .btn-cancel { background: #4a5568; color: #e2e8f0; }
    .btn-save:hover   { background: #276749; }
    .btn-cancel:hover { background: #718096; }
  `;

  constructor() {
    super();
    this.label = 'Image Annotator';
    this.description = '';
    this.readOnly = false;
    this.required = false;
    this._imageDataUrl = null;
    this._annotatedDataUrl = null;
    this._modalOpen = false;
    this._tool = 'pencil';
    this._color = '#e53e3e';
    this._lineWidth = 3;
    this._fontSize = 20;
    this._isDrawing = false;
    this._startX = 0; this._startY = 0;
    this._error = '';
    this._snapshot = null;
    this._undoStack = [];
    this._showTextBox = false;
    this._textInput = '';
    this._textX = 0; this._textY = 0;
  }

  static getMetaConfig() {
    return {
      controlName: 'Image Annotator v2',
      description: 'Upload an image and annotate it with drawing, text, highlight, and shape tools.',
      iconUrl: 'attach',
      groupName: 'Custom',
      version: '1',
      fallbackDisableSubmit: false,
      standardProperties: {
        fieldLabel: true, description: true,
        readOnly: true, required: true, visibility: true,
      },
      properties: {
        value: { type: 'string', title: 'Annotated Image (base64)', isValueField: true },
      },
    };
  }

  // ── File handling ────────────────────────────────────────
  _onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this._error = 'Only image files are supported. Please select JPG, PNG, GIF, or WebP.';
      return;
    }
    this._error = '';
    const reader = new FileReader();
    reader.onload = (evt) => {
      this._imageDataUrl = evt.target.result;
      this._annotatedDataUrl = null;
      this._undoStack = [];
      this._openModal();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  _openModal() {
    this._modalOpen = true;
    this._showTextBox = false;
    this.updateComplete.then(() => this._initCanvas());
  }

  _closeModal() {
    this._modalOpen = false;
    this._isDrawing = false;
    this._showTextBox = false;
    this._snapshot = null;
  }

  // ── Canvas ───────────────────────────────────────────────
  _initCanvas() {
    const canvas = this._canvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const MAX_W = Math.min(window.innerWidth * 0.84, 860);
      const MAX_H = Math.min(window.innerHeight * 0.58, 560);
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > MAX_W) { h = h * MAX_W / w; w = MAX_W; }
      if (h > MAX_H) { w = w * MAX_H / h; h = MAX_H; }
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      this._undoStack = [];
    };
    img.src = this._annotatedDataUrl || this._imageDataUrl;
  }

  _canvas() { return this.shadowRoot?.querySelector('#annotator-canvas'); }
  _ctx()    { return this._canvas()?.getContext('2d'); }

  _coords(e) {
    const canvas = this._canvas();
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  }

  _styleCtx(ctx, forHighlight = false) {
    if (forHighlight) {
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = this._color;
      ctx.lineWidth = 18;
      ctx.lineCap = 'square';
    } else {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = this._color;
      ctx.lineWidth = this._lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }

  _pushUndo() {
    const canvas = this._canvas();
    const ctx = this._ctx();
    // Keep max 20 undo steps
    if (this._undoStack.length >= 20) this._undoStack.shift();
    this._undoStack = [...this._undoStack, ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }

  _undo() {
    if (!this._undoStack.length) return;
    const stack = [...this._undoStack];
    const last = stack.pop();
    this._undoStack = stack;
    this._ctx().putImageData(last, 0, 0);
  }

  // ── Draw events ──────────────────────────────────────────
  _onMouseDown(e) {
    e.preventDefault();
    if (this._showTextBox) { this._commitText(); return; }

    const { x, y } = this._coords(e);

    if (this._tool === 'text') {
      // Place text input overlay at click position
      this._pushUndo();
      this._textX = x; this._textY = y;
      this._textInput = '';
      this._showTextBox = true;
      this.updateComplete.then(() => {
        this.shadowRoot?.querySelector('.text-input-field')?.focus();
      });
      return;
    }

    this._pushUndo();
    this._isDrawing = true;
    this._startX = x; this._startY = y;
    const ctx = this._ctx();

    if (this._tool === 'pencil' || this._tool === 'highlight') {
      this._styleCtx(ctx, this._tool === 'highlight');
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (this._tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      // line, arrow, rect — snapshot for preview
      const canvas = this._canvas();
      this._snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }

  _onMouseMove(e) {
    e.preventDefault();
    if (!this._isDrawing) return;
    const { x, y } = this._coords(e);
    const ctx = this._ctx();

    if (this._tool === 'pencil') {
      this._styleCtx(ctx);
      ctx.lineTo(x, y); ctx.stroke();
    } else if (this._tool === 'highlight') {
      this._styleCtx(ctx, true);
      ctx.lineTo(x, y); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (this._tool === 'eraser') {
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24; ctx.lineCap = 'round';
      ctx.lineTo(x, y); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // Preview shape
      const canvas = this._canvas();
      ctx.putImageData(this._snapshot, 0, 0);
      this._drawShape(ctx, this._startX, this._startY, x, y);
    }
  }

  _onMouseUp(e) {
    e.preventDefault();
    if (!this._isDrawing) return;
    this._isDrawing = false;

    const ctx = this._ctx();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (this._tool === 'line' || this._tool === 'arrow' || this._tool === 'rect') {
      const { x, y } = this._coords(e);
      const canvas = this._canvas();
      ctx.putImageData(this._snapshot, 0, 0);
      this._drawShape(ctx, this._startX, this._startY, x, y);
      this._snapshot = null;
    }
    ctx.closePath?.();
  }

  _drawShape(ctx, x1, y1, x2, y2) {
    this._styleCtx(ctx);
    ctx.beginPath();

    if (this._tool === 'line') {
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    } else if (this._tool === 'arrow') {
      // Line
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.max(12, this._lineWidth * 4);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();

    } else if (this._tool === 'rect') {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
  }

  // ── Text tool ────────────────────────────────────────────
  _onTextInput(e) {
    this._textInput = e.target.value;
  }

  _onTextKeydown(e) {
    if (e.key === 'Enter') { e.preventDefault(); this._commitText(); }
    if (e.key === 'Escape') { this._showTextBox = false; }
  }

  _commitText() {
    if (!this._textInput.trim()) { this._showTextBox = false; return; }
    const ctx = this._ctx();
    ctx.globalAlpha = 1;
    ctx.fillStyle = this._color;
    ctx.font = `bold ${this._fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText(this._textInput, this._textX, this._textY);
    this._showTextBox = false;
    this._textInput = '';
  }

  // ── Text box position (canvas → overlay coords) ──────────
  _textOverlayStyle() {
    const canvas = this._canvas();
    if (!canvas) return '';
    const rect = canvas.getBoundingClientRect();
    const wrap = this.shadowRoot?.querySelector('.canvas-wrap');
    const wrapRect = wrap?.getBoundingClientRect();
    if (!wrapRect) return '';
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    const left = (rect.left - wrapRect.left) + this._textX * scaleX;
    const top  = (rect.top  - wrapRect.top)  + this._textY * scaleY;
    return `left:${left}px; top:${top}px;`;
  }

  // ── Clear ────────────────────────────────────────────────
  _clearCanvas() {
    this._pushUndo();
    const canvas = this._canvas();
    const ctx = this._ctx();
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = this._imageDataUrl;
  }

  // ── Save ─────────────────────────────────────────────────
  _saveAnnotation() {
    if (this._showTextBox) this._commitText();
    const dataUrl = this._canvas().toDataURL('image/png');
    this._annotatedDataUrl = dataUrl;
    this._closeModal();
    this.dispatchEvent(new CustomEvent('ntx-value-change', {
      bubbles: true, composed: true, detail: dataUrl,
    }));
  }

  _removeImage() {
    this._imageDataUrl = null; this._annotatedDataUrl = null;
    this._undoStack = [];
    this.dispatchEvent(new CustomEvent('ntx-value-change', {
      bubbles: true, composed: true, detail: '',
    }));
  }

  // ── Canvas cursor ────────────────────────────────────────
  _cursorClass() {
    if (this._tool === 'text')   return 'cursor-text';
    if (this._tool === 'eraser') return 'cursor-eraser';
    return 'cursor-crosshair';
  }

  // ── Colour swatches data ─────────────────────────────────
  get _colors() {
    return [
      { key: 'red',    val: '#e53e3e', cls: 'swatch-red' },
      { key: 'green',  val: '#38a169', cls: 'swatch-green' },
      { key: 'blue',   val: '#3182ce', cls: 'swatch-blue' },
      { key: 'orange', val: '#dd6b20', cls: 'swatch-orange' },
      { key: 'purple', val: '#805ad5', cls: 'swatch-purple' },
    ];
  }

  // ── Render ───────────────────────────────────────────────
  render() {
    const displaySrc = this._annotatedDataUrl || this._imageDataUrl;
    const tools = [
      { id: 'pencil',    icon: '✏️',  label: 'Pencil' },
      { id: 'highlight', icon: '🖊️',  label: 'Highlight' },
      { id: 'line',      icon: '╱',   label: 'Line' },
      { id: 'arrow',     icon: '↗',   label: 'Arrow' },
      { id: 'rect',      icon: '⬜',  label: 'Rect' },
      { id: 'text',      icon: 'T',   label: 'Text' },
      { id: 'eraser',    icon: '⌫',   label: 'Eraser' },
    ];

    return html`
      ${this.label ? html`<div style="font-size:13px;font-weight:600;color:#2d3748;margin-bottom:6px;">${this.label}</div>` : ''}
      ${this.description ? html`<div style="font-size:12px;color:#718096;margin-bottom:8px;">${this.description}</div>` : ''}

      ${!displaySrc ? html`
        <div class="upload-zone ${this.readOnly ? 'readonly' : ''}"
          @click="${() => !this.readOnly && this.shadowRoot.querySelector('#file-input').click()}">
          <div class="upload-icon">🖼️</div>
          <p class="upload-text">Click to upload an image</p>
          <p class="upload-hint">JPG, PNG, GIF, WebP supported</p>
          <input id="file-input" type="file" accept="image/*" @change="${this._onFileChange}" />
        </div>
      ` : ''}

      ${displaySrc ? html`
        <div class="preview-wrap">
          <img class="preview-img" src="${displaySrc}" alt="Preview" />
          <div class="preview-actions">
            ${!this.readOnly ? html`
              <button class="btn btn-primary" @click="${this._openModal}">✏️ Edit / Annotate</button>
              <button class="btn btn-ghost"   @click="${() => this.shadowRoot.querySelector('#file-input').click()}">📂 Change image</button>
              <button class="btn btn-danger"  @click="${this._removeImage}">🗑 Remove</button>
              <input id="file-input" type="file" accept="image/*" @change="${this._onFileChange}" />
            ` : ''}
          </div>
          ${this._annotatedDataUrl
            ? html`<p style="font-size:11px;color:#38a169;margin-top:4px;">✅ Annotation saved</p>`
            : html`<p style="font-size:11px;color:#e67e22;margin-top:4px;">⚠️ Not yet annotated — click Edit to annotate</p>`}
        </div>
      ` : ''}

      ${this._error ? html`<p class="error-msg">⚠️ ${this._error}</p>` : ''}

      ${this._modalOpen ? html`
        <div class="modal-overlay" @click="${(e) => e.target === e.currentTarget && this._closeModal()}">
          <div class="modal">

            <div class="modal-header">
              <h2 class="modal-title">✏️ Annotate Image — v2</h2>
              <button class="modal-close" @click="${this._closeModal}">✕</button>
            </div>

            <!-- Toolbar -->
            <div class="toolbar">
              <!-- Tool buttons -->
              <div class="tool-group">
                ${tools.map(t => html`
                  <button
                    class="tool-btn ${this._tool === t.id ? 'active' : ''}"
                    title="${t.label}"
                    @click="${() => { this._tool = t.id; this._showTextBox = false; }}"
                  >${t.icon} ${t.label}</button>
                `)}
              </div>

              <div class="separator"></div>

              <!-- Colours -->
              <div class="color-group">
                ${this._colors.map(c => html`
                  <div
                    class="color-swatch ${c.cls} ${this._color === c.val ? 'active' : ''}"
                    title="${c.key}"
                    @click="${() => { this._color = c.val; }}"
                  ></div>
                `)}
              </div>

              <div class="separator"></div>

              <!-- Stroke size -->
              <span class="ctrl-label">Size:</span>
              <select class="ctrl-select"
                .value="${String(this._lineWidth)}"
                @change="${(e) => { this._lineWidth = Number(e.target.value); }}">
                <option value="2">Thin</option>
                <option value="4">Medium</option>
                <option value="7">Thick</option>
                <option value="12">Heavy</option>
              </select>

              <!-- Font size (only relevant for text tool) -->
              ${this._tool === 'text' ? html`
                <div class="separator"></div>
                <span class="ctrl-label">Font:</span>
                <select class="ctrl-select"
                  .value="${String(this._fontSize)}"
                  @change="${(e) => { this._fontSize = Number(e.target.value); }}">
                  <option value="14">Small</option>
                  <option value="20">Medium</option>
                  <option value="28">Large</option>
                  <option value="40">XL</option>
                </select>
              ` : ''}

              <div class="separator"></div>

              <!-- Undo / Clear -->
              <button class="tool-btn btn-undo"  @click="${this._undo}"        title="Undo last action">↩ Undo</button>
              <button class="tool-btn btn-clear" @click="${this._clearCanvas}" title="Reset to original">🗑 Clear</button>
            </div>

            <!-- Canvas + floating text input -->
            <div class="canvas-wrap">
              <canvas
                id="annotator-canvas"
                class="${this._cursorClass()}"
                @mousedown="${this._onMouseDown}"
                @mousemove="${this._onMouseMove}"
                @mouseup="${this._onMouseUp}"
                @mouseleave="${this._onMouseUp}"
                @touchstart="${this._onMouseDown}"
                @touchmove="${this._onMouseMove}"
                @touchend="${this._onMouseUp}"
              ></canvas>

              ${this._showTextBox ? html`
                <div class="text-input-overlay" style="${this._textOverlayStyle()}">
                  <input
                    class="text-input-field"
                    type="text"
                    placeholder="Type here, Enter to place"
                    .value="${this._textInput}"
                    @input="${this._onTextInput}"
                    @keydown="${this._onTextKeydown}"
                    style="color:${this._color};font-size:${this._fontSize}px;"
                  />
                </div>
              ` : ''}
            </div>

            <div class="modal-footer">
              <span class="footer-hint">
                ${this._tool === 'text'   ? '💡 Click on the image to place text, then press Enter' : ''}
                ${this._tool === 'eraser' ? '💡 Click and drag to erase areas' : ''}
                ${this._tool === 'highlight' ? '💡 Drag to highlight areas in the selected colour' : ''}
                ${this._undoStack.length > 0 ? html`&nbsp;· ${this._undoStack.length} undo step(s) available` : ''}
              </span>
              <div class="footer-btns">
                <button class="btn btn-cancel" @click="${this._closeModal}">Cancel</button>
                <button class="btn btn-save"   @click="${this._saveAnnotation}">✅ Save annotation</button>
              </div>
            </div>

          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('org-image-annotator-v2', OrgImageAnnotatorV2);
