require 'minitest/autorun'
require 'rack/test'
require File.expand_path '../../../deployment', __FILE__
require File.expand_path '../../middleware/channels_api', __FILE__

ENV['RACK_ENV'] = 'test'

class ChannelsTest < Minitest::Unit::TestCase
  include Rack::Test::Methods

  def build_rack_mock_session
    Rack::MockSession.new(ChannelsApi, 'studio.code.org')
  end

  def test_create_channel
    post '/v3/channels', {hello: 'world'}.to_json
    assert last_response.redirection?
    follow_redirect!

    response = JSON.parse(last_response.body)
    assert last_request.url.end_with? "/#{response['id']}"
    assert_equal 'world', response['hello']
  end
end
