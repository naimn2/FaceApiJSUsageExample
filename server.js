const express = require('express');
const app = express();
const faceapi = require('face-api.js');

const PORT = 3000;

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/room', (req, res) => {
    res.render('index', {title: 'Contoh Penggunaan FACE-API.JS'})
});

app.get('/register', (req, res) => {
    res.redirect('/room');
});

app.listen(PORT, () => {
    console.log('server running on http://localhost:'+PORT);
});