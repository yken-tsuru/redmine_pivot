module RedminePivot
  module Patches
    module IssueQueryPatch
      # Apply patch to IssueQuery class
      # @param base [Class] the IssueQuery class
      def self.included(base)
        base.class_eval do
          unloadable
          
          # Add pivot_config to safe attributes without overwriting existing attributes
          self.safe_attributes += ['pivot_config']
        end
      end
    end
  end
end
