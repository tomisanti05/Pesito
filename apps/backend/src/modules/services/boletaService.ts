import Boleta from "../models/boleta.js";

function errorHttp(mensaje: string, status: number): Error {
  const err: any = new Error(mensaje);
  err.status = status;
  return err;
}

async function buscarBoleta(id: number, idUsuario?: number) {
  const boleta = idUsuario
    ? await Boleta.findOne({ where: { idBoleta: id, idUsuario } })
    : await Boleta.findByPk(id);
  if (!boleta) throw errorHttp("Boleta no encontrada", 404);
  return boleta;
}

export async function listarBoletas(idUsuario?: number) {
  return await Boleta.findAll({
    where: idUsuario ? { idUsuario } : undefined,
    order: [["fechaVencimiento", "ASC"]],
  });
}

export async function obtenerBoleta(id: number, idUsuario?: number) {
  return await buscarBoleta(id, idUsuario);
}

export async function crearBoleta(dto: any, idUsuario: number) {
  if (!dto.monto || Number(dto.monto) <= 0) throw errorHttp("Monto invalido", 400);
  if (!dto.fechaVencimiento) throw errorHttp("Fecha de vencimiento requerida", 400);

  return await Boleta.create({
    idUsuario,
    tipoServicio: dto.tipoServicio,
    monto: String(dto.monto),
    fechaVencimiento: dto.fechaVencimiento,
    pagada: dto.pagada || false,
    fechaPago: dto.fechaPago || null,
  });
}

export async function editarBoleta(id: number, dto: any, idUsuario?: number) {
  const boleta = await buscarBoleta(id, idUsuario);
  return await boleta.update(dto);
}

export async function eliminarBoleta(id: number, idUsuario?: number) {
  const boleta = await buscarBoleta(id, idUsuario);
  await boleta.destroy();
  return { mensaje: "Boleta eliminada" };
}
