export const otpTemplate = (otp: string, title: string) => `
  <div style="font-family: Arial, sans-serif;">
    <h2>${title}</h2>
    <p>Your OTP code is:</p>
    <h1 style="letter-spacing: 4px;">${otp}</h1>
    <p>This code will expire in 5 minutes.</p>
  </div>
`;
