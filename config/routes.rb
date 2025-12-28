get 'projects/:project_id/pivot', :to => 'pivot#index'
post 'projects/:project_id/pivot/save', :to => 'pivot#save'
get 'pivot_setup', :to => 'pivot_setup#index'
