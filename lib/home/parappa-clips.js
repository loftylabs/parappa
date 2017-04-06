var router = require('express').Router({ mergeParams: true });
module.exports = router;

router.callbacks    = require('./controllers/parappa-clips');
router.models       = require('./models');

router.get('/', router.callbacks.parappa);
