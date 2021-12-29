function autoluma (idata, thold, width, height) {   //thold = % of hist max

    var data,
        i, min = -1, max = -1,             // to find min-max
        maxH = 0,                          // to find scale of histogram
        scale,
        hgram = new Uint32Array(width);    // histogram buffer (or use Float32)

    // get image data
    data = idata.data;  // the bitmap itself

    // get lumas and build histogram
    for(i = 0; i < data.length; i += 4) {
        var luma = Math.round(rgb2luma(data, i));
        hgram[luma]++;   // add to the luma bar (and why we need an integer)
    }

    // find tallest bar so we can use that to scale threshold
    for(i = 0; i < width; i++) {
        if (hgram[i] > maxH) maxH = hgram[i];
    }

    // use that for threshold
    thold *= maxH;

    // find min value
    for(i = 0; i < width * 0.5; i++) {
        if (hgram[i] > thold) {
            min = i;
            break;
        }
    }
    if (min < 0) min = 0;             // not found, set to default 0

    // find max value
    for(i = width - 1; i > width * 0.5; i--) {
        if (hgram[i] > thold) {
            max = i;
            break;
        }
    }
    if (max < 0) max = 255;           // not found, set to default 255

    scale = 255 / (max - min) * 2;    // x2 compensates (play with value)

    // scale all pixels
    for(i = 0; i < data.length; i += 4) {
        data[i  ] = Math.max(0, data[i] - min) * scale;
        data[i+1] = Math.max(0, data[i+1] - min) * scale;
        data[i+2] = Math.max(0, data[i+2] - min) * scale;
    }

}

function rgb2luma(px, pos) {
    return px[pos] * 0.299 + px[pos+1] * 0.587 + px[pos+2] * 0.114
}
