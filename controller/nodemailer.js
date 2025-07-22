
const nodemailer = require("nodemailer");
const Sync = require("../model/sync.model");

async function sendThresholdEmails() {
  const belowThreshold = await Sync.find({ $expr: { $lt: ["$quantity", "$threshold"] } });

  if (!belowThreshold.length) {
    console.log(" No products below threshold.");
    return;
  }

  const emailBody = belowThreshold.map(product => `
    <p><b>SKU:</b> ${product.sku}</p>
    <p><b>Product:</b> ${product.product_title}</p>
    <p><b>Variant:</b> ${product.variant_title}</p>
    <p><b>Quantity:</b> ${product.quantity} <span style="color:red;">(Below threshold: ${product.threshold})</span></p>
    <hr/>
  `).join("<br>");


  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_ID,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_ID,
    to: process.env.ALERT_RECEIVER_EMAIL, 
    subject: "⚠️ Inventory Threshold Alert",
    html:`
    <h3>⚠️ Inventory Alert: Products Below Threshold</h3>
    ${emailBody}
    <p>Please restock these items as soon as possible.</p>
    <b>Inventory Monitor</b> `
  };
  
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error(" Email error:", error);
    reject(false);
  } else {
    console.log("Email sent:", info.response);
    resolve(true);
  }
});

}

module.exports = { sendThresholdEmails };
