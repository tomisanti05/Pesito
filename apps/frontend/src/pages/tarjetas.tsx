import { useState } from "react"
import './tarjetas.css'
import { 
  Pause, 
  Trash2, 
  Pencil, 
  Film, 
  Utensils, 
  IceCream, 
  Fuel, 
  ShoppingCart, 
  Gamepad2, 
  Pill, 
  Music2, 
  Bike,
  CreditCard,
  ShieldCheck,
  Calendar1,
  Calendar,ChevronRight,ChevronLeft,
  type LucideIcon
} from "lucide-react"
interface Tarjeta {
  id: string;
  nombre: string;
  numero: string;
  codigo: string;
  vencimiento: string;
  estaPausada: boolean;
}

interface Transaccion {
  id: number;
  tarjetaId: string; 
  fecha: string;
  lugar: string;
  monto: number;
  Icono: LucideIcon;
}

const TARJETAS_INICIALES: Tarjeta[] = [
  {
    id: "card_visa",
    nombre: "Visa Débito",
    numero: "4876 5678 2364 5978",
    codigo: "060",
    vencimiento: "10/31",
    estaPausada: false,
  },
  {
    id: "card_master",
    nombre: "Mastercard Crédito",
    numero: "5412 7512 3412 8901",
    codigo: "415",
    vencimiento: "05/29",
    estaPausada: false,
  },
];

const HISTORIAL_TOTAL: Transaccion[] = [
  // Movimientos de la Tarjeta 1 (Visa)
  { id: 1, tarjetaId: "card_visa", fecha: "08 Oct", lugar: "Cinemacenter BBCA", monto: 10500, Icono: Film },
  { id: 2, tarjetaId: "card_visa", fecha: "08 Oct", lugar: "McDonalds", monto: 19000, Icono: Utensils },
  { id: 3, tarjetaId: "card_visa", fecha: "08 Oct", lugar: "Lucciano's", monto: 6500, Icono: IceCream },
  { id: 4, tarjetaId: "card_visa", fecha: "07 Oct", lugar: "YPF Estación", monto: 24800, Icono: Fuel },
  { id: 5, tarjetaId: "card_visa", fecha: "06 Oct", lugar: "Supermercado Coto", monto: 42150, Icono: ShoppingCart },

  // Movimientos de la Tarjeta 2 (Mastercard)
  { id: 6, tarjetaId: "card_master", fecha: "05 Oct", lugar: "Steam Games", monto: 15900, Icono: Gamepad2 },
  { id: 7, tarjetaId: "card_master", fecha: "04 Oct", lugar: "Farmacia del Pueblo", monto: 8900, Icono: Pill },
  { id: 8, tarjetaId: "card_master", fecha: "02 Oct", lugar: "Spotify Argentina", monto: 4200, Icono: Music2 },
  { id: 9, tarjetaId: "card_master", fecha: "01 Oct", lugar: "PedidosYa", monto: 11300, Icono: Bike },
];

export default function Tarjetas() {
  const [tarjetas] = useState<Tarjeta[]>(TARJETAS_INICIALES);
  const [tarjetaIndex,setTarjetaIndex] = useState(0)
  
  const tarjetaActiva = tarjetas[tarjetaIndex]
  
  const tipo = tarjetaActiva.numero.trimStart().startsWith("4") ? "visa" : "mastercard";

  const anteriorTarjeta = () => {
  setTarjetaIndex((prev) => (prev === 0 ? tarjetas.length - 1 : prev - 1));
};

const siguienteTarjeta = () => {
  setTarjetaIndex((prev) => (prev === tarjetas.length - 1 ? 0 : prev + 1));
};
  return (
  
  <div className="tarjetas-container">
    
      <div className="tarjetas-header">
        <h1>Mis Tarjetas</h1>
      </div>
    <div className="tarjetas-grid">
    <div className="tarjetas-body-izq">

      <div className="tarjetas-content">
        <div className="tarjetas-imagen"> 
          <button 
              type="button" 
              onClick={anteriorTarjeta}
              style={{
                borderColor:"var(--color-primary)",
                borderRadius:"8px",
                marginBottom:"10px",
                marginRight:"8px"
              }}
              >
              <ChevronLeft size={18} />
            </button>
            <button 
              type="button" 
              onClick={siguienteTarjeta}
              style={{
                borderColor:"var(--color-primary)",
                borderRadius:"8px",
                marginBottom:"10px"
              }}
            >
              <ChevronRight size={18} />
            </button>
            <img 
              src={`/img/tarjetas/${tipo}_tarjeta.png`}
              alt={`Tarjeta ${tipo}`}
              width="350" 
              height="221" 
            />
        </div>

        <div className="tarjetas-descripcion">
          <div className="datos-tarjeta">
            <p className="numero-tarjeta"> <CreditCard size={20} /> Numero 
            <br />
              {tarjetaActiva.numero} 
            </p>
            <p className="codigo-tarjeta"> <ShieldCheck size={20} /> Codigo  
              <br />
               {tarjetaActiva.codigo} 
              </p>
            <p className="vencimiento-tarjeta"> <Calendar1 size={20}/> Vencimiento 
              <br />
              {tarjetaActiva.vencimiento}
              </p>
            <button>
              <Pencil size={16}/>
              Editar datos
            </button>
          </div> 
        </div>

        <div className="tarjetas-opciones">
          <div className="boton-pausar">
            <button>
              <Pause size={16} />
              <br />
              Pausar tarjeta  
            </button>
          </div>
          <div className="boton-borrar">
            <button>
            <Trash2 size={16} />
            <br />
              Borrar tarjeta
            </button>
          </div>
        </div>
      </div> 
      </div>

    
    <div className="tarjeta-body-der">
        <h1>Historial</h1>
      <div className="historial-tarjetas">

    {HISTORIAL_TOTAL.filter((item) => item.tarjetaId === tarjetaActiva.id).map(({ id, fecha, lugar, monto, Icono }) => (
        <div key={id} className="card-historial">
          <span className="fecha-consumo">
            <Calendar size={16} /> {fecha}
          </span>
          <span className="lugar">
            <Icono size={16} /> {lugar}
          </span>
          <span className="monto">
            - ${monto}
          </span>
        </div>
      ))}
        </div>
      </div> 
    </div>
  </div>

  )
}
