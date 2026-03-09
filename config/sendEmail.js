import nodemailer from 'nodemailer';

// ─── Transporter ─────────────────────────────────────────────────────────────
// SMTP_USER aur SMTP_PASS .env se aata hai
const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true', // port 465 → true, port 587 → false
    auth: {
        user: process.env.SMTP_USER, // sonupvlog8937@gmail.com
        pass: process.env.SMTP_PASS, // Gmail App Password
    },
});

// Server start hone pe connection verify karo
transporter.verify((error) => {
    if (error) {
        console.error('❌ Email transporter failed:', error.message);
    } else {
        console.log('✅ Email transporter ready —', process.env.SMTP_USER);
    }
});

/**
 * Email bhejne ka main function
 *
 * @param {Object}          options
 * @param {string|string[]} options.sendTo   - ek ya zyada recipient emails
 * @param {string}          options.subject  - email subject line
 * @param {string}          [options.text]   - plain text fallback
 * @param {string}          options.html     - HTML body
 * @returns {Promise<boolean>}               - true = sent, false = failed
 */
const sendEmailFun = async ({ sendTo, subject, text = '', html }) => {
    try {
        const info = await transporter.sendMail({
            from:    `"${process.env.STORE_NAME || 'MyStore'}" <${process.env.SMTP_USER}>`,
            to:      Array.isArray(sendTo) ? sendTo.join(', ') : sendTo,
            subject,
            text,
            html,
        });

        console.log(`📧 Email sent → ${info.envelope.to} | ID: ${info.messageId}`);
        return true;

    } catch (error) {
        console.error('❌ sendEmailFun error:', error.message);
        return false;
    }
};

export default sendEmailFun;