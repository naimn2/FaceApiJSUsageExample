const webcamElement = document.getElementById('webcam');

const classifier = knnClassifier.create();

async function app() {
    console.log('Loading mobilenet..');

    // Load the model.
    net = await mobilenet.load();
    console.log('Successfully loaded model');

    // Create an object from Tensorflow.js data API which could capture image 
    // from the web camera as Tensor.
    const webcam = await tf.data.webcam(webcamElement);

    const addExample = async classId => {
        // Capture an image from the web camera.
        const img = await webcam.capture();

        // Get the intermediate activation of MobileNet 'conv_preds' and pass that
        // to the KNN classifier.
        const activation = net.infer(img, true);

        // Pass the intermediate activation to the classifier.
        classifier.addExample(activation, classId);

        // Dispose the tensor to release the memory.
        img.dispose();
    };

    document.getElementById('present').addEventListener('click', () => addExample(0));
    document.getElementById('away').addEventListener('click', () => addExample(1));


    while (true) {
        if (classifier.getNumClasses() > 0) {
            const img = await webcam.capture();

            // Get the activation from mobilenet from the webcam.
            const activation = net.infer(img, 'conv_preds');
            // Get the most likely class and confidence from the classifier module.
            const result = await classifier.predictClass(activation);

            const classes = ['Present', 'Away'];
            document.getElementById('console').innerText = `
                prediction: ${classes[result.label]}\n
                probability: ${result.confidences[result.label]}
            `;

            // Dispose the tensor to release the memory.
            img.dispose();
        }

        await tf.nextFrame();
    }
}

app();