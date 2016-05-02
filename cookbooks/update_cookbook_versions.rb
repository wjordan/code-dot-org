#!/usr/bin/env ruby

# Calculates the 'version' of all local cookbooks based on the total number of git commits in the repository,
# filtering out git commits that modify nothing but metadata.rb.
# Sets the patch version to the
require 'pathname'
require 'chef/cookbook/metadata'

def update_metadata(cookbook_path)
  fullpath = File.absolute_path(cookbook_path)
  commit_path = Pathname.new(fullpath).relative_path_from(Pathname.new(File.join __dir__, '..'))

  # Get all commits
  commits = `git rev-list HEAD #{fullpath}`.each_line.map(&:strip).select do |line|
    # Filter out commits that only modify metadata.rb
    files = `git diff-tree -r --no-commit-id --name-only #{line} -- #{fullpath}`.each_line.map(&:strip)
    files.length > 1 || files.first != "#{commit_path}/metadata.rb"
  end

  metadata_file = "#{fullpath}/metadata.rb"

  # Use Chef library to parse the version string from the existing metadata
  old_version = Chef::Cookbook::Metadata.new.tap{|x|x.from_file(metadata_file)}.version
  # Update patch version with the commit count
  new_version = old_version.split('.').tap{|x|x[-1] = commits.count}.join('.')
  # Replace the version string in metadata.rb with the new version string.
  new_metadata = File.read(metadata_file).gsub(/(version\s+['"])[0-9\.]+(['"])/, "\\1#{new_version}\\2")
  File.write(metadata_file, new_metadata)
end

# Run `knife cookbook list` against local cookbook path.
`bundle exec knife cookbook list -z 2>/dev/null`.each_line do |path|
  path = path.split(/\s/).first
  update_metadata path
end
