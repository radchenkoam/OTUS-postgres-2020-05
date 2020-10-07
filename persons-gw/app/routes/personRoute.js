//app/routes/personRoute.js
import express from 'express';
import { addPerson, getPersonById, getAllPersons, deletePerson, filterPersonByName } from '../controllers/personController.js';
import verifyAuth from '../middleware/verifyAuth.js';

const router = express.Router();

// persons Routes
router.post('/person', verifyAuth, addPerson);
router.get('/person/:personId', verifyAuth, getPersonById);
router.get('/person', verifyAuth, getAllPersons);
router.get('/person/:searchName', verifyAuth, filterPersonByName);
router.delete('/person/:personId', verifyAuth, deletePerson);

export default router;