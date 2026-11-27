import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { LogOut } from 'lucide-react'
import '../layout.css'

const CLAVE_SIDEBAR = 'sidebar-abierta'

interface EnlaceSidebar {
    path: string
    nombre: string
    Icono: LucideIcon
}

const enlaces: EnlaceSidebar[] = [
    { path: '/inicio', nombre: 'Inicio', Icono: Home },
    { path: '/midinero', nombre: 'Mi dinero', Icono: Wallet },
    { path: '/transacciones', nombre: 'Transacciones', Icono: ArrowLeftRight },
    { path: '/facturacion', nombre: 'Facturacion', Icono: ReceiptText },
    { path: '/tarjetas', nombre: 'Tarjetas', Icono: CreditCard },
    { path: '/subscripciones', nombre: 'Subscripciones', Icono: Repeat2 },
    { path: '/miCuenta', nombre: 'Mi cuenta', Icono: CircleUserRound },
]

function leerEstadoInicial(): boolean {
    try {
        return localStorage.getItem(CLAVE_SIDEBAR) !== 'false'
    } catch {
        return true
    }
}

function obtenerIniciales(nombre: string): string {
    const palabras = nombre.trim().split(/\s+/).filter(Boolean)
    if (palabras.length === 0) return 'US'
    const primera = palabras[0].charAt(0)
    const ultima = palabras.length > 1 ? palabras[palabras.length - 1].charAt(0) : ''
    return `${primera}${ultima}`.toUpperCase()
}

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
