grafana Authentication Proxy
============

Hosts the latest [grafana](https://github.com/torkelo/grafana) and elasticsearch behind Google OAuth2, Basic Authentication or CAS Authentication with NodeJS and Express.

- A proxy between Elasticsearch, grafana and user client
- Support Elasticsearch which protected by basic authentication, only grafana-authentication-proxy knows the user/passwd
- Compatible with the latest grafana
- Enhanced authentication methods. Now support Google OAuth2, BasicAuth(multiple users supported) and CAS Authentication for the clients
- Per-user grafana index supported. now you can use index grafana-int-userA for user A and grafana-int-userB for user B
- Inspired by and based on [kibana-authentication-proxy](https://github.com/fangli/kibana-authentication-proxy), 99% from this is at the moment written by them, thanks:)

*We NO LONGER support third-party plugins such as `Bigdesk` or `Head` since it is hard to test and maintain*

Installation
=====

```
# git clone https://github.com/strima/grafana-authentication-proxy.git
# cd grafana-authentication-proxy/
# git submodule init
# git submodule update
# npm install

// You may want to update the built-in grafana to the latest version, just run
# cd grafana && git checkout master && git pull

// Then edit config.js, make sure you have everything checked in the config file
// and run!
# node app.js
```

Configuration
=============

All settings are placed in /config.js, hack it as you go.

### Elasticsearch backend configurations

- ``es_host``:  *The host of ElasticSearch*
- ``es_port``:  *The port of ElasticSearch*
- ``es_using_ssl``:  *If the ES is using SSL(https)?*
- ``es_username``:  *(optional) The basic authentication user of ES server, leave it blank if no basic auth applied*
- ``es_password``:  *(optional) The password of basic authentication of ES server, leave it blank if no basic auth applied*

### Client settings

- ``base_path``:  *The base path to appear outwards (e.g. /grafana, or "" for /)*
- ``listen_port``:  *The listen port of grafana*
- ``brower_cache_maxage``:  *The browser cache max-Age controll, for a better loading speed*
- ``enable_ssl_port``: *Enable SSL or not?*
- ``listen_port_ssl``: *If enable_ssl_port set to true, this is the port of SSL*
- ``ssl_key_file``: *Point to the ssl key file*
- ``ssl_cert_file``: *Point to the ssl certification file*
- ``grafana_es_index``: *The ES index for saving grafana dashboards, now per-user configurations supported. using %user% instead of the username*
- ``which_auth_type_for_grafana_index``: *Where the variable %user% comes from? which authentication type you want to use for it?*
- ``cookie_secret``: *The secret token for cookies. replace it with a random string for security*

### Client authentication settings

We currently support 3 auth methods: Google OAuth2, BasicAuth and CAS, you can use one of them or all of them. it depends on the configuration you have.

***1. Google OAuth2***

- ``enable_google_oauth``: *Enable or not?*
- ``client_id``:  *The client ID of Google OAuth2, leave empty if you don't want to use it*
- ``client_secret``: *The client secret of Google OAuth2*
- ``allowed_emails``: *An emails list for the authorized users, should like `["a@b.com", "*@b.com", "*"]`*. All google users in the list will be allowed to access grafana.

**Important**

Google OAuth2 needs authorized redirect URIs for your app, please add it first as below, ``http://YOUR-grafana-SITE:[listen_port]/auth/google/callback`` in production or ``http://localhost:[listen_port]/auth/google/callback`` for local test

***2. Basic Authentication***

- ``enable_basic_auth``: *Enable or not?*
- ``basic_auth_users``:  *A list of user/passwd, see the comments in config.js for help. leave empty if you won't use it*
- ``basic_auth_file``:  *A file with list of user:passwd entries per line. leave empty if you won't use it*

***3. CAS Auth***

- ``enable_cas_auth``: *Enable or not?*
- ``cas_server_url``: *Point to the CAS server URL*

Resources
=========
- The original proxy project of [kibana-proxy](https://github.com/hmalphettes/kibana-proxy)
- The original authentication proxy project of [kibana-authentication-proxy](https://github.com/fangli/kibana-authentication-proxy)
- [grafana](http://grafana.org/) or (https://github.com/torkelo/grafana) and [Elasticsearch](https://github.com/elasticsearch/elasticsearch)


Contributing
============
- Fork it
- Create your feature branch (git checkout -b my-new-feature)
- Commit your changes (git commit -am 'Add some feature')
- Push to the branch (git push origin my-new-feature)
- Create new Pull Request


Releases
========
- Minor Changes which are also found in pull request https://github.com/fangli/kibana-authentication-proxy/pull/18
- Initial forked from https://github.com/fangli/kibana-authentication-proxy


License
=======
grafana Authentication Proxy is freely distributable under the terms of the MIT license.

Copyright (c) 2014 strima

See LICENCE for details.
