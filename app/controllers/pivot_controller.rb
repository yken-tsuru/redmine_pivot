class PivotController < ApplicationController


  helper :queries
  helper :pivot
  include QueriesHelper

  before_action :find_project, :authorize, :only => [:index, :save]

  def index
    retrieve_query
    @sidebar_queries = IssueQuery.visible.where(project: @project)

    # Build base scope with error handling
    scope = build_issue_scope

    # Use Service Object for data fetching and processing
    begin
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
    
    # Pass pivot config to view if available
    @pivot_config = @query.try(:pivot_config)
  end

  def save
    query_name = params[:query_name].to_s.strip
    
    # Validate query name
    if query_name.blank?
      flash[:error] = l(:error_query_name_blank)
      return redirect_to :controller => 'pivot', :action => 'index', :project_id => @project
    end

    @query = IssueQuery.new
    @query.project = @project
    @query.user = User.current
    @query.name = query_name
    @query.pivot_config = params[:pivot_config]
    @query.visibility = IssueQuery::VISIBILITY_PRIVATE
    @query.column_names = ['id', 'subject', 'status', 'tracker', 'priority']
    
    if @query.save
      flash[:notice] = l(:notice_successful_create)
      redirect_to :controller => 'pivot', :action => 'index', :project_id => @project, :query_id => @query.id
    else
      flash[:error] = @query.errors.full_messages.join(", ")
      redirect_to :controller => 'pivot', :action => 'index', :project_id => @project
    end
  end

  private

  def find_project
    @project = Project.find(params[:project_id])
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  def build_issue_scope
    base_scope = @project.issues.visible
      .includes(:status, :tracker, :priority, :assigned_to, :category, :fixed_version, :author)

    # Apply query filter with error handling
    if @query.valid?
      begin
        base_scope.where(@query.statement)
      rescue => e
        logger.warn("Query filter failed: #{e.message}")
        base_scope
      end
    else
      base_scope
    end
  end
end
