require File.expand_path('../router', __FILE__)

require 'rack/ssl-enforcer'
use Rack::SslEnforcer,
  # Add HSTS header to all HTTPS responses in all environments.
  hsts: { expires: 31536000, subdomains: false },
  # HTTPS redirect is handled at the HTTP-cache layer (CloudFront/Varnish).
  # The only exception is in :development, where no HTTP-cache layer is present.
  only_environments: 'development',
  # Only HTTPS-redirect in development when `https_development` is true.
  ignore: lambda {|request| !request.ssl? && !CDO.https_development }

require 'varnish_environment'
use VarnishEnvironment

if rack_env?(:development)
  require 'cdo/rack/whitelist_cookies'
  require 'cdo/session'
  require '../cookbooks/cdo-varnish/libraries/http_cache'
  use Rack::WhitelistCookies,
    HttpCache.config(Session::KEY, Session::STORAGE_ID)[:pegasus]
end

require 'files_api'
use FilesApi

require 'channels_api'
use ChannelsApi

require 'properties_api'
use PropertiesApi

require 'tables_api'
use TablesApi

require 'shared_resources'
use SharedResources

run Documents
