#!/usr/bin/env bats

@test "varnish daemon binary is found in PATH" {
  run which varnishd
  [ "${status}" -eq 0 ]
}

@test "varnish service is running" {
  run service varnish status
  [ "${status}" -eq 0 ]
}
