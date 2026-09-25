import jwt from "jsonwebtoken";

export async function loginPolicymaker(req, res) {
  try {
    const { email, password } = req.body;
    const policymakerEmail = process.env.POLICYMAKER_EMAIL;
    const policymakerPassword = process.env.POLICYMAKER_PASSWORD;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (
      !policymakerEmail ||
      !policymakerPassword ||
      email.toLowerCase() !== policymakerEmail.toLowerCase() ||
      password !== policymakerPassword
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid policymaker credentials",
      });
    }

    const token = jwt.sign(
      {
        role: "policymaker",
        email: policymakerEmail,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    return res.json({
      success: true,
      message: "Policymaker login successful",
      token,
      user: {
        role: "policymaker",
        email: policymakerEmail,
      },
    });
  } catch (error) {
    console.error("[Auth] Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
}