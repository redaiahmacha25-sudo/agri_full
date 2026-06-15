const bcrypt = require('bcryptjs');
bcrypt.hash("Admin@123", 10).then(console.log);

bcrypt.compare('Admin@123', hash)
  .then(result => console.log(result));