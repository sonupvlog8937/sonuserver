import nodemailer from 'nodemailer';

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: false,
  auth: {
     user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT || 10000),
  greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT || 10000),
  socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT || 15000),
});

// Function to send email
async function sendEmail(to, subject, text, html) {
  try {
   if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
      return { success: false, error: 'EMAIL or EMAIL_PASS is not configured' };
    }
    const info = await transporter.sendMail({
       from: process.env.EMAIL,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

export {sendEmail};