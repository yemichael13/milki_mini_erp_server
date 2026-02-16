const pool = require("../config/db");

const calculateCredit = async (customerId) => {
  const [transactions] = await pool.query(
    `SELECT SUM(total_amount) as total 
     FROM transactions 
     WHERE customer_id = ? AND status = 'manager_approved'`,
    [customerId]
  );

  const [payments] = await pool.query(
    `SELECT SUM(amount) as total 
     FROM payments 
     WHERE customer_id = ?`,
    [customerId]
  );

  const totalTransactions = transactions[0].total || 0;
  const totalPayments = payments[0].total || 0;

  return totalTransactions - totalPayments;
};

module.exports = calculateCredit;
