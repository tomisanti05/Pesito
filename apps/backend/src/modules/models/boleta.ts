import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../../config/database.js";
import User from "./user.js";

export interface BoletaAttributes {
  idBoleta: number;
  idUsuario: number;
  tipoServicio: string;
  monto: string;
  fechaVencimiento: string;
  pagada: boolean;
  fechaPago?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BoletaCreationAttributes = Optional<
  BoletaAttributes,
  "idBoleta" | "fechaPago" | "createdAt" | "updatedAt"
>;

export class Boleta
  extends Model<BoletaAttributes, BoletaCreationAttributes>
  implements BoletaAttributes
{
  declare idBoleta: number;
  declare idUsuario: number;
  declare tipoServicio: string;
  declare monto: string;
  declare fechaVencimiento: string;
  declare pagada: boolean;
  declare fechaPago?: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Boleta.init(
  {
    idBoleta: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "id",
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idUsuario",
    },
    tipoServicio: { type: DataTypes.STRING(20), allowNull: false },
    monto: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: false },
    pagada: { type: DataTypes.BOOLEAN, defaultValue: false },
    fechaPago: { type: DataTypes.DATEONLY, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: "Boleta",
    timestamps: true,
  },
);

Boleta.belongsTo(User, { foreignKey: "idUsuario", as: "usuario" });
User.hasMany(Boleta, { foreignKey: "idUsuario", as: "boletas" });

export default Boleta;
