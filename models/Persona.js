const { Schema, model } = require('mongoose');

const Persona = Schema({
    id: String,
    name: String,
    image: String
})

module.exports = model('Persona', Persona);