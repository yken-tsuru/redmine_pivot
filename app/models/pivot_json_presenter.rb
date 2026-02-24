class PivotJsonPresenter
  include Redmine::I18n

  # Field key constants
  ISSUE_ID_KEY = '#'
  FIELD_KEYS = {
    subject: :field_subject,
    tracker: :field_tracker,
    status: :field_status,
    priority: :field_priority,
    author: :field_author,
    assigned_to: :field_assigned_to,
    category: :field_category,
    fixed_version: :field_fixed_version,
    start_date: :field_start_date,
    due_date: :field_due_date,
    done_ratio: :field_done_ratio,
    estimated_hours: :field_estimated_hours
  }.freeze

  def initialize(all_custom_fields)
    @all_custom_fields = all_custom_fields
    @cf_id_to_name = all_custom_fields.each_with_object({}) { |cf, h| h[cf.id] = cf.name }
    @cf_id_to_format = all_custom_fields.each_with_object({}) { |cf, h| h[cf.id] = cf.field_format }
    @localized_keys = build_localized_keys
  end

  def render(issues, cv_by_issue)
    issues.map do |issue|
      build_issue_data(issue, cv_by_issue)
    end
  end

  def identify_fields(custom_fields_by_format)
    # Standard date fields
    date_fields = [l(:field_start_date), l(:field_due_date)]
    date_fields += custom_fields_by_format['date']&.map(&:name) || []

    # Standard numeric fields
    numeric_fields = [l(:field_estimated_hours), l(:field_done_ratio)]
    numeric_cfs = custom_fields_by_format.slice('int', 'float')
                                         .values
                                         .flatten
                                         .map(&:name)
    numeric_fields += numeric_cfs

    # Boolean fields
    boolean_fields = custom_fields_by_format['bool']&.map(&:name) || []

    [date_fields, numeric_fields, boolean_fields]
  end

  private

  def build_localized_keys
    keys = { id: ISSUE_ID_KEY }
    FIELD_KEYS.each { |sym, i18n_key| keys[sym] = l(i18n_key) }
    keys
  end

  def build_issue_data(issue, cv_by_issue)
    # Build standard fields dynamically using FIELD_KEYS
    data = { @localized_keys[:id] => issue.id }
    FIELD_KEYS.each_key do |sym|
      data[@localized_keys[sym]] = resolve_field(issue, sym)
    end

    # Append custom field values if present
    if (cvs = cv_by_issue[issue.id])
      cvs.each do |cf_id, _issue_id, value|
        if (cf_name = @cf_id_to_name[cf_id])
          data[cf_name] = cast_custom_value(@cf_id_to_format[cf_id], value)
        end
      end
    end

    data
  end

  # Resolve a single standard field value for an issue
  # @param issue [Issue]
  # @param sym [Symbol] field symbol from FIELD_KEYS
  # @return [Object] the field value
  def resolve_field(issue, sym)
    case sym
    when :subject        then issue.subject
    when :tracker        then issue.tracker&.name        || ''
    when :status         then issue.status&.name         || ''
    when :priority       then issue.priority&.name       || ''
    when :author         then issue.author&.name         || ''
    when :assigned_to   then issue.assigned_to&.name    || ''
    when :category       then issue.category&.name       || ''
    when :fixed_version  then issue.fixed_version&.name  || ''
    when :start_date     then issue.start_date&.to_s     || ''
    when :due_date       then issue.due_date&.to_s       || ''
    when :done_ratio     then issue.done_ratio
    when :estimated_hours then issue.estimated_hours
    end
  end

  # Cast a custom field value to the appropriate Ruby type based on field format
  # @param format [String] the custom field format ('int', 'float', 'bool', etc.)
  # @param value [String, nil] the raw value from the database
  # @return [Object] the typed value
  def cast_custom_value(format, value)
    return '' if value.nil?

    case format
    when 'int'
      value.to_i
    when 'float'
      value.to_f
    when 'bool'
      value == '1' ? '✓' : ''
    else
      value.to_s
    end
  end
end
