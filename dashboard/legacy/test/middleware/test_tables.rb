require 'mocha/mini_test'
require_relative 'middleware_test_helper'
require_relative '../../middleware/channels_api'
require_relative '../../middleware/tables_api'

class TablesTest < Minitest::Test
  include Rack::Test::Methods
  include SetupTest

  def build_rack_mock_session
    @session = Rack::MockSession.new(ChannelsApi.new(TablesApi), "studio.code.org")
  end

  def setup
    @table_name = '_testTable'

    CDO.stubs(:firebase_name).returns('my-firebase-name')
    CDO.stubs(:firebase_secret).returns('my-firebase-secret')
    CDO.stubs(:firebase_channel_id_suffix).returns(TEST_SUFFIX)
  end

  def teardown
    CDO.unstub(:firebase_name)
    CDO.unstub(:firebase_secret)
    CDO.unstub(:firebase_channel_id_suffix)
  end

  # channel id suffix, used by firebase in development and circleci environments
  TEST_SUFFIX = '-test-suffix'.freeze

  def test_firebase_export
    create_channel

    records_data = {
      '1' => '{"id":1,"name":"alice","age":7,"male":false}',
      '2' => '{"id":2,"name":"bob","age":8,"male":true}'
    }

    response = MiniTest::Mock.new
    response.expect(:body, records_data)

    firebase_path = "/v3/channels/#{@channel_id}#{TEST_SUFFIX}/storage/tables/#{@table_name}/records"
    Firebase::Client.any_instance.expects(:get).with(firebase_path).returns(response)

    expected_csv_data = "id,name,age,male\n1,alice,7,false\n2,bob,8,true\n"

    assert_equal export_firebase.body, expected_csv_data

    table_name_with_spaces = 'my%20table'

    response.expect(:body, records_data)
    firebase_path = "/v3/channels/#{@channel_id}#{TEST_SUFFIX}/storage/tables/#{table_name_with_spaces}/records"
    Firebase::Client.any_instance.expects(:get).with(firebase_path).returns(response)
    assert_equal export_firebase(table_name_with_spaces).body, expected_csv_data

    delete_channel
  end

  private def create_channel
    post '/v3/channels', {}.to_json, 'CONTENT_TYPE' => 'application/json;charset=utf-8'
    @channel_id = last_response.location.split('/').last
  end

  private def delete_channel
    delete "/v3/channels/#{@channel_id}"
    assert last_response.successful?
  end

  # TODO: unfirebase, this should moved to datablock_storage_controler, see: #56996
  private def export_firebase(table_name = @table_name)
    get "/v3/export-firebase-tables/#{@channel_id}/#{table_name}"
  end
end
