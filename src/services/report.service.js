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
  summary,
};
