var RedminePivot = (function ($) {
    "use strict";

    var config = {};
    var customTextDerivers = [];
    var derivedAttributes = {};
    var aggregators = {};
    var localizedRenderers = {};
    var dateSuffixes = {};
    var localeAgg = {};
    var localeRend = {};

    function init() {
        if (!window.redminePivotData) return;

        // Load locale strings
        localeAgg = window.redminePivotLocaleStrings.aggregators;
        localeRend = window.redminePivotLocaleStrings.renderers;

        initAggregators();
        initRenderers();
        initDateDerivers();

        setupConfig();
        setupUI();

        // Initial Render
        render();
    }

    function initAggregators() {
        var tpl = $.pivotUtilities.aggregatorTemplates;
        var fmt = $.pivotUtilities.numberFormat({ thousandsSep: ",", decimalSep: "." });
        var fmtInt = $.pivotUtilities.numberFormat({ digitsAfterDecimal: 0, thousandsSep: ",", decimalSep: "." });
        var fmtPct = $.pivotUtilities.numberFormat({ digitsAfterDecimal: 1, scaler: 100, suffix: "%", thousandsSep: ",", decimalSep: "." });

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
    }

    function initRenderers() {
        var renderersObj = $.extend(
            {},
            $.pivotUtilities.renderers,
            $.pivotUtilities.c3_renderers || {},
            $.pivotUtilities.d3_renderers || {},
            $.pivotUtilities.gchart_renderers || {},
            $.pivotUtilities.export_renderers || {}
        );

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
    }

    function initDateDerivers() {
        dateSuffixes = {
            year: window.redminePivotLocaleStrings.labelYear,
            month: window.redminePivotLocaleStrings.labelMonth,
            day: window.redminePivotLocaleStrings.labelDay,
            yearMonth: window.redminePivotLocaleStrings.labelYearMonth
        };

        if (window.redminePivotDateFields) {
            window.redminePivotDateFields.forEach(function (key) {
                addDateDeriver(key);
            });
        }
    }

    function addDateDeriver(key) {
        derivedAttributes[key + dateSuffixes.year] = $.pivotUtilities.derivers.dateFormat(key, "%y");
        derivedAttributes[key + dateSuffixes.month] = $.pivotUtilities.derivers.dateFormat(key, "%m");
        derivedAttributes[key + dateSuffixes.day] = $.pivotUtilities.derivers.dateFormat(key, "%d");
        derivedAttributes[key + dateSuffixes.yearMonth] = $.pivotUtilities.derivers.dateFormat(key, "%y-%m");
    }

    function setupConfig() {
        config = {
            derivedAttributes: derivedAttributes,
            rows: ["Tracker", "Status"],
            cols: ["Priority"],
            aggregators: aggregators,
            renderers: localizedRenderers,
            aggregatorName: localeAgg.count,
            rendererName: localeRend.table,
            localeStrings: window.redminePivotLocaleStrings,
            unusedAttrsVertical: false
        };

        // Override defaults with server-side options
        if (window.redminePivotOptions) {
            if (window.redminePivotOptions.rows) config.rows = window.redminePivotOptions.rows;
            if (window.redminePivotOptions.cols) config.cols = window.redminePivotOptions.cols;
        }

        // Apply Saved Config
        if (window.redminePivotQueryConfig) {
            applySavedConfig(window.redminePivotQueryConfig);
        }

        // onRefresh hook for persistence
        config.onRefresh = function (cfg) {
            var currentPivotConfig = getSerializableConfig(cfg);
            // We can attach this to the global object or a hidden field right away if we wanted, 
            // but the original code did it on Save.
            // We'll expose it safely if needed, or better, just re-read from the pivot instance when saving.
            // But pivot instance doesn't expose config easily after render.
            // So let's store it in a module variable.
            RedminePivot.currentConfig = currentPivotConfig;
        };
    }

    function getSerializableConfig(cfg) {
        var serializable = {};
        var keys = ["rows", "cols", "vals", "aggregatorName", "rendererName", "hiddenAttributes", "hiddenFromAggregators"];
        keys.forEach(function (k) {
            if (cfg[k] !== undefined) {
                serializable[k] = cfg[k];
            }
        });
        if (config.customTextDerivers) {
            serializable.customTextDerivers = config.customTextDerivers;
        }
        return serializable;
    }

    function applySavedConfig(savedConfig) {
        try {
            if (typeof savedConfig === 'string') {
                try { savedConfig = JSON.parse(savedConfig); } catch (e) { console.error("JSON parse error", e); }
            }
            $.extend(config, savedConfig);

            if (savedConfig.customTextDerivers) {
                customTextDerivers = savedConfig.customTextDerivers;
                applyTextDerivers();
            }
        } catch (e) {
            console.error("Failed to load saved config", e);
        }
    }

    function setupUI() {
        setupCheckboxes();
        setupFullScreen();
        setupTextGrouping();
        setupSaveParams();
        setupBooleanMode();
    }

    function setupCheckboxes() {
        var allKeys = getAllKeys();
        var $checkboxContainer = $("#field-checkboxes");
        $checkboxContainer.empty();

        allKeys.forEach(function (key) {
            var id = "field_cb_" + key.replace(/\s+/g, '_');
            var isChecked = true;
            if (config.hiddenAttributes && config.hiddenAttributes.indexOf(key) > -1) {
                isChecked = false;
            }

            var $div = $("<div>");
            var $cb = $("<input>", { type: "checkbox", id: id, value: key, checked: isChecked });
            var $label = $("<label>", { for: id }).text(" " + key);
            $div.append($cb).append($label);
            $checkboxContainer.append($div);
        });

        $("#select-all-fields").on("click", function () {
            $checkboxContainer.find("input[type='checkbox']").prop('checked', true);
        });

        $("#deselect-all-fields").on("click", function () {
            $checkboxContainer.find("input[type='checkbox']").prop('checked', false);
        });

        $("#apply-fields").on("click", function () {
            render();
        });
    }

    function getAllKeys() {
        var keySet = {};
        if (window.redminePivotData) {
            window.redminePivotData.forEach(function (record) {
                Object.keys(record).forEach(function (k) { keySet[k] = true; });
            });
        }
        return Object.keys(keySet).sort();
    }

    function setupFullScreen() {
        $("#fullscreen-toggle").on("click", function () {
            var $container = $("body");
            var $pivotWrapper = $("#pivot-wrapper");
            if ($pivotWrapper.length === 0) {
                $("#pivot-controls, #pivot-table-output").wrapAll("<div id='pivot-wrapper'></div>");
                $pivotWrapper = $("#pivot-wrapper");
            }
            $pivotWrapper.toggleClass("full-screen-pivot");
            var isFull = $pivotWrapper.hasClass("full-screen-pivot");
            $(this).text(isFull ? window.redminePivotLocaleStrings.exitFullScreen : window.redminePivotLocaleStrings.fullScreen);
            window.dispatchEvent(new Event('resize'));
        });
    }

    function setupSaveParams() {
        $("#save-query-btn").on("click", function () {
            var name = prompt(window.redminePivotLocaleStrings.promptSaveSettings);
            if (name) {
                var configStr = JSON.stringify(RedminePivot.currentConfig || getSerializableConfig(config));
                $("#query_name").val(name);
                $("#pivot_config").val(configStr);
                $("#save-query-form").submit();
            }
        });
    }

    function setupBooleanMode() {
        if (window.redminePivotBooleanFields && window.redminePivotBooleanFields.length > 0) {
            $("<button>")
                .text(window.redminePivotLocaleStrings.buttonMultiBoolean)
                .attr("type", "button")
                .css({ "font-size": "0.9em", "margin-left": "10px" })
                .click(activateMultiBooleanMode)
                .insertAfter("#save-query-btn");
        }
    }

    function activateMultiBooleanMode() {
        if (!confirm(window.redminePivotLocaleStrings.confirmMultiBoolean)) return;

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

        var newConfig = $.extend({}, config);
        newConfig.rows = [window.redminePivotLocaleStrings.labelItemName];
        newConfig.cols = [window.redminePivotLocaleStrings.labelValue];
        newConfig.aggregatorName = localeAgg.count;
        newConfig.rendererName = localeRend.table;

        $("#pivot-table-output").pivotUI(meltedData, newConfig, true);
    }

    // --- Text Grouping Logic ---

    function setupTextGrouping() {
        var $tgModal = $("#text-grouping-modal");
        var $tgFieldSelect = $("#tg-field-select");
        var $tgRulesList = $("#tg-active-rules");

        $("#text-grouping-btn").on("click", function () {
            $tgFieldSelect.empty();
            getAllKeys().forEach(function (key) {
                $tgFieldSelect.append($("<option>").val(key).text(key));
            });
            refreshRulesList($tgRulesList);

            var buttons = {};
            buttons[window.redminePivotLocaleStrings.buttonClose] = function () { $(this).dialog("close"); };
            $tgModal.dialog({ modal: true, width: 400, buttons: buttons });
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
            try { new RegExp(regex); } catch (e) {
                alert(window.redminePivotLocaleStrings.errorInvalidRegex + e.message);
                return;
            }

            customTextDerivers.push({ field: field, regex: regex, format: format, name: name });
            applyTextDerivers();
            render();
            refreshRulesList($tgRulesList);

            $("#tg-name-input").val("");
            $("#tg-regex-input").val("");
        });
    }

    function refreshRulesList($container) {
        $container.empty();
        if (customTextDerivers.length === 0) {
            $container.append("<div style='color: #888;'>" + window.redminePivotLocaleStrings.labelNoRules + "</div>");
            return;
        }
        var $table = $("<table style='width:100%; border-collapse: collapse;'>");
        customTextDerivers.forEach(function (rule, index) {
            var $tr = $("<tr>").css("border-bottom", "1px solid #eee");
            $tr.append($("<td>").text(rule.name).css("padding", "5px"));
            $tr.append($("<td>").text(rule.field + " -> " + rule.regex).css("font-size", "0.8em").css("padding", "5px"));
            var $delBtn = $("<button>").text("x").css({ "background": "none", "border": "none", "color": "red", "cursor": "pointer", "font-weight": "bold" });
            $delBtn.on("click", function () {
                customTextDerivers.splice(index, 1);
                applyTextDerivers();
                render();
                refreshRulesList($container);
            });
            $tr.append($("<td>").append($delBtn).css("text-align", "right"));
            $table.append($tr);
        });
        $container.append($table);
    }

    function applyTextDerivers() {
        config.derivedAttributes = $.extend({}, derivedAttributes);
        customTextDerivers.forEach(function (rule) {
            try {
                var re = new RegExp(rule.regex);
                config.derivedAttributes[rule.name] = function (record) {
                    var val = record[rule.field];
                    if (val == null) return "null";
                    val = "" + val;
                    var match = val.match(re);
                    if (match) {
                        var replacement = match[1] || match[0];
                        return rule.format.replace("{0}", replacement);
                    }
                    return "Others";
                };
            } catch (e) {
                console.error("Invalid Regex", e);
            }
        });
        config.customTextDerivers = customTextDerivers;
    }

    function render() {
        var hiddenAttributes = [];
        var hiddenFromAggregators = [];

        // 1. Calculate hiddenAttributes from checkboxes
        $("#field-checkboxes input[type='checkbox']").each(function () {
            if (!$(this).is(':checked')) {
                var key = $(this).val();
                hiddenAttributes.push(key);
                // Also hide derived date attributes
                if (window.redminePivotDateFields && window.redminePivotDateFields.indexOf(key) > -1) {
                    hiddenAttributes.push(key + dateSuffixes.year);
                    hiddenAttributes.push(key + dateSuffixes.month);
                    hiddenAttributes.push(key + dateSuffixes.day);
                    hiddenAttributes.push(key + dateSuffixes.yearMonth);
                }
            }
        });

        // 2. Calculate hiddenFromAggregators
        var allKeys = getAllKeys();
        if (window.redminePivotNumericFields) {
            allKeys.forEach(function (key) {
                if (window.redminePivotNumericFields.indexOf(key) === -1) {
                    hiddenFromAggregators.push(key);
                }
            });
            for (var derivedKey in config.derivedAttributes) {
                hiddenFromAggregators.push(derivedKey);
            }
        }

        config.hiddenAttributes = hiddenAttributes;
        config.hiddenFromAggregators = hiddenFromAggregators;

        $("#pivot-table-output").pivotUI(window.redminePivotData, config, true);
    }

    return {
        init: init
    };

})(jQuery);

$(document).ready(function () {
    RedminePivot.init();
});
