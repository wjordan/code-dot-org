# == Schema Information
#
# Table name: datablock_storage_tables
#
#  project_id      :integer          not null, primary key
#  table_name      :string(700)      not null, primary key
#  columns         :json
#  is_shared_table :string(700)
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#
# Indexes
#
#  index_datablock_storage_tables_on_project_id  (project_id)
#
class DatablockStorageTable < ApplicationRecord
  # Stores student-owned tables for App Lab's data features, see datablock_storage_controller.rb
  # Row data for each table is stored in datablock_storage_record.rb, but most code lives here
  #
  # Student data tables are stored as a single row in this model, and a row-per-record in
  # DatablockStorageRecord.
  #
  # Student data is stored in a single JSON column in DatablockStorageRecord.record_json,
  # which is a map of column-names to the value for that row/column.
  # DatablockStorageTable.columns is the superset of all possible keys in the various
  # DatablockStorageRecord.json records that comprise the table.
  #
  # Methods that read records, or write records, should be placed in the
  # appropriate sections (below).

  # Composite primary key:
  self.primary_keys = :project_id, :table_name

  # Data reading methods should use read_records instead of directly accessing records
  has_many :records,
    -> {order(record_id: :asc)},
    autosave: true,
    class_name: 'DatablockStorageRecord',
    foreign_key: [:project_id, :table_name],
    dependent: :delete_all

  after_initialize -> {self.columns ||= ['id']}, if: :new_record?

  # These are errors that should show up in the Applab Debug Console
  # see description in datablock_storage_controller.rb.
  class StudentFacingError < StandardError
    attr_reader :type

    def initialize(type = nil)
      super
      @type = type
    end
  end

  # Shared tables are those defined by code.org and imported from the
  # Data Library. They are referenced by name in is_shared_table. However,
  # like all tables, they are required to have a project_id. We use 0 as
  # the special project_id to indicate it's a shared table.
  SHARED_TABLE_PROJECT_ID = 0

  # TODO: #57003, implement enforcement of MAX_TABLE_COUNT, we already have
  # a test for it but we're skipping it until this is implemented.
  MAX_TABLE_COUNT = 10

  # TODO: #57002, enforce MAX_TABLE_ROW_COUNT, we already have a test for it
  # but we're skipping it until this is implemented.
  MAX_TABLE_ROW_COUNT = 20000

  def self.get_table_names(project_id)
    DatablockStorageTable.where(project_id: project_id).pluck(:table_name)
  end

  def self.get_shared_table_names
    get_table_names(SHARED_TABLE_PROJECT_ID)
  end

  def self.find_shared_table(table_name)
    shared_table = DatablockStorageTable.find_by(project_id: SHARED_TABLE_PROJECT_ID, table_name: table_name)
    raise "Shared table '#{table_name}' does not exist" unless shared_table
    return shared_table
  end

  def self.add_shared_table(project_id, table_name)
    unless DatablockStorageTable.exists?(project_id: SHARED_TABLE_PROJECT_ID, table_name: table_name)
      raise "Shared table '#{table_name}' does not exist"
    end
    DatablockStorageTable.create!(project_id: project_id, table_name: table_name, is_shared_table: table_name)
  end

  def self.populate_tables(project_id, tables_json)
    tables_json.each do |table_name, records|
      table = DatablockStorageTable.create!(project_id: project_id, table_name: table_name)
      table.create_records records
      table.save!
    rescue ActiveRecord::RecordNotUnique
      # Its ok if the table already exists, but we won't re-populate it
      logger.warn "Table already exists: not populating project_id=#{project_id}, table_name=#{table_name}"
    end
  end

  def read_records
    is_shared_table ? shared_table.records : records
  end

  ##########################################################
  #   Table methods that read record data:                 #
  ##########################################################
  #
  # Methods that access records should do so using `read_records` (vs using table.records)
  # as tables with `is_shared_table` set do not have individual copies of their records,
  # but instead "point to" the records of a table imported from the Data Library.
  #
  # See comments on our Copy-On-Write strategy below for more details.

  def export_csv
    column_names = get_columns

    CSV.generate do |csv|
      csv << column_names
      read_records.map(&:record_json).each do |record_json|
        csv << column_names.map {|x| record_json[x]}
      end
    end
  end

  def get_columns
    is_shared_table ? shared_table.columns : columns
  end

  def get_column(column_name)
    if get_columns.include? column_name
      read_records.map do |record|
        record.record_json[column_name]
      end
    else
      [] # javascript expects a list with every element undefined to indicate column doesn't exists error
    end
  end

  ##########################################################
  #   Table methods that write record data:                #
  ##########################################################
  #
  # DatablockStorageTable uses a Copy-On-Write strategy for 'shared' tables,
  # that is: tables imported using the Data Library. Rather than copying the
  # records immediately into a local table, we create a table row with
  # is_shared_table set to the name of the shared table. When any write event
  # occurs for the table, we immediately copy all the records into the local
  # table, before applying the write. This avoids unnecessary duplication of
  # data (80% of student data was unchanged imports of data library tables).
  #
  # To ensure consistent copy-on-write behavior, all "write methods" (those
  # that modify record data) should start with a call to:
  def if_shared_table_copy_on_write
    copy_shared_table if is_shared_table
  end

  def create_records(record_jsons)
    if_shared_table_copy_on_write

    DatablockStorageRecord.transaction do
      # Because we're using a composite primary key for records: (project_id, table_name, record_id)
      # and we want an incrementing record_id unique to that (project_id, table_name), we lock
      # the first record in a DatablockStorageTable when we begin to insert new records,
      # and release it once we close the transaction.
      DatablockStorageRecord.where(project_id: project_id, table_name: table_name).lock.minimum(:record_id)

      max_record_id = DatablockStorageRecord.where(project_id: project_id, table_name: table_name).maximum(:record_id)
      next_record_id = (max_record_id || 0) + 1

      cols_in_records = Set.new
      record_jsons.each do |record_json|
        record_json.each do |_key, json_value|
          raise StudentFacingError.new(:INVALID_RECORD), 'Invalid record: nested objects and arrays are not permitted' if json_value.is_a?(Hash) || json_value.is_a?(Array)
        end

        # We write the record_id into the JSON as well as storing it in its own column
        # only create_record and update_record should be at risk of modifying this
        record_json['id'] = next_record_id

        DatablockStorageRecord.create(project_id: project_id, table_name: table_name, record_id: next_record_id, record_json: record_json)

        cols_in_records.merge(record_json.keys)
        next_record_id += 1
      end

      # Preserve the old column's order while adding any new columns
      self.columns += (cols_in_records - columns).to_a
      save!
    end
  end

  def update_record(record_id, record_json)
    if_shared_table_copy_on_write

    record = records.find_by(record_id: record_id)
    return unless record

    record_json['id'] = record_id.to_i
    record.record_json = record_json
    record.save!

    # update the table columns with any new JSON fields
    self.columns += (record_json.keys.to_set - columns).to_a

    return record_json
  end

  def delete_record(record_id)
    if_shared_table_copy_on_write

    records.find_by!(record_id: record_id).delete
  end

  def import_csv(table_data_csv)
    if_shared_table_copy_on_write

    records = CSV.parse(table_data_csv, headers: true).map(&:to_h)

    # Auto-cast CSV strings on import, e.g. "5.0" => 5.0
    same_as_undefined = ['', 'undefined']
    records.map! do |record|
      # This is equivalent to setting the value to be 'undefined' in JS: it deletes the key
      record.reject! {|_key, value| same_as_undefined.include? value}
      record.transform_values! do |string_value|
        # Attempt to parse as JSON, fall back to original string on error
        json_value = JSON.parse(string_value)
        raise TypeError, 'Invalid entry type: object' if json_value.is_a?(Hash) || json_value.is_a?(Array)
        json_value
      rescue JSON::ParserError, TypeError
        string_value
      end
    end

    create_records(records)
  rescue CSV::MalformedCSVError => exception
    raise StudentFacingError.new(:INVALID_CSV), "Could not import CSV as it was not in the format we expected: #{exception.message}"
  end

  def add_column(column_name)
    if_shared_table_copy_on_write

    unless columns.include? column_name
      self.columns << column_name
    end
  end

  def delete_column(column_name)
    if_shared_table_copy_on_write

    records.each do |record|
      record.record_json.delete(column_name)
    end

    self.columns.delete column_name
  end

  def rename_column(old_column_name, new_column_name)
    if_shared_table_copy_on_write

    # First rename the column in all the JSON records
    records.each do |record|
      record.record_json[new_column_name] = record.record_json.delete(old_column_name)
    end

    # Second rename the column in the table definition
    self.columns = columns.map {|column| column == old_column_name ? new_column_name : column}
  end

  # Convert all values in a column to a new type
  def coerce_column(column_name, column_type)
    if_shared_table_copy_on_write

    unless ['string', 'number', 'boolean'].include? column_type
      raise "column_type must be one of: string, number, boolean"
    end

    records.each do |record|
      # column type is one of: string, number, boolean, date
      if record.record_json.key?(column_name)
        record.record_json[column_name] = coerce_type(record.record_json[column_name], column_type)
      end
    end
  end

  ##########################################################
  #   Private                                              #
  ##########################################################

  private def shared_table
    DatablockStorageTable.find_by(project_id: SHARED_TABLE_PROJECT_ID, table_name: is_shared_table)
  end

  # This is where we do the actual copy-on-write
  private def copy_shared_table
    to_copy = shared_table
    self.columns = to_copy.columns
    records.insert_all to_copy.records.map(&:as_json)
    self.is_shared_table = nil
    save!
  end

  private def coerce_type(value, column_type)
    case column_type
    when 'string'
      if value.nil?
        'null'
      else
        value.to_s
      end
    when 'number'
      begin
        Float(value)
      rescue
        raise StudentFacingError.new(:CANNOT_CONVERT_COLUMN_TYPE), "Couldn't convert #{value.inspect} to number"
      end
    when 'boolean'
      if [true, 'true'].include? value
        true
      elsif [false, 'false'].include? value
        false
      else
        raise StudentFacingError.new(:CANNOT_CONVERT_COLUMN_TYPE), "Couldn't convert #{value.inspect} to boolean"
      end
    end
  end
end
