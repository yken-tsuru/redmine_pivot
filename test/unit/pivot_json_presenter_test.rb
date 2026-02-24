require File.expand_path('../../test_helper', __FILE__)

class PivotJsonPresenterTest < ActiveSupport::TestCase
  fixtures :issues, :projects, :trackers, :issue_statuses, :enumerations

  def setup
    @project = Project.find(1)
    @issue = Issue.find(1)
    # Mocking custom fields structure if needed, or loading from fixtures
    @all_custom_fields = @project.trackers.map(&:custom_fields).flatten.uniq
    @presenter = PivotJsonPresenter.new(@all_custom_fields)
  end

  def test_render_basic
    cv_by_issue = {} # No custom values for now
    json = @presenter.render([@issue], cv_by_issue)

    assert_instance_of Array, json
    assert_equal 1, json.size
    
    item = json.first
    assert_equal @issue.id, item['#']
    assert_equal @issue.subject, item[I18n.t(:field_subject)]
    assert_equal @issue.status.name, item[I18n.t(:field_status)]
  end

  def test_identify_fields
    custom_fields_by_format = {
      'date' => [],
      'int' => [],
      'bool' => []
    }
    
    date_fields, numeric_fields, boolean_fields = @presenter.identify_fields(custom_fields_by_format)
    
    assert_includes date_fields, I18n.t(:field_start_date)
    assert_includes numeric_fields, I18n.t(:field_estimated_hours)
    assert_kind_of Array, boolean_fields
  end
end
