require_relative '../../../lib/cdo/redshift'
require_relative '../../../dashboard/config/environment'
require_relative './translation_service'

module I18n
  module TranslationStatus
    class Updater
      def initialize
        super
      end
      # Redshift table where known string_keys are logged to.
      STRING_TRACKING_TABLE = 'analysis.i18n_string_tracking_events'.freeze
      # Redshift table where the translation status of string_key is stored.
      STRING_TRANSLATION_STATUS_TABLE = 'analysis.i18n_string_translation_status'.freeze

      # Queries the analysis.i18n_string_tracking_events for all the unique string_keys we have logged in the past day_count
      # days, checks their translation status in every language we support, and then uploads the statuses to the
      # analysis.i18n_string_translation_status Redshift table.
      # @param [Integer] day_count The number of days in the past to look for unique string_key's
      def update_translation_status(day_count = 7)
        redshift_client = RedshiftClient.instance
        translation_service = TranslationService.new
        # Updating the translation status in the Redshift table first requires deleting the existing records and then
        # inserting them. We do this because Redshift doesn't have unique keys, so if we inserted data for a string_key which
        # already exists, then there would be two rows in the database for the string_key.
        delete_translation_status(redshift_client, day_count)
        string_keys = get_all_unique_string_keys(redshift_client, day_count)
        # All the locale codes we support i.e. en_US, es_MX, de_DE, etc.
        locales = Languages.get_locale.map {|lang| lang[:locale_s]}
        # Record what time we checked the translation status for these strings.
        # Use the same time for all the entries so we can tell which batch they were all checked in.
        # Timestamp format matches the one supported by Redshift.
        current_time = Time.now.utc.strftime("%Y-%m-%d %H:%M:%S")
        insert_translation_status(redshift_client, translation_service, locales, string_keys, current_time)
      end

      # Deletes the existing translation status data for string_key's in the past day_count days.
      # This is done because we only want a single row for each string_key + language and we don't want to check if there is
      # an existing pair before inserting the data (Redshift does not support UPSERT by default).
      # @param [RedshiftClient] redshift_client Access the Redshift database where translation
      # status data is stored.
      # @param [Integer] day_count The number of days in the past to look for unique string_key's
      def delete_translation_status(redshift_client, day_count)
        puts "Deleting unique string_keys before inserting their latest translation status"
        unique_string_key_query = unique_string_key_sql_query(day_count)
        # The query first retrieves all the unique string_key's logged in the analysis.i18n_string_tracking events, then it
        # deletes every row from analysis.i18n_string_translation_status which has one of the unique string_key's.
        query = <<~SQL.squish
          DELETE FROM #{STRING_TRANSLATION_STATUS_TABLE}
          WHERE string_key IN (
            #{unique_string_key_query}
          )
        SQL
        redshift_client.exec(query)
      end

      # Retrieves all the unique string_key's we have logged
      # @param [RedshiftClient] redshift_client Access the Redshift database where translation
      # status data is stored.
      # @param [Integer] day_count The number of days in the past to look for unique string_key's
      def get_all_unique_string_keys(redshift_client, day_count)
        # Retrieve all the unique string_key's we have logged in the
        # analysis.i18n_string_tracking_events table.
        unique_string_key_query = unique_string_key_sql_query(day_count)
        redshift_client.exec(unique_string_key_query).map {|row| row['string_key']}
      end

      # Checks if given string_keys are translated or not in each language, and then
      # records that info to the analysis.i18n_string_translation_status table.
      # @param [RedshiftClient] redshift_client Access the Redshift database where translation
      # status data is stored.
      # @param [TranslationService] translation_service Used to determine is a string is translated
      # @param [Array<String>] locales All the i18n locales to check the translation status for.
      # @param [Array<String>] string_keys All the unique string_keys we have logged.
      # @param [String] current_time A timestamp of the current_time in a format Redshift accepts.
      # or not.
      def insert_translation_status(redshift_client, translation_service, locales, string_keys, current_time)
        # Loop through each locale code our platform supports, i.e. en_US, es_MX, de_DE, etc.
        # We want to check the translation status in each language for every string_key.
        locales.each_with_index do |locale, i|
          puts "Analyzing translation status of #{locale} (#{i + 1}/#{locales.size})"
          translation_statuses = []
          # Record the translation status for every string_key, for example:
          # "data.script.name.express-2020.title"
          string_keys.each do |string_key|
            # Maybe there is bad data in the database and we recorded an empty string
            next if string_key.blank?
            translated = translation_service.translated?(locale, string_key)
            translation_statuses << {
              string_key: string_key,
              locale: locale,
              has_translation: translated,
              checked_at: current_time
            }
          end
          # Create the rows to be inserted in the analysis.i18n_string_translation_status Redshift table
          # https://docs.aws.amazon.com/redshift/latest/dg/c_Examples_of_INSERT_30.html
          values = translation_statuses.map do |status|
            # Escape special SQL characters to protect again SQL injection attacks.
            ActiveRecord::Base.sanitize_sql(
              ["('%s', '%s', '%s', '%s')",
               status[:string_key],
               status[:locale],
               status[:has_translation],
               status[:checked_at]]
            )
          end.join(',')
          # Run a Redshift query to insert the translation statuses into the analysis.i18n_string_translation_status table.
          query = <<~SQL.squish
            INSERT INTO #{STRING_TRANSLATION_STATUS_TABLE} (string_key, locale, has_translation, checked_at)
            VALUES #{values}
          SQL
          redshift_client.exec(query)
        end
      end

      # @param [Integer] day_count The number of days in the past to look for unique string_key's
      # @return [String] A SQL query which returns the unique string_key's logged in the past day_count days.
      def unique_string_key_sql_query(day_count)
        <<~SQL.squish
          SELECT DISTINCT string_key
          FROM #{STRING_TRACKING_TABLE}
          WHERE environment = 'production'
          AND created_at >= current_timestamp - interval '#{day_count} days'
        SQL
      end
    end
  end
end
