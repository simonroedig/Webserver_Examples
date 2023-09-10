# Created with MicroPython for ESP32 by Simon Roedig
# program builts upon task 3s esp32 web server

try:
    import usocket as socket
except:
    import socket
  
import network
  
from machine import Pin
from time import sleep

# vendor OS debugging messages
import esp
esp.osdebug(None)

# garbage collector
import gc
gc.collect()

ssid = "replace"
password = "replace"

# set esp32 as wifi station
station = network.WLAN(network.STA_IF)

# activate and connect to router
station.active(True)
while True:
    try:
        station.connect(ssid, password)
    except OSError as e:
        print(e)
    sleep(1)
    if station.isconnected():
        print('Connection successful')
        print(station.ifconfig())
        break

led = Pin(2, Pin.OUT)

# when webPage() is called, check what current status of led, include this in html for response back to client
def webPage():
    clientAddrStr = str(addr[0])
    if led.value() == 1:
        gpioState = "ON"
    else:
        gpioState = "OFF"
    
    html = """
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>ESP Web Server</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                html{font-family: Helvetica; display:inline-block; margin: 0px auto; text-align: center; background-color: #191919;}
                h1{color: #ECDBBA; padding: 2vh;}
                .buttonTxt{font-size: 1.5rem; color: #ECDBBA; font-weight: bold;}
                .button{display: inline-block; color: #191919; border: none; font-weight: bold; 
                border-radius: 4px; padding: 16px 40px; text-decoration: none; font-size: 30px; margin: 2px; cursor: pointer;}
                #button1 {background-color: #BCE29E;}
                #button2{background-color: #FF8787;}
                #button3{background-color: #9AD0EC;}
                .analyticsTxt{color: white;}
                
            </style>
        </head>
        <body>
            <h1>Simon's ESP32 Web Server</h1>
            <p class="buttonTxt">GPIO state: """ + gpioState + """</p>
            <p class="buttonTxt"><a href="/led=on"><button class="button" id="button1">ON</button></a></p>
            <p class="buttonTxt"><a href="/led=off"><button class="button" id="button2">OFF</button></a></p>
            <p class="buttonTxt">------</p>
            <p class="buttonTxt"><a href="/analytics"><button class="button" id="button3">SHOW ANALYTICS</button></a></p>

            <div id="analyticsID">
                <p class="analyticsTxt">Client IP: """ + clientAddrStr + """</p>
                <p class="analyticsTxt">Request: <br> """ + request + """</p>  
            </div>

            <script>
                var analyticsDiv = document.querySelector('#analyticsID');
                if (window.location.pathname === '/analytics') {
                    analyticsDiv.style.display = "block";
                } else {
                    analyticsDiv.style.display = "none";
                }		
                
                // https://stackoverflow.com/questions/8180296/what-information-can-we-access-from-the-client
                var clientInfo = {
                    timeOpened : new Date(),
                    timeZone : (new Date()).getTimezoneOffset()/60,

                    pageon : window.location.pathname,
                    referrer : document.referrer,
                    previousSites : history.length,

                    browserName : navigator.appName,
                    browserEngine : navigator.product,
                    browserVersion1a : navigator.appVersion,
                    browserVersion1b : navigator.userAgent,
                    browserLanguage : navigator.language,
                    browserOnline : navigator.onLine,
                    browserPlatform : navigator.platform,
                    javaEnabled : navigator.javaEnabled(),
                    dataCookiesEnabled : navigator.cookieEnabled,
                    dataCookies1 : document.cookie,
                    dataCookies2 : decodeURIComponent(document.cookie.split(";")),
                    dataStorage : localStorage,

                    sizeScreenW : screen.width,
                    sizeScreenH : screen.height,
                    sizeDocW : document.width,
                    sizeDocH : document.height,
                    sizeInW : innerWidth,
                    sizeInH : innerHeight,
                    sizeAvailW : screen.availWidth,
                    sizeAvailH : screen.availHeight,
                    scrColorDepth : screen.colorDepth,
                    scrPixelDepth : screen.pixelDepth,

                    hardwareMemory : navigator.deviceMemory,
                    connection : navigator.connection,
                    logicalCpuCores : navigator.hardwareConcurrency
                };

                var clientInfoAsStr = JSON.stringify(clientInfo);
                var clientInfoAsFormatedStr = clientInfoAsStr.replace(/"/g, '').replace(/{|}/g, '').replace(/:/g, ': ').replace(/,/g, '<br>');
                
                var pTagAnalytics = document.createElement("p");
                pTagAnalytics.className = "analyticsTxt";

                pTagAnalytics.innerHTML = clientInfoAsFormatedStr;

                analyticsDiv.append(pTagAnalytics);

            </script>
        </body>
    </html>
    """    
    return html

# stream tcp socket, param: address family, socket type
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

# para: empty string refers to the localhost IP (of esp32)
s.bind(('', 80))

# para: maximum number of queued connections
s.listen(5)

# while-loop: listen for requests and send responses
while True:
    conn, addr = s.accept()
    print("Got a connection from %s (Client)" % str(addr))
    
    # data is exchanged between the client and server using the send() and recv()
    # para: maximum data that can be received at once
    request = conn.recv(1024)
    request = str(request)
    
    print("Received content from client = %s" % request)
    
    ledOn = request.find("/led=on")
    ledOff = request.find("/led=off")
    analytics = request.find("analytics")
    if ledOn == 6:
        print('LED ON')
        led.value(1)
    if ledOff == 6:
        print('LED OFF')
        led.value(0)
    if analytics == 6:
        print("ANALYTICS")   
        
    # send response to client
    response = webPage()
    conn.send('HTTP/1.1 200 OK\n')
    conn.send('Content-Type: text/html\n')
    conn.send('Connection: close\n\n')
    conn.sendall(response)
    conn.close()

