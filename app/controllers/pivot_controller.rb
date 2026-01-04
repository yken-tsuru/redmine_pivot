class PivotController < ApplicationController


  helper :queries
  helper :pivot
  include QueriesHelper

  before_action :find_project, :authorize, :only => [:index, :save]

  # Display pivot table of issues for the project
  # Builds a scope based on the current query and renders pivot data
  def index
    retrieve_query
    @sidebar_queries = IssueQuery.visible.where(project: @project)
    scope = build_issue_scope

    fetch_pivot_data(scope)
    
    @pivot_config = @query.try(:pivot_config)
  end

  # Save pivot table query configuration
  # Creates a new IssueQuery with the provided pivot_config
  # @return [void]
  def save
    query_name = params[:query_name].to_s.strip
    
    if query_name.blank?
      flash[:error] = l(:error_query_name_blank)
      return redirect_to_index
    end

    if create_pivot_query(query_name, params[:pivot_config])
      flash[:notice] = l(:notice_successful_create)
      redirect_to :controller => 'pivot', :action => 'index', :project_id => @project, :query_id => @query.id
    else
      flash[:error] = @query.errors.full_messages.join(", ")
      redirect_to_index
    end
  end

  private

  # Find and validate project from params
  # @return [Project] the project object
  # @raise [void] renders 404 if project not found
  def find_project
    @project = Project.find(params[:project_id])
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  # Redirect to pivot index page for current project
  def redirect_to_index
    redirect_to :controller => 'pivot', :action => 'index', :project_id => @project
  end

  # Fetch pivot data from PivotTableBuilder and assign to instance variables
  # Handles errors gracefully by logging and assigning empty defaults
  # @param scope [ActiveRecord::Relation] the scope of issues to process
  # @return [void]
  def fetch_pivot_data(scope)
    builder = PivotTableBuilder.new(@project, @query, scope).run
    @issues_json = builder.issues_json
    @date_fields = builder.date_fields
    @numeric_fields = builder.numeric_fields
    @boolean_fields = builder.boolean_fields
  rescue => e
    logger.error("PivotTableBuilder error: #{e.message}\n#{e.backtrace.join("\n")}")
    flash.now[:error] = l(:error_pivot_data_loading)
    @issues_json = []
    @date_fields = []
    @numeric_fields = []
    @boolean_fields = []
  end

  # Create a new pivot query with the given name and configuration
  # @param name [String] the name of the query
  # @param config [Hash] the pivot configuration
  # @return [Boolean] true if save was successful, false otherwise
  def create_pivot_query(name, config)
    @query = IssueQuery.new
    @query.project = @project
    @query.user = User.current
    @query.name = name
    @query.pivot_config = config
    @query.visibility = IssueQuery::VISIBILITY_PRIVATE
    @query.column_names = ['id', 'subject', 'status', 'tracker', 'priority']
    @query.save
  end

  # Build an ActiveRecord scope for issues with appropriate filtering
  # Applies query statement if valid, returns base scope on error
  # @return [ActiveRecord::Relation] the issue scope
  def build_issue_scope
    base_scope = @project.issues.visible
      .includes(:status, :tracker, :priority, :assigned_to, :category, :fixed_version, :author)

    return base_scope unless @query.valid?

    begin
      base_scope.where(@query.statement)
    rescue => e
      logger.warn("Query filter failed: #{e.message}")
      base_scope
    end
  end
end
