/**
 * Repetitive Comments - Nintex Forms plugin
 * Element name: repetitive-comments
 *
 * - Add as many comments as needed (each stamped with DD-MMM-YYYY HH:mm)
 * - Newest comment is shown on top
 * - Only the first line of each comment shows; "see more" expands it
 * - Comments are shaded in alternating grey / white
 * - Read-only / display form: shows comments only (no input box)
 * - Stored value (ntx-value-change) is a JSON string:
 *   [{"id":"abc1","text":"Comment","ts":"2026-10-06T04:32:00.000Z"}]
 *
 * No external dependencies (plain web component + Shadow DOM).
 */
class RepetitiveComments extends HTMLElement {
  static getMetaConfig() {
    return {
      controlName: 'Repetitive Comments',
      fallbackDisableSubmit: false,
      version: '1',
      pluginAuthor: 'saudhall',
      pluginVersion: '1.0.0',
      description: 'Add multiple time-stamped comments, newest first',
      iconUrl: 'multiline-text',
      groupName: 'Custom Plugins',
      searchTerms: ['comment', 'comments', 'notes', 'history', 'log', 'repeating'],
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
          minSize: 10,
          isFullRow: true,
        },
      },
      properties: {
        value: {
          type: 'string',
          title: 'Value',
          isValueField: true,
          maxLength: 20000,
        },
      },
    };
  }

  constructor() {
    super();
    this._comments = [];
    this._value = '';
    this._readOnly = false;
    this._expanded = new Set();
    this._needsToggle = new Map();
    this._page = 0;
    this._pageSize = 4; // comments shown per page
    this.attachShadow({ mode: 'open' });
    this._build();
    this._render();
  }

  connectedCallback() {
    if (typeof ResizeObserver !== 'undefined' && !this._ro) {
      this._ro = new ResizeObserver(() => this._measure());
      this._ro.observe(this);
    }
  }

  disconnectedCallback() {
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
  }

  // ---------- Properties set by Nintex ----------
  get value() {
    return this._value;
  }
  set value(v) {
    const str = v === null || v === undefined ? '' : String(v);
    if (str === this._value) return;
    this._value = str;
    this._comments = RepetitiveComments._parse(str);
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
        .filter((c) => c && typeof c.text === 'string')
        .map((c, i) => ({
          id: String(c.id || 'c' + i),
          text: c.text,
          ts: typeof c.ts === 'string' ? c.ts : '',
        }));
    } catch (e) {
      return [];
    }
  }

  static _stamp(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (
      pad(d.getDate()) + '-' + mon[d.getMonth()] + '-' + d.getFullYear() +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
    );
  }

  static _firstLine(text) {
    return text.split(/\r?\n/)[0];
  }

  _emit() {
    this._value = JSON.stringify(this._comments);
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
      .wrap { display: flex; flex-direction: column; gap: 12px; }
      .add { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
      textarea {
        width: 100%; box-sizing: border-box; min-height: 70px; padding: 8px 10px; resize: vertical;
        font: inherit; font-size: var(--ntx-form-theme-text-input-size, 14px);
        color: var(--ntx-form-theme-color-input-text, inherit);
        background: var(--ntx-form-theme-color-input-background, #fff);
        border: 1px solid var(--ntx-form-theme-color-border, #8a8a8a);
        border-radius: var(--ntx-form-theme-border-radius, 4px);
      }
      button.add-btn {
        height: var(--ntx-form-theme-control-height, 36px); padding: 0 16px; cursor: pointer; font: inherit;
        border-radius: var(--ntx-form-theme-border-radius, 4px);
        border: 1px solid var(--ntx-form-theme-color-primary, #0b57d0);
        background: var(--ntx-form-theme-color-primary, #0b57d0); color: #fff;
      }
      textarea:focus-visible, button:focus-visible { outline: 2px solid var(--ntx-form-theme-color-primary, #0b57d0); outline-offset: 2px; }
      .error { color: var(--ntx-form-theme-color-error, #b3261e); font-size: 13px; min-height: 1em; }
      ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      li {
        padding: 8px 12px; border-radius: 4px; border: 1px solid #dadce0;
        background: #ffffff; color: var(--ntx-form-theme-color-input-text, #202124);
      }
      li.shaded { background: #e8eaed; }
      .text { font-size: var(--ntx-form-theme-text-input-size, 14px); line-height: 1.4; }
      .text.collapsed { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .text.expanded { white-space: pre-wrap; word-break: break-word; }
      .meta { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 4px; min-height: 20px; }
      .toggle {
        background: none; border: none; padding: 0; cursor: pointer; font: inherit; font-size: 13px;
        color: var(--ntx-form-theme-color-primary, #0b57d0); text-decoration: underline;
      }
      .toggle[hidden] { display: none; }
      .stamp { font-size: 12px; color: #5f6368; margin-left: auto; white-space: nowrap; }
      .empty { color: #5f6368; font-size: 14px; font-style: italic; }
      .pager { display: flex; align-items: center; justify-content: center; gap: 12px; }
      .pager button {
        width: 32px; height: 32px; padding: 0; cursor: pointer; font: inherit; font-size: 18px; line-height: 1;
        border-radius: var(--ntx-form-theme-border-radius, 4px);
        border: 1px solid var(--ntx-form-theme-color-primary, #0b57d0);
        background: transparent; color: var(--ntx-form-theme-color-primary, #0b57d0);
      }
      .pager button:hover:not(:disabled) { background: var(--ntx-form-theme-color-primary, #0b57d0); color: #fff; }
      .pager button:disabled { opacity: .35; cursor: default; }
      .pager .page-label { font-size: 13px; color: #5f6368; min-width: 90px; text-align: center; }
    `;

    this._wrap = document.createElement('div');
    this._wrap.className = 'wrap';

    this._addBox = document.createElement('div');
    this._addBox.className = 'add';

    this._textarea = document.createElement('textarea');
    this._textarea.placeholder = 'Write a comment...';
    this._textarea.setAttribute('aria-label', 'New comment');

    this._addBtn = document.createElement('button');
    this._addBtn.type = 'button';
    this._addBtn.className = 'add-btn';
    this._addBtn.textContent = 'Add comment';

    this._error = document.createElement('div');
    this._error.className = 'error';
    this._error.setAttribute('role', 'alert');

    this._addBox.append(this._textarea, this._addBtn, this._error);

    this._list = document.createElement('ul');
    this._list.setAttribute('aria-label', 'Comments');

    this._empty = document.createElement('div');
    this._empty.className = 'empty';
    this._empty.textContent = 'No comments yet';

    this._pager = document.createElement('div');
    this._pager.className = 'pager';
    this._pager.setAttribute('role', 'navigation');
    this._pager.setAttribute('aria-label', 'Comment pages');

    this._prevBtn = document.createElement('button');
    this._prevBtn.type = 'button';
    this._prevBtn.textContent = '<';
    this._prevBtn.title = 'Newer comments';
    this._prevBtn.setAttribute('aria-label', 'Newer comments');

    this._pageLabel = document.createElement('span');
    this._pageLabel.className = 'page-label';
    this._pageLabel.setAttribute('aria-live', 'polite');

    this._nextBtn = document.createElement('button');
    this._nextBtn.type = 'button';
    this._nextBtn.textContent = '>';
    this._nextBtn.title = 'Older comments';
    this._nextBtn.setAttribute('aria-label', 'Older comments');

    this._pager.append(this._prevBtn, this._pageLabel, this._nextBtn);
    this._prevBtn.addEventListener('click', () => this._goTo(this._page - 1));
    this._nextBtn.addEventListener('click', () => this._goTo(this._page + 1));

    this._wrap.append(this._addBox, this._list, this._pager, this._empty);
    this.shadowRoot.append(style, this._wrap);

    this._addBtn.addEventListener('click', () => this._add());
    this._textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this._add();
      }
    });
  }

  _add() {
    const text = this._textarea.value.trim();
    if (!text) {
      this._error.textContent = 'Please type a comment first.';
      this._textarea.focus();
      return;
    }
    this._error.textContent = '';
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this._comments = [...this._comments, { id, text, ts: new Date().toISOString() }];
    this._textarea.value = '';
    this._page = 0; // show the newest comments
    this._emit();
    this._render();
  }

  _goTo(page) {
    this._page = page;
    this._render();
  }

  _toggle(id) {
    if (this._expanded.has(id)) this._expanded.delete(id);
    else this._expanded.add(id);
    this._render();
  }

  _render() {
    if (!this._list) return;
    this._list.textContent = '';

    // Newest first (comments are stored oldest -> newest)
    const ordered = [...this._comments].reverse();

    // Pagination: this._pageSize comments per page
    const totalPages = Math.max(1, Math.ceil(ordered.length / this._pageSize));
    this._page = Math.min(Math.max(0, this._page), totalPages - 1);
    const start = this._page * this._pageSize;
    const visible = ordered.slice(start, start + this._pageSize);

    visible.forEach((c, i) => {
      const isExpanded = this._expanded.has(c.id);
      const hasNewline = /\r?\n/.test(c.text.trim());

      const li = document.createElement('li');
      if (i % 2 === 0) li.classList.add('shaded'); // 1st, 3rd, 5th... grey
      li.dataset.id = c.id;

      const textEl = document.createElement('div');
      textEl.className = 'text ' + (isExpanded ? 'expanded' : 'collapsed');
      textEl.textContent = isExpanded ? c.text : RepetitiveComments._firstLine(c.text);

      const meta = document.createElement('div');
      meta.className = 'meta';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'toggle';
      toggle.textContent = isExpanded ? 'see less' : 'see more';
      toggle.setAttribute('aria-expanded', String(isExpanded));
      toggle.hidden = !(hasNewline || this._needsToggle.get(c.id) === true);
      if (hasNewline) this._needsToggle.set(c.id, true);
      toggle.addEventListener('click', () => this._toggle(c.id));

      const stamp = document.createElement('span');
      stamp.className = 'stamp';
      const s = RepetitiveComments._stamp(c.ts);
      stamp.textContent = s ? '[' + s + ']' : '';

      meta.append(toggle, stamp);
      li.append(textEl, meta);
      this._list.append(li);
    });

    this._empty.style.display = ordered.length ? 'none' : '';
    this._pager.style.display = ordered.length > this._pageSize ? '' : 'none';
    this._prevBtn.disabled = this._page <= 0;
    this._nextBtn.disabled = this._page >= totalPages - 1;
    this._pageLabel.textContent = 'Page ' + (this._page + 1) + ' of ' + totalPages;
    this._addBox.style.display = this._readOnly ? 'none' : '';

    requestAnimationFrame(() => this._measure());
  }

  // Show "see more" when a collapsed first line is cut off by the available width
  _measure() {
    if (!this._list) return;
    this._list.querySelectorAll('li').forEach((li) => {
      const textEl = li.querySelector('.text');
      const toggle = li.querySelector('.toggle');
      if (!textEl || !toggle || textEl.classList.contains('expanded')) return;
      const id = li.dataset.id;
      const overflow = textEl.scrollWidth > textEl.clientWidth + 1;
      const needs = overflow || this._needsToggle.get(id) === true;
      if (overflow) this._needsToggle.set(id, true);
      toggle.hidden = !needs;
    });
  }
}

if (!customElements.get('repetitive-comments')) {
  customElements.define('repetitive-comments', RepetitiveComments);
}
