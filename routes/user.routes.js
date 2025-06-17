const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Show register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Register handler
router.post(
  '/register',
  body('email').trim().isEmail().isLength({ min: 13 }),
  body('password').trim().isLength({ min: 5 }),
  body('username').trim().isLength({ min: 3 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).render('register', {
          error: 'Invalid registration data',
        });
      }
      const { email, username, password } = req.body;
        let existingUser;
            try {
            existingUser = await userModel.findOne({ $or: [{ email }, { username }] });
            } catch (err) {
            console.error('Error in DB findOne:', err.message);
            return res.status(500).render('register', {
                error: 'Server error. Please try again later.',
            });
            }
      const hashPassword = await bcrypt.hash(password, 10);
      const newUser = await userModel.create({
        email,
        username,
        password: hashPassword,
      });
        if (!process.env.JWT_SECRET){
        console.error('❌ JWT_SECRET not defined');
        return res.status(500).render('register', {
            error: 'Internal error. JWT secret not set.',
        });
        }
      const token = jwt.sign(
        {
          userId: newUser._id,
          email: newUser.email,
          username: newUser.username,
        },
        process.env.JWT_SECRET
      );
      res.cookie('token', token);
      res.redirect('/home');

    } catch (err) {
      console.error('Register Error:', err.message);
      res.status(500).render('register', {
        error: 'Something went wrong. Please try again.',
      });
    }
  }
);

// Show login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Login handler
router.post(
  '/login',
  body('username').trim().isLength({ min: 3 }),
  body('password').trim().isLength({ min: 5 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).render('login', {
          error: 'Invalid login data',
        });
      }

      const { username, password } = req.body;

      const user = await userModel.findOne({ username });

      if (!user) {
        return res.status(400).render('login', {
          error: 'Username or password is incorrect',
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).render('login', {
          error: 'Username or password is incorrect',
        });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          username: user.username,
        },
        process.env.JWT_SECRET
      );
      console.log("jwt", JWT_SECRET)

      res.cookie('token', token);
      res.redirect('/home');
    } catch (err) {
      console.error('Login Error:', err.message);
      res.status(500).render('login', {
        error: 'Something went wrong. Please try again.',
      });
    }
  }
);

module.exports = router;
