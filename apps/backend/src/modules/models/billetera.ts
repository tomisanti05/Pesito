import { Model, Sequelize, DataTypes } from "sequelize";

export interface BilleteraAtributos{
    idBilletera?: number;
    idUsuario: number;
    nombre: string;
    saldo: string; // DECIMAL(14,2) se maneja como string 
    tipo: string;
    createdAt?: Date;
    updatedAt?: Date
}

export class Billetera
    extends Model<BilleteraAtributos>
    implements BilleteraAtributos{
        public idBilletera!: number;
        public idUsuario!: number;
        public nombre!: string;
        public saldo!: string;
        public tipo!: string;
        
        public readonly createdAt?: Date | undefined;
        public updatedAt?: Date | undefined;

        public static initModel(sequelize:Sequelize): typeof Billetera{
            Billetera.init({
                idBilletera:{
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                    field: 'id_billetera'
                },
                
                idUsuario: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    field: 'id_usuario',
                    references: {
                        model: 'users',
                        key: 'id',
                                },
                
                },
                
                nombre: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
                },
                
                saldo: {
                    type: DataTypes.DECIMAL(14, 2),
                    allowNull: false,
                    defaultValue: '0.00',
                    validate: {
                        min: 0, // Restriccion en base: no admite sobregiro ni saldo negativo
                    },
                },
                
                tipo: {
                    type: DataTypes.STRING(50),
                    allowNull: false,
                },
            },
            {
                sequelize,
                tableName: 'wallets',
                timestamps: true,
            }
        );   
        return Billetera;        
    }
}
    
export default Billetera;