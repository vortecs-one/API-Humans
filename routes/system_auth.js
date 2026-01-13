// routes/system_auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // use "bcrypt" if your project uses bcrypt
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.post(
  "/system-login",
  [
    body("username").isString().notEmpty(),
    body("password").isString().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;

    // system accounts from .env
    const candidates = [
      {
        role: "admin",
        user: process.env.ADMIN_USER,
        hash: process.env.ADMIN_PASS,
        secret: process.env.JWT_SECRET_ADMIN,
      },
      {
        role: "dev",
        user: process.env.DEVELOPER_USER,
        hash: process.env.DEVELOPER_PASS,
        secret: process.env.JWT_SECRET_DEV,
      },
      // optional:
      ...(process.env.TEST_USER && process.env.TEST_PASS
        ? [{
            role: "dev",
            user: process.env.TEST_USER,
            hash: process.env.TEST_PASS,
            secret: process.env.JWT_SECRET_DEV,
          }]
        : []),
    ].filter(x => x.user && x.hash);

    const found = candidates.find(x => x.user === username);
    if (!found) return res.status(401).json({ error: "Invalid credentials" });
    if (!found.secret) return res.status(500).json({ error: "JWT secret not configured" });

    const ok = await bcrypt.compare(password, found.hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { username: found.user, role: found.role, type: "system" },
      found.secret,
      { expiresIn: "2h" }
    );

    return res.json({ token, role: found.role });
  }
);

module.exports = router;
