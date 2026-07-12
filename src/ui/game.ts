import { el, clear } from './dom';
import { Countdown } from '../game/timer';
import { GameEngine } from '../game/engine';
import { generateProblems, formatProblem, ROUND_SECONDS } from '../game/challenge';

export interface GameOptions {
  seed: number;
  scoreToBeat: number | null;
  onEnd: (engine: GameEngine) => void;
  onQuit: () => void;
}

/**
 * Render the play screen. Returns a teardown that stops the countdown, so the
 * router can safely leave the screen (quit, or timer → end) without leaks.
 *
 * PLACEHOLDER: the on-screen puzzle is mental arithmetic (see game/challenge).
 * The screen shell — header, timer, challenge progress bar, end wiring — is the
 * part meant to survive when the real Mathle concept replaces the puzzle.
 */
export function renderGame(root: HTMLElement, opts: GameOptions): () => void {
  const { seed, scoreToBeat, onEnd, onQuit } = opts;
  clear(root);

  const engine = new GameEngine(generateProblems(seed));

  // Header: quit · timer · score.
  const timerEl = el('span', { className: 'timer', textContent: formatTime(ROUND_SECONDS) });
  const scoreEl = el('span', { className: 'score', textContent: '0' });
  const quitBtn = el('button', { className: 'btn quit-btn', textContent: '✕', title: 'Quitter' });
  const header = el('div', { className: 'game-header' }, [quitBtn, timerEl, scoreEl]);

  // Challenge progress bar (only when there is a score to beat).
  let progressFill: HTMLElement | null = null;
  let progress: HTMLElement | null = null;
  if (scoreToBeat != null && scoreToBeat > 0) {
    progressFill = el('div', { className: 'progress__fill' });
    const marker = el('div', { className: 'progress__marker' });
    marker.style.left = '100%';
    const bar = el('div', { className: 'progress__bar' }, [progressFill, marker]);
    const label = el('div', {
      className: 'progress__label',
      textContent: `0 / ${scoreToBeat} pts à battre`,
    });
    progress = el('div', { className: 'progress' }, [bar, label]);
  }

  // The puzzle: a problem, a numeric field, a submit button.
  const problemEl = el('div', { className: 'problem', textContent: formatProblem(engine.current) });
  const input = el('input', {
    className: 'answer-input',
    type: 'text',
    inputMode: 'numeric',
    autocomplete: 'off',
  });
  input.setAttribute('inputmode', 'numeric');
  input.setAttribute('pattern', '-?[0-9]*');
  const submitBtn = el('button', {
    className: 'btn btn--primary answer-submit',
    textContent: 'Valider',
  });
  const puzzle = el('div', { className: 'puzzle' }, [
    el('div', { className: 'problem-wrap' }, [problemEl]),
    el('form', { className: 'answer-form' }, [input, submitBtn]),
  ]);

  function refresh(): void {
    scoreEl.textContent = String(engine.score);
    if (progressFill && progress && scoreToBeat) {
      const pct = Math.min(100, Math.round((engine.score / scoreToBeat) * 100));
      progressFill.style.width = `${pct}%`;
      progressFill.classList.toggle('progress__fill--ahead', engine.score > scoreToBeat);
      const label = progress.querySelector('.progress__label');
      if (label) label.textContent = `${engine.score} / ${scoreToBeat} pts à battre`;
    }
  }

  function nextProblem(): void {
    problemEl.textContent = formatProblem(engine.current);
    input.value = '';
    input.focus();
  }

  function flash(kind: 'good' | 'bad'): void {
    problemEl.classList.remove('problem--good', 'problem--bad');
    // Reflow so the class re-triggers the animation on rapid repeats.
    void problemEl.offsetWidth;
    problemEl.classList.add(kind === 'good' ? 'problem--good' : 'problem--bad');
  }

  function handleSubmit(): void {
    const raw = input.value.trim();
    if (raw === '' || Number.isNaN(Number(raw))) {
      input.focus();
      return;
    }
    const { correct } = engine.submit(Number(raw));
    flash(correct ? 'good' : 'bad');
    refresh();
    nextProblem();
  }

  const form = puzzle.querySelector('form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit();
  });

  const countdown = new Countdown(
    ROUND_SECONDS,
    (remaining) => {
      timerEl.textContent = formatTime(remaining);
      timerEl.classList.toggle('timer--low', remaining <= 10);
    },
    () => onEnd(engine),
  );

  // Quit flow: an in-screen confirmation, mirroring boggle's guarded quit.
  quitBtn.addEventListener('click', () => {
    const box = el('div', { className: 'confirm__box' }, [
      el('h2', { className: 'confirm__title', textContent: 'Quitter la partie ?' }),
      el('p', {
        className: 'confirm__text',
        textContent: 'Ta partie en cours ne sera pas sauvegardée.',
      }),
      el('div', { className: 'confirm__actions' }, [
        el('button', {
          className: 'btn',
          textContent: 'Continuer',
          onclick: () => overlay.remove(),
        }),
        el('button', {
          className: 'btn btn--danger',
          textContent: 'Quitter',
          onclick: () => {
            overlay.remove();
            onQuit();
          },
        }),
      ]),
    ]);
    const overlay = el('div', { className: 'confirm' }, [box]);
    root.append(overlay);
  });

  const children: (Node | string)[] = [header];
  if (progress) children.push(progress);
  children.push(puzzle);
  root.append(el('div', { className: 'screen screen--game' }, children));

  refresh();
  input.focus();
  countdown.start();

  return () => countdown.stop();
}

function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${String(rest).padStart(2, '0')}`;
}
