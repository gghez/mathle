import { mulberry32 } from '../core/rng';

// ─────────────────────────────────────────────────────────────────────────────
// Mathle puzzle model.
//
// A challenge is a single integer `seed`, from which an unbounded, deterministic
// stream of problems is derived. Two players opening the same challenge link get
// the exact same problems in the exact same order — no backend, everything rides
// in the seed.
//
// A round mixes five exercise types with a differentiated point scale:
//   • mul        — a × b                          (+3)
//   • div        — a ÷ b (exact)                  (+3)
//   • chain      — worded multi-step +/− story    (+3, or +5 with a trap)
//   • equation   — ax ± b = c                     (+4)
//   • word       — worded problem (non-trivial)   (+10)
// A wrong answer costs 1 point (penalty applied in the engine).
// ─────────────────────────────────────────────────────────────────────────────

export type ProblemKind = 'mul' | 'div' | 'chain' | 'equation' | 'word';

export interface Problem {
  kind: ProblemKind;
  /** Pre-rendered statement: a worded story, "8 × 12", "51 ÷ 3", or "2x − 6 = 4". */
  prompt: string;
  /** The correct answer — an integer, possibly negative. */
  answer: number;
  /** Points earned when answered correctly. */
  points: number;
}

/** A shareable challenge: everything needed to replay it rides in the seed. */
export interface Challenge {
  seed: number;
  /** Score to beat when the challenge came from a share link; null otherwise. */
  scoreToBeat: number | null;
}

/** Length of a round, in seconds. */
export const ROUND_SECONDS = 180;

/** How many problems to pre-generate — comfortably more than a round allows. */
const PROBLEM_POOL = 300;

/** Real minus sign (U+2212) — typographically correct, not the hyphen-minus. */
const MINUS = '−';

/** Integer in [min, max] drawn from the PRNG. */
function intBetween(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Pick a random element from a non-empty array. */
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[intBetween(rng, 0, arr.length - 1)];
}

/** Render a signed integer with the typographic minus. */
function num(n: number): string {
  return n < 0 ? `${MINUS}${Math.abs(n)}` : String(n);
}

/** Render an operand that follows an operator, parenthesizing negatives. */
function paren(n: number): string {
  return n < 0 ? `(${MINUS}${Math.abs(n)})` : String(n);
}

/** French elision: "de" → "d'" before a vowel (keeps "de" before aspirated h). */
function deOf(word: string): string {
  return /^[aeéèêiouy]/i.test(word) ? `d'${word}` : `de ${word}`;
}

const NAMES = ['Léa', 'Tom', 'Zoé', 'Hugo', 'Emma', 'Lucas', 'Jade', 'Noah'] as const;

// ── Multiplication & exact division (quick single-operation drills) ──────────

function makeMul(rng: () => number): Problem {
  const a = intBetween(rng, -12, 12);
  const b = intBetween(rng, -12, 12);
  return { kind: 'mul', prompt: `${num(a)} × ${paren(b)}`, answer: a * b, points: 3 };
}

function makeDiv(rng: () => number): Problem {
  const d = intBetween(rng, 2, 9); // divisor magnitude — keeps the division mental
  const q = intBetween(rng, 2, Math.floor(100 / d)); // quotient; dividend stays ≤ 100
  const bSign = rng() < 0.5 ? -1 : 1;
  const aSign = rng() < 0.5 ? -1 : 1;
  const b = d * bSign;
  const a = d * q * aSign;
  return { kind: 'div', prompt: `${num(a)} ÷ ${paren(b)}`, answer: a / b, points: 3 };
}

// ── Chained arithmetic (worded +/− story) ─────────────────────────────────────
//
// A character starts with N items, then gives some away and receives others.
// Plain stories always mix at least one gain and one loss; trap stories slip in
// a distractor clause (owed items, someone else's stash) that must be ignored.
// The answer is the running total after the *real* operations only.

const CHAIN_ITEMS = [
  'bonbons',
  'billes',
  'cartes',
  'autocollants',
  'timbres',
  'coquillages',
] as const;

type ChainOp = 'give' | 'receive';

/** Decide the sequence of real operations, guaranteeing the required mix. */
function chainOps(rng: () => number, withTrap: boolean): ChainOp[] {
  // Plain: at least one give AND one receive. Trap: at least one give.
  const ops: ChainOp[] = withTrap ? ['give'] : ['give', 'receive'];
  if (rng() < 0.5) ops.push(rng() < 0.5 ? 'give' : 'receive');
  for (let i = ops.length - 1; i > 0; i--) {
    const j = intBetween(rng, 0, i);
    [ops[i], ops[j]] = [ops[j], ops[i]];
  }
  return ops;
}

