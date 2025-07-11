const Sync = require('../model/sync.model');
const { Parser } = require('json2csv');

const exportSyncData = async (req, res) => {
  try {
    const data = await Sync.find().lean(); // lean() for plain JS objects

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No sync data found' });
    }

    const fields = ['sku', 'quantity', 'threshold', 'product_title', 'variant_title'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('sync-data.csv'); 
    return res.send(csv);
  } catch (err) {
    console.error('❌ Error exporting sync data:', err);
    res.status(500).json({ error: 'Failed to export sync data' });
  }
};

module.exports = { exportSyncData };
