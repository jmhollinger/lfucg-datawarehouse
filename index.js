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

app.use(express.static('public'));

app.use(bodyParser.json({
    extended: false
}));

app.set('view engine', 'pug');

app.get('/docs', function(req,res) {
	res.render("docs")
})

//VPRC Cases
app.get('/api/v1/vprc', function(req, res) {
   
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            
            client.query({
                    text: 'SELECT * FROM vprc_cases;',
                    values: []
                },function(err, result) {
                    done();
                    if (err) {
                        res.json({"success": false,"results": err});
                    } else {
                        res.json({"success" : true, "results" : result.rows});
                    }
                });
    });

})

//Police Cases by Date
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

//Water Service by Parcel
app.get('/api/v1/waterservice', function(req, res) {
   if (req.query.apikey === process.env.API_KEY) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            
            client.query({
                    text: 'SELECT kawc.address, kawc.unit, kawc.parcelid, kawc.kawc_premise_id, water_bills.name, water_bills.account_status, water_bills.charge_date, water_bills.billed_consump, water_bills.adjustment_date, water_bills.consump_adj,kawc.lat, kawc.lng FROM kawc INNER JOIN water_bills on kawc.kawc_premise_id = water_bills.kawc_premise_id WHERE charge_date >= $1 OR adjustment_date >= $1 ORDER BY kawc.kawc_premise_id, charge_date DESC',
                    values: [req.query.date]
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


//Water Service by Parcel
app.get('/api/v1/waterservice/parcel', function(req, res) {
   if (req.query.apikey === process.env.API_KEY) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            
            client.query({
                    text: 'SELECT kawc.address, kawc.unit, kawc.parcelid, kawc.kawc_premise_id, water_bills.name, water_bills.account_status, water_bills.charge_date, water_bills.billed_consump, water_bills.adjustment_date, water_bills.consump_adj,kawc.lat, kawc.lng FROM kawc INNER JOIN water_bills on kawc.kawc_premise_id = water_bills.kawc_premise_id WHERE kawc.parcelid = $1 ORDER BY kawc.kawc_premise_id, charge_date DESC',
                    values: [req.query.id]
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
