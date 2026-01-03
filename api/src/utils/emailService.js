const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return null;
};

const sendWelcomeEmail = async (userEmail, userName) => {
  const loginUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const emailFrom = process.env.EMAIL_FROM || 'noreply@example.com';

  const emailContent = {
    from: emailFrom,
    to: userEmail,
    subject: 'Welcome to Post Management System',
    text: `Hello ${userName},\n\nVisit ${loginUrl}/login to set your password.`,
    html: `<p>Hello <strong>${userName}</strong>,<br>Visit <a href="${loginUrl}/login">${loginUrl}/login</a> to set your password.</p>`
  };

  try {
    const transporter = createTransporter();
    if (transporter) {
      const info = await transporter.sendMail(emailContent);
      console.log(`✅ Real email sent to: ${userEmail}`, info.messageId);
      return { success: true, mode: 'real', messageId: info.messageId };
    } else {
      console.log('📧 Email simulation:', emailContent.text);
      return { success: true, mode: 'simulation' };
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    console.log('📧 Showing simulation:', emailContent.text);
    return { success: false, mode: 'failed', error: error.message, simulatedContent: emailContent.text };
  }
};

module.exports = { sendWelcomeEmail };
