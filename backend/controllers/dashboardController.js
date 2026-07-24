const db = require('../config/database');


const getAdminStats = async (req,res,next)=>{

try{


const totalFarmers =
(await db.query(
`SELECT COUNT(*) AS "totalFarmers"
 FROM users
 WHERE role='farmer'`
)).rows[0];


const totalEmployees =
(await db.query(
`SELECT COUNT(*) AS "totalEmployees"
 FROM users
 WHERE role='employee'`
)).rows[0];


const totalSellRequests =
(await db.query(
`SELECT COUNT(*) AS "totalSellRequests"
 FROM sell_requests`
)).rows[0];


const pendingSell =
(await db.query(
`SELECT COUNT(*) AS "pendingSell"
 FROM sell_requests
 WHERE status='pending'`
)).rows[0];


const verifiedSell =
(await db.query(
`SELECT COUNT(*) AS "verifiedSell"
 FROM sell_requests
 WHERE status='verified'`
)).rows[0];


const approvedSell =
(await db.query(
`SELECT COUNT(*) AS "approvedSell"
 FROM sell_requests
 WHERE status='approved'`
)).rows[0];


const completedSell =
(await db.query(
`
SELECT COUNT(*) AS "completedSell"
FROM sell_requests
WHERE status IN ('completed','payment_done')
`
)).rows[0];



const totalServiceRequests =
(await db.query(
`SELECT COUNT(*) AS "totalServiceRequests"
 FROM service_requests`
)).rows[0];



const pendingService =
(await db.query(
`SELECT COUNT(*) AS "pendingService"
 FROM service_requests
 WHERE status='pending'`
)).rows[0];



const escalatedService =
(await db.query(
`SELECT COUNT(*) AS "escalatedService"
 FROM service_requests
 WHERE status='escalated'`
)).rows[0];



const totalPayments =
(await db.query(
`
SELECT COALESCE(SUM(payment_amount),0) AS "totalPayments"
FROM sell_requests
WHERE payment_status='done'
`
)).rows[0];





const recentActivity =
(await db.query(
`
SELECT 'sell' AS type,id,status,created_at
FROM sell_requests

UNION ALL

SELECT 'service' AS type,id,status,created_at
FROM service_requests

ORDER BY created_at DESC
LIMIT 10
`
)).rows;





const cropStats =
(await db.query(
`
SELECT c.name,
COUNT(sr.id) AS requests,
SUM(sr.quantity) AS total_qty

FROM sell_requests sr

JOIN crops c ON sr.crop_id=c.id

GROUP BY c.id,c.name

ORDER BY requests DESC

LIMIT 6
`
)).rows;





res.json({

success:true,

stats:{
totalFarmers:Number(totalFarmers.totalFarmers),
totalEmployees:Number(totalEmployees.totalEmployees),
totalSellRequests:Number(totalSellRequests.totalSellRequests),
pendingSell:Number(pendingSell.pendingSell),
verifiedSell:Number(verifiedSell.verifiedSell),
approvedSell:Number(approvedSell.approvedSell),
completedSell:Number(completedSell.completedSell),
totalServiceRequests:Number(totalServiceRequests.totalServiceRequests),
pendingService:Number(pendingService.pendingService),
escalatedService:Number(escalatedService.escalatedService),
totalPayments:Number(totalPayments.totalPayments)
},

recentActivity,

cropStats

});


}catch(err){

next(err);

}

};







const getEmployeeStats = async(req,res,next)=>{

try{


const id=req.user.id;


const pending =
(await db.query(
`SELECT COUNT(*) AS pending
FROM sell_requests
WHERE status='pending'`
)).rows[0];



const verified =
(await db.query(
`SELECT COUNT(*) AS verified
FROM sell_requests
WHERE verified_by=$1`,
[id]
)).rows[0];



const serviceAssigned =
(await db.query(
`SELECT COUNT(*) AS "serviceAssigned"
FROM service_requests
WHERE handled_by=$1`,
[id]
)).rows[0];



const serviceResolved =
(await db.query(
`
SELECT COUNT(*) AS "serviceResolved"
FROM service_requests
WHERE handled_by=$1
AND status='resolved'
`,
[id]
)).rows[0];





const recentSell =
(await db.query(
`
SELECT sr.*,
u.name AS farmer_name,
c.name AS crop_name

FROM sell_requests sr

JOIN users u ON sr.farmer_id=u.id

JOIN crops c ON sr.crop_id=c.id

WHERE sr.status='pending'

ORDER BY sr.created_at DESC

LIMIT 5
`
)).rows;



res.json({

success:true,

stats:{
pending:Number(pending.pending),
verified:Number(verified.verified),
serviceAssigned:Number(serviceAssigned.serviceAssigned),
serviceResolved:Number(serviceResolved.serviceResolved)
},

recentSell

});



}catch(err){

next(err);

}

};






