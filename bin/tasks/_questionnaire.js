"use strict";

var inquirer = require('inquirer');
var fs = require('fs');
var path = require('path');

function validateDirectory(input) {
    var done = this.async();

    fs.access(path.resolve(input), fs.R_OK | fs.W_OK, function(err) {
        done(err ? 'NO ACCESS! USE ABSOLUTE PATHS OR CORRECT FILE PERMISSIONS' : true);
    });
}

module.exports = {
    domain: function(callback) {
        inquirer.prompt([{
            type: "input",
            name: "domain",
            message: "Enter your FQDN (fully qualified domain name) -> IMPORTANT:"
        }], callback);
    },
    directory: function(callback) {
        inquirer.prompt([{
            type: "confirm",
            name: "auto",
            message: "Should Galleon automatically create and set permissions of required directories?",
        }, {
            type: "checkbox",
            name: "perform",
            message: "Should Galleon perform the following? (You can Multi-Select)",
            choices: [{
                value: "attachments",
                name: "Save attachments",
                checked: true
            }, {
                value: "raw",
                name: "Store raw emails",
                checked: true
            }]
        }, {
            type: "input",
            name: "location_attachments",
            message: "Enter the location to store attachments in:",
            when: function(answers) {
                return !answers.auto && (answers.perform.indexOf('attachments') + 1);
            },
            validate: validateDirectory
        }, {
            type: "input",
            name: "location_raw",
            message: "Enter the location to store raw emails in:",
            when: function(answers) {
                return !answers.auto && (answers.perform.indexOf('raw') + 1);
            },
            validate: validateDirectory
        }], callback)
    },
    database: function(callback) {
        inquirer.prompt([{
            type: "list",
            name: "adapter",
            message: "Select Database Adapter",
            choices: [
                new inquirer.Separator("Recommended:"),
                { name: "MongoDB", value: "sails-mongo" },
                { name: "Redis", value: "sails-redis" },
                new inquirer.Separator("Optional:"),
                { name: "PostgreSQL", value: "sails-postgresql" },
                { name: "MySQL", value: "sails-mysql" },
                { name: "Microsoft SQL Server", value: "sails-sqlserver" },
                { name: "Disk", value: "sails-disk" },
                { name: "Memory", value: "sails-memory" }
            ]
        }, {
            type: "input",
            name: "database_name",
            message: "Enter the database name for the selected adapter:",
        }, {
            type: "input",
            name: "host",
            message: "Enter the host location:",
            default: "localhost"
        }, {
            type: "input",
            name: "port",
            message: "Enter the port:",
            default: function(answers) {
                var crs = {
                    "sails-mongo": 27017,
                    "sails-redis": 6379,
                    "sails-postgresql": 5432,
                    "sails-mysql": 3306,
                    "sails-sqlserver": 1433,
                    "sails-disk": null,
                    "sails-memory": null
                }
                return crs[answers.adapter];
            }
        }, {
            type: "input",
            name: "username",
            message: "Enter database username (requires read/write/delete access):",
        }, {
            type: "password",
            name: "password",
            message: "Enter password:",
        }], callback);
    }
}
