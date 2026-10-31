import { createElement } from '../utils/dom.js';

export class Modal {
  constructor({ title = '', content = '', footer = '', width = '520px', onClose = null } = {}) {
    this.title = title;
    this.content = content;
    this.footer = footer;
    this.width = width;
    this.onClose = onClose;
    this.backdrop = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  open() {
    const container = document.getElementById('modal-container') || document.body;

    this.backdrop = createElement('div', {
      className: 'modal-backdrop',
      onclick: (e) => {
        if (e.target === this.backdrop) this.close();
      }
    });

    const dialog = createElement('div', {
      className: 'modal-dialog',
      style: { maxWidth: this.width }
    });

    // Header
    const header = createElement('div', { className: 'modal-header' }, [
      createElement('h3', { className: 'modal-title', textContent: this.title }),
      createElement('button', {
        className: 'modal-close-btn',
        innerHTML: '&times;',
        onclick: () => this.close()
      })
    ]);

    // Body
    const body = createElement('div', { className: 'modal-body' });
    if (typeof this.content === 'string') {
      body.innerHTML = this.content;
    } else if (this.content instanceof Node) {
      body.appendChild(this.content);
    }

    dialog.appendChild(header);
    dialog.appendChild(body);

    // Footer (optional)
    if (this.footer) {
      const footerEl = createElement('div', { className: 'modal-footer' });
      if (typeof this.footer === 'string') {
        footerEl.innerHTML = this.footer;
      } else if (this.footer instanceof Node) {
        footerEl.appendChild(this.footer);
      }
      dialog.appendChild(footerEl);
    }

    this.backdrop.appendChild(dialog);
    container.appendChild(this.backdrop);

    document.addEventListener('keydown', this.handleKeyDown);
    return dialog;
  }

  handleKeyDown(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }

  close() {
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop);
      this.backdrop = null;
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    if (typeof this.onClose === 'function') {
      this.onClose();
    }
  }
}
