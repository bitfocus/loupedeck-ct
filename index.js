const WebSocketClient = require('websocket').client;
const events = require('events');
const event = new events();

let client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

// Pakke 1294 = start
// går inn i setup = 1311
// Etter endra knapp 1942

let serial = 'unknown';

/* lol, but works. */
/*const fs = require("fs");
let bu = fs.readFileSync("./dump.txt").toString().trim();
let spl = bu.split(",")
let newArr = spl.map( str => parseInt(str, 16) );
let buffi = Buffer.from(newArr);*/

const fs = require('fs');

// Sirkel
// ff102600570000000000f000f0 - 050f270057
//

let buffistart = new Buffer('ff102700570000000000f000f0', 'hex');
let buffi2 = Buffer.alloc(115200); buffistart.copy(buffi2, 0, 0, buffistart.length);
let buffi3 = new Buffer('050f270057', 'hex');

for (let i = 14; i < buffi2.length; i += 2) {
	buffi2.writeUInt16BE(rgb2col(0,0,0), i);
}

function rgb2col(r,g,b) {
	return ((g >> 5) & 0b111) |
		   (((r >> 3) & 0b11111) << 3) |
		   (((b >> 3) & 0b11111) << 8);
}

let width = 480/2;

function putpix(x, y, color) {
	let pos = x + (y * width);
	buffi2.writeUInt16BE(color, 14 + (pos * 2));
}

let line = 0;
while (line < width) {
	putpix(Math.floor(width/2), line, rgb2col(255,255,255));
	line++;
}

