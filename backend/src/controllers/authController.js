import jwt from "jsonwebtoken";

const POLICYMAKER_EMAIL = process.env.POLICYMAKER_EMAIL;
const POLICYMAKER_PASSWORD = process.env.POLICYMAKER_PASSWORD;

export async function loginPolicymaker(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (
      email.toLowerCase() !== POLICYMAKER_EMAIL?.toLowerCase() ||
      password !== POLICYMAKER_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid policymaker credentials",
      });
    }

    const token = jwt.sign(
      {
        role: "policymaker",
        email: POLICYMAKER_EMAIL,
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
        email: POLICYMAKER_EMAIL,
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