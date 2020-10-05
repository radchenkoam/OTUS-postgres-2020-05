// Подключим внешние зависимости из node_modules.
const express = require('express');
const bodyParser = require('body-parser');
const faker = require('faker/locale/ru');;

// Подключаем наш модуль models.js
const models = require('./models');


class Application {
    constructor () {
        // Создаем наше Express-приложение.
        this.expressApp = express();
        // Создаем PersonManager, экспортированный из models.js
        this.manager = new models.PersonManager();
        this.attachRoutes();
    }

    attachRoutes () {
        let app = this.expressApp;
        // Создадим middleware для обработки JSON-тел запросов, т. е. функцию,
        // которая будет вызываться перед нашими обработчиками и обрабатывать
        // JSON в теле запроса, чтобы наш обработчик получил готовый объект.
        let jsonParser = bodyParser.json();

        // Назначаем функции-обработчики для GET/POST разных URL. При запросе на
        // указанный первым аргументом адрес, будут вызваны все функции,
        // которые переданы начиная со второго аргумента (их может быть сколько
        // угодно).
        // Важно обратить внимание на .bind - тут мы назначаем в качестве
        // обработчиков методы, а не функции. По сути, метод - это функция,
        // привязанная к объекту, что мы и делаем методом bind. Без него мы
        // получим неопределенный this, так как метод будет вызван как обычная
        // функция. Так следует делать всегда при передаче метода как аргумента.
        // Каждый обработчик принимает два аргумента - объекты запроса и ответа,
        // обозначаемые как req и res.
        app.get('/persons', this.personSearchHandler.bind(this));
        app.post('/persons', jsonParser, this.createPersonHandler.bind(this));
        // Имя после двоеточия - параметр, принимающий произвольное значение.
        // Такие параметры доступны в req.params
        app.get('/persons/:personId', this.getPersonHandler.bind(this));
        app.post('/persons/:personId', jsonParser, this.postPersonHandler.bind(this));
    }

    // Обработчик создания Person
    createPersonHandler (req, res) {
        let name = req.body.name;
        let age = req.body.age;

        // Если нет полей name и age в JSON-теле - генерируем с помощью faker
        if (!name) {
            name = faker.name.findName(); 
            // res.status(400).json({});
        }; 
        
        if(!age) {
            age = this.getAge(faker.date.between('1950-01-01', '2013-12-31'));
        };

        // Создаем Person в manager'e и вернем ее в виде JSON
        let person = this.manager.createPerson(name, age);
        console.log('Create', person);

        let response = {
            person: person.toJson()
        };
        // Отправим ответ клиенту. Объект будет автоматически сериализован
        // в строку. Если явно не задано иного, HTTP-статус будет 200 OK.
        res.json(response);
    }

    getPersonHandler (req, res) {
        // Получаем Person по ID. Если Person нет - вернется undefined
        let person = this.manager.getById(req.params.personId);

        // Проверка на то, нашлась ли такая Person
        if (!person) {
            // Если нет - 404 Not Found и до свидания
            res.status(404).json({});
        } else {
            // Преобразуем в JSON
            let response = {
                person: person.toJson()
            };

            // Отправим ответ клиенту
            res.json(response);
        }
    }

    postPersonHandler (req, res) {
        // Получаем Person по ID
        let person = this.manager.getById(req.params.personId);

        if (!person) {
            res.status(404).json({});
        } else {
            // Преобразуем в JSON
            let response = {
                person: person.toJson()
            };

            // Отправим ответ клиенту
            res.json(response);
        }
    }

    personSearchHandler (req, res) {
        // Получаем строку-фильтр из query-параметров.
        let searchName = req.query.searchName || '';

        // Ищем Persons и представляем их в виде JSON
        let persons = this.manager.findByName(searchName);
        let personsJson = persons.map(person => person.toJson());
        let response = {
            persons: personsJson
        };

        // Отдаем найденное клиенту
        res.json(response);
    }

    // Вычисление возраста (age) из даты рождения
    getAge(birthday) {
        const millis = Date.now() - Date.parse(birthday);
        return new Date(millis).getFullYear() - 1970;
    }
}


// Экспортируем наш класс наружу
module.exports = Application;