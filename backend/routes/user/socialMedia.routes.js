const express = require('express');
const router = express.Router();

const { getAllSocialMedia } = require('../../controllers/socialMedia.controller');

// GET ALL (for public display)
router.get('/social-media', getAllSocialMedia);
module.exports = router;
