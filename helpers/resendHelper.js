const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || "BugTrack <onboarding@resend.dev>";

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set");
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: Array.isArray(to) ? to : [to],
    subject,
    ...(html && { html }),
    ...(text && { text }),
  });
  if (error) throw new Error(error.message || JSON.stringify(error));
  return data;
}

module.exports = { sendEmail };
