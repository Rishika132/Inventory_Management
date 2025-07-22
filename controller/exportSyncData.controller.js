const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const Sync = require('../model/sync.model');

const exportSyncData = async (req, res) => {
  try {
    const data = await Sync.find();

    if (!data || data.length === 0) {
      return res.status(404).json({ message: " No data found in Sync collection" });
    }

    const fields = ['SKU', 'Quantity', 'Threshold'];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    const exportDir = '/tmp';
    const fileName = `sync-data-${Date.now()}.csv`;
    const filePath = path.join(exportDir, fileName);

    fs.writeFileSync(filePath, csv);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(csv);

  } catch (err) {
    console.error(' CSV export error:', err.message);
    return res.status(500).json({
      error: 'Failed to export CSV',
      details: err.message,
    });
  }
};

module.exports = { exportSyncData };
