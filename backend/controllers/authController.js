const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const memoryStore = require('../utils/memoryStore');

// Helper to generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'eduspark_secret_key_2026_super_secure',
    { expiresIn: '30d' }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, grade, subject, phone } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role.',
      });
    }

    const validRoles = ['admin', 'teacher', 'parent', 'student'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role specified. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Check if user exists in DB or memoryStore
    let existingUser = null;
    try {
      existingUser = await User.findOne({ email: email.toLowerCase() });
    } catch (dbError) {
      existingUser = memoryStore.findByEmail(email);
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Generate verification token (placeholder for email verification flow)
    const verificationToken = crypto.randomBytes(20).toString('hex');

    let user;
    let token;

    try {
      // Try MongoDB creation
      user = await User.create({
        name,
        email,
        password,
        role,
        grade: grade || '',
        subject: subject || '',
        phone: phone || '',
        isVerified: true, // Default to true for instant demo access
        verificationToken,
      });

      token = generateToken(user._id, user.role);

      res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to EduSpark AI.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          grade: user.grade,
          subject: user.subject,
          isVerified: user.isVerified,
        },
      });
    } catch (mongoErr) {
      // Fallback to Memory Store if MongoDB is unavailable
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const memoryUser = memoryStore.saveUser({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        grade: grade || '',
        subject: subject || '',
        phone: phone || '',
        isVerified: true,
        verificationToken,
      });

      token = generateToken(memoryUser._id, memoryUser.role);

      res.status(201).json({
        success: true,
        message: 'Registration successful (Demo Mode)! Welcome to EduSpark AI.',
        token,
        user: {
          id: memoryUser._id,
          name: memoryUser.name,
          email: memoryUser.email,
          role: memoryUser.role,
          grade: memoryUser.grade,
          subject: memoryUser.subject,
          isVerified: memoryUser.isVerified,
        },
      });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    let user = null;
    let isMatch = false;

    try {
      user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (user) {
        isMatch = await user.matchPassword(password);
      }
    } catch (dbErr) {
      // Fallback to memory store
      user = memoryStore.findByEmail(email);
      if (user) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    }

    // Check memory store if user wasn't found in DB
    if (!user) {
      user = memoryStore.findByEmail(email);
      if (user) {
        isMatch = await bcrypt.compare(password, user.password);
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Optional role check if client specified role on login
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account found, but it is registered as a '${user.role}', not '${role}'.`,
      });
    }

    const token = generateToken(user._id || user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        grade: user.grade || '',
        subject: user.subject || '',
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

// @desc    Forgot Password - Request reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address.',
      });
    }

    let user = null;
    try {
      user = await User.findOne({ email: email.toLowerCase() });
    } catch (dbErr) {
      user = memoryStore.findByEmail(email);
    }
    if (!user) {
      user = memoryStore.findByEmail(email);
    }

    if (!user) {
      // Security best practice: don't reveal if user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been generated.',
        demoResetToken: null,
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    try {
      if (user.save && typeof user.save === 'function') {
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();
      } else {
        memoryStore.saveUser({
          ...user,
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires,
        });
      }
    } catch (saveErr) {
      memoryStore.saveUser({
        ...user,
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password reset link generated successfully! (Check response/console for token).',
      resetToken, // Returned in API response for easy testing in frontend
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request.',
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both the reset token and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    let user = null;
    try {
      user = await User.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpires: { $gt: Date.now() },
      });
    } catch (dbErr) {
      user = memoryStore.findByResetToken(resetToken);
    }

    if (!user) {
      user = memoryStore.findByResetToken(resetToken);
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    // Set new password
    if (user.save && typeof user.save === 'function') {
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      memoryStore.saveUser({
        ...user,
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password successfully reset! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
    });
  }
};

// @desc    Verify Email Placeholder
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    let user = null;
    try {
      user = await User.findOne({ verificationToken: token });
    } catch (dbErr) {
      user = memoryStore.findByVerifyToken(token);
    }
    if (!user) {
      user = memoryStore.findByVerifyToken(token);
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email verification token.',
      });
    }

    if (user.save && typeof user.save === 'function') {
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();
    } else {
      memoryStore.saveUser({
        ...user,
        isVerified: true,
        verificationToken: undefined,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email successfully verified!',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying email.',
    });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
