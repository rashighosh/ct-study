const express = require('express');
const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');

// index page
app.get('/', function(req, res) {
    res.render('interaction.ejs');
  });

app.listen(3000, () => console.log('Server running on http://localhost:3000'));