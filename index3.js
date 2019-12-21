let CT = require('./module');
let ct = new CT({ uri: 'ws://100.127.38.1:80/'})
var fs = require('fs');
var PNG = require('pngjs').PNG;

let ongoing = false;

ct.on('event', (payload) => {
	console.log("CT Event", payload);
/*
	if (payload.action === 'wheel_touch') {

		
		let pixels = Buffer.alloc(240*240*3);
		let {x,y} = payload;
		x = Math.floor(x * 240);
		y = Math.floor(y * 240);

		for (var horiz = x; horiz < 240*240; horiz += 240) {
			pixels.writeUInt8(255, (horiz*3) + 0 );
		}
		for (var vertical = (240*y); vertical < (240*y)+240; vertical++) {
			pixels.writeUInt8(255, (vertical*3) + 0 );
		}

		
		if (!ongoing) {
			ongoing = true;
			ct.drawRGB(pixels, () => {
				ongoing = false;
			})
		}
	
	}
*/

});

ct.on('error', (error) => {
	console.error("CT error:", error);
});


ct.on('connect', () => {
	console.log("connected!!");
});



//		ct.buttonColor(10, 255, 255, 0);

ct.connect();
