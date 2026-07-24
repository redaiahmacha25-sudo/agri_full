const db = require('../config/database');


const getSellRequests = async (req, res, next) => {
  try {
    const { role, id } = req.user;

    let query = `
      SELECT sr.*, 
             u.name AS farmer_name,
             u.phone AS farmer_phone,
             u.village AS farmer_village,
             c.name AS crop_name,
             c.govt_price,
             c.unit,
             v.name AS verifier_name,
             a.name AS approver_name
      FROM sell_requests sr
      JOIN users u ON sr.farmer_id = u.id
      JOIN crops c ON sr.crop_id = c.id
      LEFT JOIN users v ON sr.verified_by = v.id
      LEFT JOIN users a ON sr.approved_by = a.id
    `;

    const params = [];

    if (role === 'farmer') {
      query += ` WHERE sr.farmer_id = $1`;
      params.push(id);

    } else if (role === 'employee') {
      query += ` WHERE sr.status IN ('pending','verified','rejected')
                 OR sr.verified_by = $1`;
      params.push(id);
    }

    query += ` ORDER BY sr.created_at DESC`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      requests: result.rows
    });

  } catch(err){
    next(err);
  }
};



const getSellRequestById = async(req,res,next)=>{
  try{

    const result = await db.query(
    `
    SELECT sr.*,
           u.name AS farmer_name,
           u.phone AS farmer_phone,
           u.village AS farmer_village,
           c.name AS crop_name,
           c.govt_price,
           c.unit,
           v.name AS verifier_name,
           a.name AS approver_name
    FROM sell_requests sr
    JOIN users u ON sr.farmer_id=u.id
    JOIN crops c ON sr.crop_id=c.id
    LEFT JOIN users v ON sr.verified_by=v.id
    LEFT JOIN users a ON sr.approved_by=a.id
    WHERE sr.id=$1
    `,
    [req.params.id]
    );


    if(result.rows.length===0)
      return res.status(404).json({
        success:false,
        message:"Request not found."
      });


    const remarks = await db.query(
    `
    SELECT r.*,u.name AS author
    FROM remarks r
    JOIN users u ON r.created_by=u.id
    WHERE r.entity_type='sell_request'
    AND r.entity_id=$1
    ORDER BY r.created_at ASC
    `,
    [req.params.id]
    );


    res.json({
      success:true,
      request:result.rows[0],
      remarks:remarks.rows
    });


  }catch(err){
    next(err);
  }
};



const createSellRequest = async(req,res,next)=>{

try{

const {
crop_id,
quantity,
village,
harvest_date,
notes,
geo_lat,
geo_lng
}=req.body;


if(!crop_id || !quantity)
return res.status(400).json({
success:false,
message:"Crop and quantity required."
});


const crop = await db.query(
`SELECT govt_price FROM crops WHERE id=$1`,
[crop_id]
);


const expected_amount =
Number(quantity) *
Number(crop.rows[0].govt_price);



const image_url=req.file?
`/uploads/${req.file.filename}`:null;



const result = await db.query(
`
INSERT INTO sell_requests
(
farmer_id,
crop_id,
quantity,
image_url,
village,
harvest_date,
notes,
geo_lat,
geo_lng,
expected_amount
)
VALUES
($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
RETURNING id
`,
[
req.user.id,
crop_id,
quantity,
image_url,
village || null,
harvest_date || null,
notes || null,
geo_lat || null,
geo_lng || null,
expected_amount
]
);



await db.query(
`
INSERT INTO notifications
(user_id,title,message,type)
SELECT id,
'New Sell Request',
'A new sell request requires verification.',
'info'
FROM users
WHERE role='employee'
`
);



res.status(201).json({
success:true,
message:"Sell request submitted successfully.",
id:result.rows[0].id
});


}catch(err){
next(err);
}

};



const verifySellRequest = async(req,res,next)=>{

try{

const rows=await db.query(
`SELECT * FROM sell_requests WHERE id=$1`,
[req.params.id]
);


if(rows.rows.length===0)
return res.status(404).json({
success:false,
message:"Request not found."
});


if(rows.rows[0].status!=='pending')
return res.status(400).json({
success:false,
message:"Request already processed."
});


const newStatus =
req.body.action==='verify'
?'verified'
:'rejected';



await db.query(
`
UPDATE sell_requests
SET status=$1,
verified_by=$2,
verified_at=NOW(),
rejection_reason=$3
WHERE id=$4
`,
[
newStatus,
req.user.id,
req.body.rejection_reason || null,
req.params.id
]
);



res.json({
success:true,
message:`Request ${newStatus} successfully.`
});


}catch(err){
next(err);
}

};



module.exports={
getSellRequests,
getSellRequestById,
createSellRequest,
verifySellRequest
};