function chainProblem(rng: () => number, withTrap: boolean): Problem {
  const name = pick(rng, NAMES);
  const noun = pick(rng, CHAIN_ITEMS);
  const start = intBetween(rng, 8, 20);
  let total = start;
  const parts: string[] = [];

  for (const op of chainOps(rng, withTrap)) {
    if (op === 'give' && Math.min(9, total) >= 1) {
      const x = intBetween(rng, 1, Math.min(9, total)); // never give more than held
      total -= x;
      parts.push(`en ${pick(rng, ['donne', 'perd'])} ${x}`);
    } else {
      const x = intBetween(rng, 2, 9);
      total += x;
      const form = intBetween(rng, 0, 2);
      const giver = pick(
        rng,
        NAMES.filter((n) => n !== name),
      );
      parts.push(
        form === 0
          ? `en reçoit ${x} ${deOf(giver)}`
          : form === 1
            ? `en gagne ${x}`
            : `en trouve ${x}`,
      );
    }
  }

  const ops =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`;
  let prompt = `${name} a ${start} ${noun}, ${ops}.`;

  if (withTrap) {
    // A distractor that names a number but leaves the subject's count untouched.
    // Kept as its own sentence — never inlined among the operations — so it can't
    // steal the subject of a following clause and be misread as a real step (a
    // named person is drawn from everyone *but* the subject, to avoid a
    // contradictory "X … X en a d de son côté").
    const d = intBetween(rng, 2, 9);
    const other = pick(
      rng,
      NAMES.filter((n) => n !== name),
    );
    const distractor = pick(rng, [`On lui en doit ${d}`, `${other} en a ${d} de son côté`]);
    prompt += ` ${distractor}.`;
  }

  prompt += ` Combien ${deOf(noun)} a ${name} à la fin ?`;
  return { kind: 'chain', prompt, answer: total, points: withTrap ? 5 : 3 };
}

// ── Equations ──────────────────────────────────────────────────────────────

function makeEquation(rng: () => number): Problem {
  const a = intBetween(rng, 1, 9);
  const b = intBetween(rng, 1, 9);
  const x = intBetween(rng, -9, 9);
  const plus = rng() < 0.5;
  const c = plus ? a * x + b : a * x - b;
  const coeff = a === 1 ? 'x' : `${a}x`;
  const sign = plus ? '+' : MINUS;
  return { kind: 'equation', prompt: `${coeff} ${sign} ${b} = ${num(c)}`, answer: x, points: 4 };
}

// ── Worded problems (10 pts) — deliberately non-trivial ──────────────────────

/**
 * Union-minimum trap: two overlapping (flavour) subsets of the same items. The
 * smallest possible total is when the smaller subset is fully contained in the
 * larger, i.e. max(a, b) — not a + b.
 */
const UNION_ITEMS: { noun: string; flavours: string[] }[] = [
  { noun: 'bonbons', flavours: ["à l'anis", 'au chocolat', 'au caramel', 'à la menthe'] },
  { noun: 'glaces', flavours: ['à la vanille', 'au chocolat', 'à la fraise', 'au citron'] },
  { noun: 'gâteaux', flavours: ['au chocolat', 'aux amandes', 'à la vanille', 'au miel'] },
];

function wordUnionMin(rng: () => number): Problem {
  const item = pick(rng, UNION_ITEMS);
  const i = intBetween(rng, 0, item.flavours.length - 1);
  let j = intBetween(rng, 0, item.flavours.length - 2);
  if (j >= i) j += 1; // draw a second, distinct flavour
  const a = intBetween(rng, 2, 9);
  let b = intBetween(rng, 2, 9);
  if (b === a) b = b === 9 ? b - 1 : b + 1; // keep them distinct so the trap bites
  const prompt =
    `J'ai ${a} ${item.noun} ${item.flavours[i]} et ${b} ${item.noun} ${item.flavours[j]}. ` +
    `Combien ${deOf(item.noun)} ai-je au minimum en tout ?`;
  return { kind: 'word', prompt, answer: Math.max(a, b), points: 10 };
}

/** Inclusion–exclusion: |A ∪ B| = |A| + |B| − |A ∩ B|, not |A| + |B|. */
const IE_CONTEXTS = [
  {
    subject: 'élèves',
    pa: 'ont un chien',
    pb: 'ont un chat',
    pboth: 'ont les deux',
    pq: 'ont au moins un animal',
  },
  {
    subject: 'élèves',
    pa: 'aiment le foot',
    pb: 'aiment le basket',
    pboth: 'aiment les deux',
    pq: 'aiment au moins un de ces sports',
  },
  {
    subject: 'enfants',
    pa: 'font du piano',
    pb: 'font du dessin',
    pboth: 'font les deux',
    pq: 'font au moins une activité',
  },
];

function wordInclusionExclusion(rng: () => number): Problem {
  const c = pick(rng, IE_CONTEXTS);
  const a = intBetween(rng, 6, 15);
  const b = intBetween(rng, 6, 15);
  const both = intBetween(rng, 2, Math.min(a, b) - 1);
  const prompt =
    `Dans une classe, ${a} ${c.subject} ${c.pa} et ${b} ${c.pb}. ${both} ${c.pboth}. ` +
    `Combien ${deOf(c.subject)} ${c.pq} ?`;
  return { kind: 'word', prompt, answer: a + b - both, points: 10 };
}

