import express from 'express';

import { 
    searchPropertiesHandler,
    rankedPropertyFeedHandler,
} from './property-search.controller.js'


const router = express.Router()

router.get('/search', searchPropertiesHandler);
router.get('/feed', rankedPropertyFeedHandler);

export default router;