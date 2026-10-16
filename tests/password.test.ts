import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../server/password';

describe('contraseña admin', () => {
  it('verifica la correcta y rechaza la incorrecta', async () => {
    const h = await hashPassword('una frase larga y segura');
    expect(h.startsWith('pbkdf2$100000$')).toBe(true);
    expect(await verifyPassword('una frase larga y segura', h)).toBe(true);
    expect(await verifyPassword('otra cosa', h)).toBe(false);
  });
  it('rechaza formatos raros sin romperse', async () => {
    expect(await verifyPassword('x', '')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2$1$a$b')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2$100000$***$***')).toBe(false);
  });
});
