const webcam = document.getElementById('webcam');
const pconsole = document.getElementById('console');
const btnAddLabel = document.getElementById('addLabel');
const btnAddMe = document.getElementById('addMe');
const inputLabel = document.getElementById('inputLabel');
const canvas = document.getElementById('canvas');

let showFaceLocation = true;
let showFaceLandmarks = false;

let facesRegistered = []; // [{label:* , desc:*}, {...}, ...]
let myFaceDescriptors = []; // [desc1, des2, ...]

async function main() {
    const displaySize = { width: webcam.width, height: webcam.height };

    console.log('loading the model..');
    await faceapi.loadSsdMobilenetv1Model('/model');
    // await faceapi.loadTinyFaceDetectorModel('/model');
    await faceapi.loadFaceLandmarkModel('/model');
    await faceapi.loadFaceRecognitionModel('/model');
    console.log('successfully loaded model');

    // console.log('registering faces..');
    // await registerOtherFace();
    // console.log('completely registered faces');

    console.log('start detecting faces..');
    /**
     * Start looping for classify
     */
    setInterval(async () => {
        // detect faces
        const detections = await faceapi
            .detectAllFaces(webcam)
            .withFaceLandmarks()
            .withFaceDescriptors();

        var results = [];
        if (detections.length && (myFaceDescriptors.length || facesRegistered.length)) {
            // ada wajah terdeteksi

            // init my face labeled descriptor
            var myFaceLabeled = null;
            const myLabel = 'This is Me!!';
            var faceMatcher = null;
            if (myFaceDescriptors.length) {
                myFaceLabeled = new faceapi.LabeledFaceDescriptors(
                    myLabel,
                    myFaceDescriptors
                );
                faceMatcher = new faceapi.FaceMatcher([...facesRegistered, myFaceLabeled], 0.5);
            } else {
                faceMatcher = new faceapi.FaceMatcher(facesRegistered, 0.5);
            }
            // console.log('My Face Labeled: ', myFaceLabeled);

            detections.forEach(desc => {
                // console.log('Descriptor: \n', desc);
                const bestMatch = faceMatcher.findBestMatch(desc.descriptor);
                results.push(bestMatch.toString());
                // result = detections.length;
            });
        } else if (detections.length && !myFaceDescriptors.length) {
            results.push('Kamu siapaa??');
        } else {
            results.push('No');
        }
        pconsole.innerText = `${results} face detected!`;

        if (showFaceLocation){
            // setup the canvas
            canvas.width = webcam.width;
            canvas.height = webcam.height;
            // resize the detected boxes in case your displayed image has a different size then the original
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            // draw boxes
            resizedDetections.forEach((detection, i) => {
                const box = detection.detection.box;
                const drawBox = new faceapi.draw.DrawBox(box, {label: results[i%results.length]});
                drawBox.draw(canvas);
            });
            // const showDetectionScore = false;
            // faceapi.draw.drawDetections(canvas, resizedDetections, { withScore: showDetectionScore });
            // faceapi.draw.drawDetections(canvas, boxesWithText);
        }

        if (showFaceLandmarks){
            // resize the detected boxes and landmarks in case your displayed image has a different size then the original
            const resizedDetectionsWithLandmarks = faceapi.resizeResults(detections, displaySize);
            // draw them into a canvas
            canvas.width = webcam.width;
            canvas.height = webcam.height;
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetectionsWithLandmarks, { drawLines: false });
        }

    }, 150);
}

navigator.mediaDevices.getUserMedia({
    video: {}, audio: false
}).then(stream => {
    webcam.srcObject = stream;
    webcam.msVertivalMirror = true;
});

webcam.addEventListener('play', () => {
    console.log('video start playing..');
    main();
});

btnAddMe.addEventListener('click', () => {
    registerMyFace();
});

btnAddLabel.addEventListener('click', async () => {
    const newLabel = inputLabel.value;
    const newDescriptor = await faceapi
        .detectSingleFace(webcam)
        .withFaceLandmarks()
        .withFaceDescriptor();

    console.log(`${newLabel} Descriptor: `, newDescriptor);

    registerNewFace(newLabel, [newDescriptor.descriptor]);

    /**
     * TODO: simpan newLabel and newDescriptor ke db
     * ...
     */
});

function registerNewFace(label, descriptors) {
    const newFace = new faceapi.LabeledFaceDescriptors(
        label,
        descriptors
    );
    facesRegistered.push(newFace);
    console.log('Faces Registered: ', facesRegistered);
}

async function registerMyFace() {
    console.log('Registering My Face..');
    const myNewDescriptor = await faceapi
        .detectSingleFace(webcam)
        .withFaceLandmarks()
        .withFaceDescriptor();
    
    myFaceDescriptors.push(myNewDescriptor.descriptor);
    console.log(`My Face Descriptor: `, myFaceDescriptors);
}

async function registerOtherFace() {
    for (let i = 0; i < 50; i++) {
        const imgE = document.createElement('img');
        document.body.append(imgE);
        imgE.src = '/model/datasets/'+i+'.jpg';
        const newLabel = 'Face'+i;
        const newDescriptors = await faceapi
            .detectSingleFace(imgE)
            .withFaceLandmarks()
            .withFaceDescriptor();
    
        registerNewFace(newLabel, [newDescriptors.descriptor]);       
        if (i%10==0){
            
        } else {
            imgE.remove();
        }
    }
}