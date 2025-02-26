require 'test_helper'

class MysqlAvoidUtf8AliasInSchemaDumpTest < ActiveSupport::TestCase
  setup do
    # The MysqlAvoidUtf8AliasInSchemaDump module is prepended onto
    # ActiveRecord's SchemaDumper, and is not intended to be used on its own;
    # we therefore write these tests against the prepended-to class.
    @schema_dumper = ActiveRecord::ConnectionAdapters::SchemaDumper.create(self, {})
  end

  test 'can parse mysql versions' do
    # Correctly handles expected versions 8.0 and 5.7
    @schema_dumper.instance_variable_set(:@current_mysql_version, nil)
    ActiveRecord::Base.connection.stubs(:select_value).returns('5.7.12-log')
    assert_equal(5.7, @schema_dumper.send(:current_mysql_version))

    @schema_dumper.instance_variable_set(:@current_mysql_version, nil)
    ActiveRecord::Base.connection.stubs(:select_value).returns('8.0.35-0ubuntu0.22.04.1')
    assert_equal(8.0, @schema_dumper.send(:current_mysql_version))

    # Raises an error on unexpected versions
    @schema_dumper.instance_variable_set(:@current_mysql_version, nil)
    ActiveRecord::Base.connection.stubs(:select_value).returns('some unexpected value')
    assert_raises(RuntimeError) {@schema_dumper.send(:current_mysql_version)}
    ActiveRecord::Base.connection.stubs(:select_value).returns('8.1.26')
    assert_raises(RuntimeError) {@schema_dumper.send(:current_mysql_version)}
    ActiveRecord::Base.connection.stubs(:select_value).returns('5.6.51')
    assert_raises(RuntimeError) {@schema_dumper.send(:current_mysql_version)}
  end

  test 'resolves aliases for the appropriate version of mysql' do
    @schema_dumper.stubs(:current_mysql_version).returns(5.7)
    assert_equal('utf8mb3', @schema_dumper.send(:resolve_alias_for_mysql_version, :charset, 'utf8'))
    assert_equal('utf8mb3_unicode_ci', @schema_dumper.send(:resolve_alias_for_mysql_version, :collation, 'utf8_unicode_ci'))
    @schema_dumper.stubs(:current_mysql_version).returns(8.0)
    assert_equal('utf8mb4', @schema_dumper.send(:resolve_alias_for_mysql_version, :charset, 'utf8'))
    assert_equal('utf8mb4_unicode_ci', @schema_dumper.send(:resolve_alias_for_mysql_version, :collation, 'utf8_unicode_ci'))
  end

  test 'normalizes charset for the appropriate version of mysql' do
    raw_options = {charset: 'utf8'}
    @schema_dumper.stubs(:current_mysql_version).returns(5.7)
    assert_equal('charset: "utf8mb3"', @schema_dumper.format_options(raw_options))
    @schema_dumper.stubs(:current_mysql_version).returns(8.0)
    assert_equal('charset: "utf8mb4"', @schema_dumper.format_options(raw_options))
  end

  test 'normalizes collation for the appropriate version of mysql' do
    raw_options = {collation: 'utf8_unicode_ci'}
    @schema_dumper.stubs(:current_mysql_version).returns(5.7)
    assert_equal('collation: "utf8mb3_unicode_ci"', @schema_dumper.format_options(raw_options))
    @schema_dumper.stubs(:current_mysql_version).returns(8.0)
    assert_equal('collation: "utf8mb4_unicode_ci"', @schema_dumper.format_options(raw_options))
  end
end
