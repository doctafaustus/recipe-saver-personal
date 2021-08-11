// NOTE: Delete raw data after use for privacy reasons

const fs = require('fs');
const users = require('../users_backup.js');

console.log(users.length);

users.forEach(user => {
  user.profileImage = 'https://res.cloudinary.com/dzynqn10l/image/upload/v1628695697/recipe-saver-personal/default-profile_1_jithvf.jpg';

  if (user.subscription === 'Full (Legacy)') {
    user.appVersion = 1;
  } else {
    user.appVersion = 2;
  }
  user.appVersion
});

fs.writeFile('users_new.json', JSON.stringify(users), 'utf8', () => {
  console.log('done');
});