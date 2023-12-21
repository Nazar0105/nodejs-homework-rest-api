/* eslint-disable no-unused-vars */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./routes/api/contacts'); 
const uuid = require('uuid');

async function registerUser(userData) {
  const { email, password } = userData;

  require('dotenv').config();

  // Перевірка, чи є вже користувач з такою електронною адресою
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email is already in use');
  }

  // Хешування пароля
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Створення нового користувача
  const user = new User({
    email,
    password: hashedPassword,
  });

  // Збереження користувача в базі даних
  await user.save();

  // Видалення паролю з відповіді
  const userResponse = {
    email: user.email,
    subscription: user.subscription,
  };

  return { user: userResponse };
}

const registerUserController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Генеруємо verificationToken
    const verificationToken = uuid.v4(); // або використовуйте свій метод генерації

    // Зберігаємо користувача в базу даних з verificationToken
    const user = await User.create({ email, password, verificationToken });

    // Відправляємо електронний лист з посиланням для верифікації email
    const verificationLink = `http://nodejs-homework-rest-api/api/users/verify/${verificationToken}`;
    // Використайте ваш метод для відправлення листа (можливо, за допомогою SendGrid або Nodemailer)
    // eslint-disable-next-line no-undef
    sendVerificationEmail(email, verificationLink);

    res.status(201).json({ message: 'User registered successfully. Check your email for verification.' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

delete module.exports.registerUser;


async function loginUser(userData) {
  const { email, password } = userData;

  // Пошук користувача за електронною адресою
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Email or password is wrong');
  }

  // Перевірка пароля
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Email or password is wrong');
  }

  // Створення JWT-токена
  const secretKey = process.env.JWT_SECRET || 'qWesz0874531764X';
  const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });


  // Збереження токена у користувача
  user.token = token;
  await user.save();

  // Видалення паролю з відповіді
  const userResponse = {
    email: user.email,
    subscription: user.subscription,
  };

  return { token, user: userResponse };
}


module.exports = { registerUser, loginUser };