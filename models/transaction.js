const pool = require("../config/database");

module.exports.place_order = async function (memberId, finalAmount) {
  const query = "CALL place_orders($1, $2, NULL::INTEGER, NULL::INTEGER)";
  const result = await pool.query(query, [memberId, finalAmount]);
  const outcome = result.rows[0];
  const processedCount = Number(outcome.p_processed_count);

  return {
    orderId: outcome.p_order_id,
    processedCount: processedCount,
    orderPlaced: processedCount > 0
  };
};
