require 'redmine'

Redmine::Plugin.register :redmine_pivot do
  name 'Redmine Pivot Plugin'
  author 'Yken tsuru'
  description 'A plugin to display Redmine tickets in a pivot table.'
  version '0.0.1'
  
  project_module :pivot do
    permission :view_pivot, :pivot => [:index, :save]
  end

  menu :project_menu, :pivot, { :controller => 'pivot', :action => 'index' }, :caption => :label_pivot, :after => :activity, :param => :project_id
end

Rails.configuration.to_prepare do
  require 'redmine_pivot/patches/issue_query_patch'
  IssueQuery.send(:include, RedminePivot::Patches::IssueQueryPatch)
end
