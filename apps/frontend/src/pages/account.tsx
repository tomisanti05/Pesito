import { Mail, Phone, Lock, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import './account.css';

function Account() {
  return (
    <div className="account-page">
      <div className="page-header">
        <h1>Mi cuenta</h1>
        <button className="logout-btn">Cerrar sesión</button>
      </div>
      <div className="account-grid">
        <div className="card">
          <div className="card-header">
            <div className="avatar">IM</div>
            <div>
              <p className="name">Ian Franco Manfredi</p>
              <p className="role">Usuario</p>
            </div>
          </div>
          <div className="row">
            <div className="row-info">
              <Mail className="icon" size={20} />
              <div>
                <p className="label">Email</p>
                <p className="value">ian.manfredi12@gmail.com</p>
              </div>
            </div>
            <button className="edit-btn">Editar</button>
          </div>
          <div className="row">
            <div className="row-info">
              <Phone className="icon" size={20} />
              <div>
                <p className="label">Teléfono</p>
                <p className="value">2914368082</p>
              </div>
            </div>
            <button className="edit-btn">Editar</button>
          </div>
        </div>
        <div className="card">
          <h2>Seguridad</h2>
          <div className="row">
            <div className="row-info">
              <Lock className="icon" size={20} />
              <div>
                <p className="label">Contraseña</p>
                <p className="value">*********</p>
              </div>
            </div>
            <button className="edit-btn">Editar</button>
          </div>
          <div className="row">
            <div className="row-info">
              <Clock className="icon" size={20} />
              <div>
                <p className="label">Último cambio</p>
                <p className="value">Hace 3 meses</p>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="row-info">
              <ShieldCheck className="icon" size={20} />
              <div>
                <p className="label">Autenticación en dos pasos</p>
                <p className="value">Desactivada</p>
              </div>
            </div>
            <button className="edit-btn">Activar</button>
          </div>
        </div>
        <div className="danger-card">
          <div className="danger-info">
            <AlertTriangle className="danger-icon" size={24} />
            <div>
              <h3>Eliminar cuenta</h3>
              <p>Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <button className="delete-btn">Eliminar cuenta</button>
        </div>
      </div>
    </div>
  );
}

export default Account;