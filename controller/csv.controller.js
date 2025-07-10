const fs = require('fs');
const csv = require('csv-parser');
const { updateBulkInventory } = require('./inventory.controller');
const handleCSVUpload = (req, res) => {
  const filePath = req.file.path;
  const records = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      // Ensure required fields exist
      if (row.SKU && row.Quantity && row.Threshold) {
        records.push({
          sku: row.SKU.trim(),
          quantity: parseInt(row.Quantity.trim(), 10),
          threshold: parseInt(row.Threshold.trim(), 10)
        });
      }
    })
    .on('end', async () => {
      fs.unlinkSync(filePath); // delete the uploaded file

      // Fake req.body to pass to existing function
      const fakeReq = { body: records };
      const fakeRes = {
        status: (code) => ({
          json: (data) => res.status(code).json(data)
        })
      };

      // Reuse existing logic
      await updateBulkInventory(fakeReq, fakeRes);
    })
    .on('error', (err) => {
      console.error('CSV Error:', err);
      res.status(500).json({ error: 'Failed to process CSV' });
    });
};
module.exports = { handleCSVUpload };