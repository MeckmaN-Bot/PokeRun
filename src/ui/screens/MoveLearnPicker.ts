import type { Move, BattlePokemon } from '../../types';
import { commitPendingLearn } from '../../api/pokeapi';
import { renderTypeBadge } from '../components/TypeBadge';

/**
 * Batch move-learn modal: shows ALL pending new moves on one side and the
 * Pokémon's 4 current slots on the other. The player arms a pending move,
 * then clicks a slot to swap (or skips it to the move pool). The modal
 * stays open until every pending move is resolved.
 */
export function showMoveLearnPicker(mon: BattlePokemon, queue: Move[]): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'mlp-overlay';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    const remaining: Move[] = [...queue];
    let armedIdx = 0;

    const close = () => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        resolve();
      }, 200);
    };

    const render = () => {
      overlay.innerHTML = renderHTML(mon, remaining, armedIdx);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Stash all remaining as pool entries and close.
        for (const m of remaining) commitPendingLearn(mon, m, -1);
        remaining.length = 0;
        close();
      }
    };
    document.addEventListener('keydown', onKey);

    overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Arm a pending move
      const pending = target.closest<HTMLElement>('[data-pending-idx]');
      if (pending) {
        armedIdx = parseInt(pending.dataset['pendingIdx']!, 10);
        render();
        return;
      }

      // Skip the armed pending → pool
      if (target.closest('[data-skip-armed]')) {
        const move = remaining[armedIdx];
        if (move) {
          commitPendingLearn(mon, move, -1);
          remaining.splice(armedIdx, 1);
          armedIdx = Math.min(armedIdx, remaining.length - 1);
          if (remaining.length === 0) close(); else render();
        }
        return;
      }

      // Skip everything
      if (target.closest('[data-skip-all]')) {
        for (const m of remaining) commitPendingLearn(mon, m, -1);
        remaining.length = 0;
        close();
        return;
      }

      // Replace a slot with the armed move
      const slot = target.closest<HTMLElement>('[data-slot-idx]');
      if (slot) {
        const move = remaining[armedIdx];
        if (!move) return;
        const slotIdx = parseInt(slot.dataset['slotIdx']!, 10);
        commitPendingLearn(mon, move, slotIdx);
        remaining.splice(armedIdx, 1);
        armedIdx = Math.min(armedIdx, remaining.length - 1);
        if (remaining.length === 0) close(); else render();
        return;
      }
    });

    render();
  });
}

function renderHTML(mon: BattlePokemon, pending: Move[], armedIdx: number): string {
  const slots = mon.moves.slice(0, 4);
  while (slots.length < 4) slots.push(null as unknown as Move);
  const armed = pending[armedIdx];
  const hasFreeSlot = slots.some(s => !s);

  return `
    <div class="mlp-card mlp-batch">
      <div class="mlp-rule"></div>
      <div class="mlp-eyebrow">Field Manual · ${pending.length} New Move${pending.length === 1 ? '' : 's'}</div>
      <div class="mlp-headline">
        <img src="${mon.sprite}" alt="" class="mlp-sprite" />
        <div>
          <div class="mlp-name">${mon.displayName}</div>
          <div class="mlp-sub">Lv. ${mon.level} · pick which moves to keep</div>
        </div>
      </div>

      <div class="mlp-batch-body">
        <div class="mlp-batch-col">
          <div class="mlp-col-head">New moves <span class="mlp-col-meta">${pending.length} pending</span></div>
          <div class="mlp-pending-list">
            ${pending.map((m, i) => renderPending(m, i, i === armedIdx)).join('')}
          </div>
          ${armed ? `
            <div class="mlp-armed-actions">
              <button class="ink-btn ghost" data-skip-armed>Stash "${armed.displayName}" in pool</button>
            </div>
          ` : ''}
        </div>

        <div class="mlp-batch-col">
          <div class="mlp-col-head">Current slots <span class="mlp-col-meta">${hasFreeSlot ? 'free slot available' : 'tap to replace'}</span></div>
          <div class="mlp-grid">
            ${slots.map((m, i) => renderSlot(m, i, !!armed)).join('')}
          </div>
        </div>
      </div>

      ${armed ? `
        <div class="mlp-instruct">Tap a slot to teach <strong>${armed.displayName}</strong> there.</div>
      ` : `
        <div class="mlp-instruct">Pick a new move on the left, then choose where it lands.</div>
      `}

      <div class="mlp-actions">
        <button class="ink-btn ghost" data-skip-all>Skip all · stash to Move Pool</button>
      </div>
      <div class="mlp-foot">Skipped moves go to the Move Pool — swap them in any time from the team panel.</div>
    </div>
  `;
}

function renderPending(move: Move, idx: number, armed: boolean): string {
  return `
    <button class="mlp-pending${armed ? ' armed' : ''}" data-pending-idx="${idx}">
      <div class="mlp-pending-name">${move.displayName}</div>
      <div class="mlp-pending-meta">
        ${renderTypeBadge(move.type)}
        <span class="mlp-stat">PWR ${move.power || '—'}</span>
        <span class="mlp-stat">ACC ${move.accuracy || '—'}</span>
        <span class="mlp-stat">${move.category.toUpperCase()}</span>
      </div>
    </button>
  `;
}

function renderSlot(move: Move | null, idx: number, armed: boolean): string {
  if (!move) {
    return `
      <button class="mlp-slot mlp-slot-empty${armed ? ' targetable' : ''}" data-slot-idx="${idx}" ${armed ? '' : 'disabled'}>
        <div class="mlp-slot-num">Slot ${idx + 1}</div>
        <div class="mlp-slot-name">— empty —</div>
        <div class="mlp-slot-cta">${armed ? 'Teach here →' : 'Free'}</div>
      </button>
    `;
  }
  return `
    <button class="mlp-slot${armed ? ' targetable' : ''}" data-slot-idx="${idx}" ${armed ? '' : 'disabled'}>
      <div class="mlp-slot-num">Slot ${idx + 1}</div>
      <div class="mlp-slot-name">${move.displayName}</div>
      <div class="mlp-slot-meta">
        ${renderTypeBadge(move.type)}
        <span class="mlp-stat">PWR ${move.power || '—'}</span>
        <span class="mlp-stat">ACC ${move.accuracy || '—'}</span>
      </div>
      <div class="mlp-slot-cta">${armed ? 'Replace →' : ''}</div>
    </button>
  `;
}

/** Drains every team member's pendingLearns queue with a single batched modal each. */
export async function processPendingLearns(team: BattlePokemon[]): Promise<void> {
  for (const mon of team) {
    if (!mon.pendingLearns?.length) continue;
    const queue = [...mon.pendingLearns];
    await showMoveLearnPicker(mon, queue);
  }
}
