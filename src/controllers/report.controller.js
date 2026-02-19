const reportService = require("../services/report.service");

const customerCredit = async (req, res, next) => {
  try {
    const { from_date, to_date, format } = req.query;
    const data = await reportService.customerCreditReport(from_date || null, to_date || null, format || "json");
    if (req.query.format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=customer-credit-report.csv");
      return res.send(data);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const workflowSummary = async (req, res, next) => {
  try {
    const { from_date, to_date, format } = req.query;
    const data = await reportService.workflowFinancialSummary(from_date || null, to_date || null, format || "json");
    if (req.query.format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=workflow-summary.csv");
      return res.send(data);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const customerCreditDetail = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const data = await reportService.customerCreditById(
      Number(req.params.customerId),
      from_date || null,
      to_date || null
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { customerCredit, workflowSummary, customerCreditDetail };
