/* eslint-disable no-useless-catch */
// contacts.js
const mongoose = require('mongoose');

const contactSchemaMongoose = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Set name for contact'],
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
});

const Contact = mongoose.model('Contact', contactSchemaMongoose);

const Joi = require('joi');

const contactSchemaJoi = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
});

async function updateStatusContact(contactId, body) {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite: body.favorite },
      { new: true }
    );
    
    if (!updatedContact) {
      return null; // Контакт не знайдений
    }

    return updatedContact;
  } catch (error) {
    throw error;
  }
}

async function listContacts() {
  try {
    const contacts = await Contact.find();
    return contacts;
  } catch (error) {
    throw error;
  }
}

async function getContactById(contactId) {
  try {
    const contact = await Contact.findById(contactId);
    return contact;
  } catch (error) {
    throw error;
  }
}

async function addContact(contact) {
  try {
    const newContact = await Contact.create(contact);
    return newContact;
  } catch (error) {
    throw error;
  }
}

async function removeContact(contactId) {
  try {
    const removedContact = await Contact.findByIdAndRemove(contactId);
    return removedContact;
  } catch (error) {
    throw error;
  }
}

async function updateContact(contactId, data) {
  try {
    const updatedContact = await Contact.findByIdAndUpdate(contactId, data, { new: true });
    return updatedContact;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
  updateStatusContact,
  contactSchemaJoi, // Додано експорт Joi-схеми
};
