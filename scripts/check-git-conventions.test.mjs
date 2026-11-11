// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { checkBranch, checkMessage, checkPrTitle } from './check-git-conventions.mjs';

describe('convențiile Git', () => {
  it.each([
    'KAN-125-frontend-proiectul-initial-react',
    'KAN-126-frontend-lista-resurselor-si-formularul-de-adaugare-modificare-si-stergere',
  ])('acceptă branch-ul %s', (branch) => {
    expect(checkBranch(branch)).toEqual([]);
  });

  it.each(['main', 'master', 'feature/resurse', 'KAN-126', 'kan-126-lista', 'KAN-126_lista'])(
    'respinge branch-ul %s',
    (branch) => {
      expect(checkBranch(branch)).not.toEqual([]);
    },
  );

  it('acceptă un mesaj de commit cu tichetul', () => {
    expect(checkMessage('KAN-126: Adaugă formularul fișei resursei')).toEqual([]);
  });

  it.each(['fix', 'KAN-126 fara doua puncte', 'KAN-126: scurt'])('respinge mesajul %s', (msg) => {
    expect(checkMessage(msg)).not.toEqual([]);
  });

  it('respinge mesajele mai lungi de 72 de caractere', () => {
    expect(checkMessage(`KAN-126: ${'a'.repeat(70)}`)).not.toEqual([]);
  });

  it('cere ca titlul PR-ului să fie al aceluiași tichet ca branch-ul', () => {
    const branch = 'KAN-126-frontend-lista-resurselor';
    expect(checkPrTitle('KAN-126: Lista resurselor', branch)).toEqual([]);
    expect(checkPrTitle('KAN-125: Lista resurselor', branch)).not.toEqual([]);
  });
});
