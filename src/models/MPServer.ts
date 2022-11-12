import {Sequelize, DataTypes} from 'sequelize';
var db = new Sequelize('database', 'daggerbot', 'toastsus', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: '../database/MPDB.dat'
})
var ServerDB = db.define('urls', {
    serverId: {
        type: DataTypes.STRING,
        defaultValue: 'Missing ID',
        allowNull: false,
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
    }
}, {timestamps: false})
export default ServerDB;