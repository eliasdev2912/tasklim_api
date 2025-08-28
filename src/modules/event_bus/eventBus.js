const EventEmitter = require('events');
const eventBus = new EventEmitter();

// Opcional: quitar límite de listeners
eventBus.setMaxListeners(0);

module.exports = eventBus;
