  import { useState } from "react";
  import './subscripciones.css'
  interface Subscripcion { 
      id: string;
      proveedor: string;
      plan:string;
      numTarjeta: string;
      monto:number;
      diaCobro: string;
  } 

  const SubscripcionesPrueba: Subscripcion [] = [
    {
    id: "sub-1",
    proveedor: "Spotify",
    plan: "Spotify Premium",
    numTarjeta: "Visa •••• 5978",
    monto: 4200,
    diaCobro: "10 Nov",
  },
  {
    id: "sub-2",
    proveedor: "Netflix",
    plan: "Netflix Estándar",
    numTarjeta: "Master •••• 8901",
    monto: 11500,
    diaCobro: "12 Oct",
  },
  {
    id: "sub-3",
    proveedor: "Anthropic",
    plan: "Anthropic Pro",
    numTarjeta: "Master •••• 8901",
    monto: 22000,
    diaCobro: "25 Oct",
  },
  ]
export default function Subscripciones() {
  const [subs] = useState<Subscripcion[]>(SubscripcionesPrueba) 
  const totalGasto = subs.reduce((acc,sub) => acc + sub.monto,0)
  
  return (
    <div className="subscripciones-body">
      <div className="subscripciones-header">
         <h1>Mis Subscripciones</h1>
      </div>
      <div className="metricas">
        <span className="gasto-total">
          Total Gastado $ {totalGasto}  
        </span>
        <span className="proximo-cobro">
            
              Netflix 12 Oct
            
        </span>
        <span className="nueva-sub">
            <button>
               + Añadir subscripcion
            </button>
        </span>  
      </div>  

      <div className="subscripciones">
        {subs.map((sub) =>(
          <div key={sub.id} className="subscripcion-card"> 
            <span className="proveedor">{sub.proveedor}</span>
            <span className="plan-nombre">{sub.plan}</span>
            <span className="tarjeta-info">{sub.numTarjeta}</span>
            <span className="dia-cobro">{sub.diaCobro}</span>
            <span className="monto">-$ {sub.monto}</span>
          </div>
        )
      )}
      </div>
    </div>
  )
}
