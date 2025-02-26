# TODO: post-firebase-cleanup, consider removing this file, see https://github.com/code-dot-org/code-dot-org/issues/56996#issuecomment-1977935612, post-firebase-cleanup issue is: #56994

require 'sinatra/base'
require 'cdo/sinatra'
require 'cdo/rack/request'
require 'csv'

class TablesApi < Sinatra::Base
  set :mustermann_opts, check_anchors: false

  load(CDO.dir('shared', 'middleware', 'helpers', 'core.rb'))

  helpers do
    [
      'table.rb',
      'firebase_helper.rb',
    ].each do |file|
      load(CDO.dir('dashboard', 'legacy', 'middleware', 'helpers', file))
    end
  end

  # GET /v3/export-firebase-tables/<channel-id>/table-name
  #
  # Exports a csv file from a table where the first row is the column names
  # and additional rows are the column values.
  #
  # TODO: post-firebase-cleanup, remove this method at the least, probably remove whole file: #56994
  get %r{/v3/export-firebase-tables/([^/]+)/([^/]+)$} do |channel_id, table_name|
    dont_cache
    content_type :csv
    response.headers['Content-Disposition'] = "attachment; filename=\"#{table_name}.csv\""

    return FirebaseHelper.new(channel_id).table_as_csv(table_name)
  end
end
