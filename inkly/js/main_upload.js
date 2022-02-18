const WIDTH = 480;
const HEIGHT = 800;

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

const filename = params?.filename;

const Config = {
     USE_DITHER : params?.dither === 'true',
     FILENAME : filename || 'test.png',
     IMAGE_FORMAT : filename?.indexOf('.jpg') ? 'image/jpeg' : 'image/png',
}

console.log('Config', Config);

(function () {
    let updating = true;
    window.addEventListener('DOMContentLoaded', async () => {
        const recordButton = document.getElementById('recordButton');
        const selectFileButton = document.getElementById('selectFileButton');
        const fileSelector = document.getElementById('fileSelector');
        const acceptUI = document.getElementById('accept_ui');
        const acceptButton = document.getElementById('accept');
        const rejectButton = document.getElementById('reject');
        const canvas = document.createElement('canvas');
        const video = document.getElementById("video");
        let outputCanvas;
        let ctxOut;
        const videoObj = {
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
        };
        const ctx = canvas.getContext('2d');


        outputCanvas = document.getElementById('outputCanvas');
        ctxOut = outputCanvas.getContext('2d');

        // Put video listeners into place

        function debug(txt) {
            return;
            const div = document.createElement('div');
            div.innerText = txt;
            document.body.appendChild(div);
        }

        if (navigator.getUserMedia) { // Standard

            /* get user's permission to muck around with video devices */
            const tempStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
            const devices = await navigator.mediaDevices.enumerateDevices();
            let frontDeviceId
            let backDeviceId
            if (devices.length > 0) {
                /* defaults so all this will work on a desktop */
                frontDeviceId = devices[0].deviceId;
                backDeviceId = devices[0].deviceId;
            }
            /* look for front and back devices */
            devices.forEach(device => {
                if (device.kind === 'videoinput') {
                    debug(device.label + device.deviceId);
                    if (device.label && device.label.length > 0) {
                        if (device.label.toLowerCase().indexOf('back') >= 0)
                            backDeviceId = device.deviceId
                        else if (device.label.toLowerCase().indexOf('front') >= 0)
                            frontDeviceId = device.deviceId
                    }
                }
            });

            debug(`FRONT ${frontDeviceId}`);

            /* close the temp stream */
            const tracks = tempStream.getTracks()
            if (tracks)
                for (let t = 0; t < tracks.length; t++) tracks[t].stop()
            /* open the device you want */
            const constraints = {
                video: {
                    deviceId: backDeviceId,
                }
            };

            debug(`CHOSEN ${constraints.video.deviceId}`);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = stream;
            video.onloadedmetadata = (e) => {
                video.play();
                setInterval(() => {
                    if (updating) {
                        canvas.width = WIDTH;
                        canvas.height = HEIGHT;
                        outputCanvas.width = WIDTH;
                        outputCanvas.height = HEIGHT;
                        // get the scale
                        const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
                        // get the top left position of the image
                        const x = (canvas.width / 2) - (video.videoWidth / 2) * scale;
                        const y = (canvas.height / 2) - (video.videoHeight / 2) * scale;
                        ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale);
                        process();
                    }
                }, 50);
            };

        } else {
            console.log('FORGET IT');
        }

        function process() {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (Config.USE_DITHER) {
                monochrome(imageData, 0.5);
            }
            ctxOut.putImageData(imageData, 0, 0);
        }

        async function saveData() {
            const rotateCanvas = document.createElement('canvas');
            rotateCanvas.width = outputCanvas.height;
            rotateCanvas.height = outputCanvas.width;
            const context = rotateCanvas.getContext('2d');
            context.clearRect(0, 0, rotateCanvas.width, rotateCanvas.height);
            // save the unrotated context of the canvas so we can restore it later
            // the alternative is to untranslate & unrotate after drawing
            context.save();
            // move to the center of the canvas
            context.translate(rotateCanvas.width / 2, rotateCanvas.height / 2);
            // rotate the canvas to the specified degrees
            context.rotate(270 * Math.PI / 180);
            // draw the image
            // since the context is rotated, the image will be rotated also
            context.drawImage(outputCanvas, -outputCanvas.width / 2, -outputCanvas.height / 2);
            // we’re done with the rotating so restore the unrotated context
            context.restore();
            //var data = rotateCanvas.toBmp();
            const dataString = rotateCanvas.toDataURL(Config.IMAGE_FORMAT,0.5);
            const blob = dataURItoBlob(dataString);
            //saveAs(blob, "test.png");
            const data = new FormData()
            const fileOfBlob = new File([blob], Config.FILENAME);
            data.append('image', fileOfBlob)
            const response = await fetch('https://www.bas-horsting.com/einkupload/upload', {
                method: 'POST',
                mode: 'no-cors',
                body: data
            });
            resumeRecording();
            console.log(response);
        }

        function initWorker() {
            worker = new Worker("pngquant/worker.js");
            worker.onmessage = function (event) {
                const message = event.data;
                if (message.type == "stdout") {
                    console.log(message.data);
                } else if (message.type == "start") {
                    console.log("Worker has received command");
                } else if (message.type == "done") {
                    console.log("Conversion is done");
                    var buffers = message.data;
                    buffers && buffers.forEach(async (file) => {
                        const response = await fetch('https://www.bas-horsting.com/einkupload/upload', {
                            method: 'POST',
                            mode: 'no-cors',
                            body: file.data
                        });
                        console.log(response);
                        resumeRecording();
                    });
                }
            };
        }

        function dataURItoBlob(dataURI) {
            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
            const byteString = atob(dataURI.split(',')[1]);

            // separate out the mime component
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

            // write the bytes of the string to an ArrayBuffer
            const ab = new ArrayBuffer(byteString.length);

            // create a view into the buffer
            const ia = new Uint8Array(ab);

            // set the bytes of the buffer to the correct values
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // write the ArrayBuffer to a blob, and you're done
            const blob = new Blob([ab], {type: mimeString});
            return blob;

        }

        function handleCameraClick(){
            updating = false;
            selectFileButton.style.visibility = 'hidden';
            recordButton.style.visibility = 'hidden';
            acceptUI.style.visibility = 'visible';
        }

        function handleUploadClick() {
            updating = false;
            fileSelector.click();
        }

        function handleFileChange() {
            const file = fileSelector.files[0];
            const fr = new FileReader();
            fr.onload = (ev => {
                const img = new Image();
                img.onload = (ev1) => {
                    console.log('Drawing image on ', ctx);
                    // get the scale
                    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
                    // get the top left position of the image
                    const x = (canvas.width / 2) - (img.width / 2) * scale;
                    const y = (canvas.height / 2) - (img.height / 2) * scale;
                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
                    process();
                    handleCameraClick();
                    fileSelector.value = "";
                };
                img.src = fr.result;
            });   // onload fires after reading is complete
            fr.readAsDataURL(file);    // begin reading
        }

        function handleFileCancel() {
            updating = true;
        }

        function resumeRecording(){
            updating = true;
            selectFileButton.style.visibility = 'visible';
            recordButton.style.visibility = 'visible';
            acceptUI.style.visibility = 'hidden';
        }


        acceptButton.addEventListener('click', saveData);
        rejectButton.addEventListener('click', resumeRecording);
        recordButton.addEventListener('click', handleCameraClick);
        selectFileButton.addEventListener('click', handleUploadClick);
        fileSelector.addEventListener('change', handleFileChange);
        fileSelector.addEventListener('cancel', handleFileCancel);
    })
})();


