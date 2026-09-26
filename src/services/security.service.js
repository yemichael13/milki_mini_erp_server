const pool = require("../config/db");

const audit = async (event, userId = null, metadata = {}) => {
  try {
    await pool.query("INSERT INTO security_events (event_type, user_id, metadata) VALUES (?, ?, ?)", [event, userId, JSON.stringify(metadata)]);
  } catch (err) {
    // Logging must never turn a successful business operation into a failed request.
    require("../config/logger").warn({ message: "Security event could not be persisted", event, error: err.message });
  }
};

module.exports = { audit };
