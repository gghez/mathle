import { el, clear } from './dom';
import { Countdown } from '../game/timer';
import { GameEngine } from '../game/engine';
import { generateProblems, ROUND_SECONDS, type Difficulty } from '../game/challenge';
import { isSoundEnabled, toggleSound, playCorrect, playWrong } from '../audio/sfx';

export interface GameOptions {
  seed: number;
  scoreToBeat: number | null;
  difficulty: Difficulty;
  onEnd: (engine: GameEngine) => void;
  onQuit: () => void;
}

/**
 * Render the play screen. Returns a teardown that stops the countdown and
 * detaches the keyboard listener, so the router can safely leave the screen
 * (quit, or timer → end) without leaks.
 *
 * The puzzle is a mixed stream of the exercise types (see game/challenge).
 * Answers are entered on a custom numeric keypad — no native input — so the flow
 * is identical on desktop and mobile.
 */
export function renderGame(root: HTMLElement, opts: GameOptions): () => void {
  const { seed, scoreToBeat, difficulty, onEnd, onQuit } = opts;
  clear(root);

  const engine = new GameEngine(generateProblems(seed, undefined, difficulty));

  // Header: (quit · sound) · timer · score.
  const timerEl = el('span', { className: 'timer', textContent: formatTime(ROUND_SECONDS) });
  const scoreEl = el('span', { className: 'score', textContent: '0' });
  const quitBtn = el('button', { className: 'btn quit-btn', textContent: '✕', title: 'Quitter' });
  const soundBtn = el('button', { className: 'btn quit-btn sound-btn', title: 'Sons' });
  function renderSoundIcon(): void {
    soundBtn.textContent = isSoundEnabled() ? '🔊' : '🔇';
  }
  renderSoundIcon();
  soundBtn.addEventListener('click', () => {
    toggleSound();
    renderSoundIcon();
  });
  const header = el('div', { className: 'game-header' }, [
    el('div', { className: 'game-header__left' }, [quitBtn, soundBtn]),
    timerEl,
    scoreEl,
  ]);

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

  // The puzzle: a points badge, the statement, an answer display, a keypad.
  const pointsEl = el('div', { className: 'problem-points' });
  const problemEl = el('div', { className: 'problem' });
  const displayEl = el('div', { className: 'answer-display' });
  const keypad = el('div', { className: 'keypad' });

  let entry = '';

  const puzzle = el('div', { className: 'puzzle' }, [
    el('div', { className: 'problem-wrap' }, [pointsEl, problemEl]),
    el('div', { className: 'answer-pad' }, [displayEl, keypad]),
  ]);

  function renderProblem(): void {
    const p = engine.current;
    clear(problemEl);
    // Worded statements (chains, word problems) wrap; bare expressions stay large.
    problemEl.classList.toggle('problem--word', p.kind === 'chain' || p.kind === 'word');
    problemEl.classList.toggle('problem--eq', p.kind === 'equation');
    if (p.kind === 'equation') {
      // Equations state no explicit question — spell out what's expected.
      problemEl.append(
        el('span', { className: 'problem-eq__expr', textContent: p.prompt }),
        el('span', { className: 'problem-hint', textContent: 'Combien vaut x ?' }),
      );
    } else {
      problemEl.textContent = p.prompt;
    }
    pointsEl.textContent = `+${p.points}`;
  }

  function renderDisplay(): void {
    displayEl.textContent = entry === '' ? ' ' : entry;
    displayEl.classList.toggle('answer-display--empty', entry === '');
  }

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

  function flash(kind: 'good' | 'bad'): void {
    problemEl.classList.remove('problem--good', 'problem--bad');
    // Reflow so the class re-triggers the animation on rapid repeats.
    void problemEl.offsetWidth;
    problemEl.classList.add(kind === 'good' ? 'problem--good' : 'problem--bad');
  }

  function nextProblem(): void {
    entry = '';
    renderProblem();
    renderDisplay();
  }

  // Bump the live score counter — the little "it landed" beat.
  function bumpScore(): void {
    scoreEl.classList.remove('score--bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score--bump');
  }

  // A floating "+N" that flies from the current problem's points badge up to
  // the score counter, so a good answer visibly comes to add itself to the
  // total. The path is measured at submit time and driven with the Web
  // Animations API (arbitrary start/end, so no fixed CSS keyframes).
  function popScore(delta: number): void {
    const from = pointsEl.getBoundingClientRect();
    const to = scoreEl.getBoundingClientRect();
    const startX = from.left + from.width / 2;
    const startY = from.top + from.height / 2;
    const dx = to.left + to.width / 2 - startX;
    const dy = to.top + to.height / 2 - startY;

    const pop = el('div', { className: 'score-pop', textContent: `+${delta}` });
    pop.style.left = `${startX}px`;
    pop.style.top = `${startY}px`;
    document.body.append(pop);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof pop.animate !== 'function') {
      pop.remove();
      bumpScore();
      return;
    }

    const anim = pop.animate(
      [
        {
          transform: 'translate(-50%, -50%) translate(0px, 0px) scale(0.6)',
          opacity: 0,
          offset: 0,
        },
        {
          transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1.2)',
          opacity: 1,
          offset: 0.2,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(0.7)`,
          opacity: 0,
          offset: 1,
        },
      ],
      { duration: 700, easing: 'cubic-bezier(0.55, 0, 0.7, 0.35)' },
    );
    // Bump the counter as the "+N" reaches it, not before.
    anim.onfinish = () => {
      pop.remove();
      bumpScore();
    };
  }

  function handleSubmit(): void {
    // Ignore an empty or sign-only entry — nothing to grade.
    if (entry === '' || entry === '-' || Number.isNaN(Number(entry))) return;
    // Number() already drops superfluous leading zeros ("012" → 12).
    const { correct, delta } = engine.submit(Number(entry));
    flash(correct ? 'good' : 'bad');
    if (correct) playCorrect();
    else playWrong();
    if (delta > 0) popScore(delta);
    refresh();
    nextProblem();
  }

  // Keypad actions on the current entry.
  function press(key: string): void {
    if (key === 'ok') {
      handleSubmit();
      return;
    }
    if (key === 'back') entry = entry.slice(0, -1);
    else if (key === 'sign') entry = entry.startsWith('-') ? entry.slice(1) : `-${entry}`;
    else if (entry === '0')
      entry = key; // a digit — no superfluous leading zero
    else if (entry === '-0') entry = `-${key}`;
    else entry += key;
    renderDisplay();
  }

  function keyBtn(label: string, key: string, extra = ''): HTMLButtonElement {
    const b = el('button', {
      className: `keypad__key ${extra}`.trim(),
      textContent: label,
      type: 'button',
    });
    b.addEventListener('click', () => press(key));
    return b;
  }

  // Digits 1-9, then the bottom row: sign · 0 · backspace, then a wide validate.
  for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) keypad.append(keyBtn(d, d));
  keypad.append(keyBtn('−', 'sign', 'keypad__key--action'));
  keypad.append(keyBtn('0', '0'));
  keypad.append(keyBtn('⌫', 'back', 'keypad__key--action'));
  keypad.append(keyBtn('✓ Valider', 'ok', 'keypad__key--ok'));

  // Physical keyboard support (desktop): digits, minus, Backspace, Enter.
  function onKeydown(e: KeyboardEvent): void {
    if (e.key >= '0' && e.key <= '9') press(e.key);
    else if (e.key === '-') press('sign');
    else if (e.key === 'Backspace') press('back');
    else if (e.key === 'Enter') press('ok');
    else return;
    e.preventDefault();
  }
  document.addEventListener('keydown', onKeydown);

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

  renderProblem();
  renderDisplay();
  refresh();
  countdown.start();

  return () => {
    countdown.stop();
    document.removeEventListener('keydown', onKeydown);
  };
}

function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${String(rest).padStart(2, '0')}`;
}
