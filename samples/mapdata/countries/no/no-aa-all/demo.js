$(function () {

    // Prepare demo data
    var data = [
        {
            "hc-key": "no-aa-928",
            "value": 0
        },
        {
            "hc-key": "no-aa-914",
            "value": 1
        },
        {
            "hc-key": "no-aa-911",
            "value": 2
        },
        {
            "hc-key": "no-aa-912",
            "value": 3
        },
        {
            "hc-key": "no-aa-940",
            "value": 4
        },
        {
            "hc-key": "no-aa-901",
            "value": 5
        },
        {
            "hc-key": "no-aa-906",
            "value": 6
        },
        {
            "hc-key": "no-aa-929",
            "value": 7
        },
        {
            "hc-key": "no-aa-904",
            "value": 8
        },
        {
            "hc-key": "no-aa-919",
            "value": 9
        },
        {
            "hc-key": "no-aa-941",
            "value": 10
        },
        {
            "hc-key": "no-aa-926",
            "value": 11
        },
        {
            "hc-key": "no-va-938",
            "value": 12
        },
        {
            "hc-key": "no-aa-937",
            "value": 13
        },
        {
            "hc-key": "no-aa-935",
            "value": 14
        }
    ];

    // Initiate the chart
    $('#container').highcharts('Map', {

        title : {
            text : 'Highmaps basic demo'
        },

        subtitle : {
            text : 'Source map: <a href="https://code.highcharts.com/mapdata/countries/no/no-aa-all.js">Aust-Agder</a>'
        },

        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            }
        },

        colorAxis: {
            min: 0
        },

        series : [{
            data : data,
            mapData: Highcharts.maps['countries/no/no-aa-all'],
            joinBy: 'hc-key',
            name: 'Random data',
            states: {
                hover: {
                    color: '#BADA55'
                }
            },
            dataLabels: {
                enabled: true,
                format: '{point.name}'
            }
        }]
    });
});
