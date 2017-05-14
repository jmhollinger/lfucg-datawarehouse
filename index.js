//Configuration
var express = require('express');
var pg = require('pg');
var bodyParser = require('body-parser');

var app = express();

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

app.use(bodyParser.json({
    extended: false
}));

app.set('view engine', 'jade');

//Police
app.get('/api/v1/police', function(req, res) {
   if (req.query.apikey === process.env.API_KEY) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            
            client.query({
                    text: 'SELECT * FROM police_cases WHERE last_updated >= $1 ORDER BY last_updated DESC;',
                    values: ['\'' + req.query.lastupdated + '\'']
                },function(err, result) {
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
        res.json({"success" : "false", "results" : "API Key is invalid."})
    }
})

//Server
var server = app.listen(process.env.PORT || 3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});
