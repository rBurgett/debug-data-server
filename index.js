var express = require('express');

var app = express();

var port = 3300;

var server = app.listen(port, function() {
    'use strict';
    console.log('App listening at port', server.address().port);
});
