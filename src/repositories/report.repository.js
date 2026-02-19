const pool = require("../config/db");

const customerCreditReport = async (fromDate = null, toDate = null) => {
  let txSql = `
    SELECT customer_id, SUM(total_amount) as total_approved
    FROM transactions
    WHERE status = 'manager_approved'
  `;
  const txParams = [];
  if (fromDate) {
    txSql += " AND DATE(created_at) >= ?";
    txParams.push(fromDate);
  }
  if (toDate) {
    txSql += " AND DATE(created_at) <= ?";
    txParams.push(toDate);
  }
  txSql += " GROUP BY customer_id";

  let paySql = `
    SELECT customer_id, SUM(amount) as total_paid
    FROM payments
    WHERE 1=1
  `;
  const payParams = [];
  if (fromDate) {
    paySql += " AND payment_date >= ?";
    payParams.push(fromDate);
  }
  if (toDate) {
    paySql += " AND payment_date <= ?";
    payParams.push(toDate);
  }
  paySql += " GROUP BY customer_id";

  const [txRows] = await pool.query(txSql, txParams);
  const [payRows] = await pool.query(paySql, payParams);

  const txByCustomer = {};
  txRows.forEach((r) => {
    txByCustomer[r.customer_id] = Number(r.total_approved);
  });
  const payByCustomer = {};
  payRows.forEach((r) => {
    payByCustomer[r.customer_id] = Number(r.total_paid);
  });

  const [customers] = await pool.query("SELECT id, name, email FROM customers ORDER BY name");
  return customers.map((c) => ({
    customer_id: c.id,
    customer_name: c.name,
    email: c.email,
    total_approved: txByCustomer[c.id] || 0,
    total_paid: payByCustomer[c.id] || 0,
    credit_balance: (txByCustomer[c.id] || 0) - (payByCustomer[c.id] || 0),
  }));
};

const workflowFinancialSummary = async (fromDate = null, toDate = null) => {
  let sql = `
    SELECT workflow, status, SUM(total_amount) as total, COUNT(*) as count
    FROM transactions
    WHERE 1=1
  `;
  const params = [];
  if (fromDate) {
    sql += " AND DATE(created_at) >= ?";
    params.push(fromDate);
  }
  if (toDate) {
    sql += " AND DATE(created_at) <= ?";
    params.push(toDate);
  }
  sql += " GROUP BY workflow, status ORDER BY workflow, status";
  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    workflow: r.workflow,
    status: r.status,
    total: Number(r.total),
    count: r.count,
  }));
};

const customerCreditById = async (customerId, fromDate = null, toDate = null) => {
  let txSql = `
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM transactions
    WHERE customer_id = ? AND status = 'manager_approved'
  `;
  const txParams = [customerId];
  if (fromDate) {
    txSql += " AND DATE(created_at) >= ?";
    txParams.push(fromDate);
  }
  if (toDate) {
    txSql += " AND DATE(created_at) <= ?";
    txParams.push(toDate);
  }
  let paySql = "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE customer_id = ?";
  const payParams = [customerId];
  if (fromDate) {
    paySql += " AND payment_date >= ?";
    payParams.push(fromDate);
  }
  if (toDate) {
    paySql += " AND payment_date <= ?";
    payParams.push(toDate);
  }
  const [[txRow], [payRow]] = await Promise.all([
    pool.query(txSql, txParams),
    pool.query(paySql, payParams),
  ]);
  const totalApproved = Number(txRow.total);
  const totalPaid = Number(payRow.total);
  return { total_approved: totalApproved, total_paid: totalPaid, credit_balance: totalApproved - totalPaid };
};

module.exports = {
  customerCreditReport,
  workflowFinancialSummary,
  customerCreditById,
};
