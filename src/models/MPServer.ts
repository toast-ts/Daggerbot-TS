import {Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes} from 'sequelize';
var db = new Sequelize('database', 'daggerbot', 'toastsus', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'src/database/MPDB.dat'
})
class MPDB extends Model<InferAttributes<MPDB>, InferCreationAttributes<MPDB>>{
    declare serverId: string | null;
    declare ip: string | null;
    declare code: string | null;
    declare timesUpdated: number | null;
}
MPDB.init({
    serverId: {
        type: DataTypes.STRING,
        unique: true
    },
    ip: {
        type: DataTypes.STRING,
        defaultValue: 'Missing IP',
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        defaultValue: 'Missing Code',
        allowNull: false
    },
    timesUpdated: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    }
}, { sequelize: db, modelName: 'urls', timestamps: false });
export default MPDB