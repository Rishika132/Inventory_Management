const Webhook = async(req,res)=>{
try {
    const order = req.body; 
    console.log("🛒 New Order Received:");
    console.log(order); 

  

    res.status(200).send('Webhook received ✅');
  } catch (err) {
    console.error( err);
    res.status(400).send('Invalid data');
  }
}

module.exports = {Webhook};