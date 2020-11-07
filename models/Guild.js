const { Schema, model } = require('mongoose');

const Guild = Schema(
    {
        id: String,
        mimickable: {
            default: true,
            type: Boolean
        },
        premium: {
            default: false,
            type: Boolean
        }
    },
    { collection : "guild" }
)
module.exports = model('Guild', Guild, 'guild');
