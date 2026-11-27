import { useEffect, useState } from 'react'
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
import { apiGet, ID_USUARIO } from '../services/api'
import type { Usuario } from '../types/finanzas'
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
    const [abierta, setAbierta] = useState(leerEstadoInicial)
    const [usuario, setUsuario] = useState<Usuario | null>(null)

    useEffect(() => {
        let activo = true
        apiGet<Usuario>(`/api/users/${ID_USUARIO}`)
            .then((datos) => {
                if (activo) setUsuario(datos)
            })
            .catch(() => {
                // Si la API falla, la barra muestra el saludo sin nombre.
            })
        return () => {
            activo = false
        }
    }, [])

    const alternar = () => {
        const nuevoEstado = !abierta
        setAbierta(nuevoEstado)
        try {
            localStorage.setItem(CLAVE_SIDEBAR, String(nuevoEstado))
        } catch {
            // Si el navegador bloquea el almacenamiento, la barra sigue funcionando.
        }
    }

    const nombre = usuario?.nombre.trim() ?? ''
    const iniciales = nombre ? obtenerIniciales(nombre) : 'US'

    return (
        <aside className={`sidebar-card${abierta ? '' : ' colapsada'}`}>
            <div className="sidebar-header">
                <div className="sidebar-usuario" title={nombre || undefined}>
                    <span className="sidebar-avatar" aria-hidden="true">
                        {iniciales}
                    </span>
                    {nombre ? (
                        <div className="sidebar-saludo">
                            <span className="sidebar-saludo-etiqueta">Bienvenido,</span>
                            <h1>{nombre}</h1>
                        </div>
                    ) : (
                        <h1>Bienvenido</h1>
                    )}
                </div>
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
