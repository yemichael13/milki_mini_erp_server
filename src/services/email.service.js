const logger = require("../config/logger");
const nodemailer = require("nodemailer");

let transporter;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST) {
    const error = new Error("Email service is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM.");
    error.statusCode = 503;
    throw error;
  }
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true",
    auth: process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } : undefined,
  });
  return transporter;
};

// Email delivery is intentionally isolated. Configure an SMTP provider in deployment,
// while development remains usable without credentials.
const send = async ({ to, subject, text, html }) => {
  const result = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  logger.info({ message: "Email sent", to, subject, messageId: result.messageId });
};

const appUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const sendVerificationEmail = (user, token) => send({
  to: user.email,
  subject: "Verify your Milki Mini ERP account",
  text: `Verify your account: ${appUrl}/verify-email?token=${token}\nThis link expires in 24 hours.`,
  html: `<p>Welcome to Milki Mini ERP.</p><p><a href="${appUrl}/verify-email?token=${token}">Verify your email</a></p><p>This link expires in 24 hours.</p>`,
});

const sendPasswordResetEmail = (user, token) => send({
  to: user.email,
  subject: "Reset your Milki Mini ERP password",
  text: `Reset your password: ${appUrl}/reset-password?token=${token}\nThis link expires in 1 hour.`,
  html: `<p><a href="${appUrl}/reset-password?token=${token}">Reset your password</a></p><p>This link expires in 1 hour. If you did not request this, ignore it.</p>`,
});

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
