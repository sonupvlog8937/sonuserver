import { sendEmail } from "./emailService.js";

const sendEmailFun = async ({ sendTo, subject, text, html }) => {
    // Empty check pehle karo
    if (!sendTo || (Array.isArray(sendTo) && sendTo.length === 0)) {
        console.error("sendEmailFun: sendTo is empty or undefined, skipping.");
        return false;
    }
    console.log("Sending email to:", sendTo);
    const result = await sendEmail(sendTo, subject, text, html);
    if (result.success) {
        return true;
    } else {
        console.error("Email failed:", result.error);
        return false;
    }
}


export default sendEmailFun;