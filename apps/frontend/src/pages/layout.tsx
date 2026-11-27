import { useState } from 'react'
import {
    ArrowLeftRight,
    CircleUserRound,
    CreditCard,
    Home,
    PanelLeftClose,
    PanelLeftOpen,
    ReceiptText,
    Repeat2,
    Wallet,
    type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
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

export default function Layout() {
    const [abierta, setAbierta] = useState(leerEstadoInicial)

    const alternar = () => {
        const nuevoEstado = !abierta
        setAbierta(nuevoEstado)
        try {
            localStorage.setItem(CLAVE_SIDEBAR, String(nuevoEstado))
        } catch {
            // Si el navegador bloquea el almacenamiento, la barra sigue funcionando.
        }
    }

    return (
        <aside className={`sidebar-card${abierta ? '' : ' colapsada'}`}>
            <div className="sidebar-header">
                <h1>Bienvenido</h1>
                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={alternar}
                    aria-expanded={abierta}
                    aria-label={abierta ? 'Cerrar menú' : 'Abrir menú'}
                    title={abierta ? 'Cerrar menú' : 'Abrir menú'}
                >
                    {abierta ? (
                        <PanelLeftClose size={20} aria-hidden="true" />
                    ) : (
                        <PanelLeftOpen size={20} aria-hidden="true" />
                    )}
                </button>
            </div>
            <nav className="sidebar-menu" aria-label="Secciones">
                {enlaces.map(({ path, nombre, Icono }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }: { isActive: boolean }) =>
                            isActive ? 'white' : 'gray'
                        }
                        aria-label={nombre}
                        title={abierta ? undefined : nombre}
                    >
                        <Icono className="link-icon" size={20} aria-hidden="true" />
                        <span className="link-name">{nombre}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}
