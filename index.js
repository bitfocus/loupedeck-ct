const WebSocketClient = require('websocket').client;
const events = require('events');
const event = new events();

let client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});


let serial = 'unknown';

/* lol, but works. */
/*const fs = require("fs");
let bu = fs.readFileSync("./dump.txt").toString().trim();
let spl = bu.split(",")
let newArr = spl.map( str => parseInt(str, 16) );
let buffi = Buffer.from(newArr);*/

const fs = require('fs');
let buffi1 = new Buffer(fs.readFileSync('hex/før.txt').toString(), 'hex');
let buffistart = new Buffer('ff102600570000000000f000f0', 'hex');
let buffi2 = Buffer.alloc(115200); buffistart.copy(buffi2, 0, 0, 14);
let buffi3 = new Buffer(fs.readFileSync('hex/etter.txt').toString(), 'hex');

for (let i = 14; i < buffi2.length; i += 2) {
	buffi2[i] = 0x00;
	buffi2[i+1] = 0x00;
}

function rgb2col(r,g,b) {
	return ((g >> 5) & 0b111) |
		   (((r >> 3) & 0b11111) << 3) |
		   (((b >> 3) & 0b11111) << 8);
}

let width = 480/2;
let start = 57600;

function putpix(x, y, color) {
	let pos = x + (y * width);
	buffi2.writeUInt16BE(color, 14 + (pos * 2));
	console.log({pos,x,y,width});
}

let line = 0;
while (line < width) {
	putpix(Math.floor(width/2), line, rgb2col(255,255,255));
	line++;
}

for (let i = 14 + start; i < 14 + start + (width * 2); i += 2) {
	//buffi2.writeUInt8(0b00000000, i);
	//buffi2.writeUInt8(0b00000111, i + 1);
	buffi2.writeUInt16BE(rgb2col(255,255,255), i);
//	buffi2.writeUInt16BE((((b >> 4) & 0x1f) << 11) | (((g >> 3) & 0x1f) << 8) | ((r >> 2) & 0x3f), i);
}

/* end of lol */

function deviceEvent(payload) {
	console.log("deviceEvent()", payload);
}

function loupedeckMessageParse(connection, message) {

	let command = message.readUInt8(0);
	let subchar = message.readUInt8(1);

	// Encoder events
	if (command === 0x05 && subchar == 0x01) { 
		const id = message.readUInt8(3);
		const dirByte = message.readUInt8(4);
		let direction;
		if (dirByte == 0xFF) direction = 'left'
		else if (dirByte == 0x01) direction = 'right'
		else throw "Got invalid encoder direction"

		if (direction !== undefined) {
			deviceEvent({
				action: 'encoder_step',
				id: id,
				direction: direction
			});
		}
	}

	// Buttons events
	else if (command === 0x05 && subchar == 0x00) { 
		const id = message.readUInt8(3);
		const dirByte = message.readUInt8(4);
		let direction;
		if (dirByte == 0x00) direction = 'down'
		else if (dirByte == 0x01) direction = 'up'
		else throw "Got invalid button direction"
                     
		if (direction !== undefined) {
			deviceEvent({
				action: 'button_press',
				id: id,
				direction: direction
			});
		}
	}

	else if (command === 0x03) { // 03 03 XX - siste er en roterende  teller eller response id
		console.log("confirmation message", message);
	}

	// Touch
	else if (command === 0x09) { 

		// Big wheel touch
		if (subchar == 0x52 || subchar == 0x72) {
			let direction = subchar == 0x52 ? 'press' : 'release';
			let x = parseInt(message.readUInt8(5), 10) / 255;
			let y = parseInt(message.readUInt8(7), 10) / 255;
			deviceEvent({
				action: 'wheel_touch',
				eventId: 0,
				x, y, direction
			});
		}

		if (subchar == 0x4D || subchar == 0x6D) {
			let direction = subchar == 0x4D ? 'press' : 'release';
			let x = parseInt(message.readUInt16BE(4), 10)
			let y = parseInt(message.readUInt16BE(6), 10)
			deviceEvent({
				action: 'screen_touch',
				eventId: parseInt(message.readUInt8(8), 10),
				x, y, direction
			});
		}

		else console.log("touch action", message)
	}

	else if (command === 0x1F) { // serial
		serial = message.toString().trim();
		console.log("got serial:",serial)
	}
	else {
		console.log("got unknown stuff:", message);
	}


}

client.on('connect', function(connection) {

	console.log('Connected');

	connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });

	connection.on('close', function() {
        console.log('Connection Closed');
    });

	connection.on('message', function(message) {
		if (message.type === 'binary') {
			loupedeckMessageParse(connection, message.binaryData);
		} else {
			console.error("Got a non binary packet from loupedeck?");
		}
	});
    
	if (connection.connected) {
		let buf = Buffer.from("\x13\x0e\x01");
		connection.send(buf);

		setTimeout( () => {
			console.log("sending buffi, ", { size1: buffi1.length, size2: buffi2.length, size3: buffi3.length });
			connection.send(buffi2);
			connection.send(buffi3);
		}, 500);

		buf = Buffer.from("\x03\x03\x06"); // get serial
		connection.send(buf);


	}


});
 
client.connect('ws://100.127.37.1:80/');
