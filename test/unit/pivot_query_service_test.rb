require File.expand_path('../../test_helper', __FILE__)

class PivotQueryServiceTest < ActiveSupport::TestCase
  fixtures :projects, :users, :queries

  def setup
    @project = Project.find(1)
    @user = User.find(1)
    @service = PivotQueryService.new(@project, @user)
  end

  def test_create_query_success
    config = { 'rows' => ['tracker'], 'cols' => ['status'] }
    query = @service.create_query("Test Pivot Query", config)

    assert query.persisted?
    assert_equal "Test Pivot Query", query.name
    assert_equal config, query.pivot_config
    assert_equal @project, query.project
    assert_equal @user, query.user
    assert_equal IssueQuery::VISIBILITY_PRIVATE, query.visibility
  end

  def test_create_query_failure
    # Missing name should cause failure
    query = @service.create_query("", {})
    
    assert_not query.persisted?
    assert_not_empty query.errors[:name]
  end
end
