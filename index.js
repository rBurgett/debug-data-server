var express = require('express'),
    multipart = require('connect-multiparty'),
    path = require('path');

var app = express();

app.use(express.static('public'));
app.use(multipart({
    uploadDir: path.join(__dirname, 'uploads')
}));

app.post('/project-files', function(req, res) {
    'use strict';
    console.log(req.files.appDataZip);
    res.send('ok').end();
});

var port = 3300;

var server = app.listen(port, function() {
    'use strict';
    console.log('App listening at port', server.address().port);
});
