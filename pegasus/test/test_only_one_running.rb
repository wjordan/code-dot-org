require_relative '../../lib/cdo/pegasus'
require 'minitest/autorun'

class OnlyOneRunningTest < Minitest::Unit::TestCase
  setup do
    @name = "#{__FILE__}_#{rand(100000)}_#{Time.now.to_i}}"
  end
  def test_initially_true
    assert only_one_running?(__FILE__)
  end

  def test_thereafter_false
    assert !only_one_running?(__FILE__)
  end
end
