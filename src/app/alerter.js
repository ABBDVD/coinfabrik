var mail = require('mail').Mail({
  host: 'mail.gandi.net',
  username: 'cdx@mngn.io',
  password: ''
});

mail.message({
  from: 'sender@example.net',
  to: ['micha@roon.me'],
  subject: 'Hello from Node.JS'
})
  .body('Node speaks SMTP!')
  .send(function(err) {
    if (err) throw err;
    console.log('Sent!');
  })