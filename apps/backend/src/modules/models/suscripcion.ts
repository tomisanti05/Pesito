import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../../config/database.js";
import User from "./user.js";

export class Suscripcion extends Model<
  InferAttributes<Suscripcion>,
  InferCreationAttributes<Suscripcion>
> {
  declare idSuscripcion: CreationOptional<number>;
  declare idUsuario: number;
  declare idTarjeta: CreationOptional<number | null>;
  declare proveedor: string;
  declare plan: string;
  declare monto: string;
  declare diaCobro: number;
  declare activa: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Suscripcion.init(
  {
    idSuscripcion: {
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
    idTarjeta: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "idTarjeta",
    },
    proveedor: { type: DataTypes.STRING(100), allowNull: false },
    plan: { type: DataTypes.STRING(100), allowNull: false },
    monto: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    diaCobro: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: "diaCobro",
    },
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: "Suscripcion",
    timestamps: true,
  },
);

Suscripcion.belongsTo(User, { foreignKey: "idUsuario", as: "usuario" });
User.hasMany(Suscripcion, { foreignKey: "idUsuario", as: "suscripciones" });

export default Suscripcion;
