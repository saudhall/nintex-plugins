/**
 * Custom Links - Nintex Forms plugin
 * Element name: custom-links
 *
 * - Add links as Name + URL pairs (URL may be pasted as "www.google.com")
 * - Links are normalised (https:// added if missing)
 * - Every link opens in a new window/tab
 * - Stored value (ntx-value-change) is a JSON string: [{"name":"Google","url":"https://www.google.com"}]
 * - Read-only / display form: shows links only (no add/remove controls)
 *
 * No external dependencies (plain web component + Shadow DOM).
 */
class CustomLinks extends HTMLElement {
  static getMetaConfig() {
    return {
      controlName: 'Custom Links',
      fallbackDisableSubmit: false,
      version: '1',
      pluginAuthor: 'saudhall',
      pluginVersion: '1.0.0',
      description: 'Add named hyperlinks that open in a new window',
      iconUrl: 'attach',
      groupName: 'Custom Plugins',
      searchTerms: ['link', 'links', 'url', 'hyperlink', 'website'],
      standardProperties: {
        fieldLabel: true,
        description: true,
        toolTip: true,
        visibility: true,
        readOnly: true,
        required: true,
        defaultValue: false,
        placeholder: false,
      },
      designer: {
        canvasRestrictions: {
          isFullRow: true,
        },
      },
      properties: {
        value: {
          type: 'string',
          title: 'Value',
          isValueField: true,
          maxLength: 4000,
        },
      },
    };
  }

  constructor() {
    super();
    this._links = [];
    this._value = '';
    this._readOnly = false;
    this.attachShadow({ mode: 'open' });
    this._build();
    this._render();
  }

  // ---------- Properties set by Nintex ----------
  get value() {
    return this._value;
  }
  set value(v) {
    const str = v === null || v === undefined ? '' : String(v);
    if (str === this._value) return;
    this._value = str;
    this._links = CustomLinks._parse(str);
    this._render();
  }

  get readOnly() {
    return this._readOnly;
  }
  set readOnly(v) {
    this._readOnly = v === true || v === 'true';
    this._render();
  }

  static get observedAttributes() {
    return ['value', 'readonly'];
  }
  attributeChangedCallback(name, _old, val) {
    if (name === 'value') this.value = val;
    if (name === 'readonly') this.readOnly = val !== null && val !== 'false';
  }

  // ---------- Helpers ----------
  static _parse(str) {
    if (!str) return [];
    try {
      const arr = JSON.parse(str);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((l) => l && typeof l.url === 'string')
        .map((l) => ({ name: String(l.name || ''), url: l.url }));
    } catch (e) {
      return [];
    }
  }

  // Returns a safe absolute URL, or '' if invalid
  static _normalizeUrl(raw) {
    let u = (raw || '').trim();
    if (!u) return '';
    if (/^(mailto:|tel:)/i.test(u)) return u;
    if (u.startsWith('//')) u = 'https:' + u;
    else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) {
      // has an explicit scheme - only allow http/https
      if (!/^https?:\/\//i.test(u)) return '';
    } else if (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^[^/]*\.[^/]*:\d+/.test(u)) {
      // javascript:, data:, vbscript: etc.
      return '';
    } else {
      u = 'https://' + u;
    }
    try {
      const parsed = new URL(u);
      if (!/^https?:$/.test(parsed.protocol)) return '';
      if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return '';
      return parsed.href;
    } catch (e) {
      return '';
    }
  }

  static _displayName(link) {
    if (link.name && link.name.trim()) return link.name.trim();
    try {
      return new URL(link.url).hostname.replace(/^www\./i, '');
    } catch (e) {
      return link.url;
    }
  }

  _emit() {
    this._value = JSON.stringify(this._links);
    this.dispatchEvent(
      new CustomEvent('ntx-value-change', {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: this._value,
      })
    );
  }

