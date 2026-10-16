import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../../config/database.js';
import { Wallet } from './wallet.js';

export interface TransactionAttributes {
  idTransaccion: number;
  idBilletera: number;
  monto: string;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  fecha: string;
  descripcion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TransactionCreationAttributes = Optional<
  TransactionAttributes,
  'idTransaccion' | 'createdAt' | 'updatedAt'
>;

export class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  public idTransaccion!: number;
  public idBilletera!: number;
  public monto!: string;
  public tipo!: 'ingreso' | 'egreso';
  public categoria!: string;
  public fecha!: string;
  public descripcion?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Transaction.init(
  {
    idTransaccion: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    idBilletera: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Billeteras', key: 'idBilletera' },
    },
    monto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('ingreso', 'egreso'),
      allowNull: false,
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'Transacciones',
    timestamps: true,
  }
);

Transaction.belongsTo(Wallet, { foreignKey: 'idBilletera', as: 'billetera' });
Wallet.hasMany(Transaction, { foreignKey: 'idBilletera', as: 'transacciones' });