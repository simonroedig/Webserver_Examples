# Created with MicroPython for ESP32 by Simon Roedig
# control esp32' led with web interface
# esp32 configured as station

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
    if led.value() == 1:
        gpioState = "ON"
    else:
        gpioState = "OFF"
    
    html = """<!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <title>ESP Web Server</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        html{font-family: Helvetica; display:inline-block; margin: 0px auto; text-align: center; background-color: #191919;}
                        h1{color: #ECDBBA; padding: 2vh;}
                        p{font-size: 1.5rem; color: #ECDBBA; font-weight: bold;}
                        .button{display: inline-block; color: #191919; border: none; font-weight: bold; 
                        border-radius: 4px; padding: 16px 40px; text-decoration: none; font-size: 30px; margin: 2px; cursor: pointer;}
                        #button1 {background-color: #BCE29E;}
                        #button2{background-color: #FF8787;}
                    </style>
                </head>
                <body>
                    <h1>Simon's ESP32 Web Server</h1>
                    <p>GPIO state: """ + gpioState + """</p>
                    <p><a href="/led=on"><button class="button" id="button1">ON</button></a></p>
                    <p><a href="/led=off"><button class="button" id="button2">OFF</button></a></p>
                </body>
            </html>"""
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
    
    """
    Webpage has <a> tags with href=/led=on and href=/led=off connected to button ON and OFF.
    When client clicks on button ON or OFF he sends get request with
    request-url: .../led=on or .../led=off (to switch to does sites and turn led on/off)
    Server checks request for /led=on or /led=off to find what he requested and updates led
    with this information
    6 because /led=on or /led=off starts at 6th index in get request
    """
    ledOn = request.find("/led=on")
    ledOff = request.find("/led=off")
    if ledOn == 6:
        print('LED ON')
        led.value(1)
    if ledOff == 6:
        print('LED OFF')
        led.value(0)
    
    # send response to client
    response = webPage()
    conn.send('HTTP/1.1 200 OK\n')
    conn.send('Content-Type: text/html\n')
    conn.send('Connection: close\n\n')
    conn.sendall(response)
    conn.close()

