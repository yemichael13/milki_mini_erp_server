const pool = require("../config/db");

/**
 * Customer Credit:
 *   SUM(manager_approved sales transactions WHERE payment_type='credit')
 * - SUM(manager_approved sales transactions WHERE payment_type='paid')
 */
async function getCustomerCredit(customerId) {
  const [[row]] = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN payment_type = 'credit' THEN amount ELSE 0 END), 0) AS total_credit,
       COALESCE(SUM(CASE WHEN payment_type = 'paid' THEN amount ELSE 0 END), 0) AS total_paid
     FROM transactions
     WHERE customer_id = ?
       AND status = 'manager_approved'
       AND type = 'sale'`,
    [customerId]
  );

  const totalCredit = Number(row.total_credit);
  const totalPaid = Number(row.total_paid);
  if (totalCredit === 0) return 0;
  return totalCredit - totalPaid;
}

/**
 * Supplier Debt:
 *   SUM(manager_approved procurement transactions WHERE payment_type='debt')
 * - SUM(manager_approved procurement transactions WHERE payment_type='paid')
 */
async function getSupplierDebt(supplierId) {
  const [[row]] = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN payment_type = 'debt' THEN amount ELSE 0 END), 0) AS total_debt,
       COALESCE(SUM(CASE WHEN payment_type = 'paid' THEN amount ELSE 0 END), 0) AS total_paid
     FROM transactions
     WHERE supplier_id = ?
       AND status = 'manager_approved'
       AND type = 'procurement'`,
    [supplierId]
  );

  const totalDebt = Number(row.total_debt);
  const totalPaid = Number(row.total_paid);
  if (totalDebt === 0) return 0;
  return totalDebt - totalPaid;
}

module.exports = {
  getCustomerCredit,
  getSupplierDebt,
};
