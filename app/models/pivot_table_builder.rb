class PivotTableBuilder
  attr_reader :project, :query, :scope, :issues,
              :issues_json, :date_fields, :numeric_fields, :boolean_fields, :all_custom_fields

  def initialize(project, query, scope)
    @project = project
    @query   = query
    @scope   = scope
  end

  # Execute the pivot table data building process
  # @return [PivotTableBuilder] self for method chaining
  def run
    @issues = fetch_data
    load_custom_fields
    
    presenter = PivotJsonPresenter.new(@all_custom_fields)
    
    cv_by_issue = fetch_custom_values
    @issues_json = presenter.render(@issues, cv_by_issue)
    
    @date_fields, @numeric_fields, @boolean_fields = presenter.identify_fields(@custom_fields_by_format)
    self
  end

  private

  # Execute the query and load associations
  # @return [Array<Issue>] array of issue objects
  def fetch_data
    @scope.to_a
  end

  # Load and categorize custom fields by format to avoid repeated filtering
  def load_custom_fields
    @all_custom_fields = @project.trackers.includes(:custom_fields)
                                  .map(&:custom_fields).flatten.uniq

    # Pre-categorize custom fields by format
    @custom_fields_by_format = @all_custom_fields.group_by(&:field_format)
  end

  # Bulk fetch Custom Values for the current issues
  # @return [Hash] custom values indexed by issue id
  def fetch_custom_values
    return {} if @issues.empty?

    issue_ids = @issues.map(&:id)
    cv_rows = CustomValue.where(customized_type: 'Issue', customized_id: issue_ids)
                         .pluck(:custom_field_id, :customized_id, :value)
    
    cv_rows.group_by { |row| row[1] }
  end
end
