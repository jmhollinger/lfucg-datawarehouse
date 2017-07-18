//Configuration
var express = require('express');
var pg = require('pg');
var bodyParser = require('body-parser');
var moment = require('moment');

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

//Report Runner
app.get('/waterreports', function(req,res) {
    
            client.query({
                    text: 'SELECT DISTINCT kawc.address, kawc.parcelid FROM kawc WHERE kawc.address ILIKE $1 ORDER BY kawc.address ASC;',
                    values: ['%' + req.query.q + '%']
                },function(err, result) {
                    done();
                    if (err) {
                        res.json({"success": false,"results": err});
                    } else {
                        res.render("reports/reportRunner", {
                            searchTerm: req.query.q
                            searchResults: result.rows
                        })
                    }
                });
})

//Address Search
app.get('/waterreports/address_search', function(req, res) {
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            
            client.query({
                    text: 'SELECT DISTINCT kawc.address, kawc.parcelid FROM kawc WHERE kawc.address ILIKE $1 ORDER BY kawc.address ASC;',
                    values: ['%' + req.query.q + '%']
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

//Water Service Parcel Report
app.get('/waterreports/parcel/:parcelid', function (req, res) {
      pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query({
                    text: 'SELECT kawc.address, kawc.unit, kawc.parcelid, kawc.kawc_premise_id, water_bills.name, water_bills.account_status, water_bills.charge_date, water_bills.billed_consump, water_bills.adjustment_date, water_bills.consump_adj,kawc.lat, kawc.lng FROM kawc INNER JOIN water_bills on kawc.kawc_premise_id = water_bills.kawc_premise_id WHERE kawc.parcelid = $1 ORDER BY kawc.kawc_premise_id, charge_date ASC',
                    values: [req.params.parcelid]
                },function(err, result) {
                    done();
                    if (err) {
                        res.json(
                          {
                            status : 'error',
                            error: err
                          })  
                    } else {

                        var formattedData = []
                        var data = result.rows

                        for (var i = data.length - 1; i >= 0; i--) {
                         
                         var row = {
                          "address": data[i].address,
                          "unit": data[i].unit,
                          "parcelid": data[i].parcelid,
                          "kawc_premise_id": data[i].kawc_premise_id,
                          "name": data[i].name,
                          "account_status": data[i].account_status,
                          "charge_date": moment(data[i].charge_date).format('M-D-YYYY'),
                          "billed_consump": data[i].billed_consump,
                          "adjustment_date": formatDate(data[i].adjustment_date,'M-D-YYYY'),
                          "consump_adj": data[i].consump_adj
                          }

                          formattedData.push(row)
                                                  }
                        }

                        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            client.query({
                    text: 'SELECT kawc.address FROM kawc WHERE kawc.parcelid = $1;',
                    values: [req.params.parcelid]
                },function(err, result) {

                if (err){
                        res.json(
                          {
                            status : 'error',
                            error: err
                          })  
                }
                
                else {        
                res.render('reports/parcel',
                          {
                              parcelid: req.params.parcelid,
                              address: result.rows[0].address,
                              data: formattedData,
                              length: data.length
                          })
              } 

                })})

                                  })
                });
    });



//Server
var server = app.listen(process.env.PORT || 3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('App listening at http://%s:%s', host, port);
});

//Helper Functions
function formatDate(input, format){
if (input) {
  return moment(input).format(format)
}
else {
  return ''
}
}