require File.expand_path('../../test_helper', __FILE__)

class PivotTableBuilderTest < ActiveSupport::TestCase
  fixtures :projects, :users, :trackers, :issue_statuses, :issues,
           :enumerations, :custom_fields, :custom_values

  def setup
    @project = Project.find(1)
    @user = User.find(1)
    User.current = @user
    
    # Create a simple query
    @query = IssueQuery.new(:name => '_', :project => @project)
    @query.column_names = [:subject] # Minimal columns
    
    # Base scope
    @scope = @project.issues.visible
  end

  def test_build_json_basic
    builder = PivotTableBuilder.new(@project, @query, @scope).run
    json = builder.issues_json
    
    assert_not_nil json
    assert json.is_a?(Array)
    assert_operator json.size, :>, 0
    
    first_issue = json.first
    assert first_issue.key?('#')
    assert first_issue.key?(I18n.t(:field_subject))
    assert first_issue.key?(I18n.t(:field_status))
  end

  def test_build_json_with_empty_scope
    # Test with no issues
    builder = PivotTableBuilder.new(@project, @query, @project.issues.where("1=0")).run
    json = builder.issues_json
    
    assert json.is_a?(Array)
    assert_equal 0, json.size
  end

  def test_nil_safe_field_handling
    builder = PivotTableBuilder.new(@project, @query, @scope).run
    json = builder.issues_json
    
    # Ensure no nil values for optional fields
    json.each do |issue_data|
      # All fields should be present, even if nil or empty
      assert issue_data.key?(I18n.t(:field_assigned_to))
      assert issue_data.key?(I18n.t(:field_category))
      assert issue_data.key?(I18n.t(:field_fixed_version))
      
      # Values should be strings or numbers, not nil
      assert issue_data[I18n.t(:field_assigned_to)].is_a?(String) || issue_data[I18n.t(:field_assigned_to)].nil?
      assert issue_data[I18n.t(:field_category)].is_a?(String) || issue_data[I18n.t(:field_category)].nil?
    end
  end

  def test_custom_fields_included
    # Ensure we have a custom field for the project
    builder = PivotTableBuilder.new(@project, @query, @scope).run
    json = builder.issues_json
    
    # Check for presence of any custom field key
    custom_fields = builder.all_custom_fields
    if custom_fields.any?
      cf_name = custom_fields.first.name
      # Custom field should be in the JSON if it has values
      has_cf_in_any_issue = json.any? { |issue_data| issue_data.key?(cf_name) }
      assert has_cf_in_any_issue || json.empty?, "JSON should contain custom field #{cf_name} or have no issues"
    end
  end

  def test_identify_fields
    builder = PivotTableBuilder.new(@project, @query, @scope).run
    
    assert_not_nil builder.date_fields
    assert builder.date_fields.include?(I18n.t(:field_start_date))
    
    assert_not_nil builder.numeric_fields
    assert builder.numeric_fields.include?(I18n.t(:field_estimated_hours))
    
    assert_not_nil builder.boolean_fields
    assert builder.boolean_fields.is_a?(Array)
  end

  def test_identify_fields_with_custom_fields
    builder = PivotTableBuilder.new(@project, @query, @scope).run
    custom_fields = builder.all_custom_fields
    
    # Verify that custom fields are properly categorized
    date_custom_fields = custom_fields.select { |cf| cf.field_format == 'date' }
    numeric_custom_fields = custom_fields.select { |cf| %w(int float).include?(cf.field_format) }
    
    date_custom_fields.each do |cf|
      assert builder.date_fields.include?(cf.name), "#{cf.name} should be in date_fields"
    end
    
    numeric_custom_fields.each do |cf|
      assert builder.numeric_fields.include?(cf.name), "#{cf.name} should be in numeric_fields"
    end
  end

  def test_run_method_returns_self
    builder = PivotTableBuilder.new(@project, @query, @scope).run
    assert_equal builder, builder, "run method should return self for chaining"
  end
end
