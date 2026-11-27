import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { LogOut } from 'lucide-react'
import '../layout.css'

export default function Layout() {
    const { usuario, cerrarSesion } = useAuth()
    const navigate = useNavigate()

    const sidebarLinks = [

        { path: "/inicio", name: "Inicio"},
        { path: "/midinero", name: "Mi dinero"},
        { path: "/transacciones", name: "Transacciones"},
        { path: "/facturacion", name: "Facturacion"},
        { path: "/tarjetas", name: "Tarjetas"},
        { path: "/subscripciones", name: "Subscripciones"},
        { path: "/miCuenta", name: "Mi cuenta"}
        ];

    function salir() {
        cerrarSesion()
        navigate("/login", { replace: true })
    }

    return(
        <aside className='sidebar-card'>
        
        <div className="sidebar-header">
        <h1>Bienvenido {usuario ? `"${usuario.nombre.split(" ")[0]}"` : ''}</h1>
        </div>
        <nav className="sidebar-menu">
                {sidebarLinks.map((link) => (
                    <NavLink
                    key={link.path}
                    to={link.path}
                    className= {({ isActive }: { isActive: boolean }) => isActive ? "white" : "gray"}
                    >
                        <div className='link-left'>

                            <span className='link-name'>{link.name}</span>
                        </div>
                    </NavLink>
                ))}
        </nav>
        <button
            type="button"
            className="sidebar-logout"
            onClick={salir}
        >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
        </button>
    </aside>
    )
    

}
