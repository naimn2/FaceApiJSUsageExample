const webcam = document.getElementById('webcam');
const pconsole = document.getElementById('console');
const btnAddLabel = document.getElementById('addLabel');
const btnAddMe = document.getElementById('addMe');
const inputLabel = document.getElementById('inputLabel');
const canvas = document.getElementById('canvas');

const displaySize = { width: webcam.width, height: webcam.height };
let showFaceLocation = false;
let showFaceLandmarks = false;

let facesRegistered = []; // [{label:* , desc:*}, {...}, ...]
let myFaceDescriptors = []; // [desc1, des2, ...]

async function main() {
    console.log('loading the model..');
    await faceapi.loadSsdMobilenetv1Model('/model');
    // await faceapi.loadTinyFaceDetectorModel('/model');
    await faceapi.loadFaceLandmarkModel('/model');
    await faceapi.loadFaceRecognitionModel('/model');
    console.log('successfully loaded model');

    console.log('start detecting faces..');
    // Start looping for classify
    setInterval(async () => {
        // detect faces
        const detections = await faceapi
            .detectAllFaces(webcam)
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (showFaceLocation){
            // resize the detected boxes in case your displayed image has a different size then the original
            const detectionsForSize = faceapi.resizeResults(detections, displaySize);
            // draw them into a canvas
            canvas.width = webcam.width;
            canvas.height = webcam.height;
            const showDetectionScore = false;
            faceapi.draw.drawDetections(canvas, detectionsForSize, { withScore: showDetectionScore });
        }

        if (showFaceLandmarks){
            // resize the detected boxes and landmarks in case your displayed image has a different size then the original
            const detectionsWithLandmarksForSize = faceapi.resizeResults(detections, displaySize);
            // draw them into a canvas
            canvas.width = webcam.width;
            canvas.height = webcam.height;
            faceapi.draw.drawFaceLandmarks(canvas, detectionsWithLandmarksForSize, { drawLines: true });
        }

        var result = null;
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
                faceMatcher = new faceapi.FaceMatcher([...facesRegistered, myFaceLabeled]);
            } else {
                faceMatcher = new faceapi.FaceMatcher(facesRegistered);
            }
            // console.log('My Face Labeled: ', myFaceLabeled);

            detections.forEach(desc => {
                // console.log('Descriptor: \n', desc);
                const bestMatch = faceMatcher.findBestMatch(desc.descriptor);
                result = bestMatch.toString();
                // result = detections.length;
            });
        } else if (detections.length && !myFaceDescriptors.length) {
            result = 'Unknown';
        } else {
            result = 'No';
        }
        pconsole.innerText = `${result} face detected!`;
    }, 10);
}

navigator.mediaDevices.getDisplayMedia({
    video: {}, audio: false
}).then(stream => {
    webcam.srcObject = stream;
    webcam.clientWidth = 224;
    webcam.clientHeight = 224;
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
     * ...fgfhffgffgfgfg
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
    const myNewDescriptor = await faceapi
        .detectSingleFace(webcam)
        .withFaceLandmarks()
        .withFaceDescriptor();

    myFaceDescriptors.push(myNewDescriptor.descriptor);
    console.log(`My Face Descriptor: `, myFaceDescriptors);
}