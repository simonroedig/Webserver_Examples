/*
Created with NODEJS Version 18.12.0 LTS
by Simon Rödig
*/

// ES6 Modules
import express from 'express';
import * as fs from 'fs'; // File System Module
import browser from 'browser-detect';
import geoip from 'geoip-lite';

var rootPageRequestCounter = 0;

function main(portArg) {
    if (portArg === undefined) {
        console.log('\x1b[31m%s\x1b[0m', 'Pass a port number (e.g. 3000) to start server: \
        \n\n~$ npm start <portnumber> \
        \nOR \
        \n~$ node webAnalyticsService.js <portnumber> \
        \nOR \
        \n~$ npm test //starts server with port 3000\n'
        );
    } else {
        startServer(portArg);
    }
}

function startServer(portArg) {
    const SERVER = express();

    SERVER.listen(portArg, () => {
        console.log('\x1b[32m%s\x1b[0m', `Server listening on port ${portArg}...`);
    });

    // get request to "/" replies with current time and date
    SERVER.get('/', (request, response) => {
        rootPage(request, response);
    });

    // get request to "/s" provides clients IP (HTML)
    SERVER.get('/s', (request, response) => {
        sPage(request, response);
    });

    // get request to "/whoami" provides infos server can get from user
    SERVER.get('/whoami', (request, response) => {
        whoAmIPage(request, response);
    });

    // get request to "/adapt2user" provides different replies based on who is requesting
    SERVER.get('/adapt2user', (request, response) => {
        adapt2UserPage(request, response);
    });
}

function rootPage(request, response) {
    console.log('\x1b[33m%s\x1b[0m', `"/" (root) requested`);

    response.write(`Date: ${getTimeAndDate().date}-${getTimeAndDate().month}-${getTimeAndDate().year}\n`);
    response.write(`Time: ${getTimeAndDate().hours}:${getTimeAndDate().minutes}:${getTimeAndDate().seconds}\n`);
    response.write(`Calls to root page: ${storeAndGetRootPageRequests().toString()}`);
    response.end();
}

function sPage(request, response) {
    console.log('\x1b[33m%s\x1b[0m', `"/s" requested`);

    var currentClientIP = request.socket.remoteAddress;
    response.write(`<html><head><title>"/s" page</title></head><body><h1>Client IP is ${currentClientIP}</h1></body></html>`);
    response.end();
}

