const express = require('express')
const app = express()

const PORT = 3000

app.set('view engine', 'pug')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('index', {title: 'Get Started'})
})

app.listen(PORT, () => {
    console.log('server running on http://localhost:'+PORT);
})