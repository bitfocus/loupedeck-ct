let CT = require('./module');
let ct = new CT({ uri: 'ws://100.127.37.1:80/'})
var fs = require('fs');
var PNG = require('pngjs').PNG;
	
ct.on('event', (payload) => {
	console.log("CT Event", payload);
});

ct.on('error', (error) => {
	console.error("CT error:", error);
});

let frames = 0;
let startTime = Date.now();

let pixels = Buffer.alloc(240*240*3);

fs.createReadStream('img/bf.png').pipe(
	new PNG({
		filterType: 4
	}
)).on('parsed', function() {

	for (var pixel = 0; pixel < 240*240; pixel++) {
		pixels.writeUInt8(this.data[(pixel*4) + 0], (pixel*3) + 0 );
		pixels.writeUInt8(this.data[(pixel*4) + 1], (pixel*3) + 1 );
		pixels.writeUInt8(this.data[(pixel*4) + 2], (pixel*3) + 2 );
	}

});

function start() {

	frames++;
	console.log( frames / ((Date.now()-startTime)/1000), "fps");

	ct.drawRGB(pixels, () => {
		start();
	});
	

}


function start2() {
	ct.buttonColor(
		7 + Math.floor(Math.random() * 20), 
		Math.floor(Math.random() * 127),
		Math.floor(Math.random() * 127),
		Math.floor(Math.random() * 127),
		() => {
			start2();
		}
	);
}

ct.on('connect', () => {
	console.log("connected!!");

	start();
	start2();
});

//		ct.buttonColor(10, 255, 255, 0);

ct.connect();
