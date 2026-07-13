import { el, clear } from './dom';

export interface RulesOptions {
  onBack: () => void;
}

function section(title: string, body: (Node | string)[]): HTMLElement {
  return el('section', { className: 'rules-section' }, [
    el('h2', { className: 'rules-section__title', textContent: title }),
    ...body,
  ]);
}

function p(text: string): HTMLElement {
  return el('p', { className: 'rules-p', textContent: text });
}

function list(items: string[]): HTMLElement {
  return el(
    'ul',
    { className: 'rules-list' },
    items.map((t) => el('li', { textContent: t })),
  );
}

/**
 * Render the rules page as a dedicated screen. The back button returns to the
 * screen the player came from (home or end) via `onBack`.
 */
export function renderRules(root: HTMLElement, opts: RulesOptions): void {
  clear(root);

  const header = el('div', { className: 'rules-header' }, [
    el('button', { className: 'btn rules-back', textContent: '← Retour', onclick: opts.onBack }),
    el('h1', { className: 'rules-title', textContent: 'Règles' }),
  ]);

  const content = el('div', { className: 'rules-content' }, [
    section('Objectif', [
      p('Marque un maximum de points en 3 minutes en résolvant le plus de problèmes possible.'),
    ]),
    section('Difficulté', [
      p('Avant de lancer une partie, choisis le mode (il est mémorisé) :'),
      list([
        'Moyen : le jeu complet décrit ci-dessous.',
        'Facile : pour les plus jeunes — sans équations, sans pièges, avec des nombres plus petits pour ×, ÷ et les calculs en plusieurs étapes (les négatifs restent). Un lien de défi ou une partie rejouée garde toujours son mode.',
      ]),
    ]),
    section('Les problèmes', [
      p('Chaque partie enchaîne plusieurs types de problèmes, mélangés au hasard :'),
      list([
        'Multiplication (ex. 8 × 12) → 3 points.',
        'Division qui tombe juste (ex. 51 ÷ 3) → 3 points.',
        'Calcul en plusieurs étapes (donne/reçoit…) mêlant + et − → 3 points, ou 5 s’il cache un piège (une info inutile à ignorer).',
        'Équation à résoudre (ex. 2x − 6 = 4, trouve x) → 4 points.',
        'Problème en toutes lettres, souvent piégé → 10 points.',
      ]),
    ]),
    section('Le score', [
      p('Tape ta réponse sur le pavé numérique puis valide avec ✓.'),
      list([
        'Une bonne réponse rapporte les points du problème.',
        'Une mauvaise réponse fait perdre 1 point (le score ne descend jamais sous 0).',
        'La touche − sert pour les réponses négatives, ⌫ pour corriger.',
      ]),
    ]),
    section('Défier un ami', [
      p(
        'Ta série de problèmes et ton score à battre sont encodés dans un lien de partage. ' +
          "La personne qui l'ouvre joue exactement la même série et doit dépasser ton score — " +
          'aucun serveur, tout tient dans le lien.',
      ),
    ]),
    section('En plus', [
      list([
        'À la fin, « Voir mes réponses » liste chaque question avec ta réponse et la bonne réponse. On peut aussi revoir une partie depuis l’historique.',
        'Le bouton 🔊 / 🔇 active ou coupe les sons (mémorisé sur l’appareil).',
      ]),
    ]),
  ]);

  root.append(el('div', { className: 'screen screen--rules' }, [header, content]));
}
