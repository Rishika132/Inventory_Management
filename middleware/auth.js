const jwt = require("jsonwebtoken");
 const auth = async(request,response,next)=>{
 try{ 
  let cookies = request.cookies;
  let token = cookies.token;
  let decodeMessage =  jwt.verify(token,process.env.JWT_SECRET);
  console.log(decodeMessage);
  next();
 }
 catch(err){
   console.log(err);
   return response.status(401).json({error: "Unauthorized user | Inavlid token"});
 } 
}
module.exports = { auth };