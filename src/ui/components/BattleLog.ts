import type { BattleLogEntry } from '../../types';

export function renderBattleLog(entries: BattleLogEntry[], maxEntries = 8): string {
  const visible = entries.slice(-maxEntries);
  return `
    <div class="battle-log" id="battle-log">
      <div class="h">
        <span>Battle log</span>
        <span id="battle-turn-counter" style="font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;color:var(--ink-3)">Turn 1</span>
      </div>
      ${visible.map((e, i) => `
        <div class="log-entry log-${e.type} ${i === visible.length - 1 ? 'latest' : ''}">
          ${e.text}
        </div>
      `).join('')}
    </div>
  `;
}

export function appendLogEntry(logEl: HTMLElement, entry: BattleLogEntry): void {
  const div = document.createElement('div');
  div.className = `log-entry log-${entry.type} latest`;
  div.textContent = entry.text;
  logEl.appendChild(div);

  // Remove old entries to avoid overflow
  const entries = logEl.querySelectorAll('.log-entry');
  if (entries.length > 8) {
    entries[0].remove();
  }

  // Scroll to bottom
  logEl.scrollTop = logEl.scrollHeight;

  // Animate in
  div.style.opacity = '0';
  div.style.transform = 'translateY(5px)';
  requestAnimationFrame(() => {
    div.style.transition = 'opacity 0.2s, transform 0.2s';
    div.style.opacity = '1';
    div.style.transform = 'translateY(0)';
  });

  // Remove "latest" class from previous
  entries.forEach((e, i) => {
    if (i < entries.length - 1) e.classList.remove('latest');
  });
}
