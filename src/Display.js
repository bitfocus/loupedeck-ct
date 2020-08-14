const Debug = require('debug');
const _ = require('lodash');
const uuid = require('uuid/v4')

class Display {
  constructor(device, type) {
		
		this.id = type;
		this.device = device;
		this.writes = {}
		this.ready = false;
		this.type = type;
		
		this.executeUpdate = this.executeUpdate.bind(this)
		this.requestUpdate = _.throttle(this.executeUpdate.bind(this), 16, { trailing: true, leading: false })
		
		if (type === "left") {
      this.width = 60;
      this.height = 270;
		} 
		else if (type === "right") {
      this.width = 60;
      this.height = 270;
		} 
		else if (type === "center") {
      this.width = 360;
      this.height = 270;
		} 
		else if (type === "wheel") {
      this.width = 240;
      this.height = 240;
		}
		
    this.buffer = Buffer.alloc(this.width * this.height * 3);
    this.buffer.fill(127);
    this.tiles = [];
    this.debug = Debug("LoupedeckCT:Display"+this.id);
    this.debug("constructor");
  }

  first() {
		this.debug("first");
		this.ready = true
	}

	refresh() {
		this.debug("refresh")
	}

	
	executeUpdate = (tile, setLastRequest = true) => {


		this.debug("executeUpdate",setLastRequest)
		if (setLastRequest) {
			this.lastRequest = Date.now()
		}
		if (this.ready) {
			this.debug("display is ready")
			if (this.device.writing === false && this.device.busy === false && this.device.ready === true) {
				this.device.writing=true
				this.write(() => {
					this.device.writing=false
					this.debug("executeUpdate: done writing");
					if (this.lastRequest > this.lastWrite) {
						this.executeUpdate(tile, false)
					}
				})
			} else {
				this.debug("executeUpdate stopping since we're writing atm", this.writes)
			}
		}
  }

  write(cb) {
		if (!this.device.ready) {
			this.debug("device not ready to write")
			return
		}

		this.lastWrite = Date.now()
		if (this.type === "left") this.writeLeft(cb);
		else if (this.type === "right") this.writeRight(cb);
		else if (this.type === "center") this.writeCenter(cb);
		else if (this.type === "wheel") this.writeWheel(cb);
		
  }

  writeLeft(cb) {
		this.buffer = Buffer.concat([
			this.tiles[0].buffer,
			this.tiles[1].buffer,
			this.tiles[2].buffer,
		])
    this.device.drawLeftScreen(
      this.buffer,
      () => {
				this.debug("drawLeftScreen: done")
        cb();
      }
    );
  }

  writeRight(cb) {
		this.buffer = Buffer.concat([
			this.tiles[0].buffer,
			this.tiles[1].buffer,
			this.tiles[2].buffer,
		])
    this.device.drawRightScreen(
      this.buffer,
      () => {
				this.debug("drawRightScreen: done")
        cb();
      }
    );
  }

  writeWheel(cb) {
    this.device.drawRotaryRGB(this.tiles[0].buffer, () => {
			this.debug("drawRotayRGB: done")
			cb();
    });
  }

  writeCenter(cb) {
    
    for (let line = 0; line < 270; line++) {
      if (line < 90) {
        for (var x = 1; x <= 4; x++)
          this.tiles[x-1].buffer.copy(
            this.buffer,
            90 * 4 * 3 * line + 90 * 3 * (x - 1),
            90 * 3 * line,
            90 * 3 * line + 90 * 3
          );
      } else if (line >= 90 && line < 90 * 2) {
        for (var x = 1; x <= 4; x++)
          this.tiles[4+x-1].buffer.copy(
            this.buffer,
            90 * 90 * 4 * 3 + (90 * 4 * 3 * (line % 90) + 90 * 3 * (x - 1)),
            90 * 3 * (line % 90),
            90 * 3 * (line % 90) + 90 * 3
          );
      } else if (line >= 90 * 2 && line < 90 * 3) {
        for (var x = 1; x <= 4; x++)
          this.tiles[8+x-1].buffer.copy(
            this.buffer,
            90 * 90 * 4 * 3 * 2 + (90 * 4 * 3 * (line % 90) + 90 * 3 * (x - 1)),
            90 * 3 * (line % 90),
            90 * 3 * (line % 90) + 90 * 3
          );
      }
    }
    this.device.drawCenterScreen(this.buffer, () => {
			this.debug("drawCenterScreen: done")
      cb();
    });
  }

  tile(c) {
    this.tiles.push(c);
    if (this.type === "left" && this.tiles.length === 3) this.first();
    else if (this.type === "right" && this.tiles.length === 3) this.first();
    else if (this.type === "center" && this.tiles.length === 12) this.first();
    else if (this.type === "wheel" && this.tiles.length === 1) this.first();
  }

}

exports.Display = Display