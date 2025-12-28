$(document).ready(function () {
    if (window.redminePivotData) {
        var derivers = $.pivotUtilities.derivers;
        var renderers = $.pivotUtilities.renderers;
        var tpl = $.pivotUtilities.aggregatorTemplates;

        // Number formatting
        var fmt = $.pivotUtilities.numberFormat({
            thousandsSep: ",",
            decimalSep: "."
        });
        var fmtInt = $.pivotUtilities.numberFormat({
            digitsAfterDecimal: 0,
            thousandsSep: ",",
            decimalSep: "."
        });
        var fmtPct = $.pivotUtilities.numberFormat({
            digitsAfterDecimal: 1,
            scaler: 100,
            suffix: "%",
            thousandsSep: ",",
            decimalSep: "."
        });

        // Localized Aggregators
        // We use the keys provided by the server in window.redminePivotLocaleStrings.aggregators
        // to map to the implementation.
        var localeAgg = window.redminePivotLocaleStrings.aggregators;
        var aggregators = {};
        aggregators[localeAgg.count] = tpl.count(fmtInt);
        aggregators[localeAgg.countUniqueValues] = tpl.countUnique(fmtInt);
        aggregators[localeAgg.listUniqueValues] = tpl.listUnique(", ");
        aggregators[localeAgg.sum] = tpl.sum(fmt);
        aggregators[localeAgg.integerSum] = tpl.sum(fmtInt);
        aggregators[localeAgg.average] = tpl.average(fmt);
        aggregators[localeAgg.median] = tpl.median(fmt);
        aggregators[localeAgg.variance] = tpl.var(1, fmt);
        aggregators[localeAgg.sampleVariance] = tpl.var(0, fmt);
        aggregators[localeAgg.standardDeviation] = tpl.stdev(1, fmt, function (x) { return Math.pow(x, 0.5) });
        aggregators[localeAgg.sampleStandardDeviation] = tpl.stdev(0, fmt, function (x) { return Math.pow(x, 0.5) });
        aggregators[localeAgg.minimum] = tpl.min(fmt);
        aggregators[localeAgg.maximum] = tpl.max(fmt);
        aggregators[localeAgg.first] = tpl.first(fmt);
        aggregators[localeAgg.last] = tpl.last(fmt);
        aggregators[localeAgg.sumAsFractionOfTotal] = tpl.fractionOf(tpl.sum(), "total", fmtPct);
        aggregators[localeAgg.sumAsFractionOfRows] = tpl.fractionOf(tpl.sum(), "row", fmtPct);
        aggregators[localeAgg.sumAsFractionOfColumns] = tpl.fractionOf(tpl.sum(), "col", fmtPct);
        aggregators[localeAgg.countAsFractionOfTotal] = tpl.fractionOf(tpl.count(), "total", fmtPct);
        aggregators[localeAgg.countAsFractionOfRows] = tpl.fractionOf(tpl.count(), "row", fmtPct);
        aggregators[localeAgg.countAsFractionOfColumns] = tpl.fractionOf(tpl.count(), "col", fmtPct);

        // Combine all available renderers
        var renderersObj = $.extend(
            {},
            $.pivotUtilities.renderers,
            $.pivotUtilities.c3_renderers || {},
            $.pivotUtilities.d3_renderers || {},
            $.pivotUtilities.gchart_renderers || {},
            $.pivotUtilities.export_renderers || {}
        );

        // Map to Localized names
        var localeRend = window.redminePivotLocaleStrings.renderers;
        var localizedRenderers = {};

        // Helper to map if exists
        var mapRenderer = function (localizedName, originalName) {
            if (renderersObj[originalName]) {
                localizedRenderers[localizedName] = renderersObj[originalName];
            }
        };

        mapRenderer(localeRend.table, "Table");
        mapRenderer(localeRend.tableBarchart, "Table Barchart");
        mapRenderer(localeRend.heatmap, "Heatmap");
        mapRenderer(localeRend.rowHeatmap, "Row Heatmap");
        mapRenderer(localeRend.colHeatmap, "Col Heatmap");
        mapRenderer(localeRend.lineChart, "Line Chart");
        mapRenderer(localeRend.barChart, "Bar Chart");
        mapRenderer(localeRend.stackedBarChart, "Stacked Bar Chart");
        mapRenderer(localeRend.areaChart, "Area Chart");
        mapRenderer(localeRend.scatterChart, "Scatter Chart");
        mapRenderer(localeRend.tsvExport, "TSV Export");

        // Detect date fields and add derived attributes
        var derivedAttributes = {};
        var dateSuffixes = {
            year: window.redminePivotLocaleStrings.labelYear,
            month: window.redminePivotLocaleStrings.labelMonth,
            day: window.redminePivotLocaleStrings.labelDay,
            yearMonth: window.redminePivotLocaleStrings.labelYearMonth
        };

        // 1. Use server-provided metadata (Reliable & Fast)
        if (window.redminePivotDateFields) {
            window.redminePivotDateFields.forEach(function (key) {
                derivedAttributes[key + dateSuffixes.year] = $.pivotUtilities.derivers.dateFormat(key, "%y");
                derivedAttributes[key + dateSuffixes.month] = $.pivotUtilities.derivers.dateFormat(key, "%m");
                derivedAttributes[key + dateSuffixes.day] = $.pivotUtilities.derivers.dateFormat(key, "%d");
                derivedAttributes[key + dateSuffixes.yearMonth] = $.pivotUtilities.derivers.dateFormat(key, "%y-%m");
            });
        }
        // 2. Fallback: Scan data if metadata is missing (e.g. older version cached)
        else if (window.redminePivotData.length > 0) {
            var datePattern = /^\d{4}-\d{2}-\d{2}$/;
            var allKeys = {};
            // Scan up to 50 records
            var limit = Math.min(window.redminePivotData.length, 50);
            for (var i = 0; i < limit; i++) {
                var record = window.redminePivotData[i];
                for (var key in record) {
                    if (record[key] && datePattern.test(record[key])) {
                        allKeys[key] = true;
                    }
                }
            }
            for (var key in allKeys) {
                derivedAttributes[key + dateSuffixes.year] = $.pivotUtilities.derivers.dateFormat(key, "%y");
                derivedAttributes[key + dateSuffixes.month] = $.pivotUtilities.derivers.dateFormat(key, "%m");
                derivedAttributes[key + dateSuffixes.day] = $.pivotUtilities.derivers.dateFormat(key, "%d");
                derivedAttributes[key + dateSuffixes.yearMonth] = $.pivotUtilities.derivers.dateFormat(key, "%y-%m");
            }
        }

        // Prepare config
        var config = {
            derivedAttributes: derivedAttributes,
            rows: ["Tracker", "Status"],
            cols: ["Priority"],
            // vals: ["Estimated Hours"], 

            aggregators: aggregators,
            renderers: localizedRenderers,

            // Defaults (Localized)
            aggregatorName: localeAgg.count,
            rendererName: localeRend.table,

            localeStrings: window.redminePivotLocaleStrings,

            // Force unused attributes to be horizontal (prevents layout shift)
            unusedAttrsVertical: false
        };

        // Override defaults with server-side options if available
        if (window.redminePivotOptions) {
            if (window.redminePivotOptions.rows) config.rows = window.redminePivotOptions.rows;
            if (window.redminePivotOptions.cols) config.cols = window.redminePivotOptions.cols;
        }

        // Initialize Field Selection Checkboxes
        var allKeys = [];
        if (window.redminePivotData.length > 0) {
            var keySet = {};
            window.redminePivotData.forEach(function (record) {
                Object.keys(record).forEach(function (k) {
                    keySet[k] = true;
                });
            });
            allKeys = Object.keys(keySet).sort();
        }

        var $checkboxContainer = $("#field-checkboxes");
        allKeys.forEach(function (key) {
            var id = "field_cb_" + key.replace(/\s+/g, '_'); // sanitize ID
            var $div = $("<div>");
            var $cb = $("<input>", { type: "checkbox", id: id, value: key, checked: true });
            var $label = $("<label>", { for: id }).text(" " + key);
            $div.append($cb).append($label);
            $checkboxContainer.append($div);
        });

        // "Select All" / "Deselect All" handlers
        $("#select-all-fields").on("click", function () {
            $checkboxContainer.find("input[type='checkbox']").prop('checked', true);
        });

        $("#deselect-all-fields").on("click", function () {
            $checkboxContainer.find("input[type='checkbox']").prop('checked', false);
        });

        // "Apply" handler
        // --- Persistent Configuration Logic (Moved) ---

        // Store current config to allow saving
        var currentPivotConfig = {};

        // Helper to extract serializable config
        var getSerializableConfig = function (cfg) {
            var serializable = {};
            var keys = ["rows", "cols", "vals", "aggregatorName", "rendererName", "hiddenAttributes", "hiddenFromAggregators"];
            keys.forEach(function (k) {
                if (cfg[k] !== undefined) {
                    serializable[k] = cfg[k];
                }
            });
            return serializable;
        };

        // onRefresh hooks
        config.onRefresh = function (cfg) {
            currentPivotConfig = getSerializableConfig(cfg);
            if (config.hiddenAttributes) {
                currentPivotConfig.hiddenAttributes = config.hiddenAttributes;
            }
            if (config.hiddenFromAggregators) {
                currentPivotConfig.hiddenFromAggregators = config.hiddenFromAggregators;
            }
            // Preserve Custom Text Derivers
            if (config.customTextDerivers) {
                currentPivotConfig.customTextDerivers = config.customTextDerivers;
            }
        };

        // --- Custom Text Grouping (Regex) ---
        var customTextDerivers = []; // Array of { field, regex, format, name }

        // Function to apply Custom Text Derivers to config
        var applyTextDerivers = function () {
            customTextDerivers.forEach(function (rule) {
                try {
                    var re = new RegExp(rule.regex);
                    config.derivedAttributes[rule.name] = function (record) {
                        var val = record[rule.field];
                        if (val == null) return "null"; // Handle nulls safe? or just null
                        val = "" + val; // force string
                        var match = val.match(re);
                        if (match) {
                            var replacement = match[1] || match[0];
                            return rule.format.replace("{0}", replacement);
                        }
                        return "Others"; // or val? "Others" is better for grouping non-matches
                    };
                } catch (e) {
                    console.error("Invalid Regex or Deriver Error", e);
                }
            });

            // Allow storing in config for persistence
            config.customTextDerivers = customTextDerivers;
        };

        // Override defaults with Saved Config from Server if available
        if (window.redminePivotQueryConfig) {
            try {
                var savedConfig = window.redminePivotQueryConfig;

                // If it's a string (safely encoded from server), parse it.
                if (typeof savedConfig === 'string') {
                    try {
                        savedConfig = JSON.parse(savedConfig);
                    } catch (e) {
                        console.error("RedminePivot: JSON parsing error:", e);
                    }
                }

                // Merge saved config into main config
                $.extend(config, savedConfig);

                // Restore checkbox state based on hiddenAttributes
                if (savedConfig.hiddenAttributes) {
                    $checkboxContainer.find("input[type='checkbox']").each(function () {
                        if (savedConfig.hiddenAttributes.indexOf($(this).val()) > -1) {
                            $(this).prop('checked', false);
                        } else {
                            $(this).prop('checked', true);
                        }
                    });
                }

                // Restore Custom Text Derivers
                if (savedConfig.customTextDerivers) {
                    customTextDerivers = savedConfig.customTextDerivers;
                    applyTextDerivers();
                }
            } catch (e) {
                console.error("Failed to load saved configuration", e);
            }
        }

        $("#save-query-btn").on("click", function () {
            var name = prompt(window.redminePivotLocaleStrings.promptSaveSettings);
            if (name) {
                var configStr = JSON.stringify(currentPivotConfig);
                $("#query_name").val(name);
                $("#pivot_config").val(configStr);
                $("#save-query-form").submit();
            }
        });

        // Handler for Multi-item Aggregation (Questionnaire Mode)
        var activateMultiBooleanMode = function () {
            if (!window.redminePivotBooleanFields || window.redminePivotBooleanFields.length === 0) {
                alert(window.redminePivotLocaleStrings.alertNoBoolean);
                return;
            }

            if (!confirm(window.redminePivotLocaleStrings.confirmMultiBoolean)) {
                return;
            }

            var meltedData = [];
            window.redminePivotData.forEach(function (record) {
                window.redminePivotBooleanFields.forEach(function (field) {
                    if (record.hasOwnProperty(field)) {
                        var newRecord = $.extend({}, record);
                        newRecord[window.redminePivotLocaleStrings.labelItemName] = field;
                        newRecord[window.redminePivotLocaleStrings.labelValue] = record[field];
                        meltedData.push(newRecord);
                    }
                });
            });

            // Update configuration
            var newConfig = $.extend({}, config);
            newConfig.rows = [window.redminePivotLocaleStrings.labelItemName];
            newConfig.cols = [window.redminePivotLocaleStrings.labelValue];
            newConfig.aggregatorName = localeAgg.count;
            newConfig.rendererName = localeRend.table;

            // Render with melted data
            $("#pivot-table-output").pivotUI(meltedData, newConfig, true);
        };

        // Add Multi-item Aggregation Button if boolean fields exist
        if (window.redminePivotBooleanFields && window.redminePivotBooleanFields.length > 0) {
            $("<button>")
                .text(window.redminePivotLocaleStrings.buttonMultiBoolean)
                .attr("type", "button")
                .css({ "font-size": "0.9em", "margin-left": "10px" })
                .click(activateMultiBooleanMode)
                .insertAfter("#save-query-btn");
        }

        var renderPivotTable = function () {
            var hiddenAttributes = [];
            var hiddenFromAggregators = [];

            // 1. Calculate hiddenAttributes (from checkboxes)
            $checkboxContainer.find("input[type='checkbox']").each(function () {
                if (!$(this).is(':checked')) {
                    var key = $(this).val();
                    hiddenAttributes.push(key);

                    // If it is a date field, also hide derived attributes
                    if (window.redminePivotDateFields && window.redminePivotDateFields.indexOf(key) > -1) {
                        hiddenAttributes.push(key + dateSuffixes.year);
                        hiddenAttributes.push(key + dateSuffixes.month);
                        hiddenAttributes.push(key + dateSuffixes.day);
                        hiddenAttributes.push(key + dateSuffixes.yearMonth);
                    }
                }
            });

            // 2. Calculate hiddenFromAggregators (All attributes - Numeric attributes)
            // This ensures only numeric fields are shown in "Sum", "Average" etc.
            if (window.redminePivotNumericFields) {
                allKeys.forEach(function (key) {
                    if (window.redminePivotNumericFields.indexOf(key) === -1) {
                        hiddenFromAggregators.push(key);
                    }
                });

                // Also hide derived date attributes from aggregators
                for (var derivedKey in config.derivedAttributes) {
                    hiddenFromAggregators.push(derivedKey);
                }
            }

            config.hiddenAttributes = hiddenAttributes;
            config.hiddenFromAggregators = hiddenFromAggregators;

            $("#pivot-table-output").pivotUI(window.redminePivotData, config, true);
        };

        $("#apply-fields").on("click", function () {
            renderPivotTable();
        });

        // Initial Render
        renderPivotTable();

        // Full Screen Toggle
        $("#fullscreen-toggle").on("click", function () {
            var $container = $("#content"); // Redmine's main content area
            // If #content is not found (some themes differ), fallback to body or create a wrapper
            if ($container.length === 0) $container = $("body");

            var $pivotWrapper = $("#pivot-wrapper");
            if ($pivotWrapper.length === 0) {
                $("#pivot-controls, #pivot-table-output").wrapAll("<div id='pivot-wrapper'></div>");
                $pivotWrapper = $("#pivot-wrapper");
            }

            $pivotWrapper.toggleClass("full-screen-pivot");

            if ($pivotWrapper.hasClass("full-screen-pivot")) {
                $(this).text(window.redminePivotLocaleStrings ? window.redminePivotLocaleStrings.exitFullScreen : "Exit Full Screen");
            } else {
                $(this).text(window.redminePivotLocaleStrings ? window.redminePivotLocaleStrings.fullScreen : "Full Screen");
            }

            // Retrigger resize for charts if needed
            window.dispatchEvent(new Event('resize'));
        });

        // Text Grouping UI Handlers
        var $tgModal = $("#text-grouping-modal");
        var $tgFieldSelect = $("#tg-field-select");
        var $tgRulesList = $("#tg-active-rules");

        var refreshRulesList = function () {
            $tgRulesList.empty();
            if (customTextDerivers.length === 0) {
                $tgRulesList.append("<div style='color: #888;'>" + window.redminePivotLocaleStrings.labelNoRules + "</div>");
                return;
            }
            var $table = $("<table style='width:100%; border-collapse: collapse;'>");
            customTextDerivers.forEach(function (rule, index) {
                var $tr = $("<tr>").css("border-bottom", "1px solid #eee");
                $tr.append($("<td>").text(rule.name).css("padding", "5px"));
                $tr.append($("<td>").text(rule.field + " -> " + rule.regex).css("font-size", "0.8em").css("padding", "5px"));
                var $delBtn = $("<button>").text("x").css({
                    "background": "none",
                    "border": "none",
                    "color": "red",
                    "cursor": "pointer",
                    "font-weight": "bold"
                });
                $delBtn.on("click", function () {
                    customTextDerivers.splice(index, 1);
                    applyTextDerivers();
                    renderPivotTable();
                    refreshRulesList();
                });
                $tr.append($("<td>").append($delBtn).css("text-align", "right"));
                $table.append($tr);
            });
            $tgRulesList.append($table);
        };

        $("#text-grouping-btn").on("click", function () {
            // Populate fields dropdown
            $tgFieldSelect.empty();
            allKeys.forEach(function (key) {
                $tgFieldSelect.append($("<option>").val(key).text(key));
            });

            refreshRulesList();

            // Localized button
            var buttons = {};
            buttons[window.redminePivotLocaleStrings.buttonClose] = function () {
                $(this).dialog("close");
            };

            $tgModal.dialog({
                modal: true,
                width: 400,
                buttons: buttons
            });
        });

        $("#tg-add-btn").on("click", function () {
            var field = $tgFieldSelect.val();
            var regex = $("#tg-regex-input").val();
            var format = $("#tg-format-input").val();
            var name = $("#tg-name-input").val();

            if (!field || !regex || !format || !name) {
                alert(window.redminePivotLocaleStrings.errorFillAll);
                return;
            }

            try {
                new RegExp(regex); // validate regex
            } catch (e) {
                alert(window.redminePivotLocaleStrings.errorInvalidRegex + e.message);
                return;
            }

            customTextDerivers.push({
                field: field,
                regex: regex,
                format: format,
                name: name
            });

            applyTextDerivers();
            renderPivotTable(); // Refresh pivot to show new field (might need to update UI for available fields)

            refreshRulesList();

            // clear inputs
            $("#tg-name-input").val("");
            $("#tg-regex-input").val("");
            // keep format as it's often similar
        });

    }
});
