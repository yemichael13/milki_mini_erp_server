const reportRepository = require("../repositories/report.repository");

const customerCreditReport = async (fromDate, toDate, format = "json") => {
  const data = await reportRepository.customerCreditReport(fromDate, toDate);
  if (format === "csv") {
    return toCSV(data, [
      "customer_id",
      "customer_name",
      "email",
      "total_credit_sales",
      "total_customer_payments",
      "credit_balance",
    ]);
  }
  return data;
};

const supplierDebtReport = async (fromDate, toDate, format = "json") => {
  const data = await reportRepository.supplierDebtReport(fromDate, toDate);
  if (format === "csv") {
    return toCSV(data, [
      "supplier_id",
      "supplier_name",
      "email",
      "total_credit_procurement",
      "total_supplier_payments",
      "debt_balance",
    ]);
  }
  return data;
};

const transactionHistoryReport = async (filters = {}, format = "json") => {
  const rows = await reportRepository.transactionHistoryReport(filters);
  const data = rows.map((row) => ({
    id: row.id,
    date: row.created_at,
    type: row.type,
    source_department: row.source_department,
    amount: Number(row.amount),
    payment_type: row.payment_type,
    status: row.status,
    customer: row.customer_name || "",
    supplier: row.supplier_name || "",
    description: row.description || "",
    created_by: row.created_by_name || row.created_by_email || "",
    approved_by: row.manager_approved_by_name || row.manager_approved_by_email || "",
    rejection_reason: row.rejection_reason || "",
  }));
  if (format === "csv") return toCSV(data, ["id", "date", "type", "source_department", "amount", "payment_type", "status", "customer", "supplier", "description", "created_by", "approved_by", "rejection_reason"]);
  return data;
};

const summary = async (fromDate, toDate) => {
  return reportRepository.summary(fromDate, toDate);
};

function toCSV(rows, headers) {
  const headerLine = headers.join(",");
  const lines = rows.map((r) => headers.map((h) => escapeCSV(r[h])).join(","));
  return [headerLine, ...lines].join("\n");
}

function escapeCSV(val) {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

module.exports = {
  customerCreditReport,
  supplierDebtReport,
  transactionHistoryReport,
  summary,
};
