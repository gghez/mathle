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
 *
 * PLACEHOLDER copy — describes the stand-in arithmetic game. Rewrite when the
 * real Mathle concept is defined.
 */
export function renderRules(root: HTMLElement, opts: RulesOptions): void {
  clear(root);

  const header = el('div', { className: 'rules-header' }, [
    el('button', { className: 'btn rules-back', textContent: '← Retour', onclick: opts.onBack }),
    el('h1', { className: 'rules-title', textContent: 'Règles' }),
  ]);

  const content = el('div', { className: 'rules-content' }, [
    section('Objectif', [
      p('Marque un maximum de points en 60 secondes. (Concept provisoire : calcul mental.)'),
    ]),
    section('Comment jouer', [
      p('Une opération apparaît. Tape le résultat puis valide.'),
      list([
        'Chaque bonne réponse rapporte 1 point.',
        'Une mauvaise réponse ne rapporte rien — on passe à la suivante.',
        'Enchaîne autant de calculs que possible avant la fin du chrono.',
      ]),
    ]),
    section('Défier un ami', [
      p(
        'Ta suite de calculs et ton score à battre sont encodés dans un lien de partage. ' +
          "La personne qui l'ouvre joue exactement la même suite et doit dépasser ton score — " +
          'aucun serveur, tout tient dans le lien.',
      ),
    ]),
    section('À venir', [
      p(
        'Ceci est une version de démonstration servant à valider la chaîne de build et de ' +
          'déploiement. Le vrai concept de jeu Mathle remplacera bientôt ces règles.',
      ),
    ]),
  ]);

  root.append(el('div', { className: 'screen screen--rules' }, [header, content]));
}
