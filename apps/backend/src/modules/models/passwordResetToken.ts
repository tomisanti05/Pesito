import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import sequelize from "../../config/database.js";

export class PasswordResetToken extends Model<
  InferAttributes<PasswordResetToken>,
  InferCreationAttributes<PasswordResetToken>
> {
  declare id: CreationOptional<number>;
  declare idUsuario: number;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare usedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
}

PasswordResetToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idUsuario",
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: "tokenHash",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expiresAt",
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "usedAt",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "PasswordResetToken",
    timestamps: true,
    updatedAt: false,
  },
);

export default PasswordResetToken;
