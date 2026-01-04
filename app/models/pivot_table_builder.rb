class PivotTableBuilder
  include Redmine::I18n

  # Field key constants for consistent field naming
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

  attr_reader :project, :query, :scope, :issues
  attr_reader :issues_json, :date_fields, :numeric_fields, :boolean_fields, :all_custom_fields

  def initialize(project, query, scope)
    @project = project
    @query = query
    @scope = scope
    @custom_fields_by_format = {}
  end

  # Execute the pivot table data building process
  # @return [PivotTableBuilder] self for method chaining
  def run
    @issues = fetch_data
    load_custom_fields
    @issues_json = build_json
    @date_fields, @numeric_fields, @boolean_fields = identify_fields
    self
  end

  private

  # Execute the query and load associations
  # @return [Array<Issue>] array of issue objects
  def fetch_data
    @scope.to_a
  end

  # Load and categorize custom fields by format to avoid repeated filtering
  # Populates @all_custom_fields and @custom_fields_by_format
  def load_custom_fields
    @all_custom_fields = @project.trackers.includes(:custom_fields)
                                  .map(&:custom_fields).flatten.uniq

    # Pre-categorize custom fields by format to avoid multiple filtering passes
    @all_custom_fields.each do |cf|
      format = cf.field_format
      @custom_fields_by_format[format] ||= []
      @custom_fields_by_format[format] << cf
    end
  end

  # Build JSON representation of issues with all associated data
  # @return [Array<Hash>] array of issue data hashes
  def build_json
    return [] if @issues.empty?

    issue_ids = @issues.map(&:id)
    
    # Bulk fetch Custom Values
    cv_rows = CustomValue.where(customized_type: 'Issue', customized_id: issue_ids)
                         .pluck(:custom_field_id, :customized_id, :value)
    
    cv_by_issue = cv_rows.group_by { |row| row[1] }
    cf_id_to_name = @all_custom_fields.each_with_object({}) { |cf, h| h[cf.id] = cf.name }

    # Pre-calculate localized keys
    localized_keys = build_localized_keys

    @issues.map do |issue|
      build_issue_data(issue, localized_keys, cv_by_issue, cf_id_to_name)
    end
  end

  # Build a hash of localized field keys for efficient access
  # @return [Hash] mapping of field symbols to localized strings
  def build_localized_keys
    keys = { id: ISSUE_ID_KEY }
    FIELD_KEYS.each { |sym, i18n_key| keys[sym] = l(i18n_key) }
    keys
  end

  # Build a single issue data hash with standard and custom fields
  # @param issue [Issue] the issue object
  # @param localized_keys [Hash] pre-calculated localized field keys
  # @param cv_by_issue [Hash] custom values indexed by issue id
  # @param cf_id_to_name [Hash] custom field id to name mapping
  # @return [Hash] issue data with all fields
  def build_issue_data(issue, localized_keys, cv_by_issue, cf_id_to_name)
    data = {
      localized_keys[:id] => issue.id,
      localized_keys[:subject] => issue.subject,
      localized_keys[:tracker] => issue.tracker&.name || '',
      localized_keys[:status] => issue.status&.name || '',
      localized_keys[:priority] => issue.priority&.name || '',
      localized_keys[:author] => issue.author&.name || '',
      localized_keys[:assigned_to] => issue.assigned_to&.name || '',
      localized_keys[:category] => issue.category&.name || '',
      localized_keys[:fixed_version] => issue.fixed_version&.name || '',
      localized_keys[:start_date] => issue.start_date&.to_s || '',
      localized_keys[:due_date] => issue.due_date&.to_s || '',
      localized_keys[:done_ratio] => issue.done_ratio,
      localized_keys[:estimated_hours] => issue.estimated_hours
    }

    # Append custom field values if present
    if (cvs = cv_by_issue[issue.id])
      cvs.each do |cf_id, _issue_id, value|
        if (cf_name = cf_id_to_name[cf_id])
          data[cf_name] = value.to_s
        end
      end
    end

    data
  end

  # Identify and categorize standard and custom fields by type
  # @return [Array<Array>] tuple of [date_fields, numeric_fields, boolean_fields]
  def identify_fields
    # Standard date fields
    date_fields = [l(:field_start_date), l(:field_due_date)]
    date_fields += @custom_fields_by_format['date']&.map(&:name) || []

    # Standard numeric fields
    numeric_fields = [l(:field_estimated_hours), l(:field_done_ratio)]
    numeric_numeric_cfs = @custom_fields_by_format.slice('int', 'float')
                                                  .values
                                                  .flatten
                                                  .map(&:name)
    numeric_fields += numeric_numeric_cfs

    # Boolean fields
    boolean_fields = @custom_fields_by_format['bool']&.map(&:name) || []

    [date_fields, numeric_fields, boolean_fields]
  end
end
