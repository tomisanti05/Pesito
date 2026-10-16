import { Decimal } from "decimal.js";
import User from "../models/user.js";
import Billetera from "../models/billetera.js";
// PATRON STRATEGY PARA CALCULOS INGRESO EGRESO
export interface calculoSaldoStrategy {
    calcularSaldo(saldo:string,monto:string):string;
}

export class ingresoStrategy implements calculoSaldoStrategy{
    calcularSaldo(saldo: string, monto: string): string {
        return new Decimal(saldo).plus(new Decimal(monto)).toFixed(2);
    }
}

export class egresoStrategy implements calculoSaldoStrategy{
    calcularSaldo(saldo: string, monto: string): string {
        const actualSaldo = new Decimal(saldo)
        const gastoSaldo = new Decimal(monto)

        if (actualSaldo.lt(gastoSaldo)){
            throw { status: 409, message:"fondos insuficientes"}
        }

        return actualSaldo.minus(gastoSaldo).toFixed(2);
    }
}

export function calcularNuevoSaldo(saldo:string,monto:string,tipo:string):string{
    if (!monto || Number(monto) <= 0){
        throw {status:400, message:"el monto debe ser positivo"}
    }
    const strategies: Record<string, calculoSaldoStrategy> ={ //diccionario de strategias
        ingreso: new ingresoStrategy(),  
        egreso: new egresoStrategy()    

    };
    const strategy = strategies[tipo];
    if (!strategy){
        throw{ status:400, message:"tipo de movimiento invalido (debe ser ingreso o egreso)"};
    }
    return strategy.calcularSaldo(saldo,monto)
}

export async function CrearBilletera(data:{idUsuario:number;nombre:string; tipo:string}) {
    if (!data.idUsuario || !data.nombre || !data.tipo){
        throw{ status: 400, message:" Faltan datos para la creacion de la billetera, por favor ingrese los datos correctos"}
    }
    const usuario = await User.findByPk(data.idUsuario);

    if(!usuario){
        throw { status:404,message:"el usuario no existe"};
    }
    if(!usuario.activo){
        throw { status:400,message:"el usuario esta inactivo"};
    }

    return await Billetera.create({
        idUsuario: data.idUsuario,
        nombre:data.nombre,
        tipo:data.tipo,
        saldo:"0.00"
    });
}

export async function obtenerBilleteraPorId(idBilletera:number) {
    const billetera = await Billetera.findByPk(idBilletera);

    if(!billetera){
        throw { status:404,message:"la billetera no existe"};
    }
    return billetera
}

export async function editarBilletera(idBilletera:number,data:{nombre?:string;tipo?:string;saldo?:any;idUsuario?:any;}) {
    if (data.saldo !== undefined || data.idUsuario !== undefined){
        throw {status:400,message:"no se permite modificar el saldo o el propietario de la billetera"};
    }
    
    const billetera = await Billetera.findByPk(idBilletera)
    if (!billetera){
        throw { status:404,message:"la billetera no existe"};
    }

    if(data.nombre){
        billetera.nombre = data.nombre.trim();
    } 
    if(data.tipo){
        billetera.tipo = data.tipo.trim();
    } 
    await billetera.save()
    return billetera
}