import { Resend } from "resend";

const sendPopupEmail = async (data) => {

  const resend = new Resend(process.env.RESEND_API_KEY);

  const {
    fullName,
    email,
  } = data;

  await resend.emails.send({
    from: "hello@mail.strynder.com",
    to: [email],
    subject: "Welcome to Strynder",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.7; max-width: 600px; margin: auto;">

        <h2>Hi ${fullName},</h2>

        <p>
          You’re here because you know your business can do more.
        </p>

        <p>
          At <strong>Strynder</strong>, we help founders and businesses move from ideas and manual processes to structured, scalable systems powered by technology and strategy.
        </p>

        <p>
          Most businesses don’t fail because of lack of effort.
          They stall because they don’t have the right systems in place.
        </p>

        <p>
          That’s where we come in.
        </p>

        <p>
          Based on what you shared, we’d love to understand your goals a bit deeper and show you exactly how we can support you.
        </p>

        <p>
          👉 <a href="https://strynder.com/project-inquiry">
          Start here
          </a>
        </p>

        <p>
          This takes less than 2 minutes, and it helps us tailor everything specifically to you.
        </p>

        <p>
          Once you complete it, we’ll:
        </p>

        <ul>
          <li>Map out the best approach for your business</li>
          <li>Recommend the right tools or solutions</li>
          <li>Guide you on the fastest way to scale</li>
        </ul>

        <p>
          Looking forward to building with you.
        </p>

        <br />

        <p>
          — The Strynder Team
        </p>

        <p>
          <em>Fueling ideas, driving innovation</em>
        </p>

      </div>
    `,
  });

  console.log("✅ Popup email sent");
};

export default sendPopupEmail;