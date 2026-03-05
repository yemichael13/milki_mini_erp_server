const pool = require("../config/db");

/**
 * Customer Credit:
 *   SUM(manager_approved sales_transactions WHERE payment_type='credit')
 * - SUM(all customer_payments)
 */
async function getCustomerCredit(customerId) {
  const [[salesRow]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM sales_transactions
     WHERE customer_id = ?
       AND status = 'manager_approved'
       AND payment_type = 'credit'`,
    [customerId]
  );

  const [[payRow]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM customer_payments
     WHERE customer_id = ?`,
    [customerId]
  );

  return Number(salesRow.total) - Number(payRow.total);
}

/**
 * Supplier Debt:
 *   SUM(manager_approved procurement_transactions WHERE payment_type='credit')
 * - SUM(all supplier_payments)
 */
async function getSupplierDebt(supplierId) {
  const [[procRow]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM procurement_transactions
     WHERE supplier_id = ?
       AND status = 'manager_approved'
       AND payment_type = 'credit'`,
    [supplierId]
  );

  const [[payRow]] = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM supplier_payments
     WHERE supplier_id = ?`,
    [supplierId]
  );

  return Number(procRow.total) - Number(payRow.total);
}

module.exports = {
  getCustomerCredit,
  getSupplierDebt,
};

