cdo-varnish Cookbook
====================
Installs and configures Varnish HTTP cache.

Requirements
------------
Ubuntu 14.04

#### apt packages installed
- `varnish`
- `libvmod-cookie`
- `libvmod-header`

Running Tests
-------------------
The integration tests use [Test Kitchen](http://kitchen.ci/) to set up an isolated platform using [Docker](https://www.docker.com/).

To test the cookbook, first make sure Docker is installed and running locally, then run:
- `chef exec kitchen create` to create the machine image
- `chef exec kitchen converge` to install Chef and converge the cookbook in the platform environment
- `chef exec kitchen verify` to run the integration test suite
