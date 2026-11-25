import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../../config/database.js";
import User from "./user.js";

export type TipoTarjeta = "visa" | "mastercard" | "amex" | "otra";

export class Tarjeta extends Model<
  InferAttributes<Tarjeta>,
  InferCreationAttributes<Tarjeta>
> {
  declare id: CreationOptional<number>;
  declare idUsuario: number;
  declare tipo: TipoTarjeta;
  declare ultimosCuatro: string;
  declare titular: string;
  declare vencimiento: string;
  declare activa: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Tarjeta.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idUsuario",
    },
    tipo: { type: DataTypes.STRING(20), allowNull: false },
    ultimosCuatro: {
      type: DataTypes.CHAR(4),
      allowNull: false,
      field: "ultimosCuatro",
    },
    titular: { type: DataTypes.STRING(100), allowNull: false },
    vencimiento: { type: DataTypes.CHAR(5), allowNull: false },
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: "Tarjeta",
    timestamps: true,
  },
);

Tarjeta.belongsTo(User, { foreignKey: "idUsuario", as: "usuario" });
User.hasMany(Tarjeta, { foreignKey: "idUsuario", as: "tarjetas" });

export default Tarjeta;
