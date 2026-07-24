const db = require('../config/database');


const getServiceRequests = async (req, res, next) => {
  try {

    const { role, id } = req.user;

    let query = `
      SELECT sr.*,
             u.name AS farmer_name,
             u.phone AS farmer_phone,
             u.village AS farmer_village,
             h.name AS handler_name,
             e.name AS escalated_to_name
      FROM service_requests sr
      JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN users h ON sr.handled_by = h.id
      LEFT JOIN users e ON sr.escalated_to = e.id
    `;


    const params = [];


    if(role === 'farmer'){

      query += ` WHERE sr.farmer_id = $1`;
      params.push(id);

    }
    else if(role === 'employee'){

      query += ` WHERE sr.handled_by = $1 
                 OR sr.status = 'pending'`;

      params.push(id);

    }


    query += ` ORDER BY sr.created_at DESC`;


    const result = await db.query(query,params);


    res.json({
      success:true,
      requests:result.rows
    });



  }catch(err){
    next(err);
  }
};





const getServiceRequestById = async(req,res,next)=>{

try{


const result = await db.query(
`
SELECT sr.*,
       u.name AS farmer_name,
       u.phone AS farmer_phone,
       h.name AS handler_name,
       e.name AS escalated_to_name

FROM service_requests sr

JOIN users u ON sr.farmer_id=u.id

LEFT JOIN users h ON sr.handled_by=h.id

LEFT JOIN users e ON sr.escalated_to=e.id

WHERE sr.id=$1

`,
[req.params.id]
);



if(result.rows.length===0){

return res.status(404).json({

success:false,

message:'Request not found.'

});

}



const remarks = await db.query(
`
SELECT r.*,
       u.name AS author

FROM remarks r

JOIN users u ON r.created_by=u.id

WHERE r.entity_type='service_request'

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







const createServiceRequest = async(req,res,next)=>{

try{


const {
type,
subject,
description,
priority

}=req.body;



if(!type || !subject || !description){

return res.status(400).json({

success:false,

message:'Type, subject, and description required.'

});

}



const media_url=req.file ?
`/uploads/${req.file.filename}` :
null;





const result = await db.query(

`
INSERT INTO service_requests
(
farmer_id,
type,
subject,
description,
media_url,
priority
)

VALUES
($1,$2,$3,$4,$5,$6)

RETURNING id

`,

[
req.user.id,
type,
subject,
description,
media_url,
priority || 'medium'
]

);






await db.query(

`
INSERT INTO notifications
(user_id,title,message,type)

SELECT id,
'New Service Request',
'A new service request requires attention.',
'info'

FROM users

WHERE role IN ('employee','admin')

`

);





res.status(201).json({

success:true,

message:'Service request submitted successfully.',

id:result.rows[0].id

});



}catch(err){

next(err);

}

};







const updateServiceRequest = async(req,res,next)=>{

try{


const {
action,
resolution_notes,
escalation_reason,
remarks

}=req.body;



const result = await db.query(

`SELECT * FROM service_requests WHERE id=$1`,

[req.params.id]

);



if(result.rows.length===0){

return res.status(404).json({

success:false,

message:'Request not found.'

});

}



const req_data=result.rows[0];



let updateFields='';
let params=[];



if(action==='accept'){

updateFields=
`status=$1,
handled_by=$2,
assigned_at=NOW()`;

params.push(
'in_progress',
req.user.id
);


}

else if(action==='resolve'){

updateFields=
`status=$1,
resolved_at=NOW(),
resolution_notes=$2`;

params.push(
'resolved',
resolution_notes || ''
);

}


else if(action==='reject'){

updateFields=
`status=$1,
resolved_at=NOW(),
resolution_notes=$2`;

params.push(
'rejected',
resolution_notes || ''
);

}


else if(action==='escalate'){

updateFields=
`status=$1,
escalated_at=NOW(),
escalation_reason=$2`;

params.push(
'escalated',
escalation_reason || ''
);

}



params.push(req.params.id);



await db.query(

`
UPDATE service_requests

SET ${updateFields}

WHERE id=$${params.length}

`,

params

);






if(remarks){

await db.query(

`
INSERT INTO remarks
(entity_type,entity_id,message,created_by)

VALUES
('service_request',$1,$2,$3)

`,

[
req.params.id,
remarks,
req.user.id
]

);

}







const notifMap={

accept:[
'Request Accepted',
'Your service request is now being processed.',
'info'
],


resolve:[
'Request Resolved',
`Your service request has been resolved. ${resolution_notes || ''}`,
'success'
],


reject:[
'Request Rejected',
`Your service request was rejected. ${resolution_notes || ''}`,
'error'
],


escalate:[
'Request Escalated',
'Your service request has been escalated to admin for further action.',
'warning'
]

};





if(notifMap[action]){


const [title,message,type]=notifMap[action];


await db.query(

`
INSERT INTO notifications
(user_id,title,message,type)

VALUES
($1,$2,$3,$4)

`,

[
req_data.farmer_id,
title,
message,
type
]

);


}




res.json({

success:true,

message:`Service request ${action}d successfully.`

});




}catch(err){

next(err);

}

};





module.exports={
getServiceRequests,
getServiceRequestById,
createServiceRequest,
updateServiceRequest
};