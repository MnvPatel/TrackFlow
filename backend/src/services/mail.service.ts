import { transporter } from "../config/mail";

export const sendMail = async (
  to: string,
  subject: string,
  html: string
) => {
  await transporter.sendMail({
    from: `"Task Portal" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};
