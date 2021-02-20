const webcamElement = document.getElementById('webcam');

const classifier = knnClassifier.create();

let webcam = null;
let detector = null;

const addExample = async classId => {
    // Capture an image from the web camera.
    const img = await webcam.capture();

    const facesDetected = await detector.estimateFaces(img, false);
    if (!facesDetected.length){
        document.getElementById('console').innerText = 'No face detected';
    } else if (facesDetected.length > 1){
        document.getElementById('console').innerText = `There must be only 
        one face!`;
    } else {
        // const cropped = crop(img, facesDetected[0]);
        // console.log('Cropped!');

        // Get the intermediate activation of MobileNet 'conv_preds' and pass that
        // to the KNN classifier.
        const activation = net.infer(img, true);

        // Pass the intermediate activation to the classifier.
        classifier.addExample(activation, classId);
    }
    console.log('Dataset: ', classifier.getClassifierDataset());
    // Dispose the tensor to release the memory.
    img.dispose();
};

async function app() {
    // console.log('Loading face-mesh..');
    // const model = await facemesh.load();
    // console.log('Successfully loaded face-mesh');

    console.log('Loading Blazeface Detector..');
    detector = await blazeface.load();
    console.log('Successfully loaded detector');

    console.log('Loading mobilenet..');
    // Load the model.
    net = await mobilenet.load();
    console.log('Successfully loaded model');

    // Create an object from Tensorflow.js data API which could capture image 
    // from the web camera as Tensor.
    webcam = await tf.data.webcam(webcamElement);

    const myFaceLabel = 'This is Me!!';
    const otherLabel = 'Others';

    document.getElementById('present').addEventListener('click', () => addExample(myFaceLabel));
    document.getElementById('away').addEventListener('click', () => addExample(otherLabel));

    // Add other faces dataset
    // const OTHER_FACE_URL = '/model/datasets';
    

    while (true) {
        if (classifier.getNumClasses() > 0) {
            console.log('Face Detected');
            const img = await webcam.capture();

            // PERCOBAAN
            // const predictions = await model.estimateFaces(img);
            // console.log(predictions);

            const facesDetected = await detector.estimateFaces(img, false);
            var result = null;
            if (facesDetected.length){
                // const cropped = crop(img, facesDetected[0]);
                
                // Get the activation from mobilenet from the webcam.
                const activation = net.infer(img, 'conv_preds');
                // Get the most likely class and confidence from the classifier module.
                result = await classifier.predictClass(activation);
                // const classes = ['Present', 'Away'];
                var prediction = null;
                prediction = result.label;
                if (result.label !== myFaceLabel) {
                    prediction = otherLabel;
                }
                document.getElementById('console').innerText = `
                    prediction: ${prediction}\n
                    probability: ${result.confidences[result.label]}\n
                    faces: ${facesDetected.length}
                `;
            } else {
                prediction = otherLabel;
                document.getElementById('console').innerText = `
                    prediction: ${prediction}\n
                    probability: 1\n
                    faces: no face
                `;
            }

            // Dispose the tensor to release the memory.
            img.dispose();
        }

        await tf.nextFrame();
    }
}

// function crop(img, faceDetected){
//     console.log('Start cropping input..');
//     const start = faceDetected.topLeft;
//     const end = faceDetected.bottomRight;
//     const size = [end[0] - start[0], end[1] - start[1]];
//     console.log('start: ', start);
//     console.log('end: ', end);
//     console.log('size: ', size);
//     // Crop the image
//     const boxes = tf.concat([start, end]).reshape([-1, 4]);
//     console.log('Boxes: ', boxes);
//     return tf.image.cropAndResize(img.expandDims(), boxes, [0], size, method='nearest');
// }

app();