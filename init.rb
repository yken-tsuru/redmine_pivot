require 'redmine'

Redmine::Plugin.register :redmine_pivot do
  name 'Redmine Pivot Plugin'
  author 'Yken tsuru'
  description 'A plugin to display Redmine tickets in a pivot table.'
  version '0.0.1'
  
  project_module :pivot do
    permission :view_pivot, :pivot => :index
  end

  menu :project_menu, :pivot, { :controller => 'pivot', :action => 'index' }, :caption => :label_pivot, :after => :activity, :param => :project_id
end
