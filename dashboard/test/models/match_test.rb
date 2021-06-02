require 'test_helper'

class MatchLevelTest < ActiveSupport::TestCase
  test 'shuffled answer indexes never exactly match default order' do
    @level = create :match, properties: {
      answers: [{text: "one"}, {text: "two"}, {text: "three"}]
    }

    # shuffle the answers ten times. This doesn't _guarantee_ we'll get all
    # possible shuffles on any given test run, but over all test runs for all
    # time we should be pretty well set.
    possible_shuffles = Array.new(10).map do |_|
      @level.shuffled_answer_indexes
    end

    original_order = (0...@level.answers.size).to_a

    possible_shuffles.each do |shuffle|
      refute_equal shuffle, original_order
    end
  end

  test 'summarize_for_lesson_show includes all set content' do
    @level = create :match, properties: {
      content1: 'content 1',
      content2: nil,
      content3: 'content 3',
      content4: nil
    }

    summary = @level.summarize_for_lesson_show(false)
    assert_equal ['content 1', 'content 3'], summary[:content]
  end
end
