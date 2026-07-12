# Rules (placeholder)

> These rules describe the **placeholder** game (mental arithmetic) that ships
> with the scaffold. They will be rewritten when the real Mathle concept is
> defined.

## Objective

Score as many points as possible within the round's 60-second timer.

## How to play

- An arithmetic problem appears (addition, subtraction or multiplication).
- Type the result and validate.
- A correct answer scores **1 point**; a wrong answer scores nothing. Either way
  the next problem appears immediately.
- Keep answering until the timer runs out.

## Challenge a friend

Your round (a seed) and your score to beat are encoded in a share link. Whoever
opens it plays the exact same sequence of problems and must beat your score.
There is no server — everything rides in the link.

## Board generation

The whole round is derived deterministically from a single integer seed via a
`mulberry32` PRNG (`src/core/rng.ts`). Same seed → same problems, in the same
order, on any device. This is what makes a shared challenge reproducible without
a backend.
