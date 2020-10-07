//app/controllers/personController.js
import moment from 'moment';
import dbQuery from '../db/dev/dbQuery.js';
import {
  empty,
} from '../helpers/validation.js';
import {
  errorMessage, successMessage, status,
} from '../helpers/status.js';


/**
 * Add A Person
 * @param {object} req
 * @param {object} res
 * @returns {object} reflection object
 */
const addPerson = async (req, res) => {
  const {
    name, age,
  } = req.body;

  const created_on = moment(new Date());

  if (empty(name) || empty(age)) {
    errorMessage.error = 'All fields are required';
    return res.status(status.bad).send(errorMessage);
  }
  const createPersonQuery = `insert into public.persons 
    (name, age, created_on) 
    values($1, $2, $3)
    returning *`;
  const values = [name, age, created_on];
    
  try {
    const { rows } = await dbQuery.query(createPersonQuery, values);
    const dbResponse = rows[0];
    successMessage.data = dbResponse;
    return res.status(status.created).send(successMessage);
  } catch (error) {
    errorMessage.error = 'Unable to add person';
    return res.status(status.error).send(errorMessage);
  }
};


/**
 * Get person by id
 * @param {object} req
 * @param {object} res
 * @returns {object} returned person
 */
const getPersonById = async (req, res) => {
  const { personId } = req.query;

  const getPersonQuery = `select id, name, age, created_on 
    from public.persons where id = $1`;
  try {
    const { rows } = await dbQuery.query(getPersonQuery, [personId]);
    const dbResponse = rows;
    if (!dbResponse[0]) {
      errorMessage.error = 'No Person(s) with that Id';
      return res.status(status.notfound).send(errorMessage);
    }
    successMessage.data = dbResponse;
    return res.status(status.success).send(successMessage);
  } catch (error) {
    errorMessage.error = 'Operation was not successful';
    return res.status(status.error).send(errorMessage);
  }
};


/**
 * Get All Persons
 * @param {object} req 
 * @param {object} res 
 * @returns {object} Persons array
 */
const getAllPersons = async (req, res) => {
  const getAllPersonsQuery = `select id, name, age, created_on 
  from public.persons 
  order by id`;
  try {
    const { rows } = await dbQuery.query(getAllPersonsQuery);
    const dbResponse = rows;
    if (dbResponse[0] === undefined) {
      errorMessage.error = 'There are no persons';
      return res.status(status.notfound).send(errorMessage);
    }
    successMessage.data = dbResponse;
    return res.status(status.success).send(successMessage);
  } catch (error) {
    errorMessage.error = 'An error Occured';
    return res.status(status.error).send(errorMessage);
  }
};


/**
 * Delete A Person
 * @param {object} req 
 * @param {object} res 
 * @returns {void} return response Person deleted successfully
 */
  const deletePerson = async (req, res) => {
    const { personId } = req.params;
    const deletePersonQuery = `delete from public.persons 
      where id = $1 returning *`;
    try {
      const { rows } = await dbQuery.query(deletePersonQuery, [personId]);
      const dbResponse = rows[0];
      if (!dbResponse) {
        errorMessage.error = 'You have no Person with that id';
        return res.status(status.notfound).send(errorMessage);
      }
      successMessage.data = {};
      successMessage.data.message = 'Person deleted successfully';
      return res.status(status.success).send(successMessage);
    } catch (error) {
      return res.status(status.error).send(error);
    }
  };


/**
 * filter persons by name
 * @param {object} req
 * @param {object} res
 * @returns {object} returned person(s)
 */
const filterPersonByName = async (req, res) => {
  const { searchName } = req.query;

  const findPersonQuery = `select id, name, age, created_on 
    from public.persons where name = $1 order by name`;
  try {
    const { rows } = await dbQuery.query(findPersonQuery, [searchName]);
    const dbResponse = rows;
    if (!dbResponse[0]) {
      errorMessage.error = 'No Person(s) with that name';
      return res.status(status.notfound).send(errorMessage);
    }
    successMessage.data = dbResponse;
    return res.status(status.success).send(successMessage);
  } catch (error) {
    errorMessage.error = 'Operation was not successful';
    return res.status(status.error).send(errorMessage);
  }
};


export {
  addPerson,
  getPersonById, 
  getAllPersons,
  deletePerson, 
  filterPersonByName
};
