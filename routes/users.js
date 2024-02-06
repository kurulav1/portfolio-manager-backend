var express = require('express');
var router = express.Router();
const { registerUser, authenticateUser } = require('../services/userService');
const jwt = require('jsonwebtoken');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const userId = await registerUser(username, password, email);
    res.status(201).send({ userId });
  } catch (err) {
    if (err.message === 'User already exists') {
      return res.status(400).send(err.message);
    }
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = await authenticateUser(username, password);
    const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).send({ token });
  } catch (err) {
    if (err.message === 'User not found' || err.message === 'Invalid password') {
      return res.status(401).send(err.message);
    }
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/validateToken', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Extract the token from the Authorization header
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Optionally, fetch user details from your database using the decoded.userId
    // and return relevant user information
    res.status(200).send({ userId: decoded.userId, /* other user info */ });
  } catch (error) {
    res.status(401).send('Invalid or expired token');
  }
});

module.exports = router;
