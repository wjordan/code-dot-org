#!/bin/bash

bundle install -j`nproc`
(cd cdo-ruby; bundle exec kitchen verify)
