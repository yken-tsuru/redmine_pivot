module PivotHelper
  def pivot_locale_data
    {
      fullScreen: l(:button_fullscreen),
      exitFullScreen: l(:button_exit_fullscreen),
      renderError: l('js.render_error'),
      computeError: l('js.compute_error'),
      uiRenderError: l('js.ui_render_error'),
      selectAll: l('js.select_all'),
      selectNone: l('js.select_none'),
      tooMany: l('js.too_many'),
      filterResults: l('js.filter_results'),
      apply: l('js.apply'),
      cancel: l('js.cancel'),
      totals: l('js.totals'),
      vs: l('js.vs'),
      by: l('js.by'),
      promptSaveSettings: l('js.prompt_save_settings'),
      alertNoBoolean: l('js.alert_no_boolean'),
      confirmMultiBoolean: l('js.confirm_multi_bool'),
      buttonMultiBoolean: l('js.button_multi_bool'),
      labelNoRules: l('js.label_no_rules'),
      errorFillAll: l('js.error_fill_all'),
      errorInvalidRegex: l('js.error_invalid_regex'),
      labelItemName: l('js.label_item_name'),
      labelValue: l('js.label_value'),
      labelYear: l('js.label_year'),
      labelMonth: l('js.label_month'),
      labelDay: l('js.label_day'),
      labelYearMonth: l('js.label_year_month'),
      buttonClose: l(:button_close),
      aggregators: {
        count: l('js.aggregator_count'),
        countUniqueValues: l('js.aggregator_count_unique_values'),
        listUniqueValues: l('js.aggregator_list_unique_values'),
        sum: l('js.aggregator_sum'),
        integerSum: l('js.aggregator_integer_sum'),
        average: l('js.aggregator_average'),
        median: l('js.aggregator_median'),
        variance: l('js.aggregator_variance'),
        sampleVariance: l('js.aggregator_sample_variance'),
        standardDeviation: l('js.aggregator_standard_deviation'),
        sampleStandardDeviation: l('js.aggregator_sample_standard_deviation'),
        minimum: l('js.aggregator_minimum'),
        maximum: l('js.aggregator_maximum'),
        first: l('js.aggregator_first'),
        last: l('js.aggregator_last'),
        sumAsFractionOfTotal: l('js.aggregator_sum_as_fraction_of_total'),
        sumAsFractionOfRows: l('js.aggregator_sum_as_fraction_of_rows'),
        sumAsFractionOfColumns: l('js.aggregator_sum_as_fraction_of_columns'),
        countAsFractionOfTotal: l('js.aggregator_count_as_fraction_of_total'),
        countAsFractionOfRows: l('js.aggregator_count_as_fraction_of_rows'),
        countAsFractionOfColumns: l('js.aggregator_count_as_fraction_of_columns')
      },
      renderers: {
        table: l('js.renderers.table', :default => 'Table'),
        tableBarchart: l('js.renderers.table_barchart', :default => 'Table Barchart'),
        heatmap: l('js.renderers.heatmap', :default => 'Heatmap'),
        rowHeatmap: l('js.renderers.row_heatmap', :default => 'Row Heatmap'),
        colHeatmap: l('js.renderers.col_heatmap', :default => 'Col Heatmap'),
        lineChart: l('js.renderers.line_chart', :default => 'Line Chart'),
        barChart: l('js.renderers.bar_chart', :default => 'Bar Chart'),
        stackedBarChart: l('js.renderers.stacked_bar_chart', :default => 'Stacked Bar Chart'),
        areaChart: l('js.renderers.area_chart', :default => 'Area Chart'),
        scatterChart: l('js.renderers.scatter_chart', :default => 'Scatter Chart'),
        tsvExport: l('js.renderers.tsv_export', :default => 'TSV Export')
      }
    }
  end

  def pivot_default_options
    {
      rows: [l(:field_tracker), l(:field_status)],
      cols: [l(:field_priority)]
    }
  end
end
