const webcam = document.getElementById('webcam');
const pconsole = document.getElementById('console');
const btnAddLabel = document.getElementById('addLabel');
const btnAddMe = document.getElementById('addMe');
const inputLabel = document.getElementById('inputLabel');

let facesRegistered = {}; // {label1: desc1, label2: desc2, ...}
let myFaceDescriptors = []; // [desc1, des2, ...]

async function main(){
    console.log('loading the model..');
    // await faceapi.loadSsdMobilenetv1Model('/model');
    await faceapi.loadTinyFaceDetectorModel('/model');
    await faceapi.loadFaceLandmarkTinyModel('/model');
    await faceapi.loadFaceRecognitionModel('/model');
    console.log('successfully loaded model');

    console.log(faceapi.nets);

    console.log('start detecting faces..');
    setInterval( async () => {
        const useTinyModel = true;
        const detections = await faceapi
            .detectAllFaces(webcam, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(useTinyModel).withFaceDescriptors();
        var result = null;
        if (detections.length && myFaceDescriptors.length){
            // ada wajah terdeteksi

            // init my face labeled descriptor
            const myLabel = 'This is Me!!'
            const myFaceLabeled = new faceapi.LabeledFaceDescriptors(
                myLabel,
                myFaceDescriptors
            );
            // console.log('My Face Labeled: ', myFaceLabeled);

            const faceMatcher = new faceapi.FaceMatcher(myFaceLabeled);
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
    }, 100);
}

navigator.mediaDevices.getUserMedia({
    video: {}, audio: false
}).then(stream => {
    webcam.srcObject = stream;
    webcam.width = 224;
    webcam.height = 224;
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
    const useTinyModel = true;
    const newDescriptor = await faceapi
        .detectSingleFace(webcam, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(useTinyModel).withFaceDescriptor();

    console.log(`${newLabel} Descriptor: `, newDescriptor);

    registerNewFace(newLabel, [newDescriptor.descriptor]);

    /**
     * TODO: simpan newLabel and newDescriptor ke db
     * ...
     */
});

function registerNewFace(label, descriptors) {
    facesRegistered[label] = descriptors;
    console.log('Faces Registered: ', facesRegistered);
}

async function registerMyFace() {
    const myNewDescriptor = await faceapi
        .detectSingleFace(webcam, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true).withFaceDescriptor();

    myFaceDescriptors.push(myNewDescriptor.descriptor);
    console.log(`My Face Descriptor: `, myFaceDescriptors);
}