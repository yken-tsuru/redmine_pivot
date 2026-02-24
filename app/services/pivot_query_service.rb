class PivotQueryService
  include Redmine::I18n

  def initialize(project, user)
    @project = project
    @user = user
  end

  # Create a new pivot query with the given name and configuration
  # @param name [String] the name of the query
  # @param config [Hash] the pivot configuration
  # @return [IssueQuery] the created query object (check .valid? or .persisted?)
  def create_query(name, config)
    IssueQuery.new.tap do |query|
      query.project    = @project
      query.user       = @user
      query.name       = name
      query.pivot_config = config
      query.visibility = IssueQuery::VISIBILITY_PRIVATE
      query.column_names = ['id', 'subject', 'status', 'tracker', 'priority']
      query.save
    end
  end
end
