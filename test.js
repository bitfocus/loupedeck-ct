let CT = require('./index');
var fs = require('fs');
var PNG = require('pngjs').PNG;
const grafikk = require('@bitfocusas/grafikk');

var getips = require('get-ip-addresses').default;
let ip = getips().find( ip => ip.match(/^100\.127\./) );
if (ip === undefined) {
	console.error("Unable to find device");
	process.exit(1);
}
else {
	ip = ip.replace(/\.2$/,".1");
}

let ct = new CT({ uri: 'ws://'+ip+':80/'})


let ongoing = false;
let ongoing2 = false;
let intensity = 255;

ct.on('event', (payload) => {

	console.log("CT Event", payload);

	if (payload.action === 'encoder_step') {
		if (payload.direction == 'left') { if (intensity>=5) intensity-=5; }
		if (payload.direction == 'right') { if (intensity<250) intensity+=5; }
	}

	if (payload.action === 'button_press') {

		
		let pixels = Buffer.alloc(360*270*3);

		fs.createReadStream('./research/img/bfstor.png').pipe(
			new PNG({
				filterType: 4
			}
		)).on('parsed', function() {
		
			for (let pixel = 0; pixel < 360*270; pixel++) {
				pixels.writeUInt8(this.data[(pixel*4) + 0], (pixel*3) + 0 );
				pixels.writeUInt8(this.data[(pixel*4) + 1], (pixel*3) + 1 );
				pixels.writeUInt8(this.data[(pixel*4) + 2], (pixel*3) + 2 );
			}
		

			if (!ongoing) {
				ongoing = true;
				ct.drawCenterScreen(pixels, () => {
					ongoing = false;
				})
			}

		});
		
		let pixels2 = Buffer.alloc(240*240*3);

		fs.createReadStream('./research/img/bf.png').pipe(
			new PNG({
				filterType: 4
			}
		)).on('parsed', function() {
		
			for (let pixel = 0; pixel < 240*240; pixel++) {
				pixels2.writeUInt8(this.data[(pixel*4) + 0], (pixel*3) + 0 );
				pixels2.writeUInt8(this.data[(pixel*4) + 1], (pixel*3) + 1 );
				pixels2.writeUInt8(this.data[(pixel*4) + 2], (pixel*3) + 2 );
			}
		

			if (!ongoing2) {
				ongoing2 = true;
				ct.drawRotaryRGB(pixels2, () => {
					ongoing2 = false;
				})
			}

		});
		
	}


});

ct.on('error', (error) => {
	console.error("CT error:", error);
});


ct.on('connect', () => {
	console.log("connected!!");
	setTimeout( () => { 
		for (var x = 7; x <= 27; x++) {
			ct.buttonColor(x, intensity, 0, 0);
		}
		setInterval(start,40);
	}, 500);
});

function start() {
	let rndButton = 7 + Math.floor(Math.random() * 20);
		ct.buttonColor(rndButton, 
			Math.floor(Math.random() * intensity),
			Math.floor(Math.random() * intensity), 
			Math.floor(Math.random() * intensity)
		);
}




ct.connect();