let buf2 = Buffer.from(fs.readFileSync('sirkel.hex').toString(),'hex');
buf2.copy(buffi2, 14, 0, buf2.length);
/*
let start = 57600;
for (let i = 14 + start; i < 14 + start + (width * 2); i += 2) {
	//buffi2.writeUInt8(0b00000000, i);
	//buffi2.writeUInt8(0b00000111, i + 1);
	buffi2.writeUInt16BE(rgb2col(0,0,255), i);
//	buffi2.writeUInt16BE((((b >> 4) & 0x1f) << 11) | (((g >> 3) & 0x1f) << 8) | ((r >> 2) & 0x3f), i);
}
*/
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
		connection.send(Buffer.from("130e013da81c9ba72a8c87d4f6a135a289066c", "hex"));
		connection.send(Buffer.from("131c0261f1392a8e936ba66e992daedb40f65f", "hex"));
		connection.send(Buffer.from("030703", "hex"));
		connection.send(Buffer.from("030d04", "hex"));
		connection.send(Buffer.from("030405", "hex"));
		connection.send(Buffer.from("030306", "hex"));
		connection.send(Buffer.from("041a0700", "hex"));
		connection.send(Buffer.from("041a0801", "hex"));
		connection.send(Buffer.from("041a0902", "hex"));
		connection.send(Buffer.from("041e0a00", "hex"));
		connection.send(Buffer.from("04090b03", "hex"));
		connection.send(Buffer.from("07020c07000000", "hex"));
		connection.send(Buffer.from("07020d08000000", "hex"));
		connection.send(Buffer.from("07020e09000000", "hex"));
		connection.send(Buffer.from("07020f0a000000", "hex"));
		connection.send(Buffer.from("0702100b000000", "hex"));
		connection.send(Buffer.from("0702110c000000", "hex"));
		connection.send(Buffer.from("0702120d000000", "hex"));
		connection.send(Buffer.from("0702130e000000", "hex"));
		connection.send(Buffer.from("0702140f000000", "hex"));
		connection.send(Buffer.from("07021510000000", "hex"));
		connection.send(Buffer.from("07021611000000", "hex"));
		connection.send(Buffer.from("07021712000000", "hex"));
		connection.send(Buffer.from("07021813000000", "hex"));
		connection.send(Buffer.from("07021914000000", "hex"));
		connection.send(Buffer.from("07021a15000000", "hex"));
		connection.send(Buffer.from("07021b16000000", "hex"));
		connection.send(Buffer.from("07021c17000000", "hex"));
		connection.send(Buffer.from("07021d18000000", "hex"));
		connection.send(Buffer.from("07021e19000000", "hex"));
		connection.send(Buffer.from("07021f1a000000", "hex"));

		setTimeout( () => {

			let bigbuf1 = new Buffer('ff10210041000000000168010e', 'hex');
			let bigbuf2 = Buffer.alloc(bigbuf1.length+(270*360*2)).fill(0xff);//new Buffer(fs.readFileSync('dump.txt').toString(), 'hex');
			for (let i = 1; i < bigbuf2.length; i += 2) {
				bigbuf2.writeUInt16BE(rgb2col(0,255,0), i);
			}
			bigbuf1.copy(bigbuf2, 0, 0, bigbuf1.length);
			let bigbuf3 = new Buffer('050f210041', 'hex');
			connection.send(bigbuf2);
			connection.send(bigbuf3);

			bigbuf1 = new Buffer('ff1023004c00000000003c010e', 'hex');
			bigbuf2 = Buffer.alloc(bigbuf1.length+(270*60*2)).fill(0xff);
			for (let i = 1; i < bigbuf2.length; i += 2) {
				bigbuf2.writeUInt16BE(rgb2col(255,0,255), i);
			}
			bigbuf1.copy(bigbuf2, 0, 0, bigbuf1.length);
			bigbuf3 = new Buffer('050f23004c', 'hex');
			connection.send(bigbuf2);
			connection.send(bigbuf3);

			bigbuf1 = new Buffer('ff1024005200000000003c010e', 'hex');
			bigbuf2 = Buffer.alloc(bigbuf1.length+(270*60*2)).fill(0x00);
			for (let i = 1; i < bigbuf2.length; i += 2) {
				bigbuf2.writeUInt16BE(rgb2col(255,0,0), i);
			}
			bigbuf1.copy(bigbuf2, 0, 0, bigbuf1.length);
			bigbuf3 = new Buffer('050f240052', 'hex');
			connection.send(bigbuf2);
			connection.send(bigbuf3);
			connection.send(Buffer.from('07024214052929', 'hex'));
			connection.send(Buffer.from('07024317052929', 'hex'));
/*
			connection.send(Buffer.from('041a4600', 'hex'));
			connection.send(Buffer.from('041a4700', 'hex'));
			connection.send(Buffer.from('070248071e4d19', 'hex'));
			connection.send(Buffer.from('07024908000000', 'hex'));
			connection.send(Buffer.from('', 'hex'));
			connection.send(Buffer.from('', 'hex'));
*/

			connection.send(buffi2);
			connection.send(buffi3);
/*
			connection.send(Buffer.from('070228071e4d19', 'hex'));
			connection.send(Buffer.from('07022908000000', 'hex'));
			connection.send(Buffer.from('07022a09000000', 'hex'));
			connection.send(Buffer.from('07022b0a000000', 'hex'));
			connection.send(Buffer.from('07022c0b000000', 'hex'));
			connection.send(Buffer.from('07022d0c000000', 'hex'));
			connection.send(Buffer.from('07022e0d000000', 'hex'));
			connection.send(Buffer.from('07022f0e000000', 'hex'));
			connection.send(Buffer.from('0702300f002800', 'hex'));
			connection.send(Buffer.from('07023110000000', 'hex'));
			connection.send(Buffer.from('07023211202420', 'hex'));
			connection.send(Buffer.from('07023312202420', 'hex'));
			connection.send(Buffer.from('07023413000000', 'hex'));
			connection.send(Buffer.from('07023514052929', 'hex'));
			connection.send(Buffer.from('07023615000000', 'hex'));
			connection.send(Buffer.from('07023716000000', 'hex'));
			connection.send(Buffer.from('07023817052929', 'hex'));
			connection.send(Buffer.from('07023918000000', 'hex'));
			connection.send(Buffer.from('07023a19000000', 'hex'));
			connection.send(Buffer.from('07023b1a000000', 'hex'));
*/
			// Stort display
			// ff10200041000000000168010e - 050f210041
			// ff1022004c00000000003c010e - 050f23004c
			// ff1024005200000000003c010e - 050f250052

/*
			connection.send(new Buffer('07026214052929', 'hex'));
			connection.send(new Buffer('07026317052929', 'hex'));
			connection.send(bigbuf2);
			connection.send(bigbuf3);
			*/
		}, 1000);

		buf = Buffer.from("\x03\x03\x06"); // get serial
		connection.send(buf);


	}


});
 
client.connect('ws://100.127.38.1:80/');
