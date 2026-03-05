const placeholder = (feature) => async (req, res) => {
  res.status(501).json({
    message: `${feature} not implemented yet`,
  });
};

module.exports = {
  getSettings: placeholder("System settings"),
  triggerBackup: placeholder("Backup"),
  viewLogs: placeholder("Logs"),
};

