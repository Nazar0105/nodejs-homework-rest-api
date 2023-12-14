// app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./db'); // Додано підключення до бази даних
const authRoutes = require('./auth');
const contactsRoutes = require('./routes/api/contacts'); // Додано імпорт роутів для контактів
const multer = require('multer'); // Додано імпорт multer
const path = require('path'); // Додано імпорт path
const { processAvatar } = require('./avatarProcessing');
const { updateUserAvatar } = require('./routes/api/contacts'); // Додано імпорт для оновлення аватара користувача
const {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
  updateStatusContact,// Додано нову функцію
} = require('./routes/api/contacts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan('combined'));
app.use(cors());

// Підключення до бази даних
connectDB();

// Налаштування роботи з статичними файлами
app.use(express.static(path.join(__dirname, 'public')));

// Налаштування роботи з аватарками через Multer
const storage = multer.diskStorage({
  destination: 'public/avatars',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

// Роути для автентифікації
app.use('/api/users', authRoutes);

// Роути для контактів
app.use('/api/contacts', contactsRoutes);

// Ендпоінт для завантаження та обробки аватарки контакта
app.post('/api/avatars', upload.single('avatar'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const processedBuffer = await processAvatar(file.buffer);
    const avatarFileName = `${Date.now()}.jpeg`;
    const avatarPath = `/avatars/${avatarFileName}`;
    const avatarFilePath = path.join(__dirname, 'public', 'avatars', avatarFileName);

    require('fs').writeFileSync(avatarFilePath, processedBuffer);

    res.status(200).json({ avatarPath });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Ендпоінт для оновлення аватара користувача
app.patch('/api/users/avatars', upload.single('avatar'), async (req, res) => {
  const { file, user } = req;

  if (!file || !user) {
    return res.status(400).json({ message: 'Bad request' });
  }

  try {
    const processedBuffer = await processAvatar(file.buffer);
    const avatarFileName = `${user._id.toString()}${path.extname(file.originalname)}`;
    const avatarPath = path.join('public', 'avatars', avatarFileName);

    await require('fs').promises.writeFile(avatarPath, processedBuffer);
    const avatarURL = `/avatars/${avatarFileName}`;
    
    // Оновлення URL аватара користувача в базі даних
    await updateUserAvatar(user._id, avatarURL);

    res.status(200).json({ avatarURL });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await listContacts();
    res.status(200).json(contacts);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Роути
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await listContacts();
    res.status(200).json(contacts);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Роутер для оновлення статусу контакту
app.patch('/api/contacts/:id/favorite', async (req, res) => {
  const { id } = req.params;
  const { favorite } = req.body;

  // Перевірка наявності обов'язкового поля favorite
  if (favorite === undefined) {
    return res.status(400).json({ message: 'missing field favorite' });
  }

  try {
    const updatedContact = await updateStatusContact(id, { favorite });

    if (!updatedContact) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const contact = await getContactById(id);
    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/contacts', async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const newContact = await addContact({ name, email, phone });
    res.status(201).json(newContact);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.delete('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await removeContact(id);
    if (result) {
      res.status(200).json({ message: 'Contact deleted' });
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.put('/api/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  try {
    const updatedContact = await updateContact(id, { name, email, phone });
    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});