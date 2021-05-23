// const nodemailer = require('nodemailer');
// const fs = require('fs');
// const emailPass = process.env.PORT ? process.env.EMAIL_PASS : fs.readFileSync('./private/email_pass.txt').toString();

// const transporter = nodemailer.createTransport({
//   host: 'smtp.mailgun.org', 
//   port: 465, 
//   auth: { 
//     user: 'contact@recipesaver.me',
//     pass: emailPass,
//   },
//   secure: true,
// });


// module.exports = transporter;