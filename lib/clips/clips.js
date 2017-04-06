var router = require('express').Router({ mergeParams: true });
var multer = require('multer');
router.callbacks    = require('./controllers/clips');
router.models       = require('./models');

router.get('/', router.callbacks.list);
router.get('/:clipId/delete', router.callbacks.delete);
router.post('/upload', router.callbacks.upload);

module.exports = router;
