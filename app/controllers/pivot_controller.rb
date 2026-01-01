class PivotController < ApplicationController


  helper :queries
  include QueriesHelper

  before_action :find_project, :authorize, :only => [:index, :save]

  def index
    retrieve_query
    @sidebar_queries = IssueQuery.visible.where(project: @project)

    # 1. Base Scope and ID fetching
    if @query.valid?
      # Use the query to get the base scope, but don't load objects yet
      scope = @project.issues.visible
        .where(@query.statement)
        .includes(:status, :tracker, :priority, :assigned_to, :category, :fixed_version)
    else
      scope = @project.issues.visible
        .includes(:status, :tracker, :priority, :assigned_to, :category, :fixed_version)
    end

    # 2. Bulk fetch issues with eager loaded associations
    # We still use ActiveRecord objects for the base issues because it handles the complex joins/includes well,
    # but we will avoid the N+1 custom field loop.
    @issues = scope.to_a
    issue_ids = @issues.map(&:id)

    # 3. Bulk fetch Custom Values
    # Fetch all custom values for these issues in one query
    # customized_type='Issue' is implicit if we join or just trust the IDs, but safer to specify if needed.
    # However, CustomValue table is large.
    # We want: custom_field_id, customized_id, value. use pluck to avoid AR objects.
    cv_rows = CustomValue.where(customized_type: 'Issue', customized_id: issue_ids)
                         .pluck(:custom_field_id, :customized_id, :value)

    # Group by Issue ID for fast access: { issue_id => [[cf_id, issue_id, value], ...] }
    cv_by_issue = cv_rows.group_by { |row| row[1] }

    # 4. Bulk fetch Custom Field Definitions map
    # We need the names of custom fields.
    # We can fetch all custom fields used in this project to create a lookup map.
    project_trackers = @project.trackers
    all_custom_fields = project_trackers.map(&:custom_fields).flatten.uniq
    cf_id_to_name = all_custom_fields.each_with_object({}) { |cf, h| h[cf.id] = cf.name }

    # 5. Build JSON data
    # Pre-calculate keys to avoid 5000x method calls
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

    @issues_json = @issues.map do |issue|
      data = {
        k_id => issue.id,
        k_subject => issue.subject,
        k_tracker => issue.tracker.name,
        k_status => issue.status.name,
        k_priority => issue.priority.name,
        k_author => issue.author.name,
        k_assigned_to => issue.assigned_to ? issue.assigned_to.name : '',
        k_category => issue.category ? issue.category.name : '',
        k_fixed_version => issue.fixed_version ? issue.fixed_version.name : '',
        k_start_date => issue.start_date.to_s,
        k_due_date => issue.due_date.to_s,
        k_done_ratio => issue.done_ratio,
        k_estimated_hours => issue.estimated_hours
      }

      # Append Custom Fields from the in-memory hash
      if cvs = cv_by_issue[issue.id]
        cvs.each do |row|
          # row[0] is cf_id, row[2] is value
          if cf_name = cf_id_to_name[row[0]]
             data[cf_name] = row[2].to_s
          end
        end
      end

      data
    end

    # Identify date fields for frontend processing
    @date_fields = [l(:field_start_date), l(:field_due_date)]
    
    # Add date-type custom fields that are available for the project
    @date_fields += all_custom_fields.select { |cf| cf.field_format == 'date' }.map(&:name)

    # Identify numeric fields for aggregators (Sum, Average, etc.)
    @numeric_fields = [l(:field_estimated_hours), l(:field_done_ratio)]
    @numeric_fields += all_custom_fields.select { |cf| %w(int float).include?(cf.field_format) }.map(&:name)

    # Identify boolean fields for multi-column aggregation
    @boolean_fields = all_custom_fields.select { |cf| cf.field_format == 'bool' }.map(&:name)
    
    # Pass pivot config to view if available
    @pivot_config = @query.try(:pivot_config)
  end

  def save
    @query = IssueQuery.new(:name => "_")
    @query.project = @project
    @query.user = User.current
    
    # Safe attributes assignment if we had a proper form, but here manual for custom logic
    @query.name = params[:query_name]
    @query.pivot_config = params[:pivot_config]
    @query.visibility = IssueQuery::VISIBILITY_PRIVATE
    
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
end
