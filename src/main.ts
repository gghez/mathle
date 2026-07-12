import { decodeChallenge } from './share/codec';
import { renderHome } from './ui/home';
import { renderGame } from './ui/game';
import { renderEnd } from './ui/end';
import { renderRules } from './ui/rules';
import { renderHistory } from './ui/history';
import { Router, type View } from './ui/router';
import { saveGame } from './history/store';
import type { GameEngine } from './game/engine';
import './style.css';

function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

function main(): void {
  const root = document.querySelector<HTMLDivElement>('#app')!;

  // Navigation runs through a tiny history-backed router: every screen is a
  // View thunk pushed onto a stack that mirrors the browser history, so the
  // native back gesture/button walks between screens. `trapRootBack` absorbs
  // the back gesture on the home screen so it can't close the app outright.
  const router = new Router({ trapRootBack: true });

  const rulesView: View = () => renderRules(root, { onBack: () => router.back() });

  const historyView: View = () =>
    renderHistory(root, {
      onBack: () => router.back(),
      onReplay: (seed, scoreToBeat) => router.push(gameView(seed, scoreToBeat)),
    });

  const homeView: View = () =>
    renderHome(
      root,
      () => router.push(freshGame()),
      () => router.push(rulesView),
      () => router.push(historyView),
    );

  // A brand-new game: a fresh random seed, no score to beat.
  const freshGame = (): View => gameView(randomSeed(), null);

  // A finished game hands to an end screen that *replaces* the game in history:
  // the game is over, so the back gesture skips it and reaches the screen the
  // game was launched from (home or history).
  const gameView =
    (seed: number, scoreToBeat: number | null): View =>
    () => {
      const teardown = renderGame(root, {
        seed,
        scoreToBeat,
        onEnd: (engine: GameEngine) => {
          saveGame({
            seed,
            score: engine.score,
            answered: engine.answered,
            scoreToBeat,
          });
          router.replace(endView(engine.score, engine.answered, seed, scoreToBeat));
        },
        // Quitting mid-game abandons the run without saving it: lift the
        // back-gesture veto and pop to the launching screen.
        onQuit: () => {
          router.setGuard(null);
          router.back();
        },
      });
      // A game runs to the buzzer: veto the back gesture so an edge-swipe can't
      // abandon it. Lifted in the teardown, which also fires when the timer ends.
      router.setGuard(() => false);
      return () => {
        router.setGuard(null);
        teardown();
      };
    };

  const endView =
    (score: number, answered: number, seed: number, scoreToBeat: number | null): View =>
    () =>
      renderEnd(root, {
        result: { score, answered },
        seed,
        scoreToBeat,
        onNewGame: () => router.replace(freshGame()),
        onReplaySame: () => router.replace(gameView(seed, scoreToBeat)),
        onHome: () => router.toRoot(),
        onHelp: () => router.push(rulesView),
      });

  const params = new URLSearchParams(location.search);
  const token = params.get('c');
  const challenge = token ? decodeChallenge(token) : null;

  // Home is always the stack root, so the back gesture and the end screen's
  // "🏠 Accueil" button reach it even when a challenge link opens into a game.
  router.reset(homeView);
  if (challenge) {
    router.push(gameView(challenge.seed, challenge.scoreToBeat));
  }
}

main();
