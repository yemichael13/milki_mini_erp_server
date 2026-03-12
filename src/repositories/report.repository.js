const pool = require("../config/db");

const customerCreditReport = async (fromDate = null, toDate = null) => {
  // manager-approved sales transactions, split by payment type
  let txSql = `
    SELECT customer_id,
           SUM(CASE WHEN payment_type = 'credit' THEN amount ELSE 0 END) as total_credit_sales,
           SUM(CASE WHEN payment_type = 'paid' THEN amount ELSE 0 END) as total_customer_payments
    FROM transactions
    WHERE status = 'manager_approved'
      AND type = 'sale'
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

  const [txRows] = await pool.query(txSql, txParams);

  const totalsByCustomer = {};
  txRows.forEach((r) => {
    totalsByCustomer[r.customer_id] = {
      credit: Number(r.total_credit_sales),
      paid: Number(r.total_customer_payments),
    };
  });

  const [customers] = await pool.query("SELECT id, name, email FROM customers ORDER BY name");
  return customers.map((c) => ({
    customer_id: c.id,
    customer_name: c.name,
    email: c.email,
    total_credit_sales: totalsByCustomer[c.id]?.credit || 0,
    total_customer_payments: totalsByCustomer[c.id]?.paid || 0,
    credit_balance:
      (totalsByCustomer[c.id]?.credit || 0) === 0
        ? 0
        : (totalsByCustomer[c.id]?.credit || 0) - (totalsByCustomer[c.id]?.paid || 0),
  }));
};

const supplierDebtReport = async (fromDate = null, toDate = null) => {
  // manager-approved procurement transactions, split by payment type
  let txSql = `
    SELECT supplier_id,
           SUM(CASE WHEN payment_type = 'debt' THEN amount ELSE 0 END) as total_credit_procurement,
           SUM(CASE WHEN payment_type = 'paid' THEN amount ELSE 0 END) as total_supplier_payments
    FROM transactions
    WHERE status = 'manager_approved'
      AND type = 'procurement'
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
  txSql += " GROUP BY supplier_id";

  const [txRows] = await pool.query(txSql, txParams);

  const totalsBySupplier = {};
  txRows.forEach((r) => {
    totalsBySupplier[r.supplier_id] = {
      debt: Number(r.total_credit_procurement),
      paid: Number(r.total_supplier_payments),
    };
  });

  const [suppliers] = await pool.query("SELECT id, name, email FROM suppliers ORDER BY name");
  return suppliers.map((s) => ({
    supplier_id: s.id,
    supplier_name: s.name,
    email: s.email,
    total_credit_procurement: totalsBySupplier[s.id]?.debt || 0,
    total_supplier_payments: totalsBySupplier[s.id]?.paid || 0,
    debt_balance:
      (totalsBySupplier[s.id]?.debt || 0) === 0
        ? 0
        : (totalsBySupplier[s.id]?.debt || 0) - (totalsBySupplier[s.id]?.paid || 0),
  }));
};

module.exports = {
  customerCreditReport,
  supplierDebtReport,
  summary: async (fromDate = null, toDate = null) => {
    const [creditRows, debtRows] = await Promise.all([
      customerCreditReport(fromDate, toDate),
      supplierDebtReport(fromDate, toDate),
    ]);
    const totalCustomerCredit = creditRows.reduce((sum, r) => sum + Number(r.credit_balance), 0);
    const totalSupplierDebt = debtRows.reduce((sum, r) => sum + Number(r.debt_balance), 0);
    return { total_customer_credit: totalCustomerCredit, total_supplier_debt: totalSupplierDebt };
  },
};
