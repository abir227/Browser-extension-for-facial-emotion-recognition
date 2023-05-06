const express = require('express')
const app = express()
var cors = require('cors');
const model= require('./tfjs_model7/model.json');



app.use(cors());
app.use(express.static('./modeljs'));
app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/model',function(req,res){
    res.send(model)
})


app.listen(3000);
