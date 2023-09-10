const { json } = require('body-parser');
const bodyParser = require('body-parser');
const express = require('express');
const { stringify } = require('querystring');
const server = express();
const request = require('request')

const port = 3000;
const translationURL = 'https://api.funtranslations.com/translate/yoda.json';

// global 
let yodaResponse; // so get requests to /get-longORall-translation is depending on post request to /yoda
const yodaResponseArr = [];
const responseWithMin5WordsArr = [];

// I used this format for the curl queries (windows os) (few examples)
// curl -H "Content-type:application/json" --data "{\"text\":\"Less than 5 words\"}" -X POST http://localhost:3000/yoda
// curl -H "Content-type:application/json" --data "{\"text\":\"more than 5 words in this sentence\"}" -X POST http://localhost:3000/yoda
// curl -H "Content-type:application/json" --data "{\"text\":\"My name is Simon and I like Apples\"}" -X POST http://localhost:3000/yoda

// json middleware
server.use(bodyParser.json());

server.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
});

server.post('/yoda', (req, res) => {
    // req.body = whole json
    // req.body.text = value of "text" in json
    if (!(req.body && req.body.text)) {
        res.status(400).send('There was something wrong with this request');
        return;
    } 
    // post req to yoda api
    request.post(
        translationURL, 
        {
            json: {
                text: req.body.text
            }
        },
        (error, response, body) => {
            console.log(body);
            if (!(response.statusCode == 200)) {
                res.status(500).send('The request could not be handled.');
                return;
            }
            if (!(response.body && response.body.contents)) {
                res.status(500).send('The request could not be handled.');
                return;
            }
            // https://prnt.sc/hbNOwrivHk_A
            res.send(response.body.contents);

            yodaResponse = new StringAndTranslation(response.body.contents);
        } 
    );
});

server.get('/', (req, res) => {
    res.status(200).send('GET request on root page (test)');
});

server.get('/get-long-translation', (req, res) => {
    res.write('First complete response with at least 5 words:\n');
    res.write(typeof yodaResponse === 'undefined' ? 'No post requests to /yoda yet!' : JSON.stringify(yodaResponse.getFirstResponseWithAtLeast5Words()));
    res.end();
});

server.get('/get-all-translation', (req, res) => {
    res.write('All translations with at least 5 words:\n');
    res.write(typeof yodaResponse === 'undefined' ? 'No post requests to /yoda yet!' : JSON.stringify(yodaResponse.getAllTranslWithAtLeast5Words()));
    res.end();
});

class StringAndTranslation {
    constructor(response) {
        this.response = response;
        yodaResponseArr.push(this.response);
    }

    // https://attacomsian.com/blog/javascript-iterate-array-of-objects
    getFirstResponseWithAtLeast5Words() {
        // iterate through list and iterate to response objects in list
        yodaResponseArr.forEach(singleResponse => {
            Object.keys(singleResponse).forEach((value) => {
                if (singleResponse[value].match(/(\w+)/g).length >= 5) {
                    responseWithMin5WordsArr.push(singleResponse);
                }
            });
        });
        if (typeof responseWithMin5WordsArr === 'undefined' || responseWithMin5WordsArr.length === 0) {
            return 'No translation with at least 5 words found yet!';
        } 
        return responseWithMin5WordsArr[0];
    }

    getAllTranslWithAtLeast5Words() {
        // filters for objects that have translated strings with >= 5 words and maps only translated strings
        let allTranslWithMin5WordsArr = yodaResponseArr.
        filter((words) => {return words.translated.match(/(\w+)/g).length >= 5;}).
        map((value) => {return value.translated});

        if (typeof allTranslWithMin5WordsArr === 'undefined' || allTranslWithMin5WordsArr.length === 0) {
            return 'No translations with at least 5 words found yet!';
        } 
        return allTranslWithMin5WordsArr;
    }
}





