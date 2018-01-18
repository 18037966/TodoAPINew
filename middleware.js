module.exports = function(db){ //beacuse we have other files
  return {
    requireAuthentication: function(req, res, next){
      var token = req.get('auth');

      db.user.findByToken(token).then(function (user){
        req.user = user;//req.user to access sequelize instance // this is going to let us access the user inside of each individual request
        next();
      }, function (){
         console.error("Proble is in middle ware");
         res.status(401).send();
      });
    }
  };
};
