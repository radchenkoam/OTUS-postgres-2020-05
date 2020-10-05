class PersonManager {
    constructor () {
        // Задаем поля класса в его конструкторе.

        // Словарь - позволяет получить Person по id.
        this.persons = {};
        // Счетчик, который хранит id, который будет присвоен следующей Person
        this._nextPersonId = 0;
    }

    createPerson (name, age) {
        // Создаем новую Person
        let person = new Person(this._nextPersonId++, name, age);
        // Заносим ее в словарь
        this.persons[person.id] = person;
        return person;
    }

    // Регистронезависимый поиск по имени Person
    findByName (searchSubstring) {
        // Переведем поисковый запрос в нижний регистр
        let lowerSearchSubstring = searchSubstring.toLowerCase();

        // Получим массив Person. Для этого, получим все ключи словаря в виде
        // массива, и для каждого ключа вытащим соответствующий ему элемент
        //let persons = Object.values(this.persons);
        let persons = Object.keys(this.persons).map(id => this.persons[id]);

        // Отфильтруем из массива только те Person, в имени которых есть
        // заданная подстрока
        return persons.filter(person =>
            person.name.toLowerCase().indexOf(lowerSearchSubstring) !== -1
        );
    }

    // Получаем Person по ее id
    getById (id) {
        return this.persons[id];
    }
}

class Person {
    constructor (id, name, age) {
        this.id = id;
        this.name = name;
        this.age = age;
    }

    toJson () {
        // Приведем объект к тому JSON-представлению, которое отдается клиенту
        return {
            id: this.id,
            name: this.name,
            age: this.age
        };
    }
}

// Определим объекты, которые будут экспортироваться модулем как внешнее API:
module.exports = { PersonManager, Person };