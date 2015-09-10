# Setup and teardown the wiremock server
puts 'setup'
PID = spawn('cd ~; java -jar mock.jar')
`sleep 5`
`service varnish restart`
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
def mock_url(url, body)
  json = <<JSON
{
  "request": {
    "method": "GET",
    "url": "#{url}"
  },
  "response": {
    "status": 200,
    "body": "#{body}",
    "headers": {
      "Content-Type": "text/plain"
    }
  }
}
JSON
  puts `curl -s -X POST localhost:8080/__admin/mappings/new -d '#{json}'`
end

def request(url)
  `curl -s -i localhost:8080#{url}`
end

def proxy_request(url)
  `curl -s -H "host: _default-studio.code.org" -H "X-Forwarded-Proto: https" -i localhost:80#{url}`
end

describe 'http' do
  it 'handles a simple request' do
    url = '/some/thing'
    text = 'Hello World!'
    mock_url(url, text)
    response = request(url)
    assert_equal 'HTTP/1.1 200 OK', response.lines.first.strip
    assert_equal text, response.lines.last.strip
  end

  it 'caches a simple request' do
    url = '/cache1'
    text = 'Hello World 2!'
    mock_url(url, text)

    response = proxy_request url
    assert_equal 'HTTP/1.1 200 OK', response.lines.first.strip
    cache = /X-Varnish-Cache: (\w+)/.match(response)[1]
    assert_equal 'MISS', cache

    response = proxy_request url
    assert_equal 'HTTP/1.1 200 OK', response.lines.first.strip
    cache = /X-Varnish-Cache: (\w+)/.match(response)[1]
    assert_equal 'HIT', cache

    # Verify only one request hit the origin server
    assert_equal 1, count_requests(url)
  end
end
