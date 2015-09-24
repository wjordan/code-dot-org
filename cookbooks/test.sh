#!/bin/bash

bundle install -j`nproc`
(cd cdo-ruby; kitchen verify)
