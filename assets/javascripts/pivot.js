var RedminePivot = (function ($) {
    "use strict";

    // Global state holders
    var appConfig = {}; // The pivotUI configuration object
    var appState = {
        customTextDerivers: [],
        derivedAttributes: {},
        aggregators: {},
        localizedRenderers: {},
        dateSuffixes: {},
        localeAgg: {},
        localeRend: {}
    };

    // --- Module: Config ---
    var Config = {
        init: function () {
            var rawConfig = window.redminePivotConfig || {};

            // Load locale strings
            appState.localeAgg = rawConfig.localeStrings.aggregators;
            appState.localeRend = rawConfig.localeStrings.renderers;

            // Set up date suffixes
            appState.dateSuffixes = {
                year: rawConfig.localeStrings.labelYear,
                month: rawConfig.localeStrings.labelMonth,
                day: rawConfig.localeStrings.labelDay,
                yearMonth: rawConfig.localeStrings.labelYearMonth
            };

            // Initialize base pivotUI config
            appConfig = {
                derivedAttributes: appState.derivedAttributes,
                rows: ["Tracker"],
                cols: ["Status"],
                aggregators: appState.aggregators,
                renderers: appState.localizedRenderers,
                aggregatorName: (appState.localeAgg.count && appState.localeAgg.count !== "undefined") ? appState.localeAgg.count : "Count",
                rendererName: (appState.localeRend.table && appState.localeRend.table !== "undefined") ? appState.localeRend.table : "Table",
                localeStrings: rawConfig.localeStrings,
                unusedAttrsVertical: false
            };

            // Override with server-side options (default layout)
            if (rawConfig.options) {
                if (rawConfig.options.rows) appConfig.rows = rawConfig.options.rows;
                if (rawConfig.options.cols) appConfig.cols = rawConfig.options.cols;
            }

            // Apply User Saved Config
            if (rawConfig.savedConfig) {
                this.applySavedConfig(rawConfig.savedConfig);
            }

            // Persistence hook
            appConfig.onRefresh = function (cfg) {
                RedminePivot.currentConfig = Config.getSerializableConfig(cfg);
            };
        },

        getSerializableConfig: function (cfg) {
            var serializable = {};
            var keys = ["rows", "cols", "vals", "aggregatorName", "rendererName", "hiddenAttributes", "hiddenFromAggregators"];
            keys.forEach(function (k) {
                if (cfg[k] !== undefined) {
                    serializable[k] = cfg[k];
                }
            });
            if (appState.customTextDerivers && appState.customTextDerivers.length > 0) {
                serializable.customTextDerivers = appState.customTextDerivers;
            }
            return serializable;
        },

        applySavedConfig: function (savedConfig) {
            try {
                if (typeof savedConfig === 'string') {
                    try { savedConfig = JSON.parse(savedConfig); } catch (e) { console.error("JSON parse error", e); }
                }
                $.extend(appConfig, savedConfig);

                if (savedConfig.customTextDerivers) {
                    appState.customTextDerivers = savedConfig.customTextDerivers;
                    DataDetails.applyTextDerivers();
                }
            } catch (e) {
                console.error("Failed to load saved config", e);
            }
        }
    };

    // --- Module: DataDetails (Derivers & Formatters) ---
    var DataDetails = {
        init: function () {
            this.initDateDerivers();
            this.initAggregators();
            this.initRenderers();
        },

        initDateDerivers: function () {
            var dateFields = window.redminePivotConfig.dateFields;
            if (dateFields) {
                dateFields.forEach(function (key) {
                    DataDetails.addDateDeriver(key);
                });
            }
        },

        addDateDeriver: function (key) {
            var sfx = appState.dateSuffixes;
            appState.derivedAttributes[key + sfx.year] = $.pivotUtilities.derivers.dateFormat(key, "%y");
            appState.derivedAttributes[key + sfx.month] = $.pivotUtilities.derivers.dateFormat(key, "%m");
            appState.derivedAttributes[key + sfx.day] = $.pivotUtilities.derivers.dateFormat(key, "%d");
            appState.derivedAttributes[key + sfx.yearMonth] = $.pivotUtilities.derivers.dateFormat(key, "%y-%m");
        },

        initAggregators: function () {
            var tpl = $.pivotUtilities.aggregatorTemplates;
            var fmt = $.pivotUtilities.numberFormat({ thousandsSep: ",", decimalSep: "." });
            var fmtInt = $.pivotUtilities.numberFormat({ digitsAfterDecimal: 0, thousandsSep: ",", decimalSep: "." });
            var fmtPct = $.pivotUtilities.numberFormat({ digitsAfterDecimal: 1, scaler: 100, suffix: "%", thousandsSep: ",", decimalSep: "." });
            var localeAgg = appState.localeAgg;

            var setAgg = function (localizedName, originalName, aggregatorFn) {
                var name = (localizedName && localizedName !== "undefined") ? localizedName : originalName;
                appState.aggregators[name] = aggregatorFn;
            };

            setAgg(localeAgg.count, "Count", tpl.count(fmtInt));
            setAgg(localeAgg.countUniqueValues, "Count Unique Values", tpl.countUnique(fmtInt));
            setAgg(localeAgg.listUniqueValues, "List Unique Values", tpl.listUnique(", "));
            setAgg(localeAgg.sum, "Sum", tpl.sum(fmt));
            setAgg(localeAgg.integerSum, "Integer Sum", tpl.sum(fmtInt));
            setAgg(localeAgg.average, "Average", tpl.average(fmt));
            setAgg(localeAgg.median, "Median", tpl.median(fmt));
            setAgg(localeAgg.variance, "Variance", tpl.var(1, fmt));
            setAgg(localeAgg.sampleVariance, "Sample Variance", tpl.var(0, fmt));
            setAgg(localeAgg.standardDeviation, "Standard Deviation", tpl.stdev(1, fmt, function (x) { return Math.pow(x, 0.5) }));
            setAgg(localeAgg.sampleStandardDeviation, "Sample Standard Deviation", tpl.stdev(0, fmt, function (x) { return Math.pow(x, 0.5) }));
            setAgg(localeAgg.minimum, "Minimum", tpl.min(fmt));
            setAgg(localeAgg.maximum, "Maximum", tpl.max(fmt));
            setAgg(localeAgg.first, "First", tpl.first(fmt));
            setAgg(localeAgg.last, "Last", tpl.last(fmt));
            setAgg(localeAgg.sumAsFractionOfTotal, "Sum as Fraction of Total", tpl.fractionOf(tpl.sum(), "total", fmtPct));
            setAgg(localeAgg.sumAsFractionOfRows, "Sum as Fraction of Rows", tpl.fractionOf(tpl.sum(), "row", fmtPct));
            setAgg(localeAgg.sumAsFractionOfColumns, "Sum as Fraction of Columns", tpl.fractionOf(tpl.sum(), "col", fmtPct));
            setAgg(localeAgg.countAsFractionOfTotal, "Count as Fraction of Total", tpl.fractionOf(tpl.count(), "total", fmtPct));
            setAgg(localeAgg.countAsFractionOfRows, "Count as Fraction of Rows", tpl.fractionOf(tpl.count(), "row", fmtPct));
            setAgg(localeAgg.countAsFractionOfColumns, "Count as Fraction of Columns", tpl.fractionOf(tpl.count(), "col", fmtPct));
        },

        initRenderers: function () {
            var renderersObj = $.extend(
                {},
                $.pivotUtilities.renderers,
                $.pivotUtilities.c3_renderers || {},
                $.pivotUtilities.d3_renderers || {},
                $.pivotUtilities.gchart_renderers || {},
                $.pivotUtilities.export_renderers || {}
            );

            var localeRend = appState.localeRend || {};
            var mapRenderer = function (localizedName, originalName) {
                var name = (localizedName && localizedName !== "undefined") ? localizedName : originalName;
                if (renderersObj[originalName]) {
                    appState.localizedRenderers[name] = renderersObj[originalName];
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
        },

        applyTextDerivers: function () {
            appConfig.derivedAttributes = $.extend({}, appState.derivedAttributes);
            appState.customTextDerivers.forEach(function (rule) {
                try {
                    var re = new RegExp(rule.regex);
                    appConfig.derivedAttributes[rule.name] = function (record) {
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
            appConfig.customTextDerivers = appState.customTextDerivers;
        }
    };

    // --- Module: UI ---
    var UI = {
        init: function () {
            this.setupCheckboxes();
            this.setupFullScreen();
            this.setupTextGrouping();
            this.setupSaveParams();
            this.setupBooleanMode();
        },

        setupCheckboxes: function () {
            var allKeys = UI.getAllKeys();
            var $checkboxContainer = $("#field-checkboxes");
            $checkboxContainer.empty();

            allKeys.forEach(function (key) {
                var id = "field_cb_" + key.replace(/\s+/g, '_');
                var isChecked = true;
                if (appConfig.hiddenAttributes && appConfig.hiddenAttributes.indexOf(key) > -1) {
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
                Core.render();
            });
        },

        getAllKeys: function () {
            var keySet = {};
            var data = window.redminePivotConfig.data;
            if (data) {
                data.forEach(function (record) {
                    Object.keys(record).forEach(function (k) { keySet[k] = true; });
                });
            }
            return Object.keys(keySet).sort();
        },

        setupFullScreen: function () {
            $("#fullscreen-toggle").on("click", function () {
                var $container = $("body");
                var $pivotWrapper = $("#pivot-wrapper");
                if ($pivotWrapper.length === 0) {
                    $("#pivot-controls, #pivot-table-output").wrapAll("<div id='pivot-wrapper'></div>");
                    $pivotWrapper = $("#pivot-wrapper");
                }
                $pivotWrapper.toggleClass("full-screen-pivot");
                var isFull = $pivotWrapper.hasClass("full-screen-pivot");
                $(this).text(isFull ? window.redminePivotConfig.localeStrings.exitFullScreen : window.redminePivotConfig.localeStrings.fullScreen);
                window.dispatchEvent(new Event('resize'));
            });
        },

        setupSaveParams: function () {
            $("#save-query-btn").on("click", function () {
                var name = prompt(window.redminePivotConfig.localeStrings.promptSaveSettings);
                if (name) {
                    var configStr = JSON.stringify(RedminePivot.currentConfig || Config.getSerializableConfig(appConfig));
                    $("#query_name").val(name);
                    $("#pivot_config").val(configStr);
                    $("#save-query-form").submit();
                }
            });
        },

        setupBooleanMode: function () {
            var boolFields = window.redminePivotConfig.booleanFields;
            if (boolFields && boolFields.length > 0) {
                var btnTxt = window.redminePivotConfig.localeStrings.buttonMultiBoolean;

                $("<button>")
                    .text(btnTxt)
                    .attr("type", "button")
                    .addClass("pivot-button pivot-button-spacer")
                    .click(UI.activateMultiBooleanMode)
                    .insertAfter("#save-query-btn");
            }
        },

        activateMultiBooleanMode: function () {
            if (!confirm(window.redminePivotConfig.localeStrings.confirmMultiBoolean)) return;

            var meltedData = [];
            var boolFields = window.redminePivotConfig.booleanFields;
            var data = window.redminePivotConfig.data;
            var localeStrs = window.redminePivotConfig.localeStrings;

            data.forEach(function (record) {
                boolFields.forEach(function (field) {
                    if (record.hasOwnProperty(field)) {
                        var newRecord = $.extend({}, record);
                        newRecord[localeStrs.labelItemName] = field;
                        newRecord[localeStrs.labelValue] = record[field];
                        meltedData.push(newRecord);
                    }
                });
            });

            var newConfig = $.extend({}, appConfig);
            newConfig.rows = [localeStrs.labelItemName];
            newConfig.cols = [localeStrs.labelValue];
            newConfig.aggregatorName = appState.localeAgg.count;
            newConfig.rendererName = appState.localeRend.table;

            $("#pivot-table-output").pivotUI(meltedData, newConfig, true);
        },

        setupTextGrouping: function () {
            var $tgModal = $("#text-grouping-modal");
            var $tgFieldSelect = $("#tg-field-select");
            var $tgRulesList = $("#tg-active-rules");

            $("#text-grouping-btn").on("click", function () {
                $tgFieldSelect.empty();
                UI.getAllKeys().forEach(function (key) {
                    $tgFieldSelect.append($("<option>").val(key).text(key));
                });
                UI.refreshRulesList($tgRulesList);

                var buttons = {};
                buttons[window.redminePivotConfig.localeStrings.buttonClose] = function () { $(this).dialog("close"); };
                $tgModal.dialog({ modal: true, width: 400, buttons: buttons });
            });

            $("#tg-add-btn").on("click", function () {
                var field = $tgFieldSelect.val();
                var regex = $("#tg-regex-input").val();
                var format = $("#tg-format-input").val();
                var name = $("#tg-name-input").val();
                var strs = window.redminePivotConfig.localeStrings;

                if (!field || !regex || !format || !name) {
                    alert(strs.errorFillAll);
                    return;
                }
                try { new RegExp(regex); } catch (e) {
                    alert(strs.errorInvalidRegex + e.message);
                    return;
                }

                appState.customTextDerivers.push({ field: field, regex: regex, format: format, name: name });
                DataDetails.applyTextDerivers();
                Core.render();
                UI.refreshRulesList($tgRulesList);

                $("#tg-name-input").val("");
                $("#tg-regex-input").val("");
            });
        },

        refreshRulesList: function ($container) {
            $container.empty();
            var strs = window.redminePivotConfig.localeStrings;

            if (appState.customTextDerivers.length === 0) {
                $container.append("<div style='color: #888;'>" + strs.labelNoRules + "</div>");
                return;
            }

            var $table = $("<table>").addClass("pivot-rules-table");
            appState.customTextDerivers.forEach(function (rule, index) {
                var $tr = $("<tr>").addClass("pivot-rule-row");
                $tr.append($("<td>").text(rule.name).addClass("pivot-rule-name"));
                $tr.append($("<td>").text(rule.field + " -> " + rule.regex).addClass("pivot-rule-detail"));

                var $delBtn = $("<button>").text("x").addClass("pivot-delete-btn");
                $delBtn.on("click", function () {
                    appState.customTextDerivers.splice(index, 1);
                    DataDetails.applyTextDerivers();
                    Core.render();
                    UI.refreshRulesList($container);
                });

                $tr.append($("<td>").append($delBtn).addClass("pivot-rule-action"));
                $table.append($tr);
            });
            $container.append($table);
        }
    };

    // --- Module: Core ---
    var Core = {
        init: function () {
            if (!window.redminePivotConfig || !window.redminePivotConfig.data) return;

            Config.init();
            DataDetails.init();
            UI.init();

            this.render();
        },

        render: function () {
            var hiddenAttributes = [];
            var hiddenFromAggregators = [];

            // 1. Calculate hiddenAttributes from checkboxes
            $("#field-checkboxes input[type='checkbox']").each(function () {
                if (!$(this).is(':checked')) {
                    var key = $(this).val();
                    hiddenAttributes.push(key);
                    // Also hide derived date attributes
                    var dateFields = window.redminePivotConfig.dateFields;
                    var sfx = appState.dateSuffixes;
                    if (dateFields && dateFields.indexOf(key) > -1) {
                        hiddenAttributes.push(key + sfx.year);
                        hiddenAttributes.push(key + sfx.month);
                        hiddenAttributes.push(key + sfx.day);
                        hiddenAttributes.push(key + sfx.yearMonth);
                    }
                }
            });

            // 2. Calculate hiddenFromAggregators
            var numericFields = window.redminePivotConfig.numericFields;
            if (numericFields) {
                var allKeys = UI.getAllKeys();
                allKeys.forEach(function (key) {
                    if (numericFields.indexOf(key) === -1) {
                        hiddenFromAggregators.push(key);
                    }
                });
                for (var derivedKey in appConfig.derivedAttributes) {
                    hiddenFromAggregators.push(derivedKey);
                }
            }

            appConfig.hiddenAttributes = hiddenAttributes;
            appConfig.hiddenFromAggregators = hiddenFromAggregators;

            $("#pivot-table-output").pivotUI(window.redminePivotConfig.data, appConfig, true);
        }
    };

    return {
        init: function () { Core.init(); }
    };

})(jQuery);

$(document).ready(function () {
    // Load configuration from data attributes (XSS-safe)
    var $configEl = $('#pivot-config-data');
    if ($configEl.length) {
        window.redminePivotConfig = {
            data: JSON.parse($configEl.attr('data-issues')),
            options: JSON.parse($configEl.attr('data-options')),
            localeStrings: JSON.parse($configEl.attr('data-locale-strings')),
            dateFields: JSON.parse($configEl.attr('data-date-fields')),
            numericFields: JSON.parse($configEl.attr('data-numeric-fields')),
            booleanFields: JSON.parse($configEl.attr('data-boolean-fields')),
            savedConfig: JSON.parse($configEl.attr('data-saved-config'))
        };
    }
    RedminePivot.init();
});
