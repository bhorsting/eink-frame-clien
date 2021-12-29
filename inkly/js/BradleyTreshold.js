var ocr;
(function (ocr) {

    var BradleyThreshold = (function () {
        function BradleyThreshold(imageData) {
            this.imageData = imageData;
            this._windowSize = 60;
            this._pixelBrightnessDifferenceLimit = 0.18;
            this.imageDataWidth = 0;
            this.imageDataHeight = 0;
        }

        BradleyThreshold.prototype.setImageData = function (imageData) {
            this.imageData = imageData;
        }

        BradleyThreshold.prototype.process = function () {
            var width = this.imageData.width, height = this.imageData.height, widthM1 = width - 1, heightM1 = height - 1, radius = (this.windowSize / 2) | 0, avgBrightnessPart = 1.0 - this._pixelBrightnessDifferenceLimit, x, x1, x1, x2, y, y1, y2, r, g, b, a, l, imageData = this.imageData, data8 = imageData.data, out, ptr = 0, originalPixelValue = 0;

            this.integralImageFlat = [];
            this.imageDataWidth = width;
            this.imageDataHeight = height;
            this.integralImage = [];
            this.bwImage = [];

            var integralImage = this.integralImage, bwImage = this.bwImage;

            for (y = 0; y < height; y++) {
                integralImage[y] = [];
                bwImage[y] = [];

                for (x = 0; x < width; x++) {
                    r = data8[ptr++];
                    g = data8[ptr++];
                    b = data8[ptr++];
                    ptr++;

                    // Do a quick RGB to Luma conversion
                    originalPixelValue = (r + r + r + b + g + g + g + g) >> 3;

                    bwImage[y][x] = originalPixelValue;

                    //For the leftmost pixel, just copy value from original
                    if (y == 0 && x == 0) {
                        integralImage[y][x] = originalPixelValue;
                    } else if (y == 0) {
                        integralImage[y][x] = originalPixelValue + integralImage[y][x - 1];
                    } else if (x == 0) {
                        integralImage[y][x] = originalPixelValue + integralImage[y - 1][x];
                    } else {
                        integralImage[y][x] = originalPixelValue + integralImage[y][x - 1] + integralImage[y - 1][x] - integralImage[y - 1][x - 1];
                    }
                }
            }

            ptr = 0;

            for (y = 0; y < height; y++) {
                // rectangle's Y coordinates
                y1 = y - radius;
                y2 = y + radius;

                if (y1 < 0) {
                    y1 = 0;
                }

                if (y2 > heightM1) {
                    y2 = heightM1;
                }

                for (x = 0; x < width; x++) {
                    // rectangle's X coordinates
                    x1 = x - radius;
                    x2 = x + radius;

                    l = bwImage[y][x];

                    if (x1 < 0) {
                        x1 = 0;
                    }

                    if (x2 > widthM1) {
                        x2 = widthM1;
                    }

                    out = l < ((integralImage[y2][x2] + integralImage[y1][x1] - integralImage[y2][x1] - integralImage[y1][x2]) / ((x2 - x1) * (y2 - y1)) * avgBrightnessPart) ? 0 : 0xff;

                    data8[ptr++] = out;
                    data8[ptr++] = out;
                    data8[ptr++] = out;
                    data8[ptr++] = out ^ 0xff;
                }
            }
        };


        Object.defineProperty(BradleyThreshold.prototype, "windowSize", {
            get: function () {
                return this._windowSize;
            },
            set: function (value) {
                this._windowSize = Math.max(3, value | 1);
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(BradleyThreshold.prototype, "pixelBrightnessDifferenceLimit", {
            get: function () {
                return this._pixelBrightnessDifferenceLimit;
            },
            set: function (value) {
                this._pixelBrightnessDifferenceLimit = Math.max(0, Math.min(1, value));
            },
            enumerable: true,
            configurable: true
        });
        return BradleyThreshold;
    })();
    ocr.BradleyThreshold = BradleyThreshold;
})(ocr || (ocr = {}));