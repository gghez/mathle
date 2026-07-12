import { el, clear } from './dom';

/** Render the home screen with a "new game" button and a help button. */
export function renderHome(
  root: HTMLElement,
  onStart: () => void,
  onHelp: () => void,
  onHistory: () => void,
): void {
  clear(root);
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
    el('button', {
      className: 'btn btn--primary',
      textContent: 'Nouvelle partie',
      onclick: onStart,
    }),
    el('button', {
      className: 'btn',
      textContent: '🕘 Historique',
      onclick: onHistory,
    }),
  ]);
  root.append(screen);
}
