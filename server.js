const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const db   = require('./config/db');

// Set up the express app
const app = express();

// Log requests to the console.
app.use(logger('dev'));

// Parse incoming requests data (https://github.com/expressjs/body-parser)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const sequelize = new Sequelize(process.env.DATABASE || db.database, process.env.USERNAME || db.username, process.env.PASSWORD || db.password, {
  host: process.env.HOSTURL || db.url,
  dialect: 'postgres',
  ssl: true,
  dialectOptions: {
            ssl: true
        },

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  // SQLite only
  storage: 'path/to/database.sqlite'
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');

  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('client/build'));
  }



// Setup a default catch-all route that sends back a welcome message in JSON format.
app.get('/api/bcycle', function(req, res){
  console.log("params: ",req.query);
  var bounds = req.query.bounds;
  var startDate = req.query.startDate;
  var endDate = req.query.endDate;
  /*
  var query = "SELECT count(latitude) OVER() as full_count, latitude, longitude, \"rental dat\" FROM bikeshare WHERE ST_Contains(ST_MakeEnvelope("
    +bounds[0]+", "+bounds[1]+","+bounds[2]+", "+bounds[3]+", 4326), geom)"
    +" AND to_date(\"rental dat\",'MM/DD/YYYY') >= '"+startDate+"'"
    +" AND to_date(\"rental dat\",'MM/DD/YYYY') <= '"+endDate+"'"
    +" ORDER BY random() LIMIT 10000;"
  */
  var query = "SELECT count(latitude) OVER() as full_count, latitude, longitude, \"rental dat\" FROM bikeshare WHERE ST_Contains(ST_MakeEnvelope("
    +bounds[0]+", "+bounds[1]+","+bounds[2]+", "+bounds[3]+", 4326), geom)"
    +" AND to_date(\"rental dat\",'MM/DD/YYYY') >= '"+startDate+"'"
    +" AND to_date(\"rental dat\",'MM/DD/YYYY') <= '"+endDate+"'"
    +" ORDER BY random(), full_count ASC LIMIT 10000;"
  sequelize.query(query).then(bcycleData => {
    res.status(200).send({
      data: bcycleData,
    })
  })

});

app.get('/api/bikefacilities', function(req, res){

  sequelize.query("SELECT loc1_faca, distance, city, state FROM KCBikeFacilities ").then(bikefacilities => {
    res.status(200).send({
      data: bikefacilities,
    })
  })

});

app.post('/api/addLines', function(req, res){
  console.log(req.body.features);
  var featureLayers = req.body.features;
  featureLayers.map(function(featureLayer, count){
    var featureCollection = JSON.parse(featureLayer);
    featureCollection.features.map(function(feature){
      console.log(feature);
    })
  })
  /*
  var query = "INSERT INTO northKC(geom, line_comment) VALUES "
  features.features.forEach(function(item){
    console.log(item);
    if(item.properties != null){
      query = query + "(ST_Transform(ST_GeomFromGeoJSON('"+JSON.stringify(item.geometry).slice(0,-1)+",\"crs\":{\"type\":\"name\",\"properties\":{\"name\":\"EPSG:3857\"}}}'), 4326),'"+item.properties.comment+"'), ";
    }
    else{
      query = query + "(ST_Transform(ST_GeomFromGeoJSON('"+JSON.stringify(item.geometry).slice(0,-1)+",\"crs\":{\"type\":\"name\",\"properties\":{\"name\":\"EPSG:3857\"}}}'), 4326),' '), ";

    }
  });
  query = query.slice(0,-2);
  query = query +";"
  console.log(query);
  sequelize.query(query).then(results => {
    res.status(200).send({
      message: results,
    })
  })
  */
});

app.get('/api/results', function(req, res){
  console.log('get lines');
  sequelize.query("SELECT * FROM northkc ").then(results => {
    res.status(200).send({
      data: results,
    })
  })
});


if (process.env.NODE_ENV === 'production') {
  app.route('/*')
    .get(function(req, res){
      res.sendFile(__dirname+'/client/build/index.html');
    });
};


// This will be our application entry. We'll setup our server here.
const http = require('http');

const port = parseInt(process.env.PORT, 10) || 8000;
app.set('port', port);

const server = http.createServer(app);
server.listen(port);


module.exports = app;
