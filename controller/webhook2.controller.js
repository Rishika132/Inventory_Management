const Webhook2 = async(req,res)=>{
try {
    const order = req.body; 
    console.log("🛒Retail - New Order Received:");
    console.log(order); 

  

    res.status(200).send('Webhook retail received ✅');
  } catch (err) {
    console.error( err);
    res.status(400).send('Invalid data');
  }
}

module.exports = {Webhook2};