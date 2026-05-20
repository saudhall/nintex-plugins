/**
 * Nintex Form Plugin: Image Annotator v5 Created by Saurabh Dhall (www.sharepointist.com)
 *
 * NEW IN V5:
 * ✅ Pointer / Select Tool
 * ✅ Pencil Tool
 * ✅ Highlighter Tool
 * ✅ Eraser Tool
 * ✅ Undo Support
 * ✅ Shape Thickness Control
 * ✅ Text Rotation
 * ✅ Resizable Text
 * ✅ 4 Resize Handles
 * ✅ Draggable Objects
 * ✅ Rectangle / Circle / Arrow / Line
 * ✅ Custom Color Picker
 * ✅ 8 Font Sizes
 * ✅ Full v3 Compatibility Features
 *
 * REGISTRATION DETAILS:
 *   Element name: org-image-annotator-v5
 *   Source URL:
 *   https://saudhall.github.io/nintex-plugins/image-annotator-plugin-v5.js
 */

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class OrgImageAnnotatorV5 extends LitElement {

  static properties = {

    label: {},
    description: {},
    readOnly: {},
    required: {},

    _imageDataUrl: { state:true },
    _annotatedDataUrl: { state:true },

    _modalOpen: { state:true },

    _tool: { state:true },
    _shapeTool: { state:true },

    _color: { state:true },
    _lineWidth: { state:true },
    _fontSize: { state:true },

    _textLabels: { state:true },

    _selectedLabelId: { state:true },

    _isDrawing: { state:true },

    _undoStack: { state:true },

    _showShapesMenu: { state:true }

  };

  static styles = css`

    :host{
      display:block;
      font-family:Segoe UI,sans-serif;
    }

    .upload-zone{
      border:2px dashed #cbd5e1;
      padding:30px;
      border-radius:12px;
      text-align:center;
      cursor:pointer;
      background:#f8fafc;
    }

    .preview-img{
      max-width:100%;
      max-height:260px;
      border-radius:8px;
      border:1px solid #ddd;
    }

    .btn{
      border:none;
      padding:8px 14px;
      border-radius:8px;
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
      z-index:999999;
    }

    .modal{
      width:95vw;
      height:95vh;
      background:#111827;
      border-radius:12px;
      overflow:hidden;
      display:flex;
      flex-direction:column;
    }

    .toolbar{
      background:#1f2937;
      padding:10px;
      display:flex;
      flex-wrap:wrap;
      gap:8px;
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
      background:#0f172a;
      display:flex;
      justify-content:center;
      align-items:center;
      padding:20px;
    }

    .canvas-container{
      position:relative;
      display:inline-block;
    }

    canvas{
      display:block;
      background:white;
      border-radius:8px;
      box-shadow:0 10px 40px rgba(0,0,0,.5);
    }

    .text-label{
      position:absolute;
      transform:translate(-50%, -50%);
      user-select:none;
    }

    .text-box{
      min-width:40px;
      padding:4px 6px;
      border:2px dashed transparent;
      background:rgba(0,0,0,.15);
      font-weight:700;
      white-space:pre;
      cursor:move;
      transform-origin:center;
    }

    .text-label.selected .text-box{
      border-color:#60a5fa;
    }

    .resize-handle{
      width:10px;
      height:10px;
      background:white;
      border:2px solid #2563eb;
      border-radius:50%;
      position:absolute;
    }

    .handle-tl{top:-8px;left:-8px;cursor:nwse-resize;}
    .handle-tr{top:-8px;right:-8px;cursor:nesw-resize;}
    .handle-bl{bottom:-8px;left:-8px;cursor:nesw-resize;}
    .handle-br{bottom:-8px;right:-8px;cursor:nwse-resize;}

    .shape-dropdown{
      position:absolute;
      top:45px;
      left:0;
      background:#1f2937;
      border:1px solid #374151;
      border-radius:10px;
      padding:8px;
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:6px;
      z-index:1000;
    }

    .shape-wrap{
      position:relative;
    }

    select{
      background:#374151;
      color:white;
      border:1px solid #4b5563;
      border-radius:6px;
      padding:6px;
    }

    .color-picker{
      width:40px;
      height:40px;
      border:none;
      background:none;
      cursor:pointer;
    }

  `;

  constructor(){

    super();

    this.label = 'Image Annotator v5';

    this._imageDataUrl = null;
    this._annotatedDataUrl = null;

    this._modalOpen = false;

    this._tool = 'pointer';

    this._shapeTool = 'rect';

    this._color = '#ff0000';

    this._lineWidth = 4;

    this._fontSize = 20;

    this._textLabels = [];

    this._selectedLabelId = null;

    this._isDrawing = false;

    this._undoStack = [];

    this._showShapesMenu = false;

    this._labelCounter = 0;
  }

  static getMetaConfig(){

    return {

      controlName:'Image Annotator v5',

      description:'Advanced image annotation plugin with selectable objects, draggable text, resize handles, undo, highlighter, pencil, shapes, rotation and custom colours.',

      groupName:'Custom',

      version:'5',

      iconUrl:'image',

      standardProperties:{
        fieldLabel:true,
        description:true,
        readOnly:true,
        required:true,
        visibility:true
      },

      properties:{
        value:{
          type:'string',
          title:'Annotated Image',
          isValueField:true
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

  _pushUndo(){

    const canvas = this._canvas();

    this._undoStack.push(
      this._ctx().getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      )
    );

    if(this._undoStack.length > 20){
      this._undoStack.shift();
    }
  }

  _undo(){

    if(!this._undoStack.length) return;

    const last = this._undoStack.pop();

    this._ctx().putImageData(last,0,0);
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
      x:e.clientX - rect.left,
      y:e.clientY - rect.top
    };
  }

  _mouseDown(e){

    const ctx = this._ctx();

    const pos = this._coords(e);

    this._pushUndo();

    this._isDrawing = true;

    this._startX = pos.x;
    this._startY = pos.y;

    if(this._tool === 'text'){

      this._labelCounter++;

      const label = {

        id:this._labelCounter,

        x:pos.x,
        y:pos.y,

        text:'Double click to edit',

        color:this._color,

        fontSize:this._fontSize,

        rotation:0

      };

      this._textLabels = [...this._textLabels,label];

      this._selectedLabelId = label.id;

      this._isDrawing = false;

      return;
    }

    if(this._tool === 'pencil'){

      ctx.beginPath();
      ctx.moveTo(pos.x,pos.y);

      ctx.strokeStyle = this._color;
      ctx.lineWidth = this._lineWidth;
      ctx.lineCap = 'round';
    }

    if(this._tool === 'highlighter'){

      ctx.beginPath();
      ctx.moveTo(pos.x,pos.y);

      ctx.strokeStyle = this._color;
      ctx.lineWidth = this._lineWidth * 4;

      ctx.globalAlpha = 0.25;
    }

    if(this._tool === 'eraser'){

      ctx.beginPath();
      ctx.moveTo(pos.x,pos.y);

      ctx.globalCompositeOperation = 'destination-out';

      ctx.lineWidth = 25;
      ctx.lineCap = 'round';
    }

    if(this._tool === 'shape'){

      this._snapshot = ctx.getImageData(
        0,
        0,
        this._canvas().width,
        this._canvas().height
      );
    }
  }

  _mouseMove(e){

    if(!this._isDrawing) return;

    const ctx = this._ctx();

    const pos = this._coords(e);

    if(
      this._tool === 'pencil' ||
      this._tool === 'highlighter' ||
      this._tool === 'eraser'
    ){

      ctx.lineTo(pos.x,pos.y);
      ctx.stroke();

      return;
    }

    if(this._tool === 'shape'){

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

        ctx.arc(
          this._startX,
          this._startY,
          radius,
          0,
          Math.PI * 2
        );

        ctx.stroke();
      }

      if(this._shapeTool === 'line'){

        ctx.beginPath();

        ctx.moveTo(this._startX,this._startY);

        ctx.lineTo(pos.x,pos.y);

        ctx.stroke();
      }

      if(this._shapeTool === 'arrow'){

        ctx.beginPath();

        ctx.moveTo(this._startX,this._startY);

        ctx.lineTo(pos.x,pos.y);

        ctx.stroke();

        const angle = Math.atan2(
          pos.y - this._startY,
          pos.x - this._startX
        );

        const size = 14;

        ctx.beginPath();

        ctx.moveTo(pos.x,pos.y);

        ctx.lineTo(
          pos.x - size * Math.cos(angle - Math.PI/6),
          pos.y - size * Math.sin(angle - Math.PI/6)
        );

        ctx.lineTo(
          pos.x - size * Math.cos(angle + Math.PI/6),
          pos.y - size * Math.sin(angle + Math.PI/6)
        );

        ctx.closePath();

        ctx.fillStyle = this._color;

        ctx.fill();
      }
    }
  }

  _mouseUp(){

    this._isDrawing = false;

    const ctx = this._ctx();

    ctx.globalAlpha = 1;

    ctx.globalCompositeOperation = 'source-over';
  }

  _dragLabel(e,id){

    e.stopPropagation();

    this._selectedLabelId = id;

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

  _resizeLabel(e,id){

    e.stopPropagation();

    const move = (ev)=>{

      const rect = this._canvas().getBoundingClientRect();

      const x = ev.clientX - rect.left;

      this._textLabels = this._textLabels.map(l=>{

        if(l.id === id){

          const size = Math.max(
            10,
            l.fontSize + ((x - l.x)/10)
          );

          return {
            ...l,
            fontSize:size
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

  _rotateSelected(value){

    if(!this._selectedLabelId) return;

    this._textLabels = this._textLabels.map(l=>{

      if(l.id === this._selectedLabelId){

        return {
          ...l,
          rotation:Number(value)
        };
      }

      return l;
    });
  }

  _save(){

    const canvas = this._canvas();

    const ctx = this._ctx();

    this._textLabels.forEach(label=>{

      ctx.save();

      ctx.translate(label.x,label.y);

      ctx.rotate(label.rotation * Math.PI / 180);

      ctx.font = `bold ${label.fontSize}px Segoe UI`;

      ctx.fillStyle = label.color;

      ctx.fillText(label.text,0,0);

      ctx.restore();
    });

    const data = canvas.toDataURL('image/png');

    this._annotatedDataUrl = data;

    this.dispatchEvent(new CustomEvent(
      'ntx-value-change',
      {
        bubbles:true,
        composed:true,
        detail:data
      }
    ));

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

          <div>Click to upload image</div>

          <input
            hidden
            id="file"
            type="file"
            accept="image/*"
            @change="${this._onFileChange}"
          >

        </div>

      ` : html`

        <img class="preview-img" src="${display}">

        <div style="margin-top:10px;display:flex;gap:10px;">

          <button
            class="btn btn-primary"
            @click="${this._openModal}"
          >
            ✏ Edit / Annotate
          </button>

        </div>

      `}

      ${this._modalOpen ? html`

        <div class="modal-overlay">

          <div class="modal">

            <div class="toolbar">

              <button
                class="tool-btn ${this._tool==='pointer'?'active':''}"
                @click="${()=>this._tool='pointer'}"
              >
                🖱 Pointer
              </button>

              <button
                class="tool-btn ${this._tool==='pencil'?'active':''}"
                @click="${()=>this._tool='pencil'}"
              >
                ✏ Pencil
              </button>

              <button
                class="tool-btn ${this._tool==='highlighter'?'active':''}"
                @click="${()=>this._tool='highlighter'}"
              >
                🖍 Highlighter
              </button>

              <button
                class="tool-btn ${this._tool==='text'?'active':''}"
                @click="${()=>this._tool='text'}"
              >
                🔤 Text
              </button>

              <button
                class="tool-btn ${this._tool==='eraser'?'active':''}"
                @click="${()=>this._tool='eraser'}"
              >
                🧽 Eraser
              </button>

              <div class="shape-wrap">

                <button
                  class="tool-btn ${this._tool==='shape'?'active':''}"
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
                @change="${(e)=>this._lineWidth=Number(e.target.value)}"
              >
                <option value="2">Thin</option>
                <option value="4" selected>Medium</option>
                <option value="8">Thick</option>
                <option value="14">Heavy</option>
              </select>

              <select
                @change="${(e)=>this._fontSize=Number(e.target.value)}"
              >
                <option value="10">10px</option>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="20" selected>20px</option>
                <option value="24">24px</option>
                <option value="32">32px</option>
                <option value="48">48px</option>
              </select>

              <select
                @change="${(e)=>this._rotateSelected(e.target.value)}"
              >
                <option value="0">0°</option>
                <option value="15">15°</option>
                <option value="30">30°</option>
                <option value="45">45°</option>
                <option value="60">60°</option>
                <option value="90">90°</option>
                <option value="180">180°</option>
              </select>

              <button
                class="tool-btn"
                @click="${this._undo}"
              >
                ↩ Undo
              </button>

            </div>

            <div class="canvas-wrap">

              <div class="canvas-container">

                <canvas
                  id="canvas"
                  @mousedown="${this._mouseDown}"
                  @mousemove="${this._mouseMove}"
                  @mouseup="${this._mouseUp}"
                  @mouseleave="${this._mouseUp}"
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
                      class="text-box"
                      contenteditable="true"
                      style="
                        color:${label.color};
                        font-size:${label.fontSize}px;
                        transform:rotate(${label.rotation}deg);
                      "
                      @mousedown="${(e)=>this._dragLabel(e,label.id)}"
                      @click="${()=>this._selectedLabelId=label.id}"
                    >${label.text}</div>

                    ${this._selectedLabelId===label.id ? html`

                      <div
                        class="resize-handle handle-tl"
                        @mousedown="${(e)=>this._resizeLabel(e,label.id)}"
                      ></div>

                      <div
                        class="resize-handle handle-tr"
                        @mousedown="${(e)=>this._resizeLabel(e,label.id)}"
                      ></div>

                      <div
                        class="resize-handle handle-bl"
                        @mousedown="${(e)=>this._resizeLabel(e,label.id)}"
                      ></div>

                      <div
                        class="resize-handle handle-br"
                        @mousedown="${(e)=>this._resizeLabel(e,label.id)}"
                      ></div>

                    `:''}

                  </div>

                `)}

              </div>

            </div>

            <div style="
              background:#111827;
              padding:12px;
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
  'org-image-annotator-v5',
  OrgImageAnnotatorV5
);