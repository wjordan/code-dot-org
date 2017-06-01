module Pd::FacilitatorSpecificForm
  extend ActiveSupport::Concern
  include Pd::Form

  def facilitator_required_fields
    []
  end

  def get_facilitator_names
    []
  end

  def validate_required_fields
    hash = sanitize_form_data_hash

    if get_facilitator_names.any?
      add_key_error(:who_facilitated) unless hash.key?(:who_facilitated)
    end

    # validate facilitator required fields
    each_facilitator_field do |facilitator, field, field_name|
      add_key_error(field_name) unless hash.try(:[], field).try(:[], facilitator)
    end

    super
  end

  def validate_options
    hash = sanitize_form_data_hash

    facilitator_names = get_facilitator_names
    if hash[:who_facilitated] && facilitator_names.any?
      hash[:who_facilitated].each do |facilitator|
        add_key_error(:who_facilitated) unless facilitator_names.include? facilitator
      end
    end

    super
  end

  # Simple helper that iterates over each facilitator as reported by the user
  # and each facilitator-specific field and yields a block with the facilitator,
  # the field, and the combined field name we expect in the flattened version of
  # our hash. Supports either rails-style keys (underscored symbols) or
  # JSON-style keys (camelCased strings)
  def each_facilitator_field(hash=nil, camel=false)
    hash ||= camel ? form_data_hash : sanitize_form_data_hash

    facilitators = hash.try(:[], camel ? 'whoFacilitated' : :who_facilitated) || []

    # validate facilitator required fields
    facilitators.each do |facilitator|
      facilitator_required_fields.each do |field|
        field = field.to_s.camelize(:lower) if camel
        field_name = "#{field}[#{facilitator}]"
        field_name = field_name.to_sym unless camel
        yield(facilitator, field, field_name)
      end
    end
  end

  # inflate all the facilitator-specific fields (stored as flattened keys) into
  # nested hashes before saving
  #
  # Before:
  #   {
  #     "howClearlyPresented[facilitatorOne@code.org]" => "Clearly",
  #     "howClearlyPresented[facilitatorTwo@code.org]" => "Quite clearly",
  #   }
  #
  # After:
  #   {
  #     "howClearlyPresented" => {
  #       "facilitatorOne@code.org" => "Clearly",
  #       "facilitatorTwo@code.org" => "Quite clearly",
  #     }
  #   }
  def form_data_hash=(hash)
    hash = hash.dup

    each_facilitator_field(hash, true) do |facilitator, field, field_name|
      next unless hash[field_name]

      hash[field] ||= {}
      hash[field][facilitator] = hash.delete(field_name)
    end

    super(hash)
  end
end
