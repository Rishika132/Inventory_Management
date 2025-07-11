
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


    const exportDir = path.join(__dirname, '../public/exports');
    const fileName = `sync-data-${Date.now()}.csv`;
    const filePath = path.join(exportDir, fileName);

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    fs.writeFileSync(filePath, csv);

    
    const fileUrl = `http://localhost:3000/exports/${fileName}`;
    return res.status(200).json({
      message: '✅ CSV exported successfully',
      url: fileUrl
    });

  } catch (err) {
    console.error('❌ CSV export error:', err.message);
    return res.status(500).json({
      error: 'Failed to export CSV',
      details: err.message
    });
  }
};

module.exports = { exportSyncData };
