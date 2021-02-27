# == Schema Information
#
# Table name: resources
#
#  id                :integer          not null, primary key
#  name              :string(255)
#  url               :string(255)      not null
#  key               :string(255)      not null
#  properties        :string(255)
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  course_version_id :integer          not null
#
# Indexes
#
#  index_resources_on_course_version_id_and_key  (course_version_id,key) UNIQUE
#  index_resources_on_name_and_url               (name,url)
#

# A Resource represents a link to external material for a lesson
#
# @attr [String] name - The user-visisble name of the resource
# @attr [String] url - The URL pointing to the resource
# @attr [String] key - A unique identifier for the resource
# @attr [String] type - type of resource (eg video, handout, etc)
# @attr [Boolean] assessment - indicates whether this resource is an assessment
# @attr [String] audience - who this resource is targeted toward (eg teacher, student, etc)
# @attr [String] download_url - URL that can download the file
# @attr [Boolean] include_in_pdf - indicates whether the file will be included in a PDF handout
class Resource < ApplicationRecord
  include SerializedProperties

  KEY_RE = /\A[a-z0-9\-\_]+\Z/
  validates_format_of :key, with: KEY_RE, message: "must contain only lowercase alphanumeric characters, dashes, and underscores."

  has_and_belongs_to_many :lessons, join_table: :lessons_resources
  belongs_to :course_version

  before_validation :generate_key, on: :create

  serialized_attrs %w(
    type
    assessment
    audience
    download_url
    include_in_pdf
  )

  def generate_key
    return if key
    self.key = generate_key_from_name
  end

  # Used for seeding from JSON. Returns the full set of information needed to
  # uniquely identify this object as well as any other objects it belongs to.
  # If the attributes of this object alone aren't sufficient, and associated
  # objects are needed, then data from the seeding_keys of those objects should
  # be included as well. Ideally should correspond to a unique index for this
  # model's table. See comments on ScriptSeed.seed_from_hash for more context.
  #
  # @param [ScriptSeed::SeedContext] _seed_context - contains preloaded data to use when looking up associated objects
  # @return [Hash<String, String>] all information needed to uniquely identify this object across environments.
  def seeding_key(_seed_context)
    # Course version is also needed to identify this object, and can be looked
    # up from the script/unit which this resource is serialized within. If we
    # were to serialize resources outside of .script_json, we'd need to include
    # a key respresenting the course version here.
    {'resource.key': key}.stringify_keys
  end

  def summarize_for_lesson_plan
    {
      key: key,
      name: I18n.t("data.resource.#{key}.name", default: name),
      url: url,
      download_url: download_url,
      audience: audience || 'All',
      type: type
    }
  end

  def summarize_for_lesson_edit
    {
      id: id,
      key: key,
      name: name,
      url: url,
      downloadUrl: download_url || '',
      audience: audience || '',
      type: type || '',
      assessment: assessment || false,
      includeInPdf: include_in_pdf || false
    }
  end

  private

  def generate_key_from_name
    # This is a litte silly, but we want to replace all characters in the
    # string that DON'T match our formatting regex, so rather than doing
    # something simple like gsub (which can only do positive matches) we have
    # to do something manual.
    key_prefix = name.strip.downcase.chars.map do |character|
      KEY_RE.match(character) ? character : '_'
    end.join.gsub(/_+/, '_')
    potential_clashes = course_version_id ? Resource.where(course_version_id: course_version_id) : Resource.all
    potential_clashes = potential_clashes.where("resources.key like '#{key_prefix}%'").pluck(:key)
    return key_prefix unless potential_clashes.include?(key_prefix)
    key_suffix_num = 1
    new_key = key_prefix
    while potential_clashes.include?(new_key)
      new_key = "#{key_prefix}_#{key_suffix_num}"
      key_suffix_num += 1
    end
    new_key
  end
end
