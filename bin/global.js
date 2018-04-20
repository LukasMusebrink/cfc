#!/usr/bin/env node
// Delete the 0 and 1 argument (node and script.js)
var args = process.argv.splice(process.execArgv.length + 2);

// Retrieve the first argument
var name = args[0];

var myLibrary = require('../index.js');

// Displays the text in the console
myLibrary.say('Jack, get back, come on before we crack Lose your blues, everybody cut footloose');
