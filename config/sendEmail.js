import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Initialize Resend client
let resendClient = null;
try {
    if (process.env.RESEND_API_KEY) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
        console.log('✅ Resend client initialized');
    }
} catch (error) {
    console.error('❌ Failed to initialize Resend client:', error);
}

// SMTP Configuration
function getSmtpCredentials() {
    const user = process.env.SMTP_USER || process.env.EMAIL;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    if (!user || !pass) return null;
    return { user, pass };
}

async function sendViaSmtp({ sendTo, subject, text, html }) {
    const credentials = getSmtpCredentials();
    if (!credentials) {
        console.log('⚠️ SMTP credentials not found');
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT || 465),
            secure: String(process.env.SMTP_SECURE ?? 'true') === 'true',
            auth: credentials,
        });

        const fromName = process.env.STORE_NAME || 'Zeedaddy';
        const info = await transporter.sendMail({
            from: `"${fromName}" <${credentials.user}>`,
            to: Array.isArray(sendTo) ? sendTo.join(',') : sendTo,
            subject,
            text,
            html,
        });

        console.log(`✅ SMTP email sent → ${sendTo} | ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ SMTP error:', error.message);
        return false;
    }
}

async function sendViaResend({ sendTo, subject, text, html }) {
    if (!resendClient) {
        console.log('⚠️ Resend client not initialized');
        return false;
    }

    try {
        const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';
        const fromName = process.env.STORE_NAME || 'Zeedaddy';
        const from = fromAddress.includes('<')
            ? fromAddress
            : `${fromName} <${fromAddress}>`;

        const { data, error } = await resendClient.emails.send({
            from,
            to: Array.isArray(sendTo) ? sendTo : [sendTo],
            subject,
            text: text || `Email from ${fromName}`,
            html: html || text,
        });

        if (error) {
            console.error('❌ Resend API error:', error.message);
            return false;
        }

        console.log(`✅ Resend email sent → ${sendTo} | ID: ${data?.id}`);
        return true;
    } catch (error) {
        console.error('❌ Resend exception:', error.message);
        return false;
    }
}

/**
 * Sends email via SMTP first, then Resend as fallback
 */
const sendEmailFun = async ({ sendTo, subject, text = '', html }) => {
    console.log('📧 Attempting to send email to:', sendTo);
    
    // Try SMTP first
    try {
        if (await sendViaSmtp({ sendTo, subject, text, html })) {
            return true;
        }
    } catch (error) {
        console.error('❌ SMTP send error:', error.message);
    }

    // Fallback to Resend
    try {
        if (await sendViaResend({ sendTo, subject, text, html })) {
            return true;
        }
    } catch (error) {
        console.error('❌ Resend send error:', error.message);
    }

    console.error('❌ All email methods failed');
    return false;
};

export default sendEmailFun;
