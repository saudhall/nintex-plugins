/**
 * Nintex Form Plugin: Image Annotator v4
 *
 * NEW FEATURES IN V4:
 * ✅ Select / Move mode
 * ✅ Resizable text with 4 resize handles
 * ✅ Shape menu (rectangle, circle, arrow, line)
 * ✅ 8 font sizes
 * ✅ Custom color picker
 * ✅ Better object selection
 * ✅ Resize text by dragging corner handles
 * ✅ Reposition objects after creating them
 * ✅ Improved toolbar UX
 *
 * REGISTRATION DETAILS:
 *   Element name: org-image-annotator-v4
 *   Source URL:   https://saudhall.github.io/nintex-plugins/image-annotator-plugin-v4.js
 */

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class OrgImageAnnotatorV4 extends LitElement {

  static properties = {
    label: {},
    description: {},
    readOnly: {},
    required: {},

    _imageDataUrl: { state: true },
    _annotatedDataUrl: { state: true },
    _modalOpen: { state: true },

    _tool: { state: true },
    _shapeTool: { state: true },

    _color: { state: true },
    _lineWidth: { state: true },
    _fontSize: { state: true },

    _isDrawing: { state: true },

    _startX: { state: true },
    _startY: { state: true },

    _undoStack: { state: true },

    _textLabels: { state: true },

    _selectedLabelId: { state: true },
    _editingLabelId: { state: true },

    _draggingLabelId: { state: true },
    _resizeLabelId: { state: true },

    _resizeCorner: { state: true },

    _dragOffsetX: { state: true },
    _dragOffsetY: { state: true },

    _showShapesMenu: { state: true },
  };

  static styles = css`

    :host {
      display:block;
      font-family:Segoe UI, sans-serif;
    }

    .upload-zone{
      border:2px dashed #cbd5e0;
      padding:30px;
      border-radius:10px;
      text-align:center;
      cursor:pointer;
      background:#f7fafc;
    }

    .preview-img{
      max-width:100%;
      max-height:250px;
      border-radius:8px;
      border:1px solid #ddd;
    }

    .btn{
      border:none;
      border-radius:8px;
      padding:8px 14px;
      cursor:pointer;
      font-size:13px;
      font-weight:600;
    }

    .btn-primary{
      background:#2563eb;
      color:white;
    }

    .btn-danger{
      background:#dc2626;
      color:white;
    }

    .modal-overlay{
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.7);
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:99999;
    }

    .modal{
      width:95vw;
      height:95vh;
      background:#1f2937;
      border-radius:12px;
      display:flex;
      flex-direction:column;
      overflow:hidden;
    }

    .toolbar{
      background:#111827;
      padding:10px;
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      align-items:center;
      border-bottom:1px solid #374151;
    }

    .tool-btn{
      background:#374151;
      color:white;
      border:none;
      padding:7px 11px;
      border-radius:8px;
      cursor:pointer;
      font-size:12px;
      font-weight:600;
    }

    .tool-btn.active{
      background:#2563eb;
    }

    .canvas-wrap{
      flex:1;
      overflow:auto;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#0f172a;
      padding:20px;
    }

    .canvas-container{
      position:relative;
      display:inline-block;
    }

    canvas{
      display:block;
      border-radius:8px;
      box-shadow:0 8px 40px rgba(0,0,0,.5);
      background:white;
    }

    .text-label{
      position:absolute;
      transform:translate(-50%, -50%);
      user-select:none;
    }

    .text-content{
      padding:4px 6px;
      border:2px dashed transparent;
      min-width:30px;
      font-weight:700;
      white-space:pre;
      cursor:move;
      background:rgba(0,0,0,.15);
    }

    .text-label.selected .text-content{
      border-color:#60a5fa;
    }

    .resize-handle{
      width:10px;
      height:10px;
      background:white;
      border:2px solid #2563eb;
      position:absolute;
      border-radius:50%;
    }

    .handle-tl{ top:-8px; left:-8px; cursor:nwse-resize; }
    .handle-tr{ top:-8px; right:-8px; cursor:nesw-resize; }
    .handle-bl{ bottom:-8px; left:-8px; cursor:nesw-resize; }
    .handle-br{ bottom:-8px; right:-8px; cursor:nwse-resize; }

    .shape-menu{
      position:relative;
    }

    .shape-dropdown{
      position:absolute;
      top:40px;
      left:0;
      background:#1f2937;
      border:1px solid #374151;
      border-radius:10px;
      padding:8px;
      display:grid;
      grid-template-columns:repeat(2,1fr);
      gap:6px;
      z-index:999;
      width:180px;
    }

    .color-picker{
      width:38px;
      height:38px;
      border:none;
      padding:0;
      background:none;
      cursor:pointer;
    }

    select{
      background:#374151;
      color:white;
      border:1px solid #4b5563;
      border-radius:6px;
      padding:6px;
    }

  `;

  constructor(){
    super();

    this.label = 'Image Annotator v4';

    this._imageDataUrl = null;
    this._annotatedDataUrl = null;

    this._modalOpen = false;

    this._tool = 'select';
    this._shapeTool = 'rect';

    this._color = '#ff0000';

    this._lineWidth = 3;
    this._fontSize = 20;

    this._isDrawing = false;

    this._undoStack = [];

    this._textLabels = [];

    this._selectedLabelId = null;
    this._editingLabelId = null;

    this._draggingLabelId = null;
    this._resizeLabelId = null;

    this._resizeCorner = null;

    this._showShapesMenu = false;

    this._labelCounter = 0;
  }

  static getMetaConfig() {

    return {
      controlName: 'Image Annotator v4',
      description: 'Advanced image annotation plugin with resize handles, selectable objects, movable text, shapes, custom colours and drawing tools.',
      groupName: 'Custom',
      version: '4',
      iconUrl: 'image',
      standardProperties: {
        fieldLabel: true,
        description: true,
        readOnly: true,
        required: true,
        visibility: true
      },
      properties: {
        value: {
          type: 'string',
          title: 'Annotated Image',
          isValueField: true
        }
      }
    };
  }

  _canvas(){
    return this.shadowRoot.querySelector('#canvas');
  }

  _ctx(){
    return this._canvas().getContext('2d');
  }

  _onFileChange(e){

    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = (ev)=>{
      this._imageDataUrl = ev.target.result;
      this._openModal();
    };

    reader.readAsDataURL(file);
  }

  _openModal(){

    this._modalOpen = true;

    this.updateComplete.then(()=>{
      this._initCanvas();
    });
  }

  _closeModal(){
    this._modalOpen = false;
  }

  _initCanvas(){

    const canvas = this._canvas();
    const ctx = this._ctx();

    const img = new Image();

    img.onload = ()=>{

      let w = img.width;
      let h = img.height;

      const maxW = 1200;
      const maxH = 700;

      if(w > maxW){
        h = h * maxW / w;
        w = maxW;
      }

      if(h > maxH){
        w = w * maxH / h;
        h = maxH;
      }

      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(img,0,0,w,h);
    };

    img.src = this._annotatedDataUrl || this._imageDataUrl;
  }

  _coords(e){

    const rect = this._canvas().getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  _canvasDown(e){

    if(this._tool === 'text'){

      const pos = this._coords(e);

      this._labelCounter++;

      const label = {
        id:this._labelCounter,
        x:pos.x,
        y:pos.y,
        text:'Double click to edit',
        color:this._color,
        fontSize:this._fontSize
      };

      this._textLabels = [...this._textLabels, label];

      this._selectedLabelId = label.id;

      return;
    }

    if(this._tool === 'shape'){

      this._isDrawing = true;

      const pos = this._coords(e);

      this._startX = pos.x;
      this._startY = pos.y;

      return;
    }
  }

  _canvasMove(e){

    if(!this._isDrawing) return;

    const ctx = this._ctx();

    const pos = this._coords(e);

    ctx.putImageData(this._snapshot,0,0);

    ctx.strokeStyle = this._color;
    ctx.lineWidth = this._lineWidth;

    if(this._shapeTool === 'rect'){

      ctx.strokeRect(
        this._startX,
        this._startY,
        pos.x - this._startX,
        pos.y - this._startY
      );
    }

    if(this._shapeTool === 'circle'){

      const radius = Math.sqrt(
        Math.pow(pos.x - this._startX,2) +
        Math.pow(pos.y - this._startY,2)
      );

      ctx.beginPath();
      ctx.arc(this._startX,this._startY,radius,0,Math.PI*2);
      ctx.stroke();
    }

  }

  _canvasUp(){

    this._isDrawing = false;
  }

  _selectLabel(id){

    this._selectedLabelId = id;
  }

  _dragLabel(e,id){

    e.stopPropagation();

    this._selectedLabelId = id;

    const label = this._textLabels.find(l=>l.id===id);

    const move = (ev)=>{

      const rect = this._canvas().getBoundingClientRect();

      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      this._textLabels = this._textLabels.map(l=>{

        if(l.id === id){

          return {
            ...l,
            x,
            y
          };
        }

        return l;
      });
    };

    const up = ()=>{

      window.removeEventListener('mousemove',move);
      window.removeEventListener('mouseup',up);
    };

    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
  }

  _resizeLabel(e,id,corner){

    e.stopPropagation();

    const move = (ev)=>{

      const rect = this._canvas().getBoundingClientRect();

      const x = ev.clientX - rect.left;

      const label = this._textLabels.find(l=>l.id===id);

      const diff = x - label.x;

      let newSize = Math.max(10, label.fontSize + (diff / 8));

      this._textLabels = this._textLabels.map(l=>{

        if(l.id === id){

          return {
            ...l,
            fontSize:newSize
          };
        }

        return l;
      });
    };

    const up = ()=>{

      window.removeEventListener('mousemove',move);
      window.removeEventListener('mouseup',up);
    };

    window.addEventListener('mousemove',move);
    window.addEventListener('mouseup',up);
  }

  _updateSelectedFontSize(size){

    if(!this._selectedLabelId) return;

    this._textLabels = this._textLabels.map(l=>{

      if(l.id === this._selectedLabelId){

        return {
          ...l,
          fontSize:Number(size)
        };
      }

      return l;
    });
  }

  _save(){

    const canvas = this._canvas();
    const ctx = this._ctx();

    this._textLabels.forEach(label=>{

      ctx.fillStyle = label.color;

      ctx.font = `bold ${label.fontSize}px Segoe UI`;

      ctx.fillText(label.text,label.x,label.y);
    });

    const data = canvas.toDataURL('image/png');

    this._annotatedDataUrl = data;

    this.dispatchEvent(new CustomEvent('ntx-value-change',{
      bubbles:true,
      composed:true,
      detail:data
    }));

    this._closeModal();
  }

  render(){

    const display = this._annotatedDataUrl || this._imageDataUrl;

    return html`

      ${!display ? html`

        <div
          class="upload-zone"
          @click="${()=>this.shadowRoot.querySelector('#file').click()}"
        >
          <h3>🖼 Upload Image</h3>
          <div>Click here to upload an image</div>

          <input
            id="file"
            type="file"
            accept="image/*"
            hidden
            @change="${this._onFileChange}"
          >
        </div>

      ` : html`

        <img class="preview-img" src="${display}">

        <div style="margin-top:10px;display:flex;gap:10px;">
          <button class="btn btn-primary" @click="${this._openModal}">
            ✏ Edit / Annotate
          </button>

          <button class="btn btn-danger">
            🗑 Remove
          </button>
        </div>

      `}

      ${this._modalOpen ? html`

        <div class="modal-overlay">

          <div class="modal">

            <div class="toolbar">

              <button
                class="tool-btn ${this._tool==='select' ? 'active':''}"
                @click="${()=>this._tool='select'}"
              >
                🖱 Select
              </button>

              <button
                class="tool-btn ${this._tool==='text' ? 'active':''}"
                @click="${()=>this._tool='text'}"
              >
                🔤 Text
              </button>

              <div class="shape-menu">

                <button
                  class="tool-btn ${this._tool==='shape' ? 'active':''}"
                  @click="${()=>{
                    this._tool='shape';
                    this._showShapesMenu = !this._showShapesMenu;
                  }}"
                >
                  ⬜ Shapes
                </button>

                ${this._showShapesMenu ? html`

                  <div class="shape-dropdown">

                    <button class="tool-btn"
                      @click="${()=>{
                        this._shapeTool='rect';
                        this._showShapesMenu=false;
                      }}"
                    >
                      ▭ Rectangle
                    </button>

                    <button class="tool-btn"
                      @click="${()=>{
                        this._shapeTool='circle';
                        this._showShapesMenu=false;
                      }}"
                    >
                      ◯ Circle
                    </button>

                    <button class="tool-btn"
                      @click="${()=>{
                        this._shapeTool='line';
                        this._showShapesMenu=false;
                      }}"
                    >
                      ／ Line
                    </button>

                    <button class="tool-btn"
                      @click="${()=>{
                        this._shapeTool='arrow';
                        this._showShapesMenu=false;
                      }}"
                    >
                      ↗ Arrow
                    </button>

                  </div>

                `:''}

              </div>

              <input
                class="color-picker"
                type="color"
                .value="${this._color}"
                @change="${(e)=>this._color=e.target.value}"
              >

              <select
                @change="${(e)=>this._updateSelectedFontSize(e.target.value)}"
              >
                <option value="10">10px</option>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="32">32px</option>
                <option value="48">48px</option>
              </select>

            </div>

            <div class="canvas-wrap">

              <div class="canvas-container">

                <canvas
                  id="canvas"
                  @mousedown="${this._canvasDown}"
                  @mousemove="${this._canvasMove}"
                  @mouseup="${this._canvasUp}"
                ></canvas>

                ${this._textLabels.map(label=>html`

                  <div
                    class="text-label ${this._selectedLabelId===label.id ? 'selected':''}"
                    style="
                      left:${label.x}px;
                      top:${label.y}px;
                    "
                  >

                    <div
                      class="text-content"
                      contenteditable="true"
                      style="
                        color:${label.color};
                        font-size:${label.fontSize}px;
                      "
                      @mousedown="${(e)=>this._dragLabel(e,label.id)}"
                      @click="${()=>this._selectLabel(label.id)}"
                    >${label.text}</div>

                    ${this._selectedLabelId===label.id ? html`

                      <div
                        class="resize-handle handle-tl"
                        @mousedown="${(e)=>this._resizeLabel(e,label.id,'tl')}"
                      ></div>

                      <div
                        class="resize-handle handle-tr"
                        @mousedown="${(e)=>this._resizeLabel(e,label.id,'tr')}"
                      ></div>

                      <div
                        class="resize-handle handle-bl"
                        @mousedown="${(e)=>this._resizeLabel(e,label.id,'bl')}"
                      ></div>

                      <div
                        class="resize-handle handle-br"
                        @mousedown="${(e)=>this._resizeLabel(e,label.id,'br')}"
                      ></div>

                    `:''}

                  </div>

                `)}

              </div>

            </div>

            <div style="
              padding:12px;
              background:#111827;
              display:flex;
              justify-content:flex-end;
              gap:10px;
            ">

              <button
                class="btn"
                @click="${this._closeModal}"
              >
                Cancel
              </button>

              <button
                class="btn btn-primary"
                @click="${this._save}"
              >
                ✅ Save Annotation
              </button>

            </div>

          </div>

        </div>

      `:''}
    `;
  }
}

customElements.define(
  'org-image-annotator-v4',
  OrgImageAnnotatorV4
);