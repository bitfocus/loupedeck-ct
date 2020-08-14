const Debug = require('debug');
const EventEmitter = require('events');
const { LoupedeckCT } = require("./LoupedeckCT");

class Device extends LoupedeckCT {
  constructor(params) {
		super(params)
		this.id = params.uri;
    this.connection = null
		this.displays = [];
		this.error = null;
		this.writing = false;
    this.debug = Debug("LoupedeckCT:Device:"+this.id);
		this.connect()
		this.on('connect', this.onConnected.bind(this))
	}

	onConnected(err) {
		this.debug("connected to device", err)
		this.ready=true;
		this.write()
	}

	yield() {
		this.debug("yield()")
	}

	findTile(id) {
		let found = null
		this.displays.forEach(display => {
			let f = display.tiles.find(obj => obj.id === id)
			if (f !== undefined) found = f
		})
		return found
	}

  write() {

		this.debug("write()");
		let writing = 0
		this.busy = true
		this.displays.forEach((display) => {
			writing++
      display.write(() => {
				writing--;
				if (writing === 0) {
					this.debug("done writing")
					this.busy = false
					this.yield()
				} else {
					this.debug("not done writing")
				}
      });
    });
  }

  display(c) {
    this.displays.push(c);
  }
}

exports.Device = Device
