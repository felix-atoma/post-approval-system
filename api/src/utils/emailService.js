const nodemailer = require('nodemailer');

async function sendWelcomeEmail(email, name) {
  const loginUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  
  console.log(`📧 Sending welcome email to: ${email}`);
  
  try {
    // ✅ Create transporter for Gmail
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      // Add these for Gmail
      tls: {
        rejectUnauthorized: false
      }
    });

    // ✅ Email content
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Post Management System'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome! Your Account Has Been Created',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>👋 Welcome, ${name}!</h1>
              <p>Your account has been successfully created</p>
            </div>
            
            <div class="content">
              <p>Hello ${name},</p>
              <p>An administrator has created an account for you. You're just one step away from getting started!</p>
              
              <div class="steps">
                <h3 style="margin-top: 0; color: #667eea;">📝 Setup Instructions:</h3>
                <ol style="padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Go to the login page: <a href="${loginUrl}/login" style="color: #667eea;">${loginUrl}/login</a></li>
                  <li style="margin-bottom: 10px;">Enter your email: <strong>${email}</strong></li>
                  <li style="margin-bottom: 10px;">Enter <strong>any temporary password</strong> (e.g., "temp123")</li>
                  <li style="margin-bottom: 10px;">You'll be prompted to create your own secure password</li>
                </ol>
              </div>
              
              <div style="text-align: center;">
                <a href="${loginUrl}/login" class="button">Get Started →</a>
              </div>
              
              <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin-top: 20px;">
                <strong>💡 Tip:</strong> Choose a strong password with at least 8 characters, including uppercase, lowercase, and numbers.
              </div>
            </div>
            
            <div class="footer">
              <p>If you didn't expect this email, please ignore it or contact support.</p>
              <p style="color: #999; font-size: 11px;">© ${new Date().getFullYear()} ${process.env.APP_NAME || 'Post Management System'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // ✅ Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   To:', email);
    
    return info;
    
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('   Email was supposed to go to:', email);
    
    // Don't throw - we don't want user creation to fail if email fails
    // Just log the error
    if (error.code === 'EAUTH') {
      console.error('   → Gmail authentication failed. Check your app password!');
    } else if (error.code === 'ESOCKET') {
      console.error('   → Network error. Check your internet connection.');
    }
    
    return null;
  }
}

module.exports = { sendWelcomeEmail };