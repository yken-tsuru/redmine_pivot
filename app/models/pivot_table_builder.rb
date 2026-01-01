class PivotTableBuilder
  include Redmine::I18n

  attr_reader :project, :query, :scope, :issues
  attr_reader :issues_json, :date_fields, :numeric_fields, :boolean_fields

  def initialize(project, query, scope)
    @project = project
    @query = query
    @scope = scope
  end

  def run
    @issues = fetch_data
    @issues_json = build_json
    @date_fields, @numeric_fields, @boolean_fields = identify_fields
    self
  end

  private

  def fetch_data
    # Execute the query and load associations
    @scope.to_a
  end

  def build_json
    return [] if @issues.empty?

    issue_ids = @issues.map(&:id)
    
    # Bulk fetch Custom Values
    cv_rows = CustomValue.where(customized_type: 'Issue', customized_id: issue_ids)
                         .pluck(:custom_field_id, :customized_id, :value)
    
    cv_by_issue = cv_rows.group_by { |row| row[1] }

    # Bulk fetch Custom Field Definitions with eager loading
    @all_custom_fields = @project.trackers.includes(:custom_fields)
                                  .map(&:custom_fields).flatten.uniq
    cf_id_to_name = @all_custom_fields.each_with_object({}) { |cf, h| h[cf.id] = cf.name }

    # Pre-calculate keys
    k_id = '#'
    k_subject = l(:field_subject)
    k_tracker = l(:field_tracker)
    k_status = l(:field_status)
    k_priority = l(:field_priority)
    k_author = l(:field_author)
    k_assigned_to = l(:field_assigned_to)
    k_category = l(:field_category)
    k_fixed_version = l(:field_fixed_version)
    k_start_date = l(:field_start_date)
    k_due_date = l(:field_due_date)
    k_done_ratio = l(:field_done_ratio)
    k_estimated_hours = l(:field_estimated_hours)

    @issues.map do |issue|
      data = {
        k_id => issue.id,
        k_subject => issue.subject,
        k_tracker => issue.tracker&.name || '',
        k_status => issue.status&.name || '',
        k_priority => issue.priority&.name || '',
        k_author => issue.author&.name || '',
        k_assigned_to => issue.assigned_to&.name || '',
        k_category => issue.category&.name || '',
        k_fixed_version => issue.fixed_version&.name || '',
        k_start_date => issue.start_date&.to_s || '',
        k_due_date => issue.due_date&.to_s || '',
        k_done_ratio => issue.done_ratio,
        k_estimated_hours => issue.estimated_hours
      }

      # Append Custom Fields
      if cvs = cv_by_issue[issue.id]
        cvs.each do |row|
          if cf_name = cf_id_to_name[row[0]]
             data[cf_name] = row[2].to_s
          end
        end
      end

      data
    end
  end

  def identify_fields
    # Date fields
    date_fields = [l(:field_start_date), l(:field_due_date)]
    date_fields += @all_custom_fields.select { |cf| cf.field_format == 'date' }.map(&:name)

    # Numeric fields
    numeric_fields = [l(:field_estimated_hours), l(:field_done_ratio)]
    numeric_fields += @all_custom_fields.select { |cf| %w(int float).include?(cf.field_format) }.map(&:name)

    # Boolean fields
    boolean_fields = @all_custom_fields.select { |cf| cf.field_format == 'bool' }.map(&:name)

    [date_fields, numeric_fields, boolean_fields]
  end
end
