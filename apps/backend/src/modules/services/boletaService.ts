import Boleta from "../models/boleta.js";

function errorHttp(mensaje: string, status: number): Error {
  const err: any = new Error(mensaje);
  err.status = status;
  return err;
}

export async function listarBoletas() {
  return await Boleta.findAll({ order: [["fechaVencimiento", "ASC"]] });
}

export async function obtenerBoleta(id: number) {
  const boleta = await Boleta.findByPk(id);
  if (!boleta) throw errorHttp("Boleta no encontrada", 404);
  return boleta;
}

export async function crearBoleta(dto: any) {
  if (!dto.monto || Number(dto.monto) <= 0) throw errorHttp("Monto invalido", 400);
  if (!dto.fechaVencimiento) throw errorHttp("Fecha de vencimiento requerida", 400);
  
  return await Boleta.create({
    idUsuario: dto.idUsuario || 1,
    tipoServicio: dto.tipoServicio,
    monto: String(dto.monto),
    fechaVencimiento: dto.fechaVencimiento,
    pagada: dto.pagada || false,
    fechaPago: dto.fechaPago || null,
  });
}

export async function editarBoleta(id: number, dto: any) {
  const boleta = await obtenerBoleta(id);
  return await boleta.update(dto);
}

export async function eliminarBoleta(id: number) {
  const boleta = await obtenerBoleta(id);
  await boleta.destroy();
  return { mensaje: "Boleta eliminada" };
}
