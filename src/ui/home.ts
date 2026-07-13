import { el, clear } from './dom';
import type { Difficulty } from '../game/challenge';
import { getPreferredDifficulty, setPreferredDifficulty } from '../game/difficulty';

/** Render the home screen with a difficulty picker, a "new game" and help button. */
export function renderHome(
  root: HTMLElement,
  onStart: (difficulty: Difficulty) => void,
  onHelp: () => void,
  onHistory: () => void,
): void {
  clear(root);

  // The chosen mode is remembered across visits; start from that preference.
  let difficulty = getPreferredDifficulty();

  // Segmented Facile / Moyen picker. Selecting a mode persists it so the choice
  // sticks; "Nouvelle partie" then launches a round in the selected mode.
  const modes: { value: Difficulty; label: string }[] = [
    { value: 'easy', label: 'Facile' },
    { value: 'medium', label: 'Moyen' },
  ];
  const modeButtons = new Map<Difficulty, HTMLButtonElement>();
  function syncModes(): void {
    for (const [value, btn] of modeButtons) {
      const on = value === difficulty;
      btn.classList.toggle('mode-btn--active', on);
      btn.setAttribute('aria-pressed', String(on));
    }
  }
  const modeBtns = modes.map(({ value, label }) => {
    const btn = el('button', {
      className: 'btn mode-btn',
      textContent: label,
      type: 'button',
      onclick: () => {
        difficulty = value;
        setPreferredDifficulty(value);
        syncModes();
      },
    });
    modeButtons.set(value, btn);
    return btn;
  });
  const modePicker = el(
    'div',
    { className: 'mode-picker', role: 'group', ariaLabel: 'Difficulté' },
    modeBtns,
  );
  syncModes();

  // The title is spelled out on tiles — the letters are decorative
  // (aria-hidden); the <h1> carries the accessible name.
  const tiles = [...'MATHLE'].map((ch) =>
    el('span', { className: 'brand-tile', textContent: ch, ariaHidden: 'true' }),
  );
  const screen = el('div', { className: 'screen screen--home' }, [
    el('button', {
      className: 'btn help-btn',
      textContent: '?',
      title: 'Règles',
      onclick: onHelp,
    }),
    el('h1', { className: 'title brand-tiles', ariaLabel: 'Mathle' }, tiles),
    el('p', {
      className: 'subtitle',
      textContent: 'Marque un max de points en temps limité.',
    }),
    el('p', { className: 'mode-label', textContent: 'Difficulté' }),
    modePicker,
    el('button', {
      className: 'btn btn--primary',
      textContent: 'Nouvelle partie',
      onclick: () => onStart(difficulty),
    }),
    el('button', {
      className: 'btn',
      textContent: '🕘 Historique',
      onclick: onHistory,
    }),
  ]);
  root.append(screen);
}
