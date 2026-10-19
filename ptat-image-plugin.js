/**
 * Nintex Form Plugin: PTAT-Image
 *
 * Simple image upload control:
 *  - Click to upload a photo
 *  - Photo shows as a small preview on the form
 *  - "View in Full Screen" button opens it full screen
 *  - Tap the image (or press Esc) to return to the small size
 *
 * REGISTRATION DETAILS:
 *   Element name: ptat-image
 *   Source URL:
 *   https://saudhall.github.io/nintex-plugins/ptat-image-plugin.js
 */

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

class PtatImage extends LitElement {

  static properties = {
    label: {},
    description: {},
    readOnly: { type: Boolean, attribute: 'readonly' },
    required: { type: Boolean },
    value: {},

    _imageDataUrl: { state: true },
    _fullScreen: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      font-family: Segoe UI, sans-serif;
    }

    .upload-zone {
      border: 2px dashed #cbd5e1;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      background: #f8fafc;
    }

    .upload-zone.disabled {
      cursor: not-allowed;
      opacity: .6;
    }

    .preview-img {
      max-width: 100%;
      max-height: 260px;
      border-radius: 8px;
      border: 1px solid #ddd;
      display: block;
    }

    .actions {
      margin-top: 10px;
      display: flex;
      gap: 10px;
    }

    .btn {
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .fs-overlay {
      position: fixed;
      inset: 0;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      cursor: zoom-out;
    }

    .fs-img {
      max-width: 100vw;
      max-height: 100vh;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `;

  constructor() {
    super();
    this.label = 'PTAT-Image';
    this.readOnly = false;
    this._imageDataUrl = null;
    this._fullScreen = false;
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  static getMetaConfig() {
    return {
      controlName: 'PTAT-Image',
      description: 'Simple image upload with a View in Full Screen button. Tap the image to return to normal size.',
      groupName: 'Custom',
      version: '1',
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
          title: 'Image',
          isValueField: true
        }
      }
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this._onKeyDown);
    super.disconnectedCallback();
  }

  willUpdate(changed) {
    // Load a saved value when the form opens
    if (changed.has('value') && this.value && this.value !== this._imageDataUrl) {
      this._imageDataUrl = this.value;
    }
  }

  // True when the form/item is opened in Display (read-only) mode
  get _isReadOnly() {
    if (this.readOnly === true || this.readOnly === 'true') return true;
    if (this.hasAttribute('readonly') || this.hasAttribute('readOnly')) return true;

    const url = (window.location.href || '').toLowerCase();
    if (url.includes('dispform') || url.includes('controlmode=display') || url.includes('mode=display')) {
      return true;
    }
    return false;
  }

  _onKeyDown(e) {
    if (e.key === 'Escape' && this._fullScreen) {
      this._fullScreen = false;
    }
  }

  _pickFile() {
    if (this._isReadOnly) return;
    this.shadowRoot.querySelector('#file').click();
  }

  _onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      this._imageDataUrl = ev.target.result;
      this._emit(this._imageDataUrl);
    };
    reader.readAsDataURL(file);
  }

  _remove() {
    this._imageDataUrl = null;
    this._emit('');
  }

  _emit(data) {
    this.dispatchEvent(new CustomEvent('ntx-value-change', {
      bubbles: true,
      composed: true,
      detail: data
    }));
  }

  render() {
    return html`
      ${!this._imageDataUrl ? html`

        <div
          class="upload-zone ${this._isReadOnly ? 'disabled' : ''}"
          @click="${this._pickFile}"
        >
          <h3>🖼 ${this._isReadOnly ? 'No Photo' : 'Upload Photo'}</h3>
          <div>${this._isReadOnly ? 'No photo has been uploaded' : 'Click to upload a photo'}</div>
          <input
            hidden
            id="file"
            type="file"
            accept="image/*"
            @change="${this._onFileChange}"
          >
        </div>

      ` : html`

        <img class="preview-img" src="${this._imageDataUrl}">

        <div class="actions">
          <button
            class="btn btn-primary"
            @click="${() => this._fullScreen = true}"
          >
            🔍 View in Full Screen
          </button>

          ${!this._isReadOnly ? html`
            <button class="btn btn-danger" @click="${this._remove}">
              🗑 Remove
            </button>
          ` : ''}
        </div>

      `}

      ${this._fullScreen ? html`
        <div class="fs-overlay" @click="${() => this._fullScreen = false}">
          <img class="fs-img" src="${this._imageDataUrl}">
        </div>
      ` : ''}
    `;
  }
}

customElements.define('ptat-image', PtatImage);
