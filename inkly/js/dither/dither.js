/**
 * Javascript dithering library
 * @author 2014 Daniele Piccone
 * @author www.danielepiccone.com
 * */

const utils = {};

utils.defaultPalette = [
    [0, 0, 0],       /*BLACK*/
    [255, 255, 255], /*WHITE*/
    [0, 255, 0],     /*GREEN*/
    [0, 0, 255],     /*BLUE*/
    [255, 0, 0],     /*RED*/
    [255, 247, 0],   /*YELLOW*/
    [255, 123, 0],   /*ORANGE*/
    [255, 126, 221]  /*MAGENTA*/
];

utils.errors = {
    CanvasNotPresent: new Error('CanvasNotPresent'),
    TargetNotBuffer: new Error('TargetNotBuffer'),
    InvalidAlgorithm: new Error('InvalidAlgorithm')
};

utils.targetTypes = {
    selector: 'SELECTOR',
    buffer: 'BUFFER'
};


function orderedDither(uint8data, palette, step, h, w) {
    const d = new Uint8ClampedArray(uint8data);
    const ratio = 3;
    const m = new Array(
        [1, 9, 3, 11],
        [13, 5, 15, 7],
        [4, 12, 2, 10],
        [16, 8, 14, 6]
    );

    let r;
    let g;
    let b;
    let a;
    let i;
    let color;
    let approx;
    let tr;
    let tg;
    let tb;
    let dx;
    let dy;
    let di;

    for (var y = 0; y < h; y += step) {
        for (var x = 0; x < w; x += step) {
            i = (4 * x) + (4 * y * w);

            // Define bytes
            r = i;
            g = i + 1;
            b = i + 2;
            a = i + 3;

            d[r] += m[x % 4][y % 4] * ratio;
            d[g] += m[x % 4][y % 4] * ratio;
            d[b] += m[x % 4][y % 4] * ratio;

            color = new Array(d[r], d[g], d[b]);
            approx = this.approximateColor(color, palette);
            tr = approx[0];
            tg = approx[1];
            tb = approx[2];

            // Draw a block
            for (dx = 0; dx < step; dx++) {
                for (dy = 0; dy < step; dy++) {
                    di = i + (4 * dx) + (4 * w * dy);

                    // Draw pixel
                    d[di] = tr;
                    d[di + 1] = tg;
                    d[di + 2] = tb;

                }
            }
        }
    }
    return d;
}


function atkinsonDither(uint8data, palette, step, h, w) {
    const d = new Uint8ClampedArray(uint8data);
    const out = new Uint8ClampedArray(uint8data);
    const ratio = 1 / 8;

    var $i = function (x, y) {
        return (4 * x) + (4 * y * w);
    };

    var r, g, b, a, q, i, color, approx, tr, tg, tb, dx, dy, di;

    for (var y = 0; y < h; y += step) {
        for (var x = 0; x < w; x += step) {
            i = (4 * x) + (4 * y * w);

            // Define bytes
            r = i;
            g = i + 1;
            b = i + 2;
            a = i + 3;

            color = new Array(d[r], d[g], d[b]);
            approx = this.approximateColor(color, palette);

            q = [];
            q[r] = d[r] - approx[0];
            q[g] = d[g] - approx[1];
            q[b] = d[b] - approx[2];

            // Diffuse the error for three colors
            d[$i(x + step, y) + 0] += ratio * q[r];
            d[$i(x - step, y + step) + 0] += ratio * q[r];
            d[$i(x, y + step) + 0] += ratio * q[r];
            d[$i(x + step, y + step) + 0] += ratio * q[r];
            d[$i(x + (2 * step), y) + 0] += ratio * q[r];
            d[$i(x, y + (2 * step)) + 0] += ratio * q[r];

            d[$i(x + step, y) + 1] += ratio * q[g];
            d[$i(x - step, y + step) + 1] += ratio * q[g];
            d[$i(x, y + step) + 1] += ratio * q[g];
            d[$i(x + step, y + step) + 1] += ratio * q[g];
            d[$i(x + (2 * step), y) + 1] += ratio * q[g];
            d[$i(x, y + (2 * step)) + 1] += ratio * q[g];

            d[$i(x + step, y) + 2] += ratio * q[b];
            d[$i(x - step, y + step) + 2] += ratio * q[b];
            d[$i(x, y + step) + 2] += ratio * q[b];
            d[$i(x + step, y + step) + 2] += ratio * q[b];
            d[$i(x + (2 * step), y) + 2] += ratio * q[b];
            d[$i(x, y + (2 * step)) + 2] += ratio * q[b];

            tr = approx[0];
            tg = approx[1];
            tb = approx[2];

            // Draw a block
            for (dx = 0; dx < step; dx++) {
                for (dy = 0; dy < step; dy++) {
                    di = i + (4 * dx) + (4 * w * dy);

                    // Draw pixel
                    out[di] = tr;
                    out[di + 1] = tg;
                    out[di + 2] = tb;

                }
            }
        }
    }
    return out;
}

