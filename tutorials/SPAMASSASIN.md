# SpamAssasin setup
Install [SpamAssasin](http://spamassassin.apache.org/downloads.cgi?update=201402111327)
```
sudo apt-get install spamassassin spamc
```
Edit **SpamAssasin** launch config using root privileges:
```
sudo nano /etc/default/spamassassin
```
Set ENABLED to 1 to activate daemon:
```
ENABLED=1
```
Add **-l** flag to options to enable Spam/Ham reporting and learning in Galleon:
```
OPTIONS="-l --create-prefs --max-children 5 --helper-home-dir"
```
Set CRON to 1 to *enable the cron job to automatically update SpamAssassin's rules on a nightly basis*:
```
CRON=1
```

Restart **SpamAssasin** for changes to take effect:
```
sudo service spamassassin start
```
