import { Resend } from 'resend';

const resendClient = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

/**
 * Sends email using Resend API
 */
const sendEmailFun = async ({ sendTo, subject, text = '', html }) => {
    if (!resendClient) {
        console.error('❌ Resend API key not configured');
        return false;
    }

    try {
        const fromAddress =
            process.env.RESEND_FROM ||
            process.env.EMAIL_FROM ||
            'onboarding@resend.dev';
        const fromName = process.env.STORE_NAME || 'Zeedaddy';
        const from = fromAddress.includes('<')
            ? fromAddress
            : `${fromName} <${fromAddress}>`;

        const { data, error } = await resendClient.emails.send({
            from,
            to: Array.isArray(sendTo) ? sendTo : [sendTo],
            subject,
            text,
            html,
        });

        if (error) {
            console.error('❌ Resend email error:', error);
            return false;
        }

        console.log(`📧 Resend email sent → ${sendTo} | ID: ${data?.id}`);
        return true;
    } catch (error) {
        console.error('❌ Resend send error:', error.message);
        return false;
    }
};

export default sendEmailFun;
