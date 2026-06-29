import { Resend } from "resend";

let resendInstance = null;
const getResend = () => {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
};

const sendEmails = async (data) => {
  try {
    const resend = getResend();

    const {
      fullName,
      email,
      
      projectType,
      projectDescription,
    } = data;

    // =========================
    // EMAIL TO USER
    // =========================

    const userEmailResponse = await resend.emails.send({
      from: "Olatunji from Strynder <hello@mail.strynder.com>",
      to: [email],
      subject: "We Received Your Inquiry",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          
          <h2>Hello ${fullName},</h2>

          <p>
           Thank you for sharing your project with us.
          </p>

          <p>
          We’ve received your details and your request is now being reviewed by our team.
          </p>

          <p>
           At Strynder, we don’t just deliver services — we design systems that help businesses operate efficiently, scale sustainably, and become investment-ready.
          </p>

          <p>
          Based on your submission, the next step is to align on your goals and map out the best execution path
          </p>

        <a 
          href="https://calendly.com/strynderhelp/30min"
          style="
            background:#7416F3;
            color:white;
            padding:12px 20px;
            border-radius:8px;
            text-decoration:none;
            display:inline-block;
            margin-top:20px;
          "
        >
          Book a Strategy Call
        </a>

         <p>During this session, we'll:</p>

          <p>● Break down your idea or current setup</p>
          <p>● Identify opportunities for optimisation and automation</p>
          <p>● Outline the best approach to build and scale your business</p>

          <p>If you prefer another communication channel (WhatsApp, email, etc.), feel free to reply to this message and let us know what works best for you.</p>

          <p>We're looking forward to working with you.</p>

          <br />

          <p>— Strynder Team</p>

        </div>
      `,
    });

    console.log("✅ User email sent, ID:", userEmailResponse.id);

    // =========================
    // EMAIL TO ADMIN
    // =========================

    const adminEmailResponse = await resend.emails.send({
      from: "Strynder Lead System <hello@mail.strynder.com>",
      to: [process.env.ADMIN_EMAIL],
      subject: "New Project Inquiry",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">

          <h2>New Inquiry Submitted</h2>

          <p><strong>Name:</strong> ${fullName}</p>

          <p><strong>Email:</strong> ${email}</p>

          <p><strong>Project Type:</strong> ${projectType}</p>

          <p><strong>Description:</strong></p>

          <p>${projectDescription}</p>

        </div>
      `,
    });

    console.log("✅ Admin email sent, ID:", adminEmailResponse.id);

    console.log("✅ All emails processed successfully");

  } catch (error) {

    console.error("❌ Email Error:");

    // Full error object
    console.error(error);

    // Resend-specific details
    if (error.response) {
      console.error("Response data:", error.response.data);
    }

    throw new Error("Failed to send inquiry emails", { cause: error });
  }
};

export default sendEmails;