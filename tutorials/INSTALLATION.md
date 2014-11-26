# Installation
### Basic Requirements
1. A domain name
2. A server running Node.JS
3. A document storage database (**Galleon** will be running only on MongoDB for the Alpha & Beta releases)

**Note:** For now you'll have to run a few commands by yourself but soon Galleon will include a simple installation interface.
### Install [MongoDB](http://docs.mongodb.org/manual/installation/)
```
sudo apt-get install -y mongodb-org
sudo service mongod start
```
### Install [NodeJS](http://nodejs.org/download/)
```
sudo apt-get update
sudo apt-get install nodejs npm
```
### Install Galleon
```javascript
npm install Galleon
```