  // ---------- DOM ----------
  _build() {
    const style = document.createElement('style');
    style.textContent = `
      :host { display: block; font-family: var(--ntx-form-theme-font-family, inherit); }
      .wrap { display: flex; flex-direction: column; gap: 10px; }
      ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      li { display: flex; align-items: center; gap: 8px; }
      a { color: var(--ntx-form-theme-color-primary, #0b57d0); font-size: var(--ntx-form-theme-text-input-size, 14px); word-break: break-all; }
      a:focus-visible, button:focus-visible, input:focus-visible { outline: 2px solid var(--ntx-form-theme-color-primary, #0b57d0); outline-offset: 2px; }
      .empty { color: #5f6368; font-size: 14px; font-style: italic; }
      .add { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
      input {
        flex: 1 1 180px; min-width: 0; box-sizing: border-box;
        height: var(--ntx-form-theme-control-height, 36px); padding: 0 10px;
        font: inherit; font-size: var(--ntx-form-theme-text-input-size, 14px);
        color: var(--ntx-form-theme-color-input-text, inherit);
        background: var(--ntx-form-theme-color-input-background, #fff);
        border: 1px solid var(--ntx-form-theme-color-border, #8a8a8a);
        border-radius: var(--ntx-form-theme-border-radius, 4px);
      }
      button {
        height: var(--ntx-form-theme-control-height, 36px); padding: 0 14px; cursor: pointer; font: inherit;
        border-radius: var(--ntx-form-theme-border-radius, 4px);
        border: 1px solid var(--ntx-form-theme-color-primary, #0b57d0);
        background: var(--ntx-form-theme-color-primary, #0b57d0); color: #fff;
      }
      button.remove {
        width: 28px; height: 28px; padding: 0; flex: 0 0 auto;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 18px; line-height: 1; font-weight: 700;
        background: transparent; color: #d93025; border: 1px solid #d93025; border-radius: 50%;
      }
      button.remove:hover, button.remove:focus-visible { background: #d93025; color: #fff; }
      .error { color: var(--ntx-form-theme-color-error, #b3261e); font-size: 13px; min-height: 1em; }
      @media (prefers-reduced-motion: no-preference) { a { transition: opacity .15s; } a:hover { opacity: .8; } }
    `;

    this._wrap = document.createElement('div');
    this._wrap.className = 'wrap';

    this._list = document.createElement('ul');
    this._list.setAttribute('aria-label', 'Links');

    this._empty = document.createElement('div');
    this._empty.className = 'empty';
    this._empty.textContent = 'No links added';

    this._addRow = document.createElement('div');
    this._addRow.className = 'add';

    this._nameInput = document.createElement('input');
    this._nameInput.type = 'text';
    this._nameInput.placeholder = 'Link name (e.g. Google)';
    this._nameInput.setAttribute('aria-label', 'Link name');

    this._urlInput = document.createElement('input');
    this._urlInput.type = 'text';
    this._urlInput.placeholder = 'URL (e.g. www.google.com)';
    this._urlInput.setAttribute('aria-label', 'Link URL');

    this._addBtn = document.createElement('button');
    this._addBtn.type = 'button';
    this._addBtn.textContent = 'Add link';

    this._error = document.createElement('div');
    this._error.className = 'error';
    this._error.setAttribute('role', 'alert');

    this._addRow.append(this._nameInput, this._urlInput, this._addBtn);
    this._wrap.append(this._list, this._empty, this._addRow, this._error);
    this.shadowRoot.append(style, this._wrap);

    this._addBtn.addEventListener('click', () => this._add());
    const onEnter = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._add();
      }
    };
    this._nameInput.addEventListener('keydown', onEnter);
    this._urlInput.addEventListener('keydown', onEnter);
  }

  _add() {
    const url = CustomLinks._normalizeUrl(this._urlInput.value);
    if (!url) {
      this._error.textContent = 'Please enter a valid URL (e.g. www.google.com).';
      this._urlInput.focus();
      return;
    }
    this._error.textContent = '';
    this._links = [...this._links, { name: this._nameInput.value.trim(), url }];
    this._nameInput.value = '';
    this._urlInput.value = '';
    this._emit();
    this._render();
    this._nameInput.focus();
  }

  _remove(index) {
    this._links = this._links.filter((_, i) => i !== index);
    this._emit();
    this._render();
  }

  _render() {
    if (!this._list) return;
    this._list.textContent = '';

    this._links.forEach((link, i) => {
      const safeUrl = CustomLinks._normalizeUrl(link.url);
      if (!safeUrl) return;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = safeUrl;
      a.textContent = CustomLinks._displayName(link);
      a.target = '_blank'; // always a new window
      a.rel = 'noopener noreferrer';
      a.title = safeUrl;
      li.append(a);

      if (!this._readOnly) {
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'remove';
        rm.textContent = '\u2715';
        rm.title = 'Delete link';
        rm.setAttribute('aria-label', 'Delete link ' + CustomLinks._displayName(link));
        rm.addEventListener('click', () => this._remove(i));
        li.append(rm);
      }
      this._list.append(li);
    });

    this._empty.style.display = this._list.children.length ? 'none' : '';
    this._addRow.style.display = this._readOnly ? 'none' : '';
    this._error.style.display = this._readOnly ? 'none' : '';
  }
}

if (!customElements.get('custom-links')) {
  customElements.define('custom-links', CustomLinks);
}