const STORY_ITEMS = [
  'billes',
  'cartes',
  'bonbons',
  'autocollants',
  'timbres',
  'coquillages',
] as const;

/** Reverse reasoning: given the end state, recover the starting amount. */
function wordReverse(rng: () => number): Problem {
  const noun = pick(rng, STORY_ITEMS);
  const name = pick(rng, NAMES);
  const start = intBetween(rng, 10, 20);
  const g = intBetween(rng, 2, Math.min(9, start));
  const r = intBetween(rng, 2, 9);
  const end = start - g + r;
  const prompt =
    `${name} avait des ${noun}. ${name} en a donné ${g}, puis en a reçu ${r}. ` +
    `Il lui en reste ${end}. Combien ${deOf(noun)} avait ${name} au départ ?`;
  return { kind: 'word', prompt, answer: start, points: 10 };
}

/** Ceiling division: leftover items still need a whole extra container. */
const CEIL_CONTEXTS: { one: string; many: string; verb: string; per: string }[] = [
  { one: 'voiture', many: 'voitures', verb: 'peut transporter', per: 'personnes' },
  { one: 'boîte', many: 'boîtes', verb: 'peut contenir', per: 'œufs' },
  { one: 'table', many: 'tables', verb: 'peut accueillir', per: 'invités' },
];

function wordCeil(rng: () => number): Problem {
  const c = pick(rng, CEIL_CONTEXTS);
  const k = intBetween(rng, 3, 6);
  const q = intBetween(rng, 2, 5);
  const rem = intBetween(rng, 1, k - 1); // a non-zero remainder forces one more
  const n = k * q + rem;
  const prompt = `Une ${c.one} ${c.verb} ${k} ${c.per}. Pour ${n} ${c.per}, combien de ${c.many} faut-il ?`;
  return { kind: 'word', prompt, answer: q + 1, points: 10 };
}

/** Age as a multiple: divide to find the younger age. */
function wordAge(rng: () => number): Problem {
  const name = pick(rng, NAMES);
  const name2 = pick(
    rng,
    NAMES.filter((n) => n !== name),
  );
  const younger = intBetween(rng, 3, 9);
  const m = intBetween(rng, 2, 5);
  const prompt = `${name} a ${younger * m} ans, c'est ${m} fois l'âge de ${name2}. Quel âge a ${name2} ?`;
  return { kind: 'word', prompt, answer: younger, points: 10 };
}

/** Legs & heads: two kinds of things, from counts recover how many of one kind. */
const LEGS_CONTEXTS = [
  { two: 'poules', four: 'lapins', heads: 'têtes', legs: 'pattes', ask: 'lapins' },
  { two: 'canards', four: 'moutons', heads: 'têtes', legs: 'pattes', ask: 'moutons' },
  { two: 'vélos', four: 'voitures', heads: 'véhicules', legs: 'roues', ask: 'voitures' },
];

function wordLegs(rng: () => number): Problem {
  const c = pick(rng, LEGS_CONTEXTS);
  const heads = intBetween(rng, 5, 10);
  const four = intBetween(rng, 1, heads - 1); // count of the 4-legged/4-wheeled kind
  const legs = 2 * (heads - four) + 4 * four;
  const prompt =
    `Il y a des ${c.two} et des ${c.four} : ${heads} ${c.heads} et ${legs} ${c.legs} en tout. ` +
    `Combien y a-t-il de ${c.ask} ?`;
  return { kind: 'word', prompt, answer: four, points: 10 };
}

function makeWord(rng: () => number): Problem {
  switch (intBetween(rng, 0, 5)) {
    case 0:
      return wordUnionMin(rng);
    case 1:
      return wordInclusionExclusion(rng);
    case 2:
      return wordReverse(rng);
    case 3:
      return wordCeil(rng);
    case 4:
      return wordAge(rng);
    default:
      return wordLegs(rng);
  }
}

/**
 * Draw one problem, choosing its type by weight (chain 25% · mul 20% · div 20% ·
 * equation 15% · word 20%). Within chains, ~40% carry a distractor trap (+5).
 * The type draw and the generator share the same PRNG stream, so the whole
 * round stays reproducible from the seed.
 */
function makeProblem(rng: () => number): Problem {
  const r = rng();
  if (r < 0.25) return chainProblem(rng, rng() < 0.4);
  if (r < 0.45) return makeMul(rng);
  if (r < 0.65) return makeDiv(rng);
  if (r < 0.8) return makeEquation(rng);
  return makeWord(rng);
}

/**
 * Deterministically derive the round's problems from a seed. The same seed
 * always yields the same sequence, so a shared challenge is perfectly
 * reproducible on any device.
 */
export function generateProblems(seed: number, count: number = PROBLEM_POOL): Problem[] {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, () => makeProblem(rng));
}

/** Human-readable form of a problem — the pre-rendered statement. */
export function formatProblem(p: Problem): string {
  return p.prompt;
}
