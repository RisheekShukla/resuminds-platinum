import nodemailer from 'nodemailer'

const sendEmail = async (options) => {
    // 1) Create a transporter
    // For production, use SendGrid or Resend. For testing, you can use Mailtrap or Gmail.
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    })

    // 2) Define the email options
    const mailOptions = {
        from: `ResuMinds Platinum <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    }

    // 3) Actually send the email
    await transporter.sendMail(mailOptions)
}

export default sendEmail
