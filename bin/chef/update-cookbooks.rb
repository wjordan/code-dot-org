#!/usr/bin/env ruby

require_relative '../../deployment'

remote, local = ['', '-z'].map do |opts|
  Hash[`knife cookbook list #{opts} -E #{CDO.rack_env}`.lines.map{|x| x.split(/\s+/)}]
end

local_cookbooks = {}
local.each do |name, local_version|
  local_cookbooks[name] =
    {
      local: local_version,
      remote: remote[name]
    }
end

updated_cookbooks = local_cookbooks.select{|k,v| v[:local] != v[:remote]}
puts "Updated cookbooks: #{updated_cookbooks.keys}"
