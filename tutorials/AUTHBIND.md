# Authbind setup
Galleon requires bind access to two ports (SMTP: 25, SMTPS: 587) and you will not be able to bind to ports lower than 1024 without root access. While it would be possible to run Galleon as root it is highly not recommended to run any node application via root but **authbind** provides this functionality.

*Setting up authbind on most linux distribution would look like this:*
```
sudo apt-get install authbind
```
Once you have installed authbind run the following to configure port 25 (remember to replace <user> with current OS user's username):
```
sudo touch /etc/authbind/byport/25
sudo chown <user> /etc/authbind/byport/25
sudo chmod 755 /etc/authbind/byport/25
