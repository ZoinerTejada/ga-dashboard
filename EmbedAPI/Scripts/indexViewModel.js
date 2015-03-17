
//Load the Embed API
(function (w, d, s, g, js, fs) {
    g = w.gapi || (w.gapi = {}); g.analytics = { q: [], ready: function (f) { this.q.push(f); } };
    js = d.createElement(s); fs = d.getElementsByTagName(s)[0];
    js.src = 'https://apis.google.com/js/platform.js';
    fs.parentNode.insertBefore(js, fs); js.onload = function () { g.load('analytics'); };
}(window, document, 'script'));


var indexViewModel = {} || indexViewModel;

indexViewModel = function (gapi) {
    var embedObjectsCounter = 1;

    var exports = {};

    exports.isRealtimeChart = function(chartType)
    {
        return chartType === 'REALTIME-ACTIVEUSERS' || chartType === 'REALTIME-TOTALEVENTS';
    }

    exports.addChart = function (chartType) {

        var chartName = "chart-" + embedObjectsCounter;
        var selectorName = "selector-" + chartName;
        var chartContainerName = "container-" + chartName;
        $("#chart-container").append(
            "<div class='col-md-6' id='" + chartContainerName + "'>"
            + "<h2>" + chartName + "</h2>"
            + "<div id='" + selectorName + "'></div>"
            + "<div id='" + chartName + "'></div>"
            + "</div>");

        var viewSelector = new gapi.analytics.ViewSelector({
            container: selectorName
        });

        viewSelector.execute();

        var dataChart = {};

        if (exports.isRealtimeChart(chartType))
        {
            //NOTE: This won't work
            /*dataChart = new gapi.analytics.googleCharts.DataChart({
                query: {
                    metrics: 'rt:activeUsers'
                },
                chart: {
                    container: chartName,
                    type: 'TABLE',
                    options: {
                        width: '100%'
                    }
                }
            });*/
        }
        else if (chartType === 'GEO')
        {
            dataChart = new gapi.analytics.googleCharts.DataChart({
                query: {
                    metrics: 'ga:sessions',
                    dimensions: 'ga:country',
                    'start-date': '30daysAgo',
                    'end-date': 'yesterday'
                },
                chart: {
                    container: chartName,
                    type: chartType,
                    options: {
                        width: '100%'
                    }
                }
            });
        }
        else
        {
            dataChart = new gapi.analytics.googleCharts.DataChart({
                query: {
                    metrics: 'ga:sessions',
                    dimensions: 'ga:date',
                    'start-date': '30daysAgo',
                    'end-date': 'yesterday'
                },
                chart: {
                    container: chartName,
                    type: chartType,
                    options: {
                        width: '100%'
                    }
                }
            });
        }
        
        embedObjectsCounter++;

        viewSelector.on('change', function (ids) {

            if (chartType === 'REALTIME-ACTIVEUSERS')
            {
                var query = gapi.client.analytics.data.realtime.get({ "ids": ids, "metrics": "rt:activeUsers" });
                query.execute(function handleRTResponse(resultAsObject, resultAsJson) {
                    $("#" + chartName).html(
                        "<h1>" + resultAsObject.totalsForAllResults["rt:activeUsers"] + "</h1> real-time active users <br/>" 
                        );
                });
                
            }
            else if (chartType === 'REALTIME-TOTALEVENTS') {
                var query = gapi.client.analytics.data.realtime.get({ "ids": ids, "metrics": "rt:totalEvents", "dimensions":"rt:eventCategory" });
                query.execute(function handleRTResponse(resultAsObject, resultAsJson) {


                    $("#" + chartName).html(
                        "<h1>" + resultAsObject.totalsForAllResults["rt:totalEvents"] + "</h1> real-time events (all categories) <br/>"
                    );

                });

            }
            else if (chartType === "ANALYSIS") {
                var report = new gapi.analytics.report.Data({
                    query: {
                        ids: ids,
                        metrics: 'ga:sessions',
                        dimensions: 'ga:date',
                        'start-date': '7daysAgo',
                        'end-date': 'yesterday'
                    }
                });

                report.on('success', function handleCoreAPIResponse(resultsAsObject) {

                    var total = 0;
                    var average = 0;

                    if (resultsAsObject.rows.length > 0) {

                        resultsAsObject.rows.forEach(function calculateTotal(row) {
                            total += parseInt(row[1]);
                        });

                        average = (total / resultsAsObject.rows.length).toFixed(2);
                    }

                    $("#" + chartName).html(
                        "<h1>" + average + "</h1> average # of sessions (past 7 days) <br/>"
                    );
                })

                report.execute();

            }
            else if (chartType === "DONUT") {

                var report = new gapi.analytics.report.Data({
                    query: {
                        ids: ids,
                        metrics: 'ga:sessions',
                        dimensions: 'ga:browser',
                        'start-date': '7daysAgo',
                        'end-date': 'yesterday'
                    }
                });

                report.on('success', function handleCoreAPIResponse(resultsAsObject) {

                    if (resultsAsObject.rows.length > 0) {

                        var data = new google.visualization.DataTable();
                        data.addColumn('string', 'Browser');
                        data.addColumn('number', 'Sessions');
                        
                        resultsAsObject.rows.forEach(function pushNumericColumn(row) {

                            data.addRow([row[0], parseInt(row[1])]);

                        });

                        var options = {
                            title: 'Custom Chart',
                            pieHole: 0.2,
                        };

                        var chart = new google.visualization.PieChart(document.getElementById(chartName));
                        chart.draw(data, options);
                    }
                });

                report.execute();

                
            }
            else
            {
                dataChart.set({ query: { ids: ids } }).execute();
            }
            
        });

    }
    

    gapi.analytics.ready(function () {
        gapi.analytics.auth.authorize({
            container: 'auth-container',

            //TODO: Replace this with your Client ID from the 
            clientid: ''
        });

        gapi.analytics.auth.on('success', function displayControls() {
            $("#vis-type-selector").show();

            
        });

        $("#addChart").on('click', function () {
            exports.addChart($("#vis-type-select").val());
        });

    });

    google.load("visualization", "1", { packages: ["corechart"] });

    exports.gapi = gapi;

    return exports;
}(gapi);
