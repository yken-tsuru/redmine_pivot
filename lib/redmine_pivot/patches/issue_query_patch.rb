module RedminePivot
  module Patches
    module IssueQueryPatch
      # Apply patch to IssueQuery class
      # @param base [Class] the IssueQuery class
      def self.included(base)
        base.class_eval do
          serialize :pivot_config
        end
      end
    end
  end
end
