/**
 * Nintex Form Plugin: PTAT-Image (v1.2)
 *
 * Simple image upload control:
 *  - Click to upload a photo
 *  - Photo shows as a small preview on the form
 *  - "View in Full Screen" button opens it full screen
 *  - Tap the image (or press Esc) to return to the small size
 *  - Upload / Remove are hidden in the Display form
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
    _fullScreen: { state: true },
    _uploadedThisSession: { state: true }
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
      cursor: default;
      opacity: .7;
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
    this._imageDataUrl = null;
    this._fullScreen = false;
    this._uploadedThisSession = false;
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  static getMetaConfig() {
    return {
      controlName: 'PTAT-Image',
      description: 'Simple image upload with a View in Full Screen button. Tap the image to return to normal size.',
      groupName: 'Custom',
      version: '1.2',
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
    if (changed.has('value') && this.value && this.value !== this._imageDataUrl) {
      this._imageDataUrl = this.value;
    }
  }

  // All page addresses we can see (this page, parent page, referrer)
  _urls() {
    const urls = [];
    try { urls.push(window.location.href); } catch (e) {}
    try { urls.push(window.top.location.href); } catch (e) {}
    try { urls.push(window.parent.location.href); } catch (e) {}
    try { urls.push(document.referrer); } catch (e) {}
    return urls.map(u => (u || '').toLowerCase());
  }

  // True when the item is opened in Display (read-only) mode
  get _isReadOnly() {
    if (this.readOnly === true || this.readOnly === 'true') return true;
    if (this.hasAttribute('readonly') || this.hasAttribute('readOnly') || this.hasAttribute('disabled')) return true;

    let el = this;
    while (el) {
      if (el.nodeType === 1) {
        const cls = (el.className && el.className.toString().toLowerCase()) || '';
        if (el.hasAttribute('readonly') || el.hasAttribute('disabled') ||
            cls.includes('readonly') || cls.includes('read-only') ||
            cls.includes('display-mode') || cls.includes('displaymode')) {
          return true;
        }
      }
      el = el.parentNode || el.host || null;
    }

    return this._urls().some(l =>
      l.includes('dispform') ||
      l.includes('controlmode=display') ||
      l.includes('mode=display') ||
      l.includes('formmode=display') ||
      l.includes('display=true')
    );
  }

  // True only when we are confident the form is New or Edit
  get _isEditContext() {
    if (this.readOnly === false) return true;
    return this._urls().some(l =>
      l.includes('newform') ||
      l.includes('editform') ||
      l.includes('controlmode=edit') ||
      l.includes('controlmode=new') ||
      l.includes('mode=edit') ||
      l.includes('mode=new')
    );
  }

  // Upload / Remove allowed only on New or Edit forms, never on Display
  get _canEdit() {
    if (this._isReadOnly) return false;
    return this._uploadedThisSession || this._isEditContext;
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
      this._uploadedThisSession = true;
      this._emit(this._imageDataUrl);
    };
    reader.readAsDataURL(file);
  }

  _remove() {
    if (!this._canEdit) return;
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
    const readOnly = this._isReadOnly;
    const canEdit = this._canEdit;

    return html`
      ${!this._imageDataUrl ? html`

        <div
          class="upload-zone ${readOnly ? 'disabled' : ''}"
          @click="${this._pickFile}"
        >
          <h3>🖼 ${readOnly ? 'No Photo' : 'Upload Photo'}</h3>
          <div>${readOnly ? 'No photo has been uploaded' : 'Click to upload a photo'}</div>
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

          ${canEdit ? html`
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
