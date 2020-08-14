const Debug = require('debug');
const Grafikk = require("@bitfocusas/grafikk/dist/Grafikk").default;

class Tile {
  constructor(display, id) {
		this.id = id;
		this.debug = Debug("LoupedeckCT:Tile:" + this.id);
		this.display = display;
		this.rendering = false;
		this.delayed = false;
    this.requestedSpec = {
      mainValue: " ",
      contextValue: " ",
			mainColorBackground: { r: 0, g: 0, b: 0 },
      mainColorText: { r: 255, g: 255, b: 255 },
      contextColorBackground: { r: 0, g: 0, b: 0 },
      contextColorText: { r: 255, g: 255, b: 255 },
		};
		this.activeSpec = {}

    if (display.type === "left") {
      this.width = 60;
      this.height = 90;
    } else if (display.type === "right") {
      this.width = 60;
      this.height = 90;
    } else if (display.type === "center") {
      this.width = 90;
      this.height = 90;
    } else if (display.type === "wheel") {
      this.width = 240;
      this.height = 240;
		}

    this.buffer = Buffer.alloc(this.width * this.height * 3);
    this.buffer.fill(Math.floor(Math.random() * 255));
    this.grafikk = new Grafikk(
      {
        id: this.display.id + "_" + this.id,
        physicalW: this.width,
        physicalH: this.height,
        pixelsW: this.width,
        pixelsH: this.height,
        mono: false,
      },
			(result) => {
				this.debug("rendering done for tile")
				this.rendering = false
				this.activeSpec = { ...this.requestedSpec }
				this.buffer = result.buffer
				this.activeSpecAt = Date.now()
				if (this.delayed) {
					this.debug("RENDERSPEC RUNNING FOR SECOND TIME SINCE WE'RE DELAYED")
					this.delayed = false;
					this.renderSpec()
				}
				this.display.requestUpdate(this);
			}
		);
		
		this.setSpec(this.requestedSpec)
  }

  setSpec(s) {
		let lastSpec = { ...this.activeSpec }
		this.requestedSpec = { ...this.activeSpec, ...s };
		if (JSON.stringify(lastSpec) !== JSON.stringify(this.requestedSpec)) {
			this.debug("renderSpec")
			this.renderSpec()
		}
	}
	
	renderSpec() {
		if (this.rendering === false) {
			this.rendering = true
			this.grafikk.generate(this.requestedSpec)
		}
	}
}


exports.Tile = Tile