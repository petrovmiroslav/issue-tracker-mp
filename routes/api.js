/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
const CONNECT_MONGODB = (done)=>{
MongoClient.connect(CONNECTION_STRING, function(err, db) {
  db.s.databaseName = "Advanced-Node";
  
  if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');
      done(db);
    }
     
});
};

function isEmptyObject(obj) {
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            return false;
        }
    }
    return true;
}

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
    
      if (req.query._id) { req.query_id = new ObjectId(req.query._id)}
      if (req.query.open) { req.query.open = req.query.open.toString() == "true" }
    
      CONNECT_MONGODB((db)=>{
        db.collection("issues").find(req.query).toArray((err,data)=>{
          if(err) { 
            console.log(err);
            return res.redirect('/');
          }
          return res.json(data);
        });
      });
    })
    
    .post(function (req, res){
      const project = req.params.project;
      const issue = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || "",
        status_text: req.body.status_text || "",
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };
      if(!issue.issue_title || !issue.issue_text || !issue.created_by) {
        return res.send('missing inputs');
      }
      CONNECT_MONGODB((db)=>{
        db.collection("issues").insertOne(issue, function (err, data) {
          if(err) { 
            console.log(err);
            return res.redirect('/');
          }
          return res.json(data.ops[0]);
        });
      });
      
    })
    
    .put(function (req, res){
      var project = req.params.project;
      
      if(req.body._id.length < 24) {
        return res.send("Invalid ID");
      };
      const ID =  req.body._id;
      delete req.body._id;
      
      for(let key in req.body) {
          req.body[key] === "" ? (delete req.body[key]) : (req.body[key])
        };
      if(isEmptyObject(req.body)) {
        return res.send('no updated field sent');
      };
      if(req.body.open){
        req.body.open = req.body.open.toString() == "true";      
      }
      req.body.updated_on = new Date();
      
      CONNECT_MONGODB((db)=>{
        try{
          db.collection('issues').findAndModify(
                                    {_id:new ObjectId(ID)},
                                    [['_id',1]],
                                    {$set: req.body },
                                    {new: true}
                                                   ,function (err, data) {
           if(err) { 
             console.log(err);
              return res.redirect('/');
            }
            data.value === null ? (res.send('could not update '+ID)) : (res.send("successfully updated"));
          });
        } catch (err) {
          //res.redirect('/');       
          throw err;
        }
        
      });
    })
    
    .delete(function (req, res){
      var project = req.params.project;
      
      CONNECT_MONGODB((db)=>{
        if(!req.body._id){
          return res.send("_id error");   
        };
        if(req.body._id.length < 24) {
          return res.send("Invalid ID");
        };
        db.collection('issues').findOneAndDelete(
                                                  { _id:new ObjectId(req.body._id)}
                                                  ,function (err, data) {
            if(err) { 
              console.log(err);
              return res.send('could not delete '+req.body._id);
            }
            data.value === null ? (res.send('could not delete '+req.body._id)) : (res.send('deleted '+req.body._id));                                   
        });
      });
    });
    
};
