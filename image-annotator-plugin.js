/**
 * Nintex Form Plugin: Image Annotator
 * Allows users to upload an image and annotate it with pencil/line tools in red, green, or blue.
 * On save, the annotated image is stored as a base64 data URL output value.
 *
 * REGISTRATION DETAILS:
 *   Element name: org-image-annotator
 *   Source URL:   <your hosted URL>/image-annotator-plugin.js
 */

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class OrgImageAnnotator extends LitElement {

  static properties = {
    // Standard Nintex props
    label: {},
    description: {},
    readOnly: {},
    required: {},
    // Internal state
    _imageDataUrl: { state: true },
    _annotatedDataUrl: { state: true },
    _modalOpen: { state: true },
    _tool: { state: true },        // 'pencil' | 'line'
    _color: { state: true },       // '#e53e3e' | '#38a169' | '#3182ce'
    _lineWidth: { state: true },
    _isDrawing: { state: true },
    _startX: { state: true },
    _startY: { state: true },
    _error: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── Upload Zone ── */
    .upload-zone {
      border: 2px dashed #a0aec0;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: #f7fafc;
    }
    .upload-zone:hover {
      border-color: #4a90d9;
      background: #ebf4ff;
    }
    .upload-zone.readonly {
      cursor: default;
      opacity: 0.7;
    }
    .upload-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .upload-text {
      color: #4a5568;
      font-size: 14px;
      margin: 0;
    }
    .upload-hint {
      color: #a0aec0;
      font-size: 12px;
      margin: 4px 0 0;
    }
    input[type="file"] {
      display: none;
    }

    /* ── Preview ── */
    .preview-wrap {
      position: relative;
      display: inline-block;
      margin-top: 12px;
      max-width: 100%;
    }
    .preview-img {
      max-width: 100%;
      max-height: 220px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      display: block;
    }
    .preview-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .btn {
      padding: 7px 14px;
      border-radius: 6px;
      border: none;
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn:hover { opacity: 0.87; transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }
    .btn-primary { background: #3182ce; color: #fff; }
    .btn-danger  { background: #e53e3e; color: #fff; }
    .btn-ghost   { background: #edf2f7; color: #2d3748; }

    .error-msg {
      color: #e53e3e;
      font-size: 12px;
      margin-top: 6px;
    }

    /* ── Modal Overlay ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 16px;
      box-sizing: border-box;
    }
    .modal {
      background: #1a202c;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      max-width: 95vw;
      max-height: 95vh;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
    }

    /* ── Modal Header ── */
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      background: #2d3748;
      border-bottom: 1px solid #4a5568;
    }
    .modal-title {
      color: #e2e8f0;
      font-size: 15px;
      font-weight: 600;
      margin: 0;
    }
    .modal-close {
      background: none;
      border: none;
      color: #a0aec0;
      font-size: 20px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      line-height: 1;
    }
    .modal-close:hover { background: #4a5568; color: #fff; }

    /* ── Toolbar ── */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: #2d3748;
      flex-wrap: wrap;
    }
    .tool-group {
      display: flex;
      gap: 4px;
    }
    .tool-btn {
      padding: 7px 13px;
      border-radius: 6px;
      border: 2px solid transparent;
      font-size: 13px;
      cursor: pointer;
      background: #4a5568;
      color: #e2e8f0;
      font-weight: 500;
      transition: background 0.15s, border-color 0.15s;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .tool-btn:hover { background: #718096; }
    .tool-btn.active {
      background: #4a90d9;
      border-color: #63b3ed;
      color: #fff;
    }

    .separator {
      width: 1px;
      height: 30px;
      background: #4a5568;
    }

    /* Colour swatches */
    .color-group {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .color-swatch {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 3px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.active {
      border-color: #fff;
      transform: scale(1.2);
    }
    .swatch-red   { background: #e53e3e; }
    .swatch-green { background: #38a169; }
    .swatch-blue  { background: #3182ce; }

    /* Line width */
    .width-label {
      color: #a0aec0;
      font-size: 12px;
    }
    .width-select {
      background: #4a5568;
      color: #e2e8f0;
      border: 1px solid #718096;
      border-radius: 4px;
      padding: 4px 6px;
      font-size: 13px;
      cursor: pointer;
    }

    /* Clear */
    .btn-clear {
      background: #744210;
      color: #fbd38d;
      border: 1px solid #975a16;
    }
    .btn-clear:hover { background: #975a16; }

    /* ── Canvas area ── */
    .canvas-wrap {
      flex: 1;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #171923;
      padding: 16px;
    }
    canvas {
      border-radius: 4px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      cursor: crosshair;
      max-width: 100%;
      display: block;
    }

    /* ── Modal Footer ── */
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 18px;
      background: #2d3748;
      border-top: 1px solid #4a5568;
    }
    .btn-save {
      background: #38a169;
      color: #fff;
    }
    .btn-cancel {
      background: #4a5568;
      color: #e2e8f0;
    }
    .btn-save:hover  { background: #276749; }
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
    this._isDrawing = false;
    this._startX = 0;
    this._startY = 0;
    this._error = '';
    this._snapshotBeforeLine = null; // canvas snapshot for line preview
  }

  // ── Nintex contract ──────────────────────────────────────
  static getMetaConfig() {
    return {
      controlName: 'Image Annotator',
      description: 'Upload an image and annotate it with drawing tools before saving.',
      iconUrl: 'attach',
      groupName: 'Custom',
      version: '1',
      fallbackDisableSubmit: false,
      standardProperties: {
        fieldLabel: true,
        description: true,
        readOnly: true,
        required: true,
        visibility: true,
      },
      properties: {
        value: {
          type: 'string',
          title: 'Annotated Image (base64)',
          isValueField: true,
        },
      },
    };
  }

  // ── File input handler ───────────────────────────────────
  _onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this._error = 'Only image files are supported by this annotator. Please select an image (JPG, PNG, GIF, WebP, etc.).';
      return;
    }

    this._error = '';
    const reader = new FileReader();
    reader.onload = (evt) => {
      this._imageDataUrl = evt.target.result;
      this._annotatedDataUrl = null;
      // Open modal after image loads
      this._openModal();
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  // ── Modal open/close ─────────────────────────────────────
  _openModal() {
    this._modalOpen = true;
    // Wait for render, then load image onto canvas
    this.updateComplete.then(() => this._initCanvas());
  }

  _closeModal() {
    this._modalOpen = false;
    this._isDrawing = false;
    this._snapshotBeforeLine = null;
  }

  // ── Canvas initialisation ────────────────────────────────
  _initCanvas() {
    const canvas = this.shadowRoot.querySelector('#annotator-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      // Cap canvas at reasonable display size while preserving ratio
      const MAX_W = Math.min(window.innerWidth * 0.85, 900);
      const MAX_H = Math.min(window.innerHeight * 0.65, 650);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_W) { h = h * (MAX_W / w); w = MAX_W; }
      if (h > MAX_H) { w = w * (MAX_H / h); h = MAX_H; }
      canvas.width  = Math.round(w);
      canvas.height = Math.round(h);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    // Use already-annotated version if re-opening, else the original
    img.src = this._annotatedDataUrl || this._imageDataUrl;
  }

  // ── Canvas helpers ───────────────────────────────────────
  _getCanvas() { return this.shadowRoot.querySelector('#annotator-canvas'); }
  _getCtx()    { return this._getCanvas()?.getContext('2d'); }

  _canvasCoords(e) {
    const canvas = this._getCanvas();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    };
  }

  _applyCtxStyle(ctx) {
    ctx.strokeStyle = this._color;
    ctx.lineWidth   = this._lineWidth;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }

  // ── Draw events ──────────────────────────────────────────
  _onMouseDown(e) {
    e.preventDefault();
    const { x, y } = this._canvasCoords(e);
    this._isDrawing = true;
    this._startX = x;
    this._startY = y;

    if (this._tool === 'pencil') {
      const ctx = this._getCtx();
      this._applyCtxStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      // Snapshot canvas for line preview rubber-banding
      const canvas = this._getCanvas();
      this._snapshotBeforeLine = this._getCtx().getImageData(0, 0, canvas.width, canvas.height);
    }
  }

  _onMouseMove(e) {
    e.preventDefault();
    if (!this._isDrawing) return;
    const { x, y } = this._canvasCoords(e);
    const ctx = this._getCtx();

    if (this._tool === 'pencil') {
      this._applyCtxStyle(ctx);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      // Restore snapshot and draw preview line
      const canvas = this._getCanvas();
      ctx.putImageData(this._snapshotBeforeLine, 0, 0);
      this._applyCtxStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(this._startX, this._startY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  _onMouseUp(e) {
    e.preventDefault();
    if (!this._isDrawing) return;
    this._isDrawing = false;

    if (this._tool === 'line') {
      const { x, y } = this._canvasCoords(e);
      const ctx = this._getCtx();
      const canvas = this._getCanvas();
      ctx.putImageData(this._snapshotBeforeLine, 0, 0);
      this._applyCtxStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(this._startX, this._startY);
      ctx.lineTo(x, y);
      ctx.stroke();
      this._snapshotBeforeLine = null;
    }
    if (this._tool === 'pencil') {
      this._getCtx().closePath();
    }
  }

  // ── Clear canvas ─────────────────────────────────────────
  _clearCanvas() {
    const canvas = this._getCanvas();
    const ctx = this._getCtx();
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = this._imageDataUrl; // reset to original
  }

  // ── Save ─────────────────────────────────────────────────
  _saveAnnotation() {
    const canvas = this._getCanvas();
    const dataUrl = canvas.toDataURL('image/png');
    this._annotatedDataUrl = dataUrl;
    this._closeModal();

    // Emit Nintex value-change event
    const event = new CustomEvent('ntx-value-change', {
      bubbles: true,
      composed: true,
      detail: dataUrl,
    });
    this.dispatchEvent(event);
  }

  // ── Clear everything ─────────────────────────────────────
  _removeImage() {
    this._imageDataUrl = null;
    this._annotatedDataUrl = null;
    const event = new CustomEvent('ntx-value-change', {
      bubbles: true,
      composed: true,
      detail: '',
    });
    this.dispatchEvent(event);
  }

  // ── Render ───────────────────────────────────────────────
  render() {
    const displaySrc = this._annotatedDataUrl || this._imageDataUrl;

    return html`
      ${this.label ? html`<div style="font-size:13px;font-weight:600;color:#2d3748;margin-bottom:6px;">${this.label}</div>` : ''}
      ${this.description ? html`<div style="font-size:12px;color:#718096;margin-bottom:8px;">${this.description}</div>` : ''}

      <!-- Upload zone (hidden when image loaded) -->
      ${!displaySrc ? html`
        <div
          class="upload-zone ${this.readOnly ? 'readonly' : ''}"
          @click="${() => !this.readOnly && this.shadowRoot.querySelector('#file-input').click()}"
        >
          <div class="upload-icon">🖼️</div>
          <p class="upload-text">Click to upload an image</p>
          <p class="upload-hint">JPG, PNG, GIF, WebP supported</p>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            @change="${this._onFileChange}"
          />
        </div>
      ` : ''}

      <!-- Preview of annotated/uploaded image -->
      ${displaySrc ? html`
        <div class="preview-wrap">
          <img class="preview-img" src="${displaySrc}" alt="Uploaded image preview" />
          <div class="preview-actions">
            ${!this.readOnly ? html`
              <button class="btn btn-primary" @click="${this._openModal}">
                ✏️ Edit / Annotate
              </button>
              <button class="btn btn-ghost" @click="${() => this.shadowRoot.querySelector('#file-input').click()}">
                📂 Change image
              </button>
              <button class="btn btn-danger" @click="${this._removeImage}">
                🗑 Remove
              </button>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                @change="${this._onFileChange}"
              />
            ` : ''}
          </div>
          ${this._annotatedDataUrl ? html`<p style="font-size:11px;color:#38a169;margin-top:4px;">✅ Annotation saved</p>` : html`<p style="font-size:11px;color:#e67e22;margin-top:4px;">⚠️ Not yet annotated — click Edit to annotate</p>`}
        </div>
      ` : ''}

      ${this._error ? html`<p class="error-msg">⚠️ ${this._error}</p>` : ''}

      <!-- Annotation Modal -->
      ${this._modalOpen ? html`
        <div class="modal-overlay" @click="${(e) => e.target === e.currentTarget && this._closeModal()}">
          <div class="modal">

            <div class="modal-header">
              <h2 class="modal-title">✏️ Annotate Image</h2>
              <button class="modal-close" @click="${this._closeModal}" title="Close">✕</button>
            </div>

            <!-- Toolbar -->
            <div class="toolbar">

              <!-- Tools -->
              <div class="tool-group">
                <button
                  class="tool-btn ${this._tool === 'pencil' ? 'active' : ''}"
                  @click="${() => { this._tool = 'pencil'; }}"
                  title="Freehand pencil"
                >✏️ Pencil</button>
                <button
                  class="tool-btn ${this._tool === 'line' ? 'active' : ''}"
                  @click="${() => { this._tool = 'line'; }}"
                  title="Straight line"
                >📏 Line</button>
              </div>

              <div class="separator"></div>

              <!-- Colours -->
              <div class="color-group">
                <div
                  class="color-swatch swatch-red ${this._color === '#e53e3e' ? 'active' : ''}"
                  title="Red"
                  @click="${() => { this._color = '#e53e3e'; }}"
                ></div>
                <div
                  class="color-swatch swatch-green ${this._color === '#38a169' ? 'active' : ''}"
                  title="Green"
                  @click="${() => { this._color = '#38a169'; }}"
                ></div>
                <div
                  class="color-swatch swatch-blue ${this._color === '#3182ce' ? 'active' : ''}"
                  title="Blue"
                  @click="${() => { this._color = '#3182ce'; }}"
                ></div>
              </div>

              <div class="separator"></div>

              <!-- Line width -->
              <span class="width-label">Size:</span>
              <select
                class="width-select"
                .value="${String(this._lineWidth)}"
                @change="${(e) => { this._lineWidth = Number(e.target.value); }}"
              >
                <option value="2">Thin</option>
                <option value="4" selected>Medium</option>
                <option value="7">Thick</option>
                <option value="12">Heavy</option>
              </select>

              <div class="separator"></div>

              <!-- Clear -->
              <button class="tool-btn btn-clear" @click="${this._clearCanvas}" title="Reset to original image">
                🗑 Clear
              </button>

            </div>

            <!-- Canvas -->
            <div class="canvas-wrap">
              <canvas
                id="annotator-canvas"
                @mousedown="${this._onMouseDown}"
                @mousemove="${this._onMouseMove}"
                @mouseup="${this._onMouseUp}"
                @mouseleave="${this._onMouseUp}"
                @touchstart="${this._onMouseDown}"
                @touchmove="${this._onMouseMove}"
                @touchend="${this._onMouseUp}"
              ></canvas>
            </div>

            <!-- Footer -->
            <div class="modal-footer">
              <button class="btn btn-cancel" @click="${this._closeModal}">Cancel</button>
              <button class="btn btn-save" @click="${this._saveAnnotation}">✅ Save annotation</button>
            </div>

          </div>
        </div>
      ` : ''}
    `;
  }
}

customElements.define('org-image-annotator', OrgImageAnnotator);
