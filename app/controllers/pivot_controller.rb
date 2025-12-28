class PivotController < ApplicationController


  helper :queries
  include QueriesHelper

  before_action :find_project, :authorize, :only => [:index, :save]

  def index
    retrieve_query
    @sidebar_queries = IssueQuery.visible.where(project: @project)

    if @query.valid?
      @issues = @query.issues(:include => [:status, :tracker, :priority, :assigned_to, :category, :fixed_version, :custom_values => :custom_field], :limit => nil)
    else
      @issues = @project.issues.visible.includes(:status, :tracker, :priority, :assigned_to, :category, :fixed_version, :custom_values => :custom_field).all
    end

    @issues_json = @issues.map do |issue|
      data = {
        '#' => issue.id,
        l(:field_subject) => issue.subject,
        l(:field_tracker) => issue.tracker.name,
        l(:field_status) => issue.status.name,
        l(:field_priority) => issue.priority.name,
        l(:field_author) => issue.author.name,
        l(:field_assigned_to) => issue.assigned_to ? issue.assigned_to.name : '',
        l(:field_category) => issue.category ? issue.category.name : '',
        l(:field_fixed_version) => issue.fixed_version ? issue.fixed_version.name : '',
        l(:field_start_date) => issue.start_date.to_s,
        l(:field_due_date) => issue.due_date.to_s,
        l(:field_done_ratio) => issue.done_ratio,
        l(:field_estimated_hours) => issue.estimated_hours
      }

      issue.custom_field_values.each do |value|
        data[value.custom_field.name] = value.value.to_s
      end

      data
    end

    # Identify date fields for frontend processing
    @date_fields = [l(:field_start_date), l(:field_due_date)]
    
    # Get custom fields available for the project's trackers
    project_trackers = @project.trackers
    available_custom_fields = project_trackers.map(&:custom_fields).flatten.uniq
    
    # Add date-type custom fields that are available for the project
    @date_fields += available_custom_fields.select { |cf| cf.field_format == 'date' }.map(&:name)

    # Identify numeric fields for aggregators (Sum, Average, etc.)
    @numeric_fields = [l(:field_estimated_hours), l(:field_done_ratio)]
    @numeric_fields += available_custom_fields.select { |cf| %w(int float).include?(cf.field_format) }.map(&:name)

    # Identify boolean fields for multi-column aggregation
    @boolean_fields = available_custom_fields.select { |cf| cf.field_format == 'bool' }.map(&:name)
    
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
