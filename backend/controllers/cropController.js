const db = require('../config/database');


const getAllCrops = async (req, res, next) => {
  try {

    const result = await db.query(
      `
      SELECT *
      FROM crops
      WHERE is_active = true
      ORDER BY category, name
      `
    );

    res.json({
      success:true,
      crops:result.rows
    });


  } catch(err){
    next(err);
  }
};





const getCropById = async(req,res,next)=>{

try{

const result = await db.query(
`
SELECT *
FROM crops
WHERE id=$1
`,
[req.params.id]
);



if(result.rows.length===0){

return res.status(404).json({
success:false,
message:'Crop not found.'
});

}



res.json({
success:true,
crop:result.rows[0]
});


}catch(err){

next(err);

}

};







const createCrop = async(req,res,next)=>{

try{


const {
name,
name_telugu,
category,
govt_price,
unit,
season

}=req.body;



if(!name || !govt_price){

return res.status(400).json({

success:false,

message:'Name and price required.'

});

}




const result = await db.query(

`
INSERT INTO crops
(
name,
name_telugu,
category,
govt_price,
unit,
season,
updated_by
)

VALUES
($1,$2,$3,$4,$5,$6,$7)

RETURNING id

`,

[
name,
name_telugu || null,
category || 'cereal',
govt_price,
unit || 'quintal',
season || 'all',
req.user.id
]

);





await db.query(

`
INSERT INTO notifications
(
user_id,
title,
message,
type
)

SELECT 
id,
'New Crop MSP Added',
$1,
'info'

FROM users

WHERE role='farmer'

`,

[
`${name} has been added with MSP ₹${govt_price}/quintal`
]

);






res.status(201).json({

success:true,

message:'Crop added successfully.',

id:result.rows[0].id

});



}catch(err){

next(err);

}

};








const updateCrop = async(req,res,next)=>{

try{


const {
name,
name_telugu,
category,
govt_price,
unit,
season,
is_active

}=req.body;





const existing = await db.query(

`
SELECT *
FROM crops
WHERE id=$1

`,

[req.params.id]

);




if(existing.rows.length===0){

return res.status(404).json({

success:false,

message:'Crop not found.'

});

}



const crop=existing.rows[0];





await db.query(

`
UPDATE crops

SET
name=$1,
name_telugu=$2,
category=$3,
govt_price=$4,
unit=$5,
season=$6,
is_active=$7,
updated_by=$8

WHERE id=$9

`,

[

name || crop.name,

name_telugu || crop.name_telugu,

category || crop.category,

govt_price || crop.govt_price,

unit || crop.unit,

season || crop.season,

is_active !== undefined 
? is_active 
: crop.is_active,

req.user.id,

req.params.id

]

);





res.json({

success:true,

message:'Crop updated successfully.'

});



}catch(err){

next(err);

}

};





module.exports={
getAllCrops,
getCropById,
createCrop,
updateCrop
};