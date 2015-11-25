var express = require('express'),
    multipart = require('connect-multiparty'),
    s3 = require('s3'),
    fs = require('fs'),
    path = require('path');

var env;

try {
    env = fs.readFileSync('./.env', 'utf8');
    env = JSON.parse(env);
} catch(e) {
    console.log(e.message);
}

var s3Client = s3.createClient({
    multipartUploadThreshold: 20971520,
    multipartUploadSize: 15728640,
    s3Options: {
        accessKeyId: env.awsAccessKeyId,
        secretAccessKey: env.awsSecretAccessKey
    }
});

var app = express();

app.use(express.static('public'));
app.use(multipart({
    uploadDir: path.join(__dirname, 'uploads')
}));

app.post('/project-files', function(req, res) {
    'use strict';
    if(req.files.appDataZip) {
        var filePath = req.files.appDataZip.path;
        console.log(filePath);

        var awsUploader = s3Client.uploadFile({
            localFile: filePath,
            s3Params: {
                Bucket: env.awsBucket,
                Key: path.basename(filePath),
                ACL: 'public-read'
            }
        });

        awsUploader.on('error', function(err) {
            console.error('unable to upload:', err.stack);
        });

        awsUploader.on('progress', function() {
            // console.log('progress', awsUploader.progressMd5Amount,
            // awsUploader.progressAmount, awsUploader.progressTotal);
            console.log(((awsUploader.progressAmount / awsUploader.progressTotal) * 100).toFixed(4) + '%');
        });

        awsUploader.on('end', function() {
            fs.unlink(filePath, function(err) {
                if(err) {
                    console.error(err.message);
                }
            });
            console.log('done uploading');
        });

    }
    res.send('ok').end();
});

var port = 3300;

var server = app.listen(port, function() {
    'use strict';
    console.log('App listening at port', server.address().port);
});
