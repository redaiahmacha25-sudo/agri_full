const bcrypt = require('bcryptjs');

const password = "Admin@123";

bcrypt.hash(password, 10).then(hash => {
  console.log("Generated Hash:", hash);

  bcrypt.compare(password, hash).then(result => {
    console.log("Match result:", result);
  });
});