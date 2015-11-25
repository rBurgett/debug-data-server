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

// var mailgun = require('mailgun-js')({
//     apiKey: env.mailgunKey,
//     domain: env.mailgunDomain
// });

// var reportError = function(errString) {
//     'use strict';
//     var emailData = {
//         from: 'LiteracyStarter.com <no-reply@literacystarter.com>',
//         to: env.errorEmailAddress,
//         subject: 'Error - LiteracyStarter.com',
//         html: '<p style="color:#F00;">' + errString + '</p>'
//     }
//     mailgun.messages().send(emailData, function(err) {
//         if(err) {
//             console.error(err.message);
//         }
//     });
// };

var app = express();

app.use(express.static('public'));
app.use(multipart({
    uploadDir: path.join(__dirname, 'uploads')
}));

app.post('/project-files', function(req, res) {
    'use strict';

    console.log(req.body.name);
    console.log(req.body.email);
    console.log(req.body.description);

    if(req.files.uploadFile) {
        var filePath = req.files.uploadFile.path;

        var key = new Date().getTime() + (req.body.name.replace(/\W/g, '')).toLowerCase() + path.basename(filePath);
        // var link = env.s3BucketLink + key;

        var awsUploader = s3Client.uploadFile({
            localFile: filePath,
            s3Params: {
                Bucket: env.awsBucket,
                Key: key,
                ACL: 'public-read'
            }
        });

        awsUploader.on('error', function(err) {
            console.error('unable to upload:', err.stack);
            // reportError(err.message);
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
                    // reportError(err.message);
                } else {
                    // var emailData = {
                    //     from: 'LiteracyStarter.com <no-reply@literacystarter.com>',
                    //     to: env.uploadNotifyEmailAddress,
                    //     subject: 'New Data Upload',
                    //     html: '<p><strong>Name:</strong><br>' + req.body.name + '</p><p><strong>Email:</strong><br>' + req.body.email + '</p><p><strong>Description:</strong><br>' + req.body.description + '</p><p><strong>Download Link:</strong><br><a href="' + link + '">' + link +'</a></p>'
                    // };
                    // mailgun.messages().send(emailData, function(err) {
                    //     if(err) {
                    //         console.error(err.message);
                    //         reportError(err.message);
                    //     }
                    // });
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
