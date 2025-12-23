import nodemailer from "nodemailer";

// Tạo transporter cho email (SMTP)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465", // true cho port 465, false cho các port khác
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Gửi email OTP để đặt lại mật khẩu
export const sendOtpEmail = async ({ email, name, otp }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Han Store" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Mã OTP đặt lại mật khẩu - Han Store",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mã OTP đặt lại mật khẩu</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #000; margin: 0;">Han Store</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Xin chào ${name || "bạn"},</h2>
            
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Mã OTP của bạn là:</p>
              <h1 style="color: #000; font-size: 32px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Lưu ý:</strong> Mã OTP này có hiệu lực trong <strong>15 phút</strong>. 
              Vui lòng không chia sẻ mã này với bất kỳ ai.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Han Store. Tất cả quyền được bảo lưu.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Xin chào ${name || "bạn"},
        
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
        
        Mã OTP của bạn là: ${otp}
        
        Mã OTP này có hiệu lực trong 15 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.
        
        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        
        © ${new Date().getFullYear()} Han Store.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

// Gửi email xác nhận đơn hàng (có thể dùng sau này)
export const sendOrderConfirmationEmail = async ({
  email,
  name,
  orderId,
  orderDetails,
}) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Han Store" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Xác nhận đơn hàng #${orderId} - Han Store`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác nhận đơn hàng</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #000; margin: 0;">Han Store</h1>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h2 style="color: #333; margin-top: 0;">Xin chào ${name},</h2>
            
            <p>Cảm ơn bạn đã đặt hàng tại Han Store!</p>
            
            <p><strong>Mã đơn hàng:</strong> #${orderId}</p>
            
            <p>Chúng tôi sẽ xử lý đơn hàng của bạn và gửi thông tin vận chuyển trong thời gian sớm nhất.</p>
            
            <p>Bạn có thể theo dõi đơn hàng tại trang "Đơn hàng của tôi" trên website.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Han Store. Tất cả quyền được bảo lưu.</p>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw new Error("Failed to send order confirmation email");
  }
};

