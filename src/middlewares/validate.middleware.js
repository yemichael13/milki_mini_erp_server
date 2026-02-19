const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const data = source === "query" ? req.query : req.body;
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
      const err = new Error("Validation error");
      err.statusCode = 400;
      err.details = error.details;
      err.message = error.details.map((d) => d.message).join("; ");
      return next(err);
    }
    if (source === "query") req.query = value;
    else req.body = value;
    next();
  };
};

module.exports = validate;