function whoAmIPage(request, response) {
    console.log('\x1b[33m%s\x1b[0m', `"/whoami" requested`);

    response.write('Browser Information:\n');
    response.write(getBrowserInfo(request, response));
    response.write('\n\n');

    response.write('Geo Information:\n');
    response.write(getGeoInfo(request, response));
    response.write('\n\n');

    response.write('Accept-Language Information:\n');
    response.write(getLanguageInfo(request, response));
    response.write('\n\n');

    response.write('Header:\n');
    response.write(JSON.stringify(request.headers).replace(/"/g, '').replace(/{|}/g, '').replace(/:/g, ': ').replace(/,/g, '\n'));
    response.write('\n\n');

    response.end();
}

function adapt2UserPage(request, response) {
    console.log('\x1b[33m%s\x1b[0m', `"/adapt2user" requested`);

    response.write(diffPagesForDiffBrowsers(request, response) + '\n');
    response.write(diffPagesForDiffOS(request, response) + '\n');
    response.write(diffPagesForMobileAccess(request, response) + '\n');
    response.write(diffPagesForDiffLanguage(request, response) + '\n');
    response.end();
}

function diffPagesForMobileAccess(request, response) {
    var mobileBool = browser(request.headers['user-agent']).mobile;
    if (mobileBool) {
        return 'I see you are accessing via mobile - Amazing what I know';
    }
    return 'I see you are NOT accessing via mobile - Amazing what I know';
}

function diffPagesForDiffBrowsers(request, response) {
    var browserName = browser(request.headers['user-agent']).name;
    var attachedStr;

    if (browserName.includes('chrome')) {
        attachedStr = 'Dear chrome, may you stop using all the RAM';
    } else if (browserName.includes('firefox')) {
        attachedStr = 'But what does the fox say? O.o';
    } else if (browserName.includes('ie')) {
        attachedStr = 'The most used internet browser \
        to downlad other internet browser :o';
    } else if (browserName.includes('safari')) {
        attachedStr = 'Great.. How does superiority feel?..';
    } else {
        attachedStr = 'Cool :)';
    }
    return `I see you are using ${browserName} - ${attachedStr}`;
}

function diffPagesForDiffOS(request, response) {
    var os = browser(request.headers['user-agent']).os;
    var attachedStr;

    if (os.includes('Windows')) {
        attachedStr = 'Fine choice, now open some real windows, it\'s sticky';
    } else if (os.includes('Linux')) {
        attachedStr = 'Well well well';
    } else if (os.includes('Mac')) {
        attachedStr = 'Ka-ching $';
    } else {
        attachedStr = 'Cool :)';
    }
    return `I see you are on ${os} - ${attachedStr}`;
}

function diffPagesForDiffLanguage(request, response) {
    var languageStr = getLanguageInfo(request, response);
    var attachedStr;

    if (languageStr.includes('de')) {
        attachedStr = 'german - Guten Tag';
    } else if (languageStr.includes('en')) {
        attachedStr = 'english - Hello';
    } else if (languageStr.includes('ru')) {
        attachedStr = 'russian - привет';
    } else if (languageStr.includes('fr')) {
        attachedStr = 'frensh - Bonjour';
    } else if (languageStr.includes('fr')) {
        attachedStr = 'spanish - Hola';
    }  else {
        attachedStr = languageStr;
    }
    return `I see you probably speak ${attachedStr}`;
}

function getGeoInfo(request, response) {
    // https://www.npmjs.com/package/geoip-lite
    var ip = request.socket.remoteAddress;
    //ip = "207.97.227.239"; // test with this ip
    var geo = geoip.lookup(ip);
    var errorStr = 'Couldn\'t find further geo information via this IP';

    var geoObj = { 
        ip : geoip.pretty(ip),
        country : (geo ? geo.country : errorStr),
        region : (geo ? geo.region : errorStr),
        memberOfEU : (geo ? (geo.member !== 0 ? 'false' : 'true') : errorStr),
        timezone : (geo ? geo.timezone : errorStr),
        city : (geo ? geo.city : errorStr),
        latitude : (geo ? geo.ll[0] : errorStr),
        longitude : (geo ? geo.ll[1] : errorStr),
        metroCode : (geo ? geo.metro : errorStr),
        accuracyRadius : (geo ? geo.area : errorStr)    
    };
    return JSON.stringify(geoObj).replace(/"/g, '').replace(/{|}/g, '').replace(/:/g, ': ').replace(/,/g, '\n');
}

function getBrowserInfo(request, response) {
    var browserInfoObj = browser(request.headers['user-agent']);
    return JSON.stringify(browserInfoObj).replace(/"/g, '').replace(/{|}/g, '').replace(/:/g, ': ').replace(/,/g, '\n');
}

function getLanguageInfo(request, response) {
    var browserInfoObj = request.headers['accept-language'];
    return JSON.stringify(browserInfoObj).replace(/"/g, '').replace(/{|}/g, '').replace(/:/g, ': ').replace(/,/g, '\n');
}

function getTimeAndDate() {
    var dateAndTime = new Date();
    var dateAndTimeObj = {
        date : ("0" + dateAndTime.getDate()).slice(-2),
        month : ("0" + (dateAndTime.getMonth() + 1)).slice(-2),
        year : dateAndTime.getFullYear(),
        hours : ('0' + dateAndTime.getHours()).slice(-2),
        minutes : dateAndTime.getMinutes(),
        seconds : dateAndTime.getSeconds()
    };
    return dateAndTimeObj;
}

function storeAndGetRootPageRequests() {
    var storingData = {
        rootPageReq : rootPageRequestCounter
    };
    var triedToReadBeforeFileCreation = 'ENOENT';

    // https://www.youtube.com/watch?v=HrjC6RwEpt0
    // synchronous reading
    try {
        storingData.rootPageReq = JSON.parse(fs.readFileSync('./config.json', 'utf-8')).rootPageReq;
    } catch (error) {
        if (error.code == triedToReadBeforeFileCreation) {
            console.log('\x1b[36m%s\x1b[0m','No config.json file to read, creating new one');
        }
    }
    storingData.rootPageReq++;

    // synchronous writing
    fs.writeFile('./config.json', JSON.stringify(storingData, null, 2), (error) => {
        if (error) {
            console.log('Error writing config file');
            console.log(error.message);
            return;
        }
    });

    return storingData.rootPageReq;
}

main(process.argv[2]);

