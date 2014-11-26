# Installation
### Basic Requirements
1. A domain name (*Fully qualified but we'll get to that)
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
### Install [Galleon](https://github.com/schahriar/Galleon)
```javascript
npm install Galleon
```

-------
## Important
Galleon requires bind access to two ports (SMTP: 25, SMTPS: 587) and you will not be able to bind to ports lower than 1024 without root access. While it would be possible to run Galleon as root it is highly not recommeneded to run any node application via root but a module called **authbind** provides this functionality for Galleon.

*Setting up authbind on most linux distribution would look like this:*
```
sudo apt-get install authbind
```
Once you have installed authbind run the following to configure port 25 (remember to replace <user> with current OS user's username):
```
sudo touch /etc/authbind/byport/25
sudo chown <user> /etc/authbind/byport/25
sudo chmod 755 /etc/authbind/byport/25
```
Run the same commands but replace port 587 with 25 to enable SMTPS access.

**Now** you can run Galleo (wait for a startup script in the Beta release) or your own startup script using:
```
authbind node <script.js>
```
Or to run it indefinitely install **Forever**:
```
npm install forever
```
& run:
```
authbind --deep forever <script.js>
```
