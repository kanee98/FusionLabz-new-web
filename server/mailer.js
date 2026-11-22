const nodemailer = require('nodemailer');
const { getDb } = require('./db');

async function sendNotification({ subject, html, replyTo }) {
  const db = getDb();
  const smtp = db.settings?.smtp;
  if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: Number(smtp.port) || 587,
      secure: Boolean(smtp.secure),
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const to = smtp.notifyEmail || db.settings.email || smtp.user;
    await transporter.sendMail({
      from: smtp.from || `FusionLabz Portal <${smtp.user}>`,
      to,
      replyTo,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.warn('[Mailer] Notification skipped/failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendNotification };
