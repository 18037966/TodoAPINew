var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
    'dialect': 'sqlite',
    'storage': __dirname + '/data/dev-todo-api.sqlite'
});

var db = {};

db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.token = sequelize.import(__dirname + '/models/token.js')
db.sequelize = sequelize;//sequelize instance
db.Sequelize = Sequelize;//Sequelize library

db.todo.belongsTo(db.user);
db.user.hasMany(db.todo);
module.exports = db;
