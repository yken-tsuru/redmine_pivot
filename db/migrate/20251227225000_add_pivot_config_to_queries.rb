class AddPivotConfigToQueries < ActiveRecord::Migration[7.2]
  def change
    add_column :queries, :pivot_config, :text
  end
end
