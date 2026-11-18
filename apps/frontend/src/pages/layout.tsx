import { NavLink } from 'react-router-dom'
import '../layout.css'

export default function Layout() {
    const sidebarLinks = [

        { path: "/inicio", name: "Inicio"},
        { path: "/midinero", name: "Mi dinero"},
        { path: "/facturacion", name: "Facturacion"},
        { path: "/tarjetas", name: "Tarjetas"},
        { path: "/subscripciones", name: "Subscripciones"},
        { path: "/miCuenta", name: "Mi cuenta"}
        ];
    return(
        <aside className='sidebar-card'>
        
        <div className="sidebar-header">
        <h1>Bienvenido "Nombre"</h1>
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
    </aside>
    )
    
}