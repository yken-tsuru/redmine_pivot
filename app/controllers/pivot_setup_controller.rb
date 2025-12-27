class PivotSetupController < ApplicationController
  skip_before_action :verify_authenticity_token

  def index
    # Fix: Randomize List custom field values
    list_cfs = CustomField.where(field_format: 'list').pluck(:id)
    
    if list_cfs.empty?
      render plain: "No list custom fields found."
      return
    end

    count = 0
    possible_values = ['A', 'B', 'C']
    
    # Direct update to avoid overhead
    CustomValue.where(custom_field_id: list_cfs, customized_type: 'Issue').find_each do |cv|
      # Randomly pick A, B, or C
      new_val = possible_values.sample
      cv.update_column(:value, new_val)
      count += 1
    end

    render plain: "Successfully randomized #{count} list values."
  rescue => e
    render plain: "Error: #{e.message}\n#{e.backtrace.join("\n")}"
  end
end
