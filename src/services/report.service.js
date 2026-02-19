const reportRepository = require("../repositories/report.repository");

const customerCreditReport = async (fromDate, toDate, format = "json") => {
  const data = await reportRepository.customerCreditReport(fromDate, toDate);
  if (format === "csv") {
    return toCSV(data, ["customer_id", "customer_name", "email", "total_approved", "total_paid", "credit_balance"]);
  }
  return data;
};

const workflowFinancialSummary = async (fromDate, toDate, format = "json") => {
  const data = await reportRepository.workflowFinancialSummary(fromDate, toDate);
  if (format === "csv") {
    return toCSV(data, ["workflow", "status", "total", "count"]);
  }
  return data;
};

const customerCreditById = async (customerId, fromDate, toDate) => {
  return reportRepository.customerCreditById(customerId, fromDate, toDate);
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
  workflowFinancialSummary,
  customerCreditById,
};
