import { el, clear } from './dom';
import type { Attempt } from '../game/engine';

export interface ReviewOptions {
  attempts: Attempt[];
  onBack: () => void;
}

/**
 * Render the end-of-game answer review: every graded question with the answer
 * the player gave and, when wrong, the correct one. Reuses the rules screen's
 * scrolling shell.
 */
export function renderReview(root: HTMLElement, opts: ReviewOptions): void {
  clear(root);

  const header = el('div', { className: 'rules-header' }, [
    el('button', { className: 'btn rules-back', textContent: '← Retour', onclick: opts.onBack }),
    el('h1', { className: 'rules-title', textContent: 'Mes réponses' }),
  ]);

  const rows = opts.attempts.map((att, i) => {
    const verdict = att.correct
      ? el('div', {
          className: 'review-row__verdict review-row__verdict--good',
          textContent: '✓ Bonne réponse',
        })
      : el('div', { className: 'review-row__verdict review-row__verdict--bad' }, [
          el('span', { textContent: `✗ Ta réponse : ${att.given}` }),
          el('span', {
            className: 'review-row__correct',
            textContent: `Bonne réponse : ${att.problem.answer}`,
          }),
        ]);
    const question =
      att.problem.kind === 'equation'
        ? `${i + 1}. ${att.problem.prompt} — combien vaut x ?`
        : `${i + 1}. ${att.problem.prompt}`;
    return el(
      'div',
      { className: `review-row ${att.correct ? 'review-row--good' : 'review-row--bad'}` },
      [el('div', { className: 'review-row__q', textContent: question }), verdict],
    );
  });

  const content = el(
    'div',
    { className: 'rules-content' },
    rows.length
      ? rows
      : [el('p', { className: 'history-empty', textContent: 'Aucune réponse donnée.' })],
  );

  root.append(el('div', { className: 'screen screen--rules' }, [header, content]));
}
