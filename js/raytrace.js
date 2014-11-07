
window.requestAnimFrame = function(){
    return (
        window.requestAnimationFrame       || 
        window.webkitRequestAnimationFrame || 
        window.mozRequestAnimationFrame    || 
        window.oRequestAnimationFrame      || 
        window.msRequestAnimationFrame     || 
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        }
    );
}();

var PixelsArray = function(resolution) {	// input: vec2
	this.pixels = [];
	this.resolution = resolution;
	this.whitePixel = '.';
	this.darkPixel = '*';

	// init pixel array
	for (var v=0; v<this.resolution.y; v++) {

		this.pixels[v] = [];

		$('<div/>', {
			id: v+'',
		}).appendTo('#display');

		for (var u=0; u<this.resolution.x; u++) {
			this.pixels[v][u] = [];
		}
	}
	// clearPixels
	this.clearPixels();

};

PixelsArray.prototype = {

	render: function() {
		
		for (var v=0; v<this.resolution.y; v++) {
			var res = '';
			for (var u=0; u<this.resolution.x; u++) {
				res += this.pixels[v][u];
			}
			$('#'+v).text(res);
		}

	},

	clearPixels: function() {
		for (var v=0; v<this.resolution.y; v++) {
			for (var u=0; u<this.resolution.x; u++) {
				this.pixels[v][u] = this.whitePixel;
			}
		}
	},

	set: function(uv, x) { // input: vec2, string
		this.pixels[uv.y][uv.x] = x;
	}
};


function vec2(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

vec2.prototype = {
	set: function (x, y) {
		this.x = x;
		this.y = y;
	}
};



function vec3(x, y, z) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
}

vec3.prototype = {

	set: function (x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	},

	length: function () {
		return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
	},

	dot: function(v) {
		return this.x*v.x + this.y*v.y + this.z*v.z;
	},

	cross: function (v) {
		return new vec3(this.y*v.z-this.z*v.y, this.z*v.x-this.x*v.z, this.x*v.y-this.y*v.x);
	},

	normalize: function () {
		var len = this.length();
		this.x /= len;
		this.y /= len;
		this.z /= len;
		return this;
	},

	sub: function (v) {
		return new vec3(this.x-v.x, this.y-v.y, this.z-v.z);
	},

	mul: function (s) {
		return new vec3(this.x*s, this.y*s, this.z*s);
	},

	add: function (v) {
		return new vec3(this.x+v.x, this.y+v.y, this.z+v.z);
	},

};





function getNormal(p) {
	var EPS = 0.001;
	var res = new vec3( p.add(new vec3(EPS, 0, 0)).sub(  p.sub(new vec3(EPS, 0, 0) )),
						p.add(new vec3(0, EPS, 0)).sub(  p.sub(new vec3(0, EPS, 0) )),
						p.add(new vec3(0, 0, EPS)).sub(  p.sub(new vec3(0, 0, EPS) )));

	return res.normalize();
}



function sdCapsule(p, a, b, r) {
	var pa = p.sub(a);
	var ba = b.sub(a);
	var h = pa.dot(ba)/ba.dot(ba);
	if (h<0) h = 0;
	if (h>1) h = 1;
	var bah = ba.mul(h);
	var x = pa.sub(bah);
	return x.length() - r;
}

function sdSphere(p, r) {	// input vec3, float
	return p.length() - r;
}

function opu(a, b) {
	return Math.min(a, b);
}

function map(p) {	// input: vec3
	// return sdSphere(p, 1.0);

	var linewidth = 0.08;
	var d = Number.POSITIVE_INFINITY;

	d = opu(d, sdCapsule(p, new vec3(-1.5, 0.5, 0), new vec3(0, -1.5, 0), linewidth ));
	d = opu(d, sdCapsule(p, new vec3(1.5, 0.5, 0), new vec3(0, -1.5, 0), linewidth ));
	d = opu(d, sdCapsule(p, new vec3(0, 0.5, 1.5), new vec3(0, -1.5, 0), linewidth ));
	d = opu(d, sdCapsule(p, new vec3(0, 0.5, -1.5), new vec3(0, -1.5, 0), linewidth ));

	d = opu(d, sdCapsule(p, new vec3(-1.5, 0.5, 0), new vec3(0, 0.5, 1.5), linewidth ));
	d = opu(d, sdCapsule(p, new vec3(0, 0.5, -1.5),  new vec3(-1.5, 0.5, 0), linewidth ));
	d = opu(d, sdCapsule(p, new vec3(0, 0.5, -1.5),  new vec3(1.5, 0.5, 0), linewidth ));
	d = opu(d, sdCapsule(p, new vec3(0, 0.5, 1.5),  new vec3(1.5, 0.5, 0), linewidth ));

	return d;
}


// todo invert UV 
var viewport = new PixelsArray(new vec2(100, 60));


// this is flipped coord fron GLSL! we loop through array starting from top left not bottom left!! ******

function main(time) {

	var cdist = 2.3;
	var cpos  = new vec3(cdist * Math.cos(time), -0.75, cdist * Math.sin(time));
	var ctgt  = new vec3(0, 0, 0);
	var fw    = ctgt.sub(cpos).normalize();
	var right = fw.cross(new vec3(0, 1, 0)).normalize();
	var up    = right.cross(fw).normalize();

	var ro = cpos;

	for (var u=0; u<viewport.resolution.x; u++) {

		for (var v=0; v<viewport.resolution.y; v++) {

			var uv = new vec2(u/viewport.resolution.x*2 - 1, v/viewport.resolution.y*2 - 1);
			uv.x *=	viewport.resolution.x/viewport.resolution.y;

			var focalLength = 1.0;
			var rd = fw.mul(focalLength).add( right.mul(uv.x) ).add( up.mul(uv.y) );

			var p = raymarch(ro, rd);
			if (p) {	// if ray intersect object
				
				var normal = getNormal(p);
				var lightDir = new vec3(1, 1, 1);
				lightDir = lightDir.normalize();
				var intensity = normal.dot(lightDir);

				// if (intensity > 0.5) {
					viewport.set(new vec2(u, v), 'x');
				// } else {
					// viewport.set(new vec2(u, v), '#');
				// }


			} 

		}

	}

}

function raymarch(ro, rd) {

	var EPS = 0.001;
	var MAX_STEP = 128;
	var MAXD = 60;
	var SETEP_REDUCTION = 0.85;
		
	var t = 0;
	var p = new vec3();

	for (var i=0; i<MAX_STEP; i++) {

		var newRd = rd.mul(t);
		p = ro.add(newRd);
		var d = map(p);
		if ( d<EPS || d>MAXD ) {
			return d>MAXD ? false : p;
		}
		t += d*SETEP_REDUCTION;
	}

	return false;

}




function randInt(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

function max(a, b) {
	return a>b?a:b;
}


var temp = new vec2();
(function render(time) {

	requestAnimationFrame(render);

	main(time*0.001);
	viewport.render();
	viewport.clearPixels();

})();

document.addEventListener( 'mousemove', onDocumentMouseMove, false );
function onDocumentMouseMove( event ) {
	event.preventDefault();
	var mx = ( event.clientX / window.innerWidth ) * 2 - 1;
	var my = - ( event.clientY / window.innerHeight ) * 2 + 1;
}