function errorDiffusionDither(uint8data, palette, step, h, w) {
    var d = new Uint8ClampedArray(uint8data);
    var out = new Uint8ClampedArray(uint8data);
    var ratio = 1 / 16;

    var $i = function (x, y) {
        return (4 * x) + (4 * y * w);
    };

    var r, g, b, a, q, i, color, approx, tr, tg, tb, dx, dy, di;

    for (y = 0; y < h; y += step) {
        for (x = 0; x < w; x += step) {
            i = (4 * x) + (4 * y * w);

            // Define bytes
            r = i;
            g = i + 1;
            b = i + 2;
            a = i + 3;

            color = new Array(d[r], d[g], d[b]);
            approx = this.approximateColor(color, palette);

            q = [];
            q[r] = d[r] - approx[0];
            q[g] = d[g] - approx[1];
            q[b] = d[b] - approx[2];

            // Diffuse the error
            d[$i(x + step, y)] = d[$i(x + step, y)] + 7 * ratio * q[r];
            d[$i(x - step, y + 1)] = d[$i(x - 1, y + step)] + 3 * ratio * q[r];
            d[$i(x, y + step)] = d[$i(x, y + step)] + 5 * ratio * q[r];
            d[$i(x + step, y + step)] = d[$i(x + 1, y + step)] + 1 * ratio * q[r];

            d[$i(x + step, y) + 1] = d[$i(x + step, y) + 1] + 7 * ratio * q[g];
            d[$i(x - step, y + step) + 1] = d[$i(x - step, y + step) + 1] + 3 * ratio * q[g];
            d[$i(x, y + step) + 1] = d[$i(x, y + step) + 1] + 5 * ratio * q[g];
            d[$i(x + step, y + step) + 1] = d[$i(x + step, y + step) + 1] + 1 * ratio * q[g];

            d[$i(x + step, y) + 2] = d[$i(x + step, y) + 2] + 7 * ratio * q[b];
            d[$i(x - step, y + step) + 2] = d[$i(x - step, y + step) + 2] + 3 * ratio * q[b];
            d[$i(x, y + step) + 2] = d[$i(x, y + step) + 2] + 5 * ratio * q[b];
            d[$i(x + step, y + step) + 2] = d[$i(x + step, y + step) + 2] + 1 * ratio * q[b];

            // Color
            tr = approx[0];
            tg = approx[1];
            tb = approx[2];

            // Draw a block
            for (dx = 0; dx < step; dx++) {
                for (dy = 0; dy < step; dy++) {
                    di = i + (4 * dx) + (4 * w * dy);

                    // Draw pixel
                    out[di] = tr;
                    out[di + 1] = tg;
                    out[di + 2] = tb;

                }
            }
        }
    }
    return out;
}


const DitherJS = function DitherJS(options) {
    this.options = options || {};
    this.options.algorithm = this.options.algorithm || 'diffusion';
    this.options.step = this.options.step || 1;
    this.options.className = this.options.className || 'dither';
    this.options.palette = this.options.palette || utils.defaultPalette;
};

DitherJS.orderedDither = orderedDither;
DitherJS.atkinsonDither = atkinsonDither;
DitherJS.errorDiffusionDither = errorDiffusionDither;

DitherJS.prototype.ditherImageData = function ditherImageData(imageData, options) {
    options = options || this.options;
    let ditherFn;
    if (options.algorithm == 'diffusion')
        ditherFn = DitherJS.errorDiffusionDither;
    else if (options.algorithm == 'ordered')
        ditherFn = DitherJS.orderedDither;
    else if (options.algorithm == 'atkinson')
        ditherFn = DitherJS.atkinsonDither;
    else
        throw utils.errors.InvalidAlgorithm;

    var startTime;
    if (options.debug) {
        startTime = Date.now();
    }

    var output = ditherFn.call(
        this,
        imageData.data,
        options.palette,
        options.step,
        imageData.height,
        imageData.width
    );

    if (options.debug) {
        console.log('Microtime: ', Date.now() - startTime);
    }

    imageData.data.set(output);
};

DitherJS.prototype.ditherCanvas = function (canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.ditherImageData(imageData, options);
    ctx.putImageData(imageData, 0, 0);
}


DitherJS.prototype.colorDistance = function colorDistance(a, b) {
    return Math.sqrt(
        Math.pow(((a[0]) - (b[0])), 2) +
        Math.pow(((a[1]) - (b[1])), 2) +
        Math.pow(((a[2]) - (b[2])), 2)
    );
};

DitherJS.prototype.approximateColor = function approximateColor(color, palette) {
    const findIndex = function (fun, arg, list, min) {
        if (list.length == 2) {
            if (fun(arg, min) <= fun(arg, list[1])) {
                return min;
            } else {
                return list[1];
            }
        } else {
            var tl = list.slice(1);
            if (fun(arg, min) <= fun(arg, list[1])) {
                min = min;
            } else {
                min = list[1];
            }
            return findIndex(fun, arg, tl, min);
        }
    };
    return findIndex(this.colorDistance, color, palette, palette[0]);
};
