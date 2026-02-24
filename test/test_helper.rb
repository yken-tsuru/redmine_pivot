# Load the Redmine helper
require File.expand_path(File.dirname(__FILE__) + '/../../../test/test_helper')

# Force apply patch for tests
require File.expand_path('../../lib/redmine_pivot/patches/issue_query_patch', __FILE__)
IssueQuery.send(:include, RedminePivot::Patches::IssueQueryPatch)
