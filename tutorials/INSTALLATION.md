# Installation
### Basic Requirements
1. A domain name (\*Fully qualified but we'll get to that)
2. A server running Node.JS
3. A local database (**Galleon** supports most [Waterline](https://github.com/balderdashy/waterline) modules)

**Note:** Only NodeJS and Authbind is required for Galleon to function in a non-production environment. You should use a database and enable SpamAssasin by following the below directions to create a solid environment.
### OPTIONAL -> Install [MongoDB](http://docs.mongodb.org/manual/installation/)
```
sudo apt-get install -y mongodb-org
sudo service mongod start
```
### REQUIRED -> Install [NodeJS](http://nodejs.org/download/)
```
sudo apt-get update
sudo apt-get install nodejs npm
```
### OPTIONAL -> Install [SpamAssasin](http://spamassassin.apache.org/downloads.cgi?update=201402111327)
Note that Spam detection is automatically available once the SpamAssassin Daemon **SPAMD** is online (after installation). For automatic training and reporting [Refer to the tutorial here!](https://github.com/schahriar/Galleon/blob/master/tutorials/SPAMASSASIN.md)
```
sudo apt-get install spamassassin spamc
```
### Install [Galleon](https://github.com/schahriar/Galleon)
Make sure to include the *-g* flag in order to enable CLI functions.
```javascript
npm install -g Galleon
```

-------
## Setup
Run the following command to setup local directories and database connection:
```
galleon setup
```

-------
## Authbind
You'll need to setup **authbind** before running Galleon. [Check out the tutorial here!](https://github.com/schahriar/Galleon/blob/master/tutorials/AUTHBIND.md)

**After setting up Authbind** you can run Galleon using:
```
authbind --deep galleon start
```

-------
## Front-end interface
Galleon no longer packages a front-end interface but rather provides an API. You can install [**Seascape** from NPM](https://npm.com/schahriar/galleon-seascape) and serve as a front-facing interface.
