const reportService = require("../services/report.service");

const customerCredit = async (req, res, next) => {
  try {
    const { from_date, to_date, format } = req.query;
    const data = await reportService.customerCreditReport(
      from_date || null,
      to_date || null,
      format || "json"
    );
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

const supplierDebt = async (req, res, next) => {
  try {
    const { from_date, to_date, format } = req.query;
    const data = await reportService.supplierDebtReport(
      from_date || null,
      to_date || null,
      format || "json"
    );
    if (req.query.format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=supplier-debt-report.csv");
      return res.send(data);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const summary = async (req, res, next) => {
  try {
    const { from_date, to_date } = req.query;
    const data = await reportService.summary(from_date || null, to_date || null);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { customerCredit, supplierDebt, summary };
