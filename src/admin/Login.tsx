import { useState, type FormEvent } from 'react';
import { AdminError, api } from './api';

export function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('POST', '/api/admin/login', { password });
      setPassword('');
      onDone();
    } catch (err) {
      setError(err instanceof AdminError ? err.message : 'No se pudo entrar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <form onSubmit={submit}>
        <div>
          <h1>Essentia</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>Panel de la tienda</p>
        </div>
        <div className="field">
          <label htmlFor="pw">Contraseña</label>
          <input id="pw" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? 'pw-err' : undefined} />
          {error && <span className="err" id="pw-err" role="alert">{error}</span>}
        </div>
        <button className="btn primary" type="submit" disabled={busy || !password}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  );
}
