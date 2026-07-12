# Rules

## Objective

Score as many points as possible within the round's 3-minute timer by solving
as many problems as you can.

## The problems

Every round interleaves several exercise types, drawn at random:

- **Multiplication** (e.g. `8 × 12`, operands in [−12, 12]) → **3 points**.
- **Exact division** (e.g. `51 ÷ 3`) → **3 points**.
- **Multi-step story** mixing additions and subtractions (e.g. "Jade a 11
  bonbons, en donne 5, en reçoit 2 et 3…") → **3 points**, or **5 points** when
  it hides a distractor (an irrelevant number to ignore, e.g. "on lui en doit 5").
- **Equation** to solve for `x` (e.g. `2x − 6 = 4`, answer `5`) → **4 points**.
- **Worded problem** in plain French → **10 points**.

Worded problems are deliberately non-trivial and come in six families:
union-minimum (a set-overlap trap), inclusion–exclusion, reverse reasoning
(recover the start from the end), ceiling division ("how many are needed"), age
as a multiple, and legs-and-heads — all generated deterministically.

## Reviewing your answers

When the timer runs out, the end screen offers **"Voir mes réponses"**: every
question you were graded on, the answer you gave, and — when you got it wrong —
the correct one. The same review is reachable later from the **history** screen
(the 📋 button on a past game), since the seed plus the stored answers rebuild
the round exactly.

## Sound

Correct and wrong answers play a short synthesised cue. The **🔊 / 🔇** button in
the game header toggles sound on/off; the choice is remembered on the device.

## Scoring

- Type your answer on the on-screen numeric keypad, then validate with **✓**.
- A correct answer scores the problem's points.
- A **wrong answer costs 1 point**; the score never drops below 0.
- The **−** key is for negative answers; **⌫** deletes the last digit.

## Challenge a friend

Your series of problems and your score to beat are encoded in a share link.
Whoever opens it plays the exact same series and must beat your score. There is
no server — everything rides in the link.

## Round generation

The whole round is derived deterministically from a single integer seed via a
`mulberry32` PRNG (`src/core/rng.ts`). The seed picks each problem's type and its
values from one shared stream, so the same seed yields the same series, in the
same order, on any device. This is what makes a shared challenge reproducible
without a backend.
