@eyes
Feature: Testing some i18n pages

Scenario: Visit Frozen in RTL
  When I open my eyes to test "frozen RTL"
  And I am on "http://studio.code.org/s/frozen/stage/1/puzzle/1/lang/ar-sa"
  And I rotate to landscape
  And I see no difference for "initial page load"
  And I close my eyes