const getFarmerStats = async(req,res,next)=>{

try{


const id=req.user.id;


const totalSell =
(await db.query(
`SELECT COUNT(*) AS "totalSell"
FROM sell_requests
WHERE farmer_id=$1`,
[id]
)).rows[0];


const pendingSell =
(await db.query(
`
SELECT COUNT(*) AS "pendingSell"
FROM sell_requests
WHERE farmer_id=$1
AND status='pending'
`,
[id]
)).rows[0];



const approvedSell =
(await db.query(
`
SELECT COUNT(*) AS "approvedSell"
FROM sell_requests
WHERE farmer_id=$1
AND status IN ('approved','scheduled')
`,
[id]
)).rows[0];



const completedSell =
(await db.query(
`
SELECT COUNT(*) AS "completedSell"
FROM sell_requests
WHERE farmer_id=$1
AND status IN ('completed','payment_done')
`,
[id]
)).rows[0];



const totalEarned =
(await db.query(
`
SELECT COALESCE(SUM(payment_amount),0) AS "totalEarned"

FROM sell_requests

WHERE farmer_id=$1
AND payment_status='done'
`,
[id]
)).rows[0];



const totalService =
(await db.query(
`
SELECT COUNT(*) AS "totalService"

FROM service_requests

WHERE farmer_id=$1
`,
[id]
)).rows[0];





const recentSell =
(await db.query(
`
SELECT sr.*,
c.name AS crop_name,
c.govt_price

FROM sell_requests sr

JOIN crops c ON sr.crop_id=c.id

WHERE sr.farmer_id=$1

ORDER BY sr.created_at DESC

LIMIT 5
`,
[id]
)).rows;





const announcements =
(await db.query(
`
SELECT *

FROM announcements

WHERE is_active=true

AND (target_role='all'
OR target_role='farmer')

AND (expires_at IS NULL
OR expires_at >= CURRENT_DATE)

ORDER BY created_at DESC

LIMIT 3
`
)).rows;



res.json({

success:true,

stats:{
totalSell:Number(totalSell.totalSell),
pendingSell:Number(pendingSell.pendingSell),
approvedSell:Number(approvedSell.approvedSell),
completedSell:Number(completedSell.completedSell),
totalEarned:Number(totalEarned.totalEarned),
totalService:Number(totalService.totalService)
},

recentSell,

announcements

});



}catch(err){

next(err);

}

};





const getNotifications = async(req,res,next)=>{

try{


const notifications =
(await db.query(
`
SELECT *

FROM notifications

WHERE user_id=$1

ORDER BY created_at DESC

LIMIT 20
`,
[req.user.id]
)).rows;



await db.query(
`
UPDATE notifications

SET is_read=true

WHERE user_id=$1

AND is_read=false
`,
[req.user.id]
);



res.json({

success:true,

notifications

});


}catch(err){

next(err);

}

};







const getAnnouncements = async(req,res,next)=>{

try{


const role=req.user.role;


const announcements =
(await db.query(
`
SELECT a.*,
u.name AS created_by_name

FROM announcements a

JOIN users u ON a.created_by=u.id

WHERE a.is_active=true

AND (a.target_role='all'
OR a.target_role=$1)

AND (a.expires_at IS NULL
OR a.expires_at >= CURRENT_DATE)

ORDER BY a.created_at DESC

`,
[role]
)).rows;



res.json({

success:true,

announcements

});


}catch(err){

next(err);

}

};







const getUsers = async(req,res,next)=>{

try{


const {role}=req.query;


let query=
`
SELECT id,name,phone,email,role,
village,district,is_active,created_at

FROM users
`;

const params=[];


if(role){

query+=` WHERE role=$1`;
params.push(role);

}


query+=` ORDER BY created_at DESC`;



const users =
(await db.query(query,params)).rows;



res.json({

success:true,

users

});


}catch(err){

next(err);

}

};




module.exports={
getAdminStats,
getEmployeeStats,
getFarmerStats,
getNotifications,
getAnnouncements,
getUsers
};