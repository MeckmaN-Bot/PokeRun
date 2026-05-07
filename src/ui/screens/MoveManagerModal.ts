import type { BattlePokemon, Move } from '../../types';
import { renderTypeBadge } from '../components/TypeBadge';
import { swapMoveFromPool } from '../../api/pokeapi';
import { showMoveLearnPicker } from './MoveLearnPicker';

/**
 * Field-Manual style modal for inspecting and rearranging a Pokémon's
 * moves outside battle. Mounts to document.body so it floats over the shop
 * regardless of stacking context.
 *
 * Re-renders on every swap so power/accuracy/type changes are visible
 * immediately. Closes on backdrop click, ✕ button, Esc, or "Done".
 */
export class MoveManagerModal {
  private overlay: HTMLElement;
  private mon: BattlePokemon;
  private onClose: () => void;
  private selectedPoolIdx: number | null = null;
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(mon: BattlePokemon, onClose: () => void) {
    this.mon = mon;
    this.onClose = onClose;

    this.overlay = document.createElement('div');
    this.overlay.className = 'mmm-overlay';
    this.render();
    document.body.appendChild(this.overlay);

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.keyHandler);

    this.overlay.addEventListener('click', this.handleClick);

    requestAnimationFrame(() => this.overlay.classList.add('active'));
  }

  private close = (): void => {
    this.overlay.classList.remove('active');
    document.removeEventListener('keydown', this.keyHandler);
    setTimeout(() => {
      this.overlay.remove();
      this.onClose();
    }, 200);
  };

  private handleClick = async (e: Event): Promise<void> => {
    const target = e.target as HTMLElement;

    if (target.closest('[data-mmm-close]')) {
      this.close();
      return;
    }
    if (target === this.overlay) {
      this.close();
      return;
    }

    const poolBtn = target.closest<HTMLElement>('[data-mmm-pool]');
    if (poolBtn) {
      const idx = parseInt(poolBtn.dataset.mmmPool!, 10);
      this.selectedPoolIdx = this.selectedPoolIdx === idx ? null : idx;
      this.render();
      return;
    }

    const slotBtn = target.closest<HTMLElement>('[data-mmm-slot]');
    if (slotBtn) {
      const slotIdx = parseInt(slotBtn.dataset.mmmSlot!, 10);
      if (this.selectedPoolIdx !== null) {
        swapMoveFromPool(this.mon, this.selectedPoolIdx, slotIdx);
        this.selectedPoolIdx = null;
        this.render();
      }
      return;
    }

    const pendingBtn = target.closest<HTMLElement>('[data-mmm-pending]');
    if (pendingBtn) {
      const queue = [...(this.mon.pendingLearns ?? [])];
      if (queue.length > 0) {
        await showMoveLearnPicker(this.mon, queue);
        this.render();
      }
      return;
    }

    const dropBtn = target.closest<HTMLElement>('[data-mmm-drop]');
    if (dropBtn) {
      const idx = parseInt(dropBtn.dataset.mmmDrop!, 10);
      const move = (this.mon.movePool ?? [])[idx];
      if (move) {
        this.mon.movePool = (this.mon.movePool ?? []).filter((_, i) => i !== idx);
        if (this.selectedPoolIdx === idx) this.selectedPoolIdx = null;
        else if (this.selectedPoolIdx !== null && this.selectedPoolIdx > idx) this.selectedPoolIdx -= 1;
        this.render();
      }
      return;
    }

    const teachBtn = target.closest<HTMLElement>('[data-mmm-teach-pending]');
    if (teachBtn) {
      const idx = parseInt(teachBtn.dataset.mmmTeachPending!, 10);
      const move = (this.mon.pendingLearns ?? [])[idx];
      if (move && this.mon.moves.length < 4) {
        this.mon.moves.push({ ...move });
        this.mon.pendingLearns = (this.mon.pendingLearns ?? []).filter(m => m.id !== move.id);
        const learned = new Set(this.mon.learnedMoveIds ?? []);
        learned.add(move.id);
        this.mon.learnedMoveIds = Array.from(learned);
        this.render();
      }
      return;
    }
  };

  private render(): void {
    this.overlay.innerHTML = this.html();
  }

  private html(): string {
    const slots = this.mon.moves.slice(0, 4);
    const pool = this.mon.movePool ?? [];
    const pending = this.mon.pendingLearns ?? [];
    const selected = this.selectedPoolIdx !== null ? pool[this.selectedPoolIdx] : null;

    return `
      <div class="mmm-card">
        <button class="mmm-close" data-mmm-close aria-label="Close">✕</button>
        <div class="mmm-rule"></div>
        <div class="mmm-eyebrow">Field Manual · Move Roster</div>

        <div class="mmm-headline">
          <img src="${this.mon.sprite}" alt="" class="mmm-sprite" />
          <div>
            <div class="mmm-name">${this.mon.displayName}</div>
            <div class="mmm-sub">Lv. ${this.mon.level} · ${this.mon.types.map(t => t.toUpperCase()).join(' / ')}</div>
          </div>
        </div>

        ${pending.length > 0 ? this.renderPending(pending) : ''}

        <div class="mmm-section-label">Active Moveset · ${slots.length}/4</div>
        <div class="mmm-slots">
          ${slots.map((m, i) => this.renderSlot(m, i, selected)).join('')}
          ${this.renderEmptySlots(slots.length)}
        </div>

        <div class="mmm-section-label mmm-section-label-pool">
          Move Pool
          ${pool.length > 0 ? `<span class="mmm-section-hint">Tap to select, then tap an active slot to swap</span>` : ''}
        </div>
        ${pool.length === 0
          ? `<div class="mmm-empty">No moves stashed. Forgotten or skipped moves arrive here.</div>`
          : `<div class="mmm-pool">${pool.map((m, i) => this.renderPoolMove(m, i)).join('')}</div>`
        }

        ${selected ? `<div class="mmm-action-hint">Now tap an active slot to put <em>${selected.displayName}</em> there.</div>` : ''}

        <div class="mmm-actions">
          <button class="ink-btn primary" data-mmm-close>Done</button>
        </div>
      </div>
    `;
  }

  private renderPending(pending: Move[]): string {
    return `
      <div class="mmm-pending-block">
        <div class="mmm-pending-label">Pending learns</div>
        <div class="mmm-pending-list">
          ${pending.map((m, i) => {
            const canTeach = this.mon.moves.length < 4;
            return `
              <div class="mmm-pending-row">
                <div class="mmm-pending-info">
                  <div class="mmm-pending-name">${m.displayName}</div>
                  <div class="mmm-meta">
                    ${renderTypeBadge(m.type)}
                    ${this.statPill('PWR', m.power)}
                    ${this.statPill('ACC', m.accuracy)}
                  </div>
                </div>
                ${canTeach
                  ? `<button class="ink-btn small" data-mmm-teach-pending="${i}">Teach</button>`
                  : `<button class="ink-btn small" data-mmm-pending="${i}">Pick slot →</button>`
                }
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  private renderSlot(move: Move | undefined, idx: number, selected: Move | null): string {
    if (!move) return '';
    const armed = selected !== null;
    const diff = selected ? this.computeDiff(move, selected) : null;

    return `
      <button class="mmm-slot ${armed ? 'mmm-armed' : ''}" data-mmm-slot="${idx}">
        <div class="mmm-slot-num">Slot ${idx + 1}</div>
        <div class="mmm-slot-name">${move.displayName}</div>
        <div class="mmm-meta">
          ${renderTypeBadge(move.type)}
          ${this.statPill('PWR', move.power, diff?.power)}
          ${this.statPill('ACC', move.accuracy, diff?.accuracy)}
          <span class="mmm-stat mmm-cat">${move.category.toUpperCase()}</span>
        </div>
        ${armed ? `<div class="mmm-slot-cta">Swap in →</div>` : ''}
      </button>
    `;
  }

  private renderEmptySlots(occupied: number): string {
    let html = '';
    for (let i = occupied; i < 4; i++) {
      html += `<div class="mmm-slot mmm-slot-empty"><div class="mmm-slot-num">Slot ${i + 1}</div><div class="mmm-slot-empty-text">— empty —</div></div>`;
    }
    return html;
  }

  private renderPoolMove(move: Move, idx: number): string {
    const isSelected = this.selectedPoolIdx === idx;
    return `
      <div class="mmm-pool-row ${isSelected ? 'mmm-selected' : ''}">
        <button class="mmm-pool-pick" data-mmm-pool="${idx}" title="Select this move">
          <div class="mmm-pool-name">${move.displayName}</div>
          <div class="mmm-meta">
            ${renderTypeBadge(move.type)}
            ${this.statPill('PWR', move.power)}
            ${this.statPill('ACC', move.accuracy)}
            <span class="mmm-stat mmm-cat">${move.category.toUpperCase()}</span>
          </div>
        </button>
        <button class="mmm-drop-btn" data-mmm-drop="${idx}" title="Forget this move">×</button>
      </div>
    `;
  }

  private statPill(label: string, value: number, delta?: number | null): string {
    const display = value > 0 ? value : '—';
    if (delta == null || delta === 0 || value === 0) {
      return `<span class="mmm-stat">${label} ${display}</span>`;
    }
    const sign = delta > 0 ? '+' : '';
    const dir = delta > 0 ? 'mmm-delta-up' : 'mmm-delta-down';
    return `<span class="mmm-stat">${label} ${display} <span class="mmm-delta ${dir}">${sign}${delta}</span></span>`;
  }

  private computeDiff(slotMove: Move, candidate: Move): { power: number | null; accuracy: number | null } {
    return {
      power: candidate.power && slotMove.power ? candidate.power - slotMove.power : null,
      accuracy: candidate.accuracy && slotMove.accuracy ? candidate.accuracy - slotMove.accuracy : null,
    };
  }
}

export function openMoveManager(mon: BattlePokemon, onClose: () => void): MoveManagerModal {
  return new MoveManagerModal(mon, onClose);
}
