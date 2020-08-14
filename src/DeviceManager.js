const Debug = require('debug');
const { Display } = require('./Display')
const { Tile } = require('./Tile')
const EventEmitter = require('events')

class DeviceManager extends EventEmitter {

	constructor() {
		super()
		this.debug = Debug("LoupedeckCT:DeviceManager");
		this.devices = [];
	}

	addDevice(device) {

		let display_left = new Display(device, "left");
		device.display(display_left);

		let display_right = new Display(device, "right");
		device.display(display_right);

		let display_center = new Display(device, "center");
		device.display(display_center);

		let display_wheel = new Display(device, "wheel");
		device.display(display_wheel);

		let tiles = {};

		for (let x = 1; x <= 3; x++) {
			tiles["left_" + x] = new Tile(display_left, "left_" + x);
			display_left.tile(tiles["left_" + x]);

			tiles["right_" + x] = new Tile(display_right, "right_" + x);
			display_right.tile(tiles["right_" + x]);
		}

		tiles["wheel"] = new Tile(display_wheel, "wheel");
		display_wheel.tile(tiles["wheel"]);

		for (let y = 1; y <= 3; y++) {
			for (let x = 1; x <= 4; x++) {
				tiles["center_" + y + "_" + x] = new Tile(
					display_center,
					"center_" + y + "_" + x
				);
				display_center.tile(tiles["center_" + y + "_" + x]);
			}
		}

		this.devices.push(device);

		device.on('connect', (err) => {
			this.debug('device_connect', err)
			this.emit('device_connect', err, device)
		})

		device.on('event', (e) => {
			this.debug('device_event', e)
			this.emit('device_event', e, device)
		})

		device.connect()
	}
}

exports.DeviceManager = DeviceManager;
