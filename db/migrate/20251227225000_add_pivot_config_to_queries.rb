class AddPivotConfigToQueries < ActiveRecord::Migration[6.1]
  def change
    add_column :queries, :pivot_config, :text
  end
end
