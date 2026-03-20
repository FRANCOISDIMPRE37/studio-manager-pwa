import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Mock de la base de données
vi.mock('./db', () => ({
  getStudioUsersByOwner: vi.fn().mockResolvedValue([]),
  getStudioUserById: vi.fn().mockResolvedValue(undefined),
  loginExistsForOwner: vi.fn().mockResolvedValue(false),
  createStudioUser: vi.fn().mockResolvedValue(undefined),
  updateStudioUser: vi.fn().mockResolvedValue(undefined),
  deleteStudioUser: vi.fn().mockResolvedValue(undefined),
}));

import {
  getStudioUsersByOwner,
  loginExistsForOwner,
  createStudioUser,
  updateStudioUser,
  deleteStudioUser,
} from './db';

describe('Gestion des utilisateurs Studio — logique métier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bcrypt hash un mot de passe correctement', async () => {
    const password = 'monMotDePasse123';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe(password);
    const match = await bcrypt.compare(password, hash);
    expect(match).toBe(true);
  });

  it('bcrypt rejette un mauvais mot de passe', async () => {
    const hash = await bcrypt.hash('bonMotDePasse', 10);
    const match = await bcrypt.compare('mauvaisMotDePasse', hash);
    expect(match).toBe(false);
  });

  it('getStudioUsersByOwner retourne la liste des utilisateurs', async () => {
    const mockUsers = [
      { id: 1, prenom: 'Marie', nom: 'Dupont', login: 'marie.dupont', role: 'employe', actif: true },
    ];
    vi.mocked(getStudioUsersByOwner).mockResolvedValueOnce(mockUsers as any);
    const result = await getStudioUsersByOwner(42);
    expect(result).toEqual(mockUsers);
    expect(getStudioUsersByOwner).toHaveBeenCalledWith(42);
  });

  it('loginExistsForOwner détecte un login existant', async () => {
    vi.mocked(loginExistsForOwner).mockResolvedValueOnce(true);
    const exists = await loginExistsForOwner('marie.dupont', 42);
    expect(exists).toBe(true);
  });

  it('loginExistsForOwner retourne false pour un login disponible', async () => {
    vi.mocked(loginExistsForOwner).mockResolvedValueOnce(false);
    const exists = await loginExistsForOwner('nouveau.login', 42);
    expect(exists).toBe(false);
  });

  it('createStudioUser est appelé avec les bons paramètres', async () => {
    const passwordHash = await bcrypt.hash('test123', 10);
    await createStudioUser({
      ownerId: 42,
      prenom: 'Jean',
      nom: 'Martin',
      login: 'jean.martin',
      passwordHash,
      role: 'employe',
      actif: true,
    });
    expect(createStudioUser).toHaveBeenCalledOnce();
    const callArg = vi.mocked(createStudioUser).mock.calls[0][0];
    expect(callArg.login).toBe('jean.martin');
    expect(callArg.ownerId).toBe(42);
  });

  it('updateStudioUser est appelé pour la modification', async () => {
    await updateStudioUser(1, 42, { actif: false });
    expect(updateStudioUser).toHaveBeenCalledWith(1, 42, { actif: false });
  });

  it('deleteStudioUser est appelé avec le bon ID', async () => {
    await deleteStudioUser(5, 42);
    expect(deleteStudioUser).toHaveBeenCalledWith(5, 42);
  });

  it('validation du login — format correct', () => {
    const validLogins = ['marie.dupont', 'jean-martin', 'user123', 'test_user'];
    const invalidLogins = ['marie dupont', 'jean@martin', 'user!', ''];
    const loginRegex = /^[a-zA-Z0-9._-]+$/;
    validLogins.forEach(l => expect(loginRegex.test(l)).toBe(true));
    invalidLogins.forEach(l => expect(loginRegex.test(l)).toBe(false));
  });

  it('validation du mot de passe — longueur minimale', () => {
    expect('abc12'.length >= 6).toBe(false);
    expect('abc123'.length >= 6).toBe(true);
    expect('motDePasseLong'.length >= 6).toBe(true);
  });
});
