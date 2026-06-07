const bcrypt = require('bcryptjs');

const hash = '$2a$10$WGAwaofyR57z62v1BmP6sOmvPEMA3PCBOXt...'; // paste FULL hash from DB

bcrypt.compare('Admin@123', hash)
  .then(result => console.log(result));