import { useState } from "react";
import "./LoginPage.css";

export default function LoginPage({ onLogin, error = '', loading = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin?.({ email, password });
  };

  return (
    <div className="login">
      <div className="login__left">
        <div className="login__brand">
          <span className="login__logo" />
          <div>
            <h1>Electric Designer</h1>
            <p>Planificación y presupuestos eléctricos en un solo lugar.</p>
          </div>
        </div>
        <div className="login__highlight">
          <h2>Accede a tus proyectos</h2>
          <p>
            Controla presupuestos, versiones y catálogos con un flujo claro y
            profesional.
          </p>
          <ul>
            <li>Historial de revisiones</li>
            <li>Exportación de presupuestos</li>
            <li>KPIs y seguimiento</li>
          </ul>
        </div>
      </div>

      <div className="login__right">
        <div className="login__panel">
          <h2>Iniciar sesión</h2>
          <p>Introduce tus credenciales para continuar.</p>
          <form className="login__form" onSubmit={handleSubmit}>
            <label className="login__label">
              Usuario
              <input
                type="email"
                placeholder="usuario@empresa.com"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="login__label">
              Contraseña
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <div className="login__error">{error}</div>}
            <button className="login__submit" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <button className="login__ghost" type="button">
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
