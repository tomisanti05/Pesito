import { useEffect, useState } from 'react'
import {
    ArrowLeftRight,
    CircleUserRound,
    CreditCard,
    Home,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    ReceiptText,
    Repeat2,
    Wallet,
    type LucideIcon,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
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
    const [abierta, setAbierta] = useState(leerEstadoInicial)
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

    useEffect(() => {
        if (!menuMovilAbierto) return
        const alPresionarEscape = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') setMenuMovilAbierto(false)
        }
        window.addEventListener('keydown', alPresionarEscape)
        return () => window.removeEventListener('keydown', alPresionarEscape)
    }, [menuMovilAbierto])

    const abrirMenuMovil = () => {
        setAbierta(true)
        setMenuMovilAbierto(true)
    }

    const alternar = () => {
        if (window.innerWidth <= 1024) {
            setMenuMovilAbierto(false)
            return
        }

        const nuevoEstado = !abierta
        setAbierta(nuevoEstado)
        try {
            localStorage.setItem(CLAVE_SIDEBAR, String(nuevoEstado))
        } catch {
            // Si el navegador bloquea el almacenamiento, la barra sigue funcionando.
        }
    }

    const salir = () => {
        cerrarSesion()
        navigate('/login', { replace: true })
    }

    const nombre = usuario?.nombre.trim() ?? ''
    const iniciales = nombre ? obtenerIniciales(nombre) : 'US'

    return (
        <>
            <header className="barra-movil">
                <button
                    type="button"
                    className="barra-movil-toggle"
                    onClick={abrirMenuMovil}
                    aria-controls="sidebar-principal"
                    aria-expanded={menuMovilAbierto}
                    aria-label="Abrir menú"
                >
                    <PanelLeftOpen size={20} aria-hidden="true" />
                </button>
                <span className="barra-movil-marca">Finanzas</span>
            </header>

            {menuMovilAbierto && (
                <button
                    type="button"
                    className="sidebar-overlay"
                    onClick={() => setMenuMovilAbierto(false)}
                    aria-label="Cerrar menú"
                    tabIndex={-1}
                />
            )}

            <aside
                id="sidebar-principal"
                className={`sidebar-card${abierta ? '' : ' colapsada'}${
                    menuMovilAbierto ? ' movil-abierta' : ''
                }`}
            >
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
                            onClick={() => setMenuMovilAbierto(false)}
                        >
                            <Icono className="link-icon" size={20} aria-hidden="true" />
                            <span className="link-name">{nombre}</span>
                        </NavLink>
                    ))}
                </nav>
                <button
                    type="button"
                    className="sidebar-logout"
                    onClick={salir}
                    title="Cerrar sesión"
                >
                    <LogOut size={20} aria-hidden="true" />
                    {abierta && <span>Cerrar sesión</span>}
                </button>
            </aside>
        </>
    )
}
