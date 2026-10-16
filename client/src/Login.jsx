import { useState } from 'react';
import { api } from './api.js';

export default function Login({ onIngreso }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      onIngreso(await api('/login', { method: 'POST', body: { usuario, password } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <form className="tarjeta login-form" onSubmit={enviar}>
        <h1 style={{ color: 'var(--corporativo-naranja, #ff6600)', fontWeight: 800, letterSpacing: 1 }}>
          26000 VEINTISEISMIL
        </h1>
        <p style={{ textAlign: 'center', marginBottom: 20, color: 'var(--texto-secundario)' }}>
          Recepción de viajes
        </p>
        <label>
          Usuario
          <input autoFocus value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn primario" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </div>
  );
}
