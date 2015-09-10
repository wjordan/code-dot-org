# Setup the mock-server and cache
puts 'setup'
PID = spawn('cd ~; java -jar mock.jar')
`service varnish restart`
# Don't start tests until both wiremock and varnish are live.
mock_started, varnish_started = false, false
until [mock_started,varnish_started].all? do
  `sleep 1`
  unless mock_started
    puts 'testing mock'
    `curl -s -i localhost:8080/start`
    mock_started = $?.exitstatus == 0
  end
  unless varnish_started
    puts 'testing varnish'
    `curl -s -i localhost:80/start`
    varnish_started = $?.exitstatus == 0
  end
end
puts 'setup finished'

at_exit do
  puts 'teardown'
  `curl -s -X POST localhost:8080/__admin/shutdown`
  Process.wait PID
  puts 'teardown finished'
end

require 'json'
require 'minitest/autorun'

describe 'varnish' do
  it 'is installed' do
    assert_equal '/usr/sbin/varnishd', `which varnishd`.strip
  end

  it 'is running' do
    assert_equal 0, (`service varnish status` && $?.exitstatus)
  end
end

# Returns the number of times the specified stub-URL was accessed.
def count_requests(url)
  request = <<JSON
{
  "method": "GET",
  "url": "#{url}"
}
JSON
  JSON.parse(`curl -s -X POST localhost:8080/__admin/requests/count -d '#{request}'`)['count']
end

# Mocks a simple text/plain response body at the specified URL.
def mock_url(url, body, request_headers={}, response_headers={})
  json = {
  request: {
    method: "GET",
    url: url,
    headers: Hash[*request_headers.map{|k, v|[k,{equalTo: v}]}.flatten]
  },
  response: {
    status: 200,
    body: body,
    headers: {
      "Content-Type" => "text/plain"
    }.merge(response_headers)
  }
}.to_json
  `curl -s -X POST localhost:8080/__admin/mappings/new -d '#{json}'`
end

def request(url, headers={})
  header_string = headers.map { |key, value| "-H \"#{key}: #{value}\"" }.join(' ')
  `curl -s #{header_string} -i localhost:8080#{url}`.tap{assert_equal 0, $?.exitstatus}
end

def proxy_request(url, https=true, headers={})
  headers.merge!(host: '_default-studio.code.org')
  headers.merge!('X-Forwarded-Proto' => 'https') if https
  header_string = headers.map { |key, value| "-H \"#{key}: #{value}\"" }.join(' ')
  `curl -s #{header_string} -i localhost:80#{url}`.tap{assert_equal 0, $?.exitstatus}
end

def code(response)
  /HTTP\/1\.1 (\d+)/.match(response.lines.first.strip)[1].to_i
end

def assert_ok(response)
  assert_equal 200, code(response)
end
def assert_cache(response, hit)
  assert_equal hit ? 'HIT' : 'MISS', /X-Varnish-Cache: (\w+)/.match(response)[1]
end
def assert_miss(response)
  assert_cache response, false
end
def assert_hit(response)
  assert_cache response, true
end

describe 'http' do
  it 'handles a simple request' do
    url = '/cache1'
    text = 'Hello World!'
    mock_url(url, text)
    response = request url
    assert_ok response
    assert_equal text, response.lines.last.strip
  end

  it 'caches a simple request' do
    url = '/cache2'
    text = 'Hello World 2!'
    mock_url(url, text)

    response = proxy_request url
    assert_ok response
    assert_miss response

    response = proxy_request url
    assert_ok response
    assert_hit response

    # Verify only one request hit the origin server
    assert_equal 1, count_requests(url)
  end

  it 'redirects HTTP to HTTPS' do
    response = proxy_request '/https', false
    assert_equal 301, code(response)
    assert_equal 'https://_default-studio.code.org/https', /Location: ([^\s]+)/.match(response)[1]
  end

  it 'separately caches responses that vary on X-Varnish-Accept-Language' do
    mock_url('/cache3', 'Hello World!', {'X-Varnish-Accept-Language' => 'en'}, {vary: 'X-Varnish-Accept-Language'})
    mock_url('/cache3', 'Bonjour le Monde!', {'X-Varnish-Accept-Language' => 'fr'}, {vary: 'X-Varnish-Accept-Language'})
    response = proxy_request '/cache3', true, 'Accept-Language' => 'en'
    assert_miss response
    assert_hit proxy_request '/cache3', true, 'Accept-Language' => 'en'

    response = proxy_request '/cache3', true, 'Accept-Language' => 'fr'
    assert_miss response
    assert_hit proxy_request '/cache3', true, 'Accept-Language' => 'fr'
  end
end
