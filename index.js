//Configuration
var express = require('express');
var pg = require('pg');
var bodyParser = require('body-parser');
var helmet = require('helmet');

var app = express();

app.use(helmet())

var https_redirect = function(req, res, next) {
    if (process.env.NODE_ENV === 'production') {
        if (req.headers['x-forwarded-proto'] != 'https') {
            return res.redirect('https://' + req.headers.host + req.url);
        } else {
            return next();
        }
    } else {
        return next();
    }
};

app.use(https_redirect);

app.enable('trust proxy')

app.use(bodyParser.json({
    extended: false
}));

app.set('view engine', 'jade');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//test
app.get('/api/v1/parcel', function(req, res) {
   if (req.query.apikey === process.env.apiKey) {
    pg.connect(process.env.HEROKU_POSTGRESQL_GOLD_URL, function(err, client, done) {
            
            client.query('SELECT address, parid FROM pva_parcels WHERE address ILIKE \'%' + req.query.address + '%\';',function(err, result) {
                    done();
                    if (err) {
                        res.json({"success": false,"results": err});
                    } else {
                        res.json({"success" : true, "results" : result.rows});
                    }
                });
    });
    }

    else {
        res.sendStatus(403).json({"success" : "false", "response" : "Api key is incorrect."})
    }
})

//Server
var server = app.listen(process.env.PORT || 3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});
