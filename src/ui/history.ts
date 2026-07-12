import { el, clear } from './dom';
import { listGames, deleteGame, clearHistory, type GameRecord } from '../history/store';

export interface HistoryOptions {
  onBack: () => void;
  onReplay: (seed: number, scoreToBeat: number | null) => void;
  /** Open the answer review for a past game (seed + the answers given). */
  onReview: (seed: number, given: number[]) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Render the local game-history screen. */
export function renderHistory(root: HTMLElement, opts: HistoryOptions): void {
  clear(root);

  const listEl = el('div', { className: 'history-list' });

  function row(record: GameRecord): HTMLElement {
    const info = el('div', {}, [
      el('div', { className: 'history-row__date', textContent: formatDate(record.playedAt) }),
      el('div', {
        className: 'history-row__stats',
        textContent: `${record.score} pts · ${record.answered} réponses`,
      }),
    ]);
    if (record.scoreToBeat != null) {
      info.append(
        el('div', {
          className: 'history-row__badge',
          textContent: `Défi : ${record.scoreToBeat} pts à battre`,
        }),
      );
    }
    const actions: HTMLElement[] = [];
    if (record.given && record.given.length > 0) {
      const given = record.given;
      actions.push(
        el('button', {
          className: 'btn history-row__btn',
          textContent: '📋',
          title: 'Revoir les réponses',
          onclick: () => opts.onReview(record.seed, given),
        }),
      );
    }
    const replayBtn = el('button', {
      className: 'btn history-row__btn',
      textContent: '🔁',
      title: 'Rejouer',
      onclick: () => opts.onReplay(record.seed, record.scoreToBeat),
    });
    const deleteBtn = el('button', {
      className: 'btn history-row__btn',
      textContent: '🗑️',
      title: 'Supprimer',
      onclick: () => {
        deleteGame(record.id);
        render();
      },
    });
    actions.push(replayBtn, deleteBtn);
    return el('div', { className: 'history-row' }, [
      info,
      el('div', { className: 'history-row__actions' }, actions),
    ]);
  }

  function render(): void {
    clear(listEl);
    const games = listGames();
    if (games.length === 0) {
      listEl.append(el('p', { className: 'history-empty', textContent: 'Aucune partie jouée.' }));
      return;
    }
    for (const g of games) listEl.append(row(g));
  }

  const clearBtn = el('button', {
    className: 'btn history-clear',
    textContent: 'Vider',
    title: 'Vider l’historique',
    onclick: () => {
      clearHistory();
      render();
    },
  });

  const header = el('div', { className: 'history-header' }, [
    el('button', { className: 'btn history-back', textContent: '← Retour', onclick: opts.onBack }),
    el('h1', { className: 'history-title', textContent: 'Historique' }),
    clearBtn,
  ]);

  render();
  root.append(el('div', { className: 'screen screen--history' }, [header, listEl]));
}
