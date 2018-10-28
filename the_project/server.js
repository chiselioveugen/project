const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.static('public'));
app.listen(80, () => {
    console.log('Server Started!');
});
