const WebSocketClient = require('websocket').client;
const EventEmitter = require('events');

class LoupedeckCT extends EventEmitter {

	constructor(props) {
		super();

		this.circleSize = 240;
		this.serial = 'unknown';
		this.client = new WebSocketClient();
		this.uri = props.uri;
		this.connection = null;
		this.responseCallbacks = {};

		this.client.on('connectFailed', (error) => {
			this.connected = false;
			this.connecting = false;
			this.connection = null;
			console.log('Connect Error: ' + error.toString());
		});
		
		this.client.on('connect', (connection) => {
			this.connecting = false;
			this.connected = true;
			this.connection = connection;

			this.emit('connect');

			/* whaaaaaa... well, please go to line 63 and act as you didn't see anything */
			this.connection.send(Buffer.from("130e013da81c9ba72a8c87d4f6a135a289066c", "hex"));
			this.connection.send(Buffer.from("131c0261f1392a8e936ba66e992daedb40f65f", "hex"));
			this.connection.send(Buffer.from("030703", "hex"));
			this.connection.send(Buffer.from("030d04", "hex"));
			this.connection.send(Buffer.from("030405", "hex"));
			this.connection.send(Buffer.from("030306", "hex"));
			this.connection.send(Buffer.from("041a0700", "hex"));
			this.connection.send(Buffer.from("041a0801", "hex"));
			this.connection.send(Buffer.from("041a0902", "hex"));
			this.connection.send(Buffer.from("041e0a00", "hex"));
			this.connection.send(Buffer.from("04090b03", "hex"));
			this.connection.send(Buffer.from("07020c07000000", "hex"));
			this.connection.send(Buffer.from("07020d08000000", "hex"));
			this.connection.send(Buffer.from("07020e09000000", "hex"));
			this.connection.send(Buffer.from("07020f0a000000", "hex"));
			this.connection.send(Buffer.from("0702100b000000", "hex"));
			this.connection.send(Buffer.from("0702110c000000", "hex"));
			this.connection.send(Buffer.from("0702120d000000", "hex"));
			this.connection.send(Buffer.from("0702130e000000", "hex"));
			this.connection.send(Buffer.from("0702140f000000", "hex"));
			this.connection.send(Buffer.from("07021510000000", "hex"));
			this.connection.send(Buffer.from("07021611000000", "hex"));
			this.connection.send(Buffer.from("07021712000000", "hex"));
			this.connection.send(Buffer.from("07021813000000", "hex"));
			this.connection.send(Buffer.from("07021914000000", "hex"));
			this.connection.send(Buffer.from("07021a15000000", "hex"));
			this.connection.send(Buffer.from("07021b16000000", "hex"));
			this.connection.send(Buffer.from("07021c17000000", "hex"));
			this.connection.send(Buffer.from("07021d18000000", "hex"));
			this.connection.send(Buffer.from("07021e19000000", "hex"));
			this.connection.send(Buffer.from("07021f1a000000", "hex"));
			
			// Socket errors
			connection.on('error', (error) => {
				this.connected = false;
				this.connecting = false;
				this.connection = null;
				this.emit('error', "Connection Error: " + error.toString());
			});

			// When the socket closes. Will it ever??!
			connection.on('close', () => {
				this.connected = false;
				this.connecting = false;
				this.connection = null;
				this.emit('error', "Connection closed");
			});

			// When it says something. And it will <3
			connection.on('message', (message) => {
				if (message.type === 'binary') {
					this.inbound(connection, message.binaryData);
				} else {
					throw "Got a non binary packet from loupedeck?";
				}
			});
			
			// If connected, send first post and get serial :) ...we should
			// probably delay this until we KNOW we're connected to a real
			// device.. But.. Who cares? ..I do. But you probably don't. :/
			if (connection.connected) {
				this.outboundFirstPost(connection);
				this.outboundGetSerial(connection);
			}
			

		});

	}

	connect() {
		if (this.connection !== null) {
		this.connection.destroy();			
		}

		this.connecting = true;
		this.connection = null;
		this.client.connect(this.uri);
	}

	
	// Add callbacks for the requests
	responseCallbackAdd(callback) {
		if (typeof callback !== 'function') {
			return;
		}
		let id = Math.floor(Math.random() * 256);
		while (this.responseCallbacks[id] !== undefined) {
			id = Math.floor(Math.random() * 256);
		}

		this.responseCallbacks[id] = callback;
		return id;
	}


	// well, trigger the stored callbacks?
	responseCallbackCall(id, args) {
		if (this.responseCallbacks[id] !== undefined) {
			const cb = this.responseCallbacks[id];
			delete this.responseCallbacks[id];
			cb(args);
		}
	
	}

