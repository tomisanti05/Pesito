import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../../config/database.js";

export class Billetera extends Model<
  InferAttributes<Billetera>,
  InferCreationAttributes<Billetera>
> {
  declare idBilletera: CreationOptional<number>;
  declare idUsuario: number;
  declare nombre: string;
  declare saldo: CreationOptional<string>;
  declare tipo: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Billetera.init(
  {
    idBilletera: {
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
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    saldo: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: "0.00",
    },
    tipo: { type: DataTypes.STRING(50), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: "Billetera",
    timestamps: true,
  },
);

export default Billetera;