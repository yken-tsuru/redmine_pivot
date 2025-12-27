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

        // Japanese aggregators
        var aggregators = {
            "件数": tpl.count(fmtInt),
            "ユニークな値の数": tpl.countUnique(fmtInt),
            "リスト (ユニーク)": tpl.listUnique(", "),
            "合計": tpl.sum(fmt),
            "整数合計": tpl.sum(fmtInt),
            "平均": tpl.average(fmt),
            "中央値": tpl.median(fmt),
            "分散": tpl.var(1, fmt),
            "標本分散": tpl.var(0, fmt),
            "標準偏差": tpl.stdev(1, fmt, function (x) { return Math.pow(x, 0.5) }),
            "標本標準偏差": tpl.stdev(0, fmt, function (x) { return Math.pow(x, 0.5) }),
            "最小": tpl.min(fmt),
            "最大": tpl.max(fmt),
            "1番目の値": tpl.first(fmt),
            "最後の値": tpl.last(fmt),
            "合計に対する割合": tpl.fractionOf(tpl.sum(), "total", fmtPct),
            "行の合計に対する割合": tpl.fractionOf(tpl.sum(), "row", fmtPct),
            "列の合計に対する割合": tpl.fractionOf(tpl.sum(), "col", fmtPct),
            "件数に対する割合": tpl.fractionOf(tpl.count(), "total", fmtPct),
            "行の件数に対する割合": tpl.fractionOf(tpl.count(), "row", fmtPct),
            "列の件数に対する割合": tpl.fractionOf(tpl.count(), "col", fmtPct)
        };

        // Combine all available renderers
        var renderersObj = $.extend(
            {},
            $.pivotUtilities.renderers,
            $.pivotUtilities.c3_renderers || {},
            $.pivotUtilities.d3_renderers || {},
            $.pivotUtilities.gchart_renderers || {},
            $.pivotUtilities.export_renderers || {}
        );

        // Map to Japanese names
        var jaRenderers = {};
        // Standard
        if (renderersObj["Table"]) jaRenderers["表"] = renderersObj["Table"];
        if (renderersObj["Table Barchart"]) jaRenderers["表 (棒グラフ)"] = renderersObj["Table Barchart"];
        if (renderersObj["Heatmap"]) jaRenderers["ヒートマップ"] = renderersObj["Heatmap"];
        if (renderersObj["Row Heatmap"]) jaRenderers["ヒートマップ (行)"] = renderersObj["Row Heatmap"];
        if (renderersObj["Col Heatmap"]) jaRenderers["ヒートマップ (列)"] = renderersObj["Col Heatmap"];

        // Charts (Common names)
        if (renderersObj["Line Chart"]) jaRenderers["折れ線グラフ"] = renderersObj["Line Chart"];
        if (renderersObj["Bar Chart"]) jaRenderers["棒グラフ"] = renderersObj["Bar Chart"];
        if (renderersObj["Stacked Bar Chart"]) jaRenderers["積み上げ棒グラフ"] = renderersObj["Stacked Bar Chart"];
        if (renderersObj["Area Chart"]) jaRenderers["面グラフ"] = renderersObj["Area Chart"];
        if (renderersObj["Scatter Chart"]) jaRenderers["散布図"] = renderersObj["Scatter Chart"];
        if (renderersObj["Pie Chart"]) jaRenderers["円グラフ"] = renderersObj["Pie Chart"];
        if (renderersObj["Donut Chart"]) jaRenderers["ドーナツグラフ"] = renderersObj["Donut Chart"];
        if (renderersObj["TSV Export"]) jaRenderers["TSV出力"] = renderersObj["TSV Export"];

        // Prepare config
        var config = {
            rows: ["Tracker", "Status"],
            cols: ["Priority"],
            // vals: ["Estimated Hours"], 

            aggregators: aggregators,
            renderers: jaRenderers,

            // Defaults
            aggregatorName: "件数",
            rendererName: "表",

            localeStrings: {
                renderError: "描画中にエラーが発生しました。",
                computeError: "集計中にエラーが発生しました。",
                uiRenderError: "表示中にエラーが発生しました。",
                selectAll: "全選択",
                selectNone: "選択解除",
                tooMany: "(多すぎるため表示できません)",
                filterResults: "項目の絞り込み",
                apply: "適用",
                cancel: "キャンセル",
                totals: "合計",
                vs: "vs",
                by: "per"
            }
        };

        // Override defaults with server-side options if available
        if (window.redminePivotOptions) {
            if (window.redminePivotOptions.rows) config.rows = window.redminePivotOptions.rows;
            if (window.redminePivotOptions.cols) config.cols = window.redminePivotOptions.cols;
        }

        $("#pivot-table-output").pivotUI(window.redminePivotData, config);
    }
});
