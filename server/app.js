const express = require('express');
const wkhtmltopdf = require('wkhtmltopdf');
const fs = require('fs');
const app = express();
const merge = require('easy-pdf-merge')
const bodyParser = require("body-parser");
const DATABASE = require('./database.js').elementsAll;
const GENERATE_ALL_LIMIT = 7;

var myConfiguration = {};
var pdfFiles = [];
var generatePercentage = 0;

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/getPageHtmlForPdf/:resourceId', (req, res) => {
    var resourceId = req.params.resourceId;
    res.send(generatePageHtmlForPdf(resourceId, myConfiguration));
});

app.get('/getPercentage', (req, res) => {
    res.send({
        percentage: generatePercentage
    });
});

app.post('/generatePagePdf', (req, res) => {
    var resourceId = req.body.resourceId;
    myConfiguration = req.body;
    var fileName = 'file_' + resourceId + '_out.pdf';
    wkhtmltopdf('http://localhost:8000/getPageHtmlForPdf/' + resourceId, {
        output: 'public/temp/' + fileName
    }, function(err, stream) {
        res.send({
            fileName: 'temp/' + fileName
        });
    });
});

app.post('/generateAll', (req, res) => {
    generatePercentage = 0;
    myConfiguration = req.body;
    pdfFiles = [];
    new Promise(function(resolve, reject) {
        generateAll(0, GENERATE_ALL_LIMIT, resolve);
    }).then(function() {
        var resultFileName = 'result.pdf';
        merge(pdfFiles, 'public/' + resultFileName, function(err) {
            if (err) {
                console.log(err);
            } else {
                res.send({
                    fileName: resultFileName
                });
            }
        });
    });
});

function generateAll(id, max, resolve) {
    if (id > max) {
        resolve();
    } else {
        var fileName = 'file_' + id + '_out.pdf';
        wkhtmltopdf('http://localhost:8000/getPageHtmlForPdf/' + id, {
            output: 'public/pdfs/' + fileName
        }, function(err, stream) {
            generatePercentage = id / max;
            pdfFiles.push('public/pdfs/' + fileName);
            return generateAll(id + 1, max, resolve);
        });
    }
};

function generatePageHtmlForPdf(resourceId, myConfiguration) {
    var resourceItems = readResourceItems(resourceId, myConfiguration);
    var fileContent = fs.readFileSync('public/page_template/test.html', 'utf8');
    fileContent = fileContent.replaceAll('${{PAGE_CSS}}', resourceItems.resourceCss);
    fileContent = fileContent.replaceAll('${{PAGE_IMAGE_BASE64}}', resourceItems.imageBase64);
    fileContent = fileContent.replaceAll('${{PAGE_CONTENT}}', resourceItems.pageContent);
    fileContent = replaceByMap(resourceItems.profile, fileContent);
    return fileContent;
}

function readResourceItems(resourceId, myConfiguration) {
    var element = DATABASE[resourceId];
    var baseCss = "@font-face{font-family:Chalkduster;src:url(/fonts/Chalkduster.woff) format('woff');font-weight:400;font-style:normal}html{height:100%;font-family:Chalkduster,sans-serif;-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%}body{margin:0}img{max-width:100%;vertical-align:middle}.box{position:relative;width:1240px}.text-block{position:absolute;left:0;top:0}";
    var fileName = 'public/' + element.imageSource;
    var resourceCss = element.pageCss;
    var pageContent = element.pageContent;
    return {
        profile: myConfiguration,
        imageBase64: base64_encode(fileName),
        resourceCss: baseCss + resourceCss,
        pageContent: pageContent
    }
}

function base64_encode(fileName) {
    var bitmap = fs.readFileSync(fileName);
    return new Buffer(bitmap).toString('base64');
}

function replaceByMap(replacement, source) {
    for (var key in replacement) {
        source = source.replaceAll("${{" + key + "}}", replacement[key]);
    }
    return source;
}

app.listen(8000, () => {
    console.log('Server Started!');
});