	// draw something on the center screen. Don't spend 4 hours, just know it's 270x360?
	drawCenterScreen(rgbBuffer, callback) {

		const id = this.responseCallbackAdd(callback);

		let bigbuf1 = Buffer.from('ff10210041000000000168010e', 'hex');
		let bigbuf2 = Buffer.alloc(bigbuf1.length+(270*360*2)).fill(0xff);//new Buffer(fs.readFileSync('dump.txt').toString(), 'hex');
		var rgbOffset = 0;
		for (let i = 15; i < bigbuf2.length; i += 2) {
			bigbuf2.writeUInt16BE(this.rgb2col(
				rgbBuffer.readUInt8(rgbOffset + 0),
				rgbBuffer.readUInt8(rgbOffset + 1),
				rgbBuffer.readUInt8(rgbOffset + 2),
			), i);
			rgbOffset += 3;
		}
		bigbuf1.copy(bigbuf2, 0, 0, bigbuf1.length);
		let bigbuf3 = new Buffer('050f210041', 'hex');
		bigbuf3.writeUInt8(id, 2);
		this.connection.send(bigbuf2);
		this.connection.send(bigbuf3);



		// one left screen
		bigbuf1 = Buffer.from('ff1023004c00000000003c010e', 'hex');
		bigbuf2 = Buffer.alloc(bigbuf1.length+(270*60*2)).fill(0xff);
		for (let i = 1; i < bigbuf2.length; i += 2) {
			bigbuf2.writeUInt16BE(this.rgb2col(255,0,0), i);
		}
		bigbuf1.copy(bigbuf2, 0, 0, bigbuf1.length);
		bigbuf3 = new Buffer('050f23004c', 'hex');
		this.connection.send(bigbuf2);
		this.connection.send(bigbuf3);



		// one right screen?
		bigbuf1 = new Buffer('ff1024005200000000003c010e', 'hex');
		bigbuf2 = Buffer.alloc(bigbuf1.length+(270*60*2)).fill(0x00);
		for (let i = 1; i < bigbuf2.length; i += 2) {
			bigbuf2.writeUInt16BE(this.rgb2col(255,0,0), i);
		}
		bigbuf1.copy(bigbuf2, 0, 0, bigbuf1.length);
		bigbuf3 = new Buffer('050f240052', 'hex');
		this.connection.send(bigbuf2);
		this.connection.send(bigbuf3);

		// something else??!
		this.connection.send(Buffer.from('07024214052929', 'hex'));
		this.connection.send(Buffer.from('07024317052929', 'hex'));


	}


	// 240x240 pixels. Trust me. We know.
	drawRotaryRGB(rgbBuffer, callback) {
		const id = this.responseCallbackAdd(callback);
		let draw_start = new Buffer('ff102600570000000000f000f0', 'hex');
		let start_and_pixelspace = Buffer.alloc(115200);
		draw_start.copy(start_and_pixelspace, 0, 0, 14);
		let draw_end = new Buffer('050f000057', 'hex');
		draw_end.writeUInt8(id, 2);
		let rgbOffset = 0;
		for (let i = 14; i < start_and_pixelspace.length; i += 2) {
			start_and_pixelspace.writeUInt16BE(
				this.rgb2col(
					rgbBuffer.readUInt8(rgbOffset + 0), 
					rgbBuffer.readUInt8(rgbOffset + 1), 
					rgbBuffer.readUInt8(rgbOffset + 2)
				),
				i
			);
			rgbOffset += 3;
		}
		this.connection.send(start_and_pixelspace);
		this.connection.send(draw_end);
	}

	rgb2col(r, g, b) {
		return ((g >> 5) & 0b111) | (((r >> 3) & 0b11111) << 3) | (((b >> 3) & 0b11111) << 8);
	}

	outboundFirstPost(connection) {
		let buf = Buffer.from("\x13\x0e\x01");
		connection.send(buf);
	}


	outboundGetSerial(connection) {
		let buf = Buffer.from("\x03\x03\x06"); // get serial
		connection.send(buf);
	}

	buttonColor(id, red, green, blue, callback) {
		let command = Buffer.from("0702FA00000000", 'hex');
		const cbid = this.responseCallbackAdd(callback);
		command.writeUInt8(cbid, 2);
		command.writeUInt8(id, 3);
		command.writeUInt8(red, 4);
		command.writeUInt8(green, 5);
		command.writeUInt8(blue, 6);
		this.connection.send(command)
	}

	deviceEvent(payload) {
		this.emit('event', payload);
	}

	// TODO: wtf. we need to write to the correct buffer. or none at all.
	drawPixel(x, y, color) {
		let pos = x + (y * this.circleSize);
		pixelspace.writeUInt16BE(color, 14 + (pos * 2));
		console.log({pos,x,y});
	}

	// messages incoming from the device. this will be fun. no.
	inbound(connection, message) {

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
				this.deviceEvent({
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
				this.deviceEvent({
					action: 'button_press',
					id: id,
					direction: direction
				});
			}
		}
		
		// Confirmation stuff, probably. Who knows
		else if (command === 0x03) {
			this.responseCallbackCall(message.readUInt8(2));
			//console.log("confirmation message", message);
		}

		// Screen related confirmation stuff, probably. Who knows
		else if (command === 0x04 && subchar === 0x0f) {
			this.responseCallbackCall(message.readUInt8(2));
			//console.log("confirmation message", message);
		}
		

		// Touch events
		else if (command === 0x09) { 
	
			// Big wheel touch
			if (subchar == 0x52 || subchar == 0x72) {

				let direction = subchar == 0x52 ? 'press' : 'release';
				let x = parseInt(message.readUInt8(5), 10) / 255;
				let y = parseInt(message.readUInt8(7), 10) / 255;

				this.deviceEvent({
					action: 'wheel_touch',
					eventId: 0,
					x, y, direction
				});
			}
	
			// Main screen touch
			if (subchar == 0x4D || subchar == 0x6D) {

				let direction = subchar == 0x4D ? 'press' : 'release';
				let x = parseInt(message.readUInt16BE(4), 10)
				let y = parseInt(message.readUInt16BE(6), 10)

				this.deviceEvent({
					action: 'screen_touch',
					eventId: parseInt(message.readUInt8(8), 10),
					x, y, direction
				});
			}
	
			else console.log("touch action", message)
		}

		// Serial number
		else if (command === 0x1F) {

			this.serial = message.toString().trim().substr(3);

			this.deviceEvent({
				action: 'device_serial',
				value: this.serial
			});

		}
		
		else {
			//console.log("got unknown stuff:", message);
		}
	}

}

module.exports = exports = LoupedeckCT;