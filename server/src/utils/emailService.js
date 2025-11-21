const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Validate required environment variables
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER and SMTP_PASS environment variables are required for sending emails');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER, // Your email
      pass: process.env.SMTP_PASS, // Your email password or app password
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CertifyHub" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Login OTP - CertifyHub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #4a90e2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">CertifyHub</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 5px 5px;">
            <h2 style="color: #333;">Hello ${userName},</h2>
            <p style="color: #666; font-size: 16px;">Your One-Time Password (OTP) for login is:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
              <h1 style="color: #4a90e2; font-size: 36px; letter-spacing: 5px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this OTP, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} CertifyHub. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
        Hello ${userName},
        
        Your One-Time Password (OTP) for login is: ${otp}
        
        This OTP is valid for 10 minutes. Please do not share this code with anyone.
        
        If you didn't request this OTP, please ignore this email.
        
        © ${new Date().getFullYear()} CertifyHub. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  sendOTPEmail,
};

