const pool = require("../config/db");

const customerCreditReport = async (fromDate = null, toDate = null) => {
  // manager-approved sales that were made on credit
  let salesSql = `
    SELECT customer_id, SUM(amount) as total_credit_sales
    FROM sales_transactions
    WHERE status = 'manager_approved' AND payment_type = 'credit'
  `;
  const salesParams = [];
  if (fromDate) {
    salesSql += " AND DATE(created_at) >= ?";
    salesParams.push(fromDate);
  }
  if (toDate) {
    salesSql += " AND DATE(created_at) <= ?";
    salesParams.push(toDate);
  }
  salesSql += " GROUP BY customer_id";

  let paySql = `
    SELECT customer_id, SUM(amount) as total_customer_payments
    FROM customer_payments
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

  const [salesRows] = await pool.query(salesSql, salesParams);
  const [payRows] = await pool.query(paySql, payParams);

  const salesByCustomer = {};
  salesRows.forEach((r) => {
    salesByCustomer[r.customer_id] = Number(r.total_credit_sales);
  });
  const payByCustomer = {};
  payRows.forEach((r) => {
    payByCustomer[r.customer_id] = Number(r.total_customer_payments);
  });

  const [customers] = await pool.query("SELECT id, name, email FROM customers ORDER BY name");
  return customers.map((c) => ({
    customer_id: c.id,
    customer_name: c.name,
    email: c.email,
    total_credit_sales: salesByCustomer[c.id] || 0,
    total_customer_payments: payByCustomer[c.id] || 0,
    credit_balance: (salesByCustomer[c.id] || 0) - (payByCustomer[c.id] || 0),
  }));
};

const supplierDebtReport = async (fromDate = null, toDate = null) => {
  // manager-approved procurement that was made on credit
  let procSql = `
    SELECT supplier_id, SUM(amount) as total_credit_procurement
    FROM procurement_transactions
    WHERE status = 'manager_approved' AND payment_type = 'credit'
  `;
  const procParams = [];
  if (fromDate) {
    procSql += " AND DATE(created_at) >= ?";
    procParams.push(fromDate);
  }
  if (toDate) {
    procSql += " AND DATE(created_at) <= ?";
    procParams.push(toDate);
  }
  procSql += " GROUP BY supplier_id";

  let paySql = `
    SELECT supplier_id, SUM(amount) as total_supplier_payments
    FROM supplier_payments
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
  paySql += " GROUP BY supplier_id";

  const [procRows] = await pool.query(procSql, procParams);
  const [payRows] = await pool.query(paySql, payParams);

  const procBySupplier = {};
  procRows.forEach((r) => {
    procBySupplier[r.supplier_id] = Number(r.total_credit_procurement);
  });
  const payBySupplier = {};
  payRows.forEach((r) => {
    payBySupplier[r.supplier_id] = Number(r.total_supplier_payments);
  });

  const [suppliers] = await pool.query("SELECT id, name, email FROM suppliers ORDER BY name");
  return suppliers.map((s) => ({
    supplier_id: s.id,
    supplier_name: s.name,
    email: s.email,
    total_credit_procurement: procBySupplier[s.id] || 0,
    total_supplier_payments: payBySupplier[s.id] || 0,
    debt_balance: (procBySupplier[s.id] || 0) - (payBySupplier[s.id] || 0),
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
