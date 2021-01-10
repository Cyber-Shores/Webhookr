const { Schema, model } = require('mongoose');

const Persona = Schema({
    id: String,
    name: String,
    finder: String,
    image: String
})

module.exports = model('Persona', Persona);