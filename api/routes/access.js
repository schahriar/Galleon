var argv = require('yargs').argv;
var express = require('express');
var router = express.Router();

router.post('/login', require("./methods/post.access.js").login);
router.post('/logout', require("./methods/post.access.js").logout);
router.post('/changepassword', require("./methods/post.access.js").changePassword);
router.get('/check', require("./methods/get.access.js"));

module.exports = router;
