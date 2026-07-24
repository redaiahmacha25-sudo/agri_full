const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');


/* =========================
   LOGIN
========================= */
const login = async (req, res, next) => {
  try {

    let { phone, password } = req.body;


    if (!phone || !password) {
      return res.status(400).json({
        success:false,
        message:'Phone and password are required.'
      });
    }


    phone = String(phone).trim();
    password = String(password).trim();


    console.log('[LOGIN] phone:', phone);
    console.log('[LOGIN] password length:', password.length);



    const result = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );


    if (result.rows.length === 0) {
      return res.status(401).json({
        success:false,
        message:'Invalid credentials.'
      });
    }


    const user = result.rows[0];


    // PostgreSQL boolean check
    if (user.is_active === false) {
      return res.status(403).json({
        success:false,
        message:'Account is inactive.'
      });
    }



    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );


    console.log('[LOGIN] bcrypt result:', valid);



    if(!valid){
      return res.status(401).json({
        success:false,
        message:'Invalid credentials.'
      });
    }



    const token = jwt.sign(
      {
        id:user.id,
        name:user.name,
        phone:user.phone,
        role:user.role
      },

      process.env.JWT_SECRET || 'agriconnect_secret',

      {
        expiresIn:'24h'
      }
    );



    return res.json({

      success:true,

      message:'Login successful',

      token,

      user:{
        id:user.id,
        name:user.name,
        phone:user.phone,
        role:user.role,
        village:user.village,
        district:user.district
      }

    });



  }catch(err){
    next(err);
  }
};





/* =========================
   REGISTER
========================= */

const register = async(req,res,next)=>{

try{


let {
name,
phone,
password,
village,
district,
aadhar_number,
bank_account,
ifsc_code

}=req.body;



if(!name || !phone || !password){

return res.status(400).json({

success:false,

message:'Name, phone, and password are required.'

});

}



phone=String(phone).trim();
password=String(password).trim();





const existing = await db.query(

'SELECT id FROM users WHERE phone=$1',

[phone]

);



if(existing.rows.length){

return res.status(409).json({

success:false,

message:'Phone number already registered.'

});

}





const hashedPassword =
await bcrypt.hash(password,10);





const result = await db.query(

`
INSERT INTO users
(
name,
phone,
password_hash,
role,
village,
district,
aadhar_number,
bank_account,
ifsc_code,
is_active
)

VALUES
(
$1,
$2,
$3,
'farmer',
$4,
$5,
$6,
$7,
$8,
true
)

RETURNING id

`,

[
name,
phone,
hashedPassword,
village || null,
district || null,
aadhar_number || null,
bank_account || null,
ifsc_code || null
]


);





return res.status(201).json({

success:true,

message:'Registration successful',

userId:result.rows[0].id

});




}catch(err){

next(err);

}

};







/* =========================
   PROFILE
========================= */


const getProfile = async(req,res,next)=>{

try{


const result = await db.query(

`
SELECT 
id,
name,
phone,
email,
role,
village,
district,
state,
aadhar_number,
bank_account,
ifsc_code,
created_at

FROM users

WHERE id=$1
`,

[req.user.id]

);





if(result.rows.length===0){

return res.status(404).json({

success:false,

message:'User not found'

});

}





return res.json({

success:true,

user:result.rows[0]

});





}catch(err){

next(err);

}

};




module.exports={
login,
register,
getProfile
};