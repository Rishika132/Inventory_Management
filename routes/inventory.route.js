const express = require("express");
const router = express.Router();
const updateAllInventoriesSameQuantity = require("../updateInventoryByItemId");
router.post("/update-quantity", async (req, res) => {
  const { quantity } = req.body;

  if (typeof quantity !== "number") {
    return res.status(400).json({ success: false, error: "Quantity must be a number." });
  }

  const result = await updateAllInventoriesSameQuantity(quantity);
  res.json(result);
});

module.exports = router;
