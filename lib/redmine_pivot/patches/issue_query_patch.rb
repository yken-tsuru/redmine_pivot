module RedminePivot
  module Patches
    module IssueQueryPatch
      def self.included(base)
        base.class_eval do
          unloadable
          
          # Add pivot_config to safe attributes so it can be saved via mass assignment
          self.safe_attributes 'pivot_config'
        end
      end
    end
  end
end
