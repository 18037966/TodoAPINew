var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js')
var bcrypt = require('bcryptjs');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;

app.use(bodyParser.json());
//a json req comes in express gonna parse and we can pase it as req.body

app.get('/', function(req, res){
  res.send('Todo API ROOT');
});

// GET REquest /todos?completed=true&q=house
app.get('/todos', middleware.requireAuthentication, function(req, res){
    var query = req.query;

    var where = {
      userId: req.user.get('id')
    };
    if(query.hasOwnProperty('completed') && query.completed === 'true'){
       where.completed = true;
    }else if(query.hasOwnProperty('completed') && query.completed === 'false'){
      where.completed = false;
    }

    if(query.hasOwnProperty('q') && query.q.length > 0){
      where.description = {
        $like: '%' + query.q + '%'
      };
    }

    db.todo.findAll({where: where}).then(function (todos){
       res.json(todos)
    }, function(e){
       res. status(500).send();
    });

});

app.get('/todos/:id', middleware.requireAuthentication, function(req, res){
     var todoId = parseInt(req.params.id, 10);

     db.todo.findOne({
       where:{
         id: todoId,
         userId: req.user.get('id')
       }
     }).then(function (todo){
         if(!!todo){//if there is a todo item
            res.json(todo.toJSON());
         }else{
           res.status(404).send();
         }
     }, function(e){
       res.status(500).send();
     });

});

//POST
app.post('/todos', middleware.requireAuthentication, function(req, res){
  var body = _.pick(req.body, 'description', 'completed');

  db.todo.create(body).then(function (todo){
    //res.json(todo.toJSON());
    req.user.addTodo(todo).then(function (){
      return todo.reload();
    }).then(function (todo){
       res.json(todo.toJSON());
    });
  }, function(e){
     res.status(400).json(e);
  });

});

app.delete('/todos/:id', middleware.requireAuthentication, function(req, res){
  var todoId = parseInt(req.params.id, 10);

  db.todo.destroy({
    where:{
      id: todoId,
      userId: req.user.get('id')
    }
  }).then(function (rowsDeleted){
    if(rowsDeleted === 0){
      res.status(404).json({
        error: "no todo with that id"
      });
    }else{
      res.status(204).send();
    }

  }, function(){
     res.status(500).send();
  });


});

app.put('/todos/:id', middleware.requireAuthentication, function(req, res){
  var todoId = parseInt(req.params.id, 10);
  //var matchedTodo = _.findWhere(todos, {id: todoId});
  var body = _.pick(req.body, 'description', 'completed');
  var attributes = {};

  //no need to validate as its being alread
  if(body.hasOwnProperty('completed')){
     attributes.completed = body.completed;
  }
  //the second else if statement is given so that we can know that sth is wrong

  if(body.hasOwnProperty('description')) {
     attributes.description = body.description;
  }

  //an instance method is executed in an existing already fetched model
  db.todo.findOne({
    where:{
      id: todoId,
      userId: req.user.get('id')
    }
  }).then(function (todo){
      if(todo){
           todo.update(attributes).then(function (todo){   //this then occurs when todo.update fires
              res.json(todo.toJSON());
           }, function (e){
               res.status(400).json(e);
           });
      }else{
        res.status(404).send();
      }
  }, function(){
    res.status(500).send();
  });
});

app.post('/users', function(req, res){
  var body = _.pick(req.body, 'email', 'password');

  db.user.create(body).then(function (user){ //it returns a promise
    res.json(user.toPublicJSON());
  }, function(e){
     res.status(400).json(e);
  });
});

app.post('/users/login', function(req, res){
  var body = _.pick(req.body, 'email', 'password');
  //var userInstance;

  db.user.authenticate(body).then(function (user){
     res.header('Auth', user.generateToken('authentication')).json(user.toPublicJSON());
  }, function (){
      res.status(401).send();
  });

});

//the below code starts the server
db.sequelize.sync({force: true}).then(function (){
    app.listen(PORT, function (){
       console.log('Express listening on port ' + PORT + '!');
    });
});
