const fs = require('fs');
const csv = require('csv-parser');
const { updateBulkInventory } = require('./inventory.controller');
const handleCSVUpload = (req, res) => {
  const filePath = req.file.path;
  const records = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
     if ((row.SKU || row.sku) && (row.Quantity || row.quantity) && (row.Threshold || row.threshold)) {
  records.push({
    sku: (row.SKU || row.sku).trim(),
    quantity: parseInt((row.Quantity || row.quantity).trim(), 10),
    threshold: parseInt((row.Threshold || row.threshold).trim(), 10)
  });
}

    })
    .on('end', async () => {
      fs.unlinkSync(filePath);
      const fakeReq = { body: records };
      const fakeRes = {
        status: (code) => ({
          json: (data) => res.status(code).json(data)
        })
      };

      await updateBulkInventory(fakeReq, fakeRes);
    })
    .on('error', (err) => {
      console.error('CSV Error:', err);
      res.status(500).json({ error: 'Failed to process CSV' });
    });
};
module.exports = { handleCSVUpload };