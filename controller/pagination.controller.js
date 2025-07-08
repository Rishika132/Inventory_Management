// Add this to sync.controller.js
const Sync = require("../model/sync.model");

const getSyncData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;  // default: page 1
    const limit = 50;  // fixed limit per page

    const skip = (page - 1) * limit;

    const data = await Sync.find().skip(skip).limit(limit).lean();
    const totalCount = await Sync.countDocuments();

    return res.status(200).json({
      message: "✅ Sync data fetched",
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      dataCount: data.length,
      data,
    });
  } catch (err) {
    console.error("❌ Failed to fetch Sync data:", err.message);
    return res.status(500).json({ error: "Failed to fetch sync data" });
  }
};

module.exports = {
  getSyncData
};
