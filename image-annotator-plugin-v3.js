/**
 * Nintex Form Plugin: Image Annotator v3
 * - All v2 tools: pencil, highlight, line, arrow, rect, eraser
 * - Text tool: draggable text labels — click to place, drag to reposition,
 *   double-click to edit, all burned into canvas on Save
 * - Colours: Red, Green, Blue, Orange, Purple
 * - Undo (up to 20 steps for drawing tools)
 *
 * REGISTRATION DETAILS:
 *   Element name: org-image-annotator-v3
 *   Source URL:   https://saudhall.github.io/nintex-plugins/image-annotator-plugin-v3.js
 */

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class OrgImageAnnotatorV3 extends LitElement {

  static properties = {
    label: {}, description: {}, readOnly: {}, required: {},
    _imageDataUrl:     { state: true },
    _annotatedDataUrl: { state: true },
    _modalOpen:        { state: true },
    _tool:             { state: true },
    _color:            { state: true },
    _lineWidth:        { state: true },
    _fontSize:         { state: true },
    _isDrawing:        { state: true },
    _startX:           { state: true },
    _startY:           { state: true },
    _error:            { state: true },
    _undoStack:        { state: true },
    _textLabels:       { state: true },  // array of {id, x, y, text, color, fontSize}
    _editingLabelId:   { state: true },  // id of label being typed into
    _draggingLabelId:  { state: true },  // id of label being dragged
    _dragOffsetX:      { state: true },
    _dragOffsetY:      { state: true },
  };

  static styles = css`
    :host { display: block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

    .upload-zone {
      border: 2px dashed #a0aec0; border-radius: 8px; padding: 24px;
      text-align: center; cursor: pointer;
      transition: border-color 0.2s, background 0.2s; background: #f7fafc;
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

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      display: flex; align-items: center; justify-content: center;
      z-index: 99999; padding: 12px; box-sizing: border-box;
    }
    .modal {
      background: #1a202c; border-radius: 12px; display: flex; flex-direction: column;
      max-width: 96vw; max-height: 96vh; overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.55); width: 920px;
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 18px; background: #2d3748; border-bottom: 1px solid #4a5568;
    }
    .modal-title { color: #e2e8f0; font-size: 15px; font-weight: 600; margin: 0; }
    .modal-close { background: none; border: none; color: #a0aec0; font-size: 20px; cursor: pointer; padding: 2px 6px; border-radius: 4px; line-height: 1; }
    .modal-close:hover { background: #4a5568; color: #fff; }

    .toolbar {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; background: #2d3748; flex-wrap: wrap; border-bottom: 1px solid #4a5568;
    }
    .tool-group { display: flex; gap: 3px; }
    .tool-btn {
      padding: 6px 11px; border-radius: 6px; border: 2px solid transparent;
      font-size: 12px; cursor: pointer; background: #4a5568; color: #e2e8f0;
      font-weight: 500; transition: background 0.15s, border-color 0.15s;
      display: flex; align-items: center; gap: 4px; white-space: nowrap;
    }
    .tool-btn:hover { background: #718096; }
    .tool-btn.active { background: #2b6cb0; border-color: #63b3ed; color: #fff; }
    .separator { width: 1px; height: 28px; background: #4a5568; flex-shrink: 0; }

    .color-group { display: flex; gap: 5px; align-items: center; }
    .color-swatch {
      width: 24px; height: 24px; border-radius: 50%;
      border: 3px solid transparent; cursor: pointer;
      transition: transform 0.15s, border-color 0.15s; flex-shrink: 0;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.active { border-color: #fff; transform: scale(1.2); }
    .swatch-red    { background: #e53e3e; }
    .swatch-green  { background: #38a169; }
    .swatch-blue   { background: #3182ce; }
    .swatch-orange { background: #dd6b20; }
    .swatch-purple { background: #805ad5; }

    .ctrl-label { color: #a0aec0; font-size: 11px; white-space: nowrap; }
    .ctrl-select {
      background: #4a5568; color: #e2e8f0; border: 1px solid #718096;
      border-radius: 4px; padding: 4px 5px; font-size: 12px; cursor: pointer;
    }
    .btn-undo  { background: #2c5282; color: #bee3f8; border: 1px solid #2b6cb0; }
    .btn-clear { background: #744210; color: #fbd38d; border: 1px solid #975a16; }
    .btn-undo:hover  { background: #2b6cb0; }
    .btn-clear:hover { background: #975a16; }

    .canvas-wrap {
      flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center;
      background: #171923; padding: 14px; position: relative;
    }
    .canvas-container { position: relative; display: inline-block; line-height: 0; }

    canvas {
      border-radius: 4px; box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      display: block; max-width: 100%;
    }
    canvas.cursor-crosshair { cursor: crosshair; }
    canvas.cursor-text       { cursor: text; }
    canvas.cursor-eraser     { cursor: cell; }
    canvas.cursor-default    { cursor: default; }

    /* ── Draggable text labels ── */
    .text-label {
      position: absolute;
      cursor: move;
      user-select: none;
      display: flex;
      align-items: flex-start;
      gap: 2px;
    }
    .text-label-content {
      background: rgba(0,0,0,0.45);
      border: 1.5px dashed rgba(255,255,255,0.5);
      border-radius: 3px;
      padding: 2px 5px;
      line-height: 1.3;
      min-width: 40px;
      white-space: pre;
      font-weight: 600;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }
    .text-label-content.editing {
      border-style: solid;
      border-color: #63b3ed;
      background: rgba(0,0,50,0.6);
      outline: none;
      white-space: pre;
    }
    .text-label-delete {
      background: #e53e3e; color: #fff; border: none;
      border-radius: 50%; width: 16px; height: 16px;
      font-size: 10px; cursor: pointer; line-height: 16px;
      text-align: center; padding: 0; flex-shrink: 0;
      opacity: 0; transition: opacity 0.15s;
    }
    .text-label:hover .text-label-delete { opacity: 1; }

    .modal-footer {
      display: flex; justify-content: space-between; align-items: center;
      gap: 10px; padding: 10px 18px; background: #2d3748; border-top: 1px solid #4a5568;
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
    this._textLabels = [];
    this._editingLabelId = null;
    this._draggingLabelId = null;
    this._dragOffsetX = 0; this._dragOffsetY = 0;
    this._labelCounter = 0;
  }

  static getMetaConfig() {
    return {
      controlName: 'Image Annotator v3',
      description: 'Upload and annotate images with draggable text, shapes, highlight, and drawing tools.',
      iconUrl: 'attach',
      groupName: 'Custom',
      version: '1',
      fallbackDisableSubmit: false,
      standardProperties: { fieldLabel: true, description: true, readOnly: true, required: true, visibility: true },
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
      this._textLabels = [];
      this._openModal();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  _openModal() {
    this._modalOpen = true;
    this._editingLabelId = null;
    this.updateComplete.then(() => this._initCanvas());
  }

  _closeModal() {
    this._modalOpen = false;
    this._isDrawing = false;
    this._snapshot = null;
    this._editingLabelId = null;
    this._draggingLabelId = null;
  }

  // ── Canvas ───────────────────────────────────────────────
  _initCanvas() {
    const canvas = this._canvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const MAX_W = Math.min(window.innerWidth * 0.84, 860);
      const MAX_H = Math.min(window.innerHeight * 0.56, 540);
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > MAX_W) { h = h * MAX_W / w; w = MAX_W; }
      if (h > MAX_H) { w = w * MAX_H / h; h = MAX_H; }
      canvas.width = Math.round(w); canvas.height = Math.round(h);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      this._undoStack = [];
    };
    img.src = this._annotatedDataUrl || this._imageDataUrl;
  }

  _canvas() { return this.shadowRoot?.querySelector('#annotator-canvas'); }
  _ctx()    { return this._canvas()?.getContext('2d'); }

  _canvasRect() { return this._canvas()?.getBoundingClientRect(); }

  _coords(e) {
    const canvas = this._canvas();
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy,
             px: cx - rect.left,         py: cy - rect.top };
  }

  _styleCtx(ctx, forHighlight = false) {
    if (forHighlight) {
      ctx.globalAlpha = 0.35; ctx.strokeStyle = this._color;
      ctx.lineWidth = 18; ctx.lineCap = 'square';
    } else {
      ctx.globalAlpha = 1; ctx.strokeStyle = this._color;
      ctx.lineWidth = this._lineWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    }
  }

  _pushUndo() {
    const canvas = this._canvas(); const ctx = this._ctx();
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

  // ── Canvas mouse events ──────────────────────────────────
  _onCanvasMouseDown(e) {
    e.preventDefault();
    if (this._editingLabelId) { this._finishEditing(); return; }
    if (this._tool === 'text') {
      // Place a new draggable text label
      const { px, py } = this._coords(e);
      this._labelCounter++;
      const newLabel = {
        id: this._labelCounter,
        px, py,   // pixel position relative to canvas display rect
        text: '',
        color: this._color,
        fontSize: this._fontSize,
      };
      this._textLabels = [...this._textLabels, newLabel];
      this._editingLabelId = newLabel.id;
      this.updateComplete.then(() => {
        this.shadowRoot?.querySelector(`[data-label-id="${newLabel.id}"] .text-label-content`)?.focus();
      });
      return;
    }

    this._pushUndo();
    this._isDrawing = true;
    const { x, y } = this._coords(e);
    this._startX = x; this._startY = y;
    const ctx = this._ctx();

    if (this._tool === 'pencil' || this._tool === 'highlight') {
      this._styleCtx(ctx, this._tool === 'highlight');
      ctx.beginPath(); ctx.moveTo(x, y);
    } else if (this._tool === 'eraser') {
      ctx.beginPath(); ctx.moveTo(x, y);
    } else {
      const canvas = this._canvas();
      this._snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }

  _onCanvasMouseMove(e) {
    e.preventDefault();
    if (!this._isDrawing) return;
    const { x, y } = this._coords(e);
    const ctx = this._ctx();

    if (this._tool === 'pencil') {
      this._styleCtx(ctx); ctx.lineTo(x, y); ctx.stroke();
    } else if (this._tool === 'highlight') {
      this._styleCtx(ctx, true); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = 1;
    } else if (this._tool === 'eraser') {
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24; ctx.lineCap = 'round';
      ctx.lineTo(x, y); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const canvas = this._canvas();
      ctx.putImageData(this._snapshot, 0, 0);
      this._drawShape(ctx, this._startX, this._startY, x, y);
    }
  }

  _onCanvasMouseUp(e) {
    e.preventDefault();
    if (!this._isDrawing) return;
    this._isDrawing = false;
    const ctx = this._ctx();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (['line','arrow','rect'].includes(this._tool)) {
      const { x, y } = this._coords(e);
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
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const hl = Math.max(12, this._lineWidth * 4);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hl * Math.cos(angle - Math.PI/6), y2 - hl * Math.sin(angle - Math.PI/6));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hl * Math.cos(angle + Math.PI/6), y2 - hl * Math.sin(angle + Math.PI/6));
      ctx.stroke();
    } else if (this._tool === 'rect') {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
  }

  // ── Text label drag ──────────────────────────────────────
  _onLabelMouseDown(e, labelId) {
    e.stopPropagation();
    if (this._editingLabelId === labelId) return; // don't drag while editing
    this._draggingLabelId = labelId;
    const label = this._textLabels.find(l => l.id === labelId);
    this._dragOffsetX = e.clientX - label.px;
    this._dragOffsetY = e.clientY - label.py;

    const onMove = (ev) => {
      if (this._draggingLabelId !== labelId) return;
      const canvas = this._canvas();
      const rect = canvas.getBoundingClientRect();
      const newPx = Math.max(0, Math.min(ev.clientX - this._dragOffsetX, rect.width));
      const newPy = Math.max(0, Math.min(ev.clientY - this._dragOffsetY, rect.height));
      this._textLabels = this._textLabels.map(l =>
        l.id === labelId ? { ...l, px: newPx, py: newPy } : l
      );
    };
    const onUp = () => {
      this._draggingLabelId = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  _onLabelDblClick(e, labelId) {
    e.stopPropagation();
    this._editingLabelId = labelId;
    this.updateComplete.then(() => {
      this.shadowRoot?.querySelector(`[data-label-id="${labelId}"] .text-label-content`)?.focus();
    });
  }

  _onLabelInput(e, labelId) {
    const text = e.target.innerText;
    this._textLabels = this._textLabels.map(l => l.id === labelId ? { ...l, text } : l);
  }

  _onLabelKeydown(e, labelId) {
    if (e.key === 'Escape') { e.preventDefault(); this._finishEditing(); }
    // Allow Enter for multiline — don't intercept
  }

  _finishEditing() {
    // Remove empty labels
    this._textLabels = this._textLabels.filter(l => l.text.trim() !== '' || l.id !== this._editingLabelId);
    this._editingLabelId = null;
  }

  _deleteLabel(e, labelId) {
    e.stopPropagation();
    this._textLabels = this._textLabels.filter(l => l.id !== labelId);
    if (this._editingLabelId === labelId) this._editingLabelId = null;
  }

  // ── Label position → CSS (relative to canvas-container) ─
  _labelStyle(label) {
    return `left:${label.px}px; top:${label.py}px; transform: translate(-50%, -50%);`;
  }

  // ── Burn text labels onto canvas then save ───────────────
  _burnLabelsAndSave() {
    this._finishEditing();
    const canvas = this._canvas();
    const ctx = this._ctx();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.globalAlpha = 1;
    this._textLabels.forEach(label => {
      const cx = label.px * scaleX;
      const cy = label.py * scaleY;
      ctx.font = `bold ${label.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillStyle = label.color;
      ctx.textBaseline = 'middle';
      // Simple multi-line support
      const lines = label.text.split('\n');
      const lineH = label.fontSize * 1.3;
      const totalH = lineH * lines.length;
      lines.forEach((line, i) => {
        ctx.fillText(line, cx, cy - totalH/2 + lineH * i + lineH/2);
      });
    });
    ctx.textBaseline = 'alphabetic';

    const dataUrl = canvas.toDataURL('image/png');
    this._annotatedDataUrl = dataUrl;
    this._textLabels = [];
    this._closeModal();
    this.dispatchEvent(new CustomEvent('ntx-value-change', {
      bubbles: true, composed: true, detail: dataUrl,
    }));
  }

  _clearCanvas() {
    this._pushUndo();
    const canvas = this._canvas(); const ctx = this._ctx();
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = this._imageDataUrl;
    this._textLabels = [];
  }

  _removeImage() {
    this._imageDataUrl = null; this._annotatedDataUrl = null;
    this._undoStack = []; this._textLabels = [];
    this.dispatchEvent(new CustomEvent('ntx-value-change', { bubbles: true, composed: true, detail: '' }));
  }

  _cursorClass() {
    if (this._tool === 'text')   return 'cursor-text';
    if (this._tool === 'eraser') return 'cursor-eraser';
    return 'cursor-crosshair';
  }

  get _colors() {
    return [
      { key: 'red',    val: '#e53e3e', cls: 'swatch-red' },
      { key: 'green',  val: '#38a169', cls: 'swatch-green' },
      { key: 'blue',   val: '#3182ce', cls: 'swatch-blue' },
      { key: 'orange', val: '#dd6b20', cls: 'swatch-orange' },
      { key: 'purple', val: '#805ad5', cls: 'swatch-purple' },
    ];
  }

  render() {
    const displaySrc = this._annotatedDataUrl || this._imageDataUrl;
    const tools = [
      { id: 'pencil',    icon: '✏️', label: 'Pencil' },
      { id: 'highlight', icon: '🖊️', label: 'Highlight' },
      { id: 'line',      icon: '╱',  label: 'Line' },
      { id: 'arrow',     icon: '↗',  label: 'Arrow' },
      { id: 'rect',      icon: '⬜', label: 'Rect' },
      { id: 'text',      icon: 'T',  label: 'Text' },
      { id: 'eraser',    icon: '⌫',  label: 'Eraser' },
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
              <h2 class="modal-title">✏️ Annotate Image — v3</h2>
              <button class="modal-close" @click="${this._closeModal}">✕</button>
            </div>

            <div class="toolbar">
              <div class="tool-group">
                ${tools.map(t => html`
                  <button class="tool-btn ${this._tool === t.id ? 'active' : ''}"
                    title="${t.label}"
                    @click="${() => { this._tool = t.id; this._finishEditing(); }}">
                    ${t.icon} ${t.label}
                  </button>
                `)}
              </div>

              <div class="separator"></div>

              <div class="color-group">
                ${this._colors.map(c => html`
                  <div class="color-swatch ${c.cls} ${this._color === c.val ? 'active' : ''}"
                    title="${c.key}" @click="${() => { this._color = c.val; }}"></div>
                `)}
              </div>

              <div class="separator"></div>

              <span class="ctrl-label">Size:</span>
              <select class="ctrl-select" .value="${String(this._lineWidth)}"
                @change="${(e) => { this._lineWidth = Number(e.target.value); }}">
                <option value="2">Thin</option>
                <option value="4">Medium</option>
                <option value="7">Thick</option>
                <option value="12">Heavy</option>
              </select>

              ${this._tool === 'text' ? html`
                <div class="separator"></div>
                <span class="ctrl-label">Font:</span>
                <select class="ctrl-select" .value="${String(this._fontSize)}"
                  @change="${(e) => { this._fontSize = Number(e.target.value); }}">
                  <option value="14">Small</option>
                  <option value="20">Medium</option>
                  <option value="28">Large</option>
                  <option value="40">XL</option>
                </select>
              ` : ''}

              <div class="separator"></div>
              <button class="tool-btn btn-undo"  @click="${this._undo}"        title="Undo">↩ Undo</button>
              <button class="tool-btn btn-clear" @click="${this._clearCanvas}" title="Clear all">🗑 Clear</button>
            </div>

            <!-- Canvas area with text overlays -->
            <div class="canvas-wrap">
              <div class="canvas-container">
                <canvas
                  id="annotator-canvas"
                  class="${this._cursorClass()}"
                  @mousedown="${this._onCanvasMouseDown}"
                  @mousemove="${this._onCanvasMouseMove}"
                  @mouseup="${this._onCanvasMouseUp}"
                  @mouseleave="${this._onCanvasMouseUp}"
                  @touchstart="${this._onCanvasMouseDown}"
                  @touchmove="${this._onCanvasMouseMove}"
                  @touchend="${this._onCanvasMouseUp}"
                ></canvas>

                <!-- Draggable text labels rendered as overlays -->
                ${this._textLabels.map(label => html`
                  <div
                    class="text-label"
                    data-label-id="${label.id}"
                    style="${this._labelStyle(label)}"
                    @mousedown="${(e) => this._onLabelMouseDown(e, label.id)}"
                    @dblclick="${(e) => this._onLabelDblClick(e, label.id)}"
                  >
                    <div
                      class="text-label-content ${this._editingLabelId === label.id ? 'editing' : ''}"
                      contenteditable="${this._editingLabelId === label.id ? 'true' : 'false'}"
                      style="color:${label.color}; font-size:${label.fontSize}px;"
                      @input="${(e) => this._onLabelInput(e, label.id)}"
                      @keydown="${(e) => this._onLabelKeydown(e, label.id)}"
                      @blur="${() => { if(this._editingLabelId === label.id) this._finishEditing(); }}"
                    >${label.text || (this._editingLabelId === label.id ? '' : '')}</div>
                    <button class="text-label-delete"
                      @click="${(e) => this._deleteLabel(e, label.id)}"
                      title="Remove label">✕</button>
                  </div>
                `)}
              </div>
            </div>

            <div class="modal-footer">
              <span class="footer-hint">
                ${this._tool === 'text' ? '💡 Click to add text · Drag to move · Double-click to edit · ✕ to delete' : ''}
                ${this._tool === 'eraser' ? '💡 Click and drag to erase' : ''}
                ${this._tool === 'highlight' ? '💡 Drag to highlight areas' : ''}
                ${this._undoStack.length > 0 ? html`&nbsp;· ${this._undoStack.length} undo step(s)` : ''}
              </span>
              <div class="footer-btns">
                <button class="btn btn-cancel" @click="${this._closeModal}">Cancel</button>
                <button class="btn btn-save"   @click="${this._burnLabelsAndSave}">✅ Save annotation</button>
              </div>
            </div>

          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('org-image-annotator-v3', OrgImageAnnotatorV3);
