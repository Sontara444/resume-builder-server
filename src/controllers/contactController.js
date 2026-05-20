const Contact = require('../models/Contact');

/**
 * @desc    Submit contact form
 * @route   POST /api/contact
 * @access  Public
 */
const submitContactForm = async (req, res) => {
  try {
    const { name, email, inquiryType, subject, message } = req.body;

    // Simple manual validation check as a first layer
    if (!name || !email || !inquiryType || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, email, inquiryType, and message.'
      });
    }

    // Email validation regex check
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    // Inquiry type validation
    const allowedTypes = ['General Inquiry', 'Technical Support', 'Feedback', 'Business Partnership'];
    if (!allowedTypes.includes(inquiryType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inquiry type.'
      });
    }

    // Create entry in database
    const newContact = await Contact.create({
      name,
      email,
      inquiryType,
      subject: subject || '',
      message
    });

    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted successfully!',
      data: {
        id: newContact._id,
        name: newContact.name,
        email: newContact.email
      }
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.'
    });
  }
};

module.exports = {
  submitContactForm
};
