require_relative '../../lib/cdo/pegasus'
require 'minitest/autorun'

# cdo-donors has a weight column whose maximum value must be 1.0 in
# order for our weighted random select to work. Even though the gsheet
# that this data is coming from has algorithms that should enforce this,
# it's gotten messed up on occasion, and that mistake has in at least
# one case made it through to production.
#
# This test is intended to catch such a glitch before it makes it to
# production.
class CSVTest < Minitest::Test
  def test_cdo_donors_csv
    donors_csv = CSV.read('./data/cdo-donors.csv')
    column = donors_csv.first.find_index('weight_f')
    max_donor_weight = donors_csv.last[column]
    assert_equal max_donor_weight.to_f, 1.0
  end

  def test_cdo_donors_db
    donors_with_max_weight = DB[:cdo_donors].where(weight_f: 1.0)
    assert_equal donors_with_max_weight.count, 1
  end

  # confirm that the cdo-state-policy.csv has the appropriate columns for
  # the CS landscape report at code.org/advocacy/landscape.pdf
  def test_policy_columns_exist
    state_policy_csv = CSV.read('./data/cdo-state-promote.csv')
    columns = %w(state_plan_t standards_t funding_t certification_t preservice_t
                 state_cs_t hs_t count_t higher_ed_t)
    columns.each do |column_name|
      column = state_policy_csv.first.find_index(column_name)
      assert !column.nil?, "cdo-state-promote.csv missing column #{column_name}"
    end
  end
end
