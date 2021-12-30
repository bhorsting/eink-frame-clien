const WIDTH = 480;
const HEIGHT = 800;
(function () {
    window.addEventListener('DOMContentLoaded', async () => {
        var bradleyThresholder = new ocr.BradleyThreshold(),
            canvas = document.createElement('canvas'),
            video = document.getElementById("video"),
            outputCanvas,
            ctxOut,
            videoObj = {
                video: {
                    facingMode: {exact: 'environment'},
                    width: {
                        min: 1280
                    },
                    height: {
                        min: 720
                    },
                },
                audio: false,
            },
            ctx = canvas.getContext('2d'),
            errBack = function (error) {
                console.log("Video capture error: ", error.code);
            };

        outputCanvas = document.getElementById('outputCanvas');
        ctxOut = outputCanvas.getContext('2d');
        // Put video listeners into place

        function debug(txt){
            return;
            const div = document.createElement('div');
            div.innerText = txt;
            document.body.appendChild(div);
        }

        if (navigator.getUserMedia) { // Standard

            /* get user's permission to muck around with video devices */
            const tempStream = await navigator.mediaDevices.getUserMedia({video:true, audio: false});
            const devices = await navigator.mediaDevices.enumerateDevices();
            let frontDeviceId
            let backDeviceId
            if (devices.length > 0) {
                /* defaults so all this will work on a desktop */
                frontDeviceId = devices[0].deviceId;
                backDeviceId = devices[0].deviceId;
            }
            /* look for front and back devices */
            devices.forEach (device => {
                if( device.kind === 'videoinput' ) {
                    debug(device.label + device.deviceId);
                    if( device.label && device.label.length > 0 ) {
                        if( device.label.toLowerCase().indexOf( 'back' ) >= 0 )
                            backDeviceId = device.deviceId
                        else if( device.label.toLowerCase().indexOf( 'front' ) >= 0 )
                            frontDeviceId = device.deviceId
                    }
                }
            });

            debug(`FRONT ${frontDeviceId}`);

            /* close the temp stream */
            const tracks = tempStream.getTracks()
            if( tracks )
                for( let t = 0; t < tracks.length; t++ ) tracks[t].stop()
            /* open the device you want */
            const constraints = {
                video: {
                    deviceId: backDeviceId,
                }
            };

            debug( `CHOSEN ${constraints.video.deviceId}`);


            const stream = await navigator.mediaDevices.getUserMedia(constraints);


            video.srcObject = stream;
            video.onloadedmetadata = (e) => {
                video.play();
                setInterval( () =>{
                    canvas.width = WIDTH;
                    canvas.height = HEIGHT;
                    outputCanvas.width = WIDTH;
                    outputCanvas.height = HEIGHT;
                    // get the scale
                    var scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
                    // get the top left position of the image
                    var x = (canvas.width / 2) - (video.videoWidth / 2) * scale;
                    var y = (canvas.height / 2) - (video.videoHeight / 2) * scale;
                    ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
                    process();
                }, 50);
            };

        } else {
            console.log('FORGET IT');
        }

        function process() {
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            //bradleyThresholder.setImageData(imageData);
            //bradleyThresholder.process();
            //autoluma(imageData, 0.5, canvas.width, canvas.height);
            monochrome(imageData, 0.5);
            ctxOut.putImageData(imageData, 0, 0);
        }

        function saveData() {
            const rotateCanvas = document.createElement('canvas');
            rotateCanvas.width = outputCanvas.height;
            rotateCanvas.height = outputCanvas.width;
            const context = rotateCanvas.getContext('2d');
            context.clearRect(0,0,rotateCanvas.width,rotateCanvas.height);
            // save the unrotated context of the canvas so we can restore it later
            // the alternative is to untranslate & unrotate after drawing
            context.save();
            // move to the center of the canvas
            context.translate(rotateCanvas.width/2,rotateCanvas.height/2);
            // rotate the canvas to the specified degrees
            context.rotate(270*Math.PI/180);
            // draw the image
            // since the context is rotated, the image will be rotated also
            context.drawImage(outputCanvas,-outputCanvas.width/2,-outputCanvas.height/2);
            // we’re done with the rotating so restore the unrotated context
            context.restore();
            //var data = rotateCanvas.toBmp();
            const data = rotateCanvas.toBlob((blob)=>{
                //saveAs(blob, "test.png");
                const formData = new FormData()
                formData.append('file', blob, 'test.png');
                fetch('http://eink.hopto.org:44444/test.bmp', {
                    method: 'POST',
                    body: formData
                })
                    .then(r => r.json())
                    .then(data => {
                        console.log(data)
                    })
            },'image/png');

        }

        window.addEventListener('click', saveData);

    })
})();


