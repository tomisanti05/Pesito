import { Navigate, Route, Routes } from 'react-router-dom';
import Facturacion from './pages/facturacion.tsx';
import Account from './pages/account.tsx';
import Layout from './pages/layout.tsx';
import Tarjetas from './pages/tarjetas.tsx'
import Inicio from './pages/inicio.tsx';
import MiDinero from './pages/midinero.tsx';
import Subscripciones from './pages/subscripciones.tsx'
import './App.css'

function App() {
  return (
    <div className='contenedor'>
      <Layout />
      <main className='main-content'>
        <Routes>

          <Route path='/' element={<Navigate to="/inicio" replace />} />

          <Route path="/inicio" element={<Inicio />} />
          <Route path="/midinero" element={<MiDinero />} />
          <Route path="/facturacion" element={<Facturacion />} />
          <Route path="/tarjetas" element={<Tarjetas />} />
          <Route path="/subscripciones" element={<Subscripciones />} />
          <Route path="/miCuenta" element={<Account />} />

          <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
