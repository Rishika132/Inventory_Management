const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const Sync = require('../model/sync.model');

const exportSyncData = async (req, res) => {
  try {
    const data = await Sync.find();

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "❌ No data found in Sync collection" });
    }

    const fields = ['sku', 'quantity', 'threshold'];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    // ✅ Use temporary directory instead of public/
    const exportDir = '/tmp';
    const fileName = `sync-data-${Date.now()}.csv`;
    const filePath = path.join(exportDir, fileName);

    fs.writeFileSync(filePath, csv); // ✅ Safe to write in /tmp

    // 🚫 Direct linking from /tmp isn't possible on most cloud platforms
    // ✅ Send file as response directly
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(csv);

  } catch (err) {
    console.error('❌ CSV export error:', err.message);
    return res.status(500).json({
      error: 'Failed to export CSV',
      details: err.message,
    });
  }
};

module.exports = { exportSyncData };
