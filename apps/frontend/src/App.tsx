import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import Facturacion from "./pages/facturacion.tsx";
import Account from "./pages/account.tsx";
import Layout from "./pages/layout.tsx";
import Tarjetas from "./pages/tarjetas.tsx";
import Inicio from "./pages/inicio.tsx";
import MiDinero from "./pages/midinero.tsx";
import Transacciones from "./pages/transacciones.tsx";
import Calendario from "./pages/calendario.tsx";
import Subscripciones from "./pages/subscripciones.tsx";
import Login from "./pages/login.tsx";
import Register from "./pages/register.tsx";
import ForgotPassword from "./pages/forgot-password.tsx";
import ResetPassword from "./pages/reset-password.tsx";
import "./App.css";

const RUTAS_PUBLICAS = ["/login", "/register", "/forgot-password", "/reset-password"];

function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return <p className="estado-auth">Cargando tu sesión…</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: ubicacion.pathname }} />;
  }

  return <>{children}</>;
}

function App() {
  const ubicacion = useLocation();
  const esRutaPublica = RUTAS_PUBLICAS.some(
    (ruta) => ubicacion.pathname === ruta || ubicacion.pathname.startsWith(`${ruta}/`),
  );

  return (
    <div className="contenedor">
      {esRutaPublica ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      ) : (
        <>
          <Layout />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/inicio" replace />} />

              <Route path="/inicio" element={<RutaProtegida><Inicio /></RutaProtegida>} />
              <Route path="/midinero" element={<RutaProtegida><MiDinero /></RutaProtegida>} />
              <Route path="/transacciones" element={<RutaProtegida><Transacciones /></RutaProtegida>} />
              <Route path="/calendario" element={<RutaProtegida><Calendario /></RutaProtegida>} />
              <Route path="/facturacion" element={<RutaProtegida><Facturacion /></RutaProtegida>} />
              <Route path="/tarjetas" element={<RutaProtegida><Tarjetas /></RutaProtegida>} />
              <Route path="/subscripciones" element={<RutaProtegida><Subscripciones /></RutaProtegida>} />
              <Route path="/miCuenta" element={<RutaProtegida><Account /></RutaProtegida>} />

              <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
            </Routes>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
