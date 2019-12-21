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

			connection.on('error', (error) => {
				this.connected = false;
				this.connecting = false;
				this.connection = null;
				this.emit('error', "Connection Error: " + error.toString());
			});

			connection.on('close', () => {
				this.connected = false;
				this.connecting = false;
				this.connection = null;
				this.emit('error', "Connection closed");
			});

			connection.on('message', (message) => {
				if (message.type === 'binary') {
					this.inbound(connection, message.binaryData);
				} else {
					throw "Got a non binary packet from loupedeck?";
				}
			});
			
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

	responseCallbackCall(id, args) {
		if (this.responseCallbacks[id] !== undefined) {
			const cb = this.responseCallbacks[id];
			delete this.responseCallbacks[id];
			cb(args);
		}
	
	}

	drawRGB(rgbBuffer, callback) {
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


	drawPixel(x, y, color) {
		let pos = x + (y * this.circleSize);
		pixelspace.writeUInt16BE(color, 14 + (pos * 2));
		console.log({pos,x,y});
	}


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