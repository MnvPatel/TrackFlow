export const accountCreatedTemplate = (name: string, setPasswordLink: string) => `
  <div style="font-family: Arial, sans-serif;">
    <h2>Your account has been created</h2>
    <p>Hi${name ? ` ${name}` : ""},</p>
    <p>An admin has created an account for you. Click the link below to set your password and sign in:</p>
    <p><a href="${setPasswordLink}" style="color: #2563eb;">Set your password</a></p>
    <p>Or copy this link: ${setPasswordLink}</p>
    <p>If you didn't expect this email, you can ignore it.</p>
  </div>
`;
