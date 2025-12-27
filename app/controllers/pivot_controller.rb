class PivotController < ApplicationController


  helper :queries
  include QueriesHelper

  before_action :find_project, :authorize, :only => :index

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
  end

  private

  def find_project
    @project = Project.find(params[:project_id])
  rescue ActiveRecord::RecordNotFound
    render_404
  end
end
