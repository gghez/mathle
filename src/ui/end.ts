import { shareChallenge } from '../share/share';
import { el, clear, toast } from './dom';

/** The finished-game data the end screen renders. */
export interface GameResult {
  score: number;
  answered: number;
}

export interface EndOptions {
  result: GameResult;
  seed: number;
  scoreToBeat: number | null;
  onNewGame: () => void;
  onReplaySame: () => void;
  onHome: () => void;
  onHelp: () => void;
  /** Open the answer review; omitted when there is nothing to review. */
  onReview?: () => void;
}

/** A congratulation line scaled to the raw score. Tunable as balance settles. */
function praiseFor(score: number): { text: string; emoji: string } {
  if (score >= 150) return { text: 'Surhumain !', emoji: '👑' };
  if (score >= 100) return { text: 'Légendaire !', emoji: '🏆' };
  if (score >= 60) return { text: 'Impressionnant !', emoji: '🌟' };
  if (score >= 35) return { text: 'Excellent !', emoji: '🔥' };
  if (score >= 15) return { text: 'Joli score !', emoji: '👏' };
  if (score > 0) return { text: "C'est un début…", emoji: '🌱' };
  return { text: 'Rien marqué… on retente ?', emoji: '😅' };
}

/** Render the end-of-game summary. */
export function renderEnd(root: HTMLElement, opts: EndOptions): void {
  const { result, seed, scoreToBeat, onNewGame, onReplaySame, onHome, onHelp, onReview } = opts;
  clear(root);

  const praise = praiseFor(result.score);

  const summary = el('div', { className: 'end-summary' }, [
    el('span', { className: 'praise-emoji', textContent: praise.emoji }),
    el('span', { className: 'end-summary__praise', textContent: praise.text }),
    el('span', {
      className: 'end-summary__stats',
      textContent: `${result.score} pts · ${result.answered} réponses`,
    }),
  ]);
  if (scoreToBeat != null) {
    const beaten = result.score > scoreToBeat;
    const tied = result.score === scoreToBeat;
    summary.append(
      el('span', {
        className: beaten ? 'end-verdict end-verdict--win' : 'end-verdict end-verdict--lose',
        textContent: beaten ? 'Battu ! 🎉' : tied ? 'Égalité' : `${scoreToBeat} pts à battre`,
      }),
    );
  }

  const shareBtn = el('button', {
    className: 'btn btn--primary',
    textContent: '📤 Défier',
    onclick: async () => {
      try {
        const res = await shareChallenge({ seed, scoreToBeat: result.score });
        if (res === 'copied' || res === 'manual') toast('Lien copié !');
      } catch {
        toast('Le partage a échoué');
      }
    },
  });
  const newGameBtn = el('button', {
    className: 'btn',
    textContent: '🎲 Nouvelle',
    onclick: onNewGame,
  });
  const replaySameBtn = el('button', {
    className: 'btn',
    textContent: '🔁 Rejouer',
    onclick: onReplaySame,
  });
  const actions = el('div', { className: 'actions actions--end' }, [
    shareBtn,
    newGameBtn,
    replaySameBtn,
  ]);

  const helpBtn = el('button', {
    className: 'btn help-btn',
    textContent: '?',
    title: 'Règles',
    onclick: onHelp,
  });
  const homeBtn = el('button', {
    className: 'btn home-btn',
    textContent: '🏠',
    title: 'Accueil',
    onclick: onHome,
  });

  const children: (Node | string)[] = [homeBtn, helpBtn, summary];
  if (onReview && result.answered > 0) {
    children.push(
      el('button', {
        className: 'btn end-review-btn',
        textContent: '📋 Voir mes réponses',
        onclick: onReview,
      }),
    );
  }
  children.push(actions);

  root.append(el('div', { className: 'screen screen--end screen--end-center' }, children));
}
