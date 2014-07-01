/**
 * @license @product.name@ JS v@product.version@ (@product.date@)
 * Plugin for displaying a message when there is no data visible in chart.
 *
 * (c) 2010-2014 Highsoft AS
 * Authors: Jon Arild Nygard / Oystein Moseng
 *
 * License: www.highcharts.com/license
 */

(function (H) { // docs
    var seriesTypes = H.seriesTypes,
        merge = H.merge,
        extendClass = H.extendClass,
        defaultOptions = H.getOptions(),
        plotOptions = defaultOptions.plotOptions,
        scatterOptions = plotOptions.scatter,
        noop = function () {},
        each = H.each;

    function Area(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.centerX = this.x + (this.width/2);
        this.centerY = this.y + (this.height/2);
        this.totalArea = this.width * this.height;
        this.direction = 0;
        this.totalValue = 0;
        this._plotW = this.width;
        this._plotH = this.height;
        this._plotX = this.x;
        this._plotY = this.y;
        // Calculates plotting width for a child point
        this.plotW = function (total, d) {
            if (this.direction == 0) {
                val = total/this._plotH;
                this._plotW -= val;
            } else {
                val = this._plotW;
            }
            return val;
        }
        // Calculates plotting height for a child point
        this.plotH = function (total, d) {
            if (this.direction == 1) {
                val = total/this._plotW;
                this._plotH -= val;
            } else {
                val = this._plotH;
            }
            return val;
        }
        // Calculates x value for a child point
        this.plotX = function (w, d) {
            val = this._plotX;
            if (this.direction == 0) {
                this._plotX += w;
            }
            return val;
        }
        // Calculates y value for a child point
        this.plotY = function (h, d) {
            val = this._plotY;
            if (this.direction == 1) {
                this._plotY += h;
            }
            return val;
        }
    }

    function getSeriesArea(series, totalValue) {
        var numSeries = series.chart.series.length,
            w = series.chart.plotWidth/numSeries,
            x = w * series._i,
            y = 0,
            h = series.chart.plotHeight,
            seriesArea = new Area(x, y, w, h)
        seriesArea.totalValue = totalValue;
        return seriesArea;
    }
    function getNodeTree(id, index, list, points) {
        //index = list
        var children = [],
            totalValue = 0;
        if (list[id] !== undefined) {
            children = [];
            each(list[id], function (index) {
                node = getNodeTree(points[index].id, index, list, points);
                totalValue += node.totalValue;
                children.push(node);
            });
        } else {
            totalValue = points[index].value;
        }
        nodeTree = {
            id: id,
            index: index,
            children: children,
            totalValue: totalValue
        }
        return nodeTree;
    }

    // Define default options
    plotOptions.treemap = merge(plotOptions.scatter, {
        marker: {
            lineColor: "#000",
            lineWidth: 0.5,
            radius: 0
        },
        dataLabels:{
            verticalAlign: 'middle',
            formatter: function () { // #2945
                return this.point.value;
            },
        },
        tooltip: {
            pointFormat: 'id: <b>{point.id}</b><br/>parent: <b>{point.parent}</b><br/>value: <b>{point.value}</b><br/>'
        },
        layoutAlgorithm: 'sliceAndDice'
    });
    
    // Stolen from heatmap    
    var colorSeriesMixin = {
        // mapping between SVG attributes and the corresponding options
        pointAttrToOptions: { 
            stroke: 'borderColor',
            'stroke-width': 'borderWidth',
            fill: 'color',
            dashstyle: 'dashStyle'
        },
        pointArrayMap: ['value'],
        axisTypes: ['xAxis', 'yAxis', 'colorAxis'],
        optionalAxis: 'colorAxis',
        getSymbol: noop,
        parallelArrays: ['x', 'y', 'value'],
        colorKey: 'colorValue', // Point color option key
        translateColors: seriesTypes.heatmap.prototype.translateColors
    }

    // The Treemap series type
    seriesTypes.treemap = extendClass(seriesTypes.scatter, merge(colorSeriesMixin, {
        type: 'treemap',
        isCartesian: false,    
        trackerGroups: ['group', 'dataLabelsGroup'],
        handleLayout: function () {
            var series = this,
                points = series.points,
                tree = series.buildTree(points),
                seriesArea = getSeriesArea(series, tree.totalValue)
            series.calculateArea(seriesArea, tree);
        },
        buildTree: function () {
            var points = this.points,
                parentList = [],
                index = 0
            each(points, function (point) {
                if (point.parent === undefined) {
                    parent = 'root';
                } else {
                    parent = point.parent;
                }
                if (parentList[parent] === undefined) {
                    parentList[parent] = [];
                }
                parentList[parent].push(index);
                index++;
            });
            root = getNodeTree('root', -1, parentList, points);
            return root;
        },
        calculateArea: function (parentArea, node) {
            var series = this,
                pointArea = series[series.options.layoutAlgorithm](parentArea, node.totalValue)
            // If node is not a leaf, then call this method recursively             
            if (node.children.length) {
                each(node.children, function (childNode) {
                    series.calculateArea(pointArea, childNode);
                });
            } else {
                point = series.points[node.index];
                // Set point values
                point.shapeType = 'rect';
                point.shapeArgs = {
                    x: pointArea.x,
                    y: pointArea.y,
                    width: pointArea.width,
                    height: pointArea.height
                };
                point.plotX = pointArea.centerX;
                point.plotY = pointArea.centerY;
            }
            
        },
        sliceAndDice: function (parent, value) {
            var pointTotal = parent.totalArea * (value / parent.totalValue),
                pointW = parent.plotW(pointTotal),
                pointH = parent.plotH(pointTotal),
                pointX = parent.plotX(pointW),
                pointY = parent.plotY(pointH),
                pointArea = new Area(pointX, pointY, pointW, pointH)
            pointArea.totalValue = value,
            parent.direction = 1 - parent.direction;
            return pointArea;
        },
        stripes: function (parent, value) {
            // Call sliceAndDice
            var pointArea = this['sliceAndDice'](parent, value)
            // Reset direction
            parent.direction = 0;
            return pointArea;
        },
        translate: function () {
            var series = this;

            H.Series.prototype.translate.call(series);
            series.handleLayout();

            series.translateColors();

            // Make sure colors are updated on colorAxis update (#2893)
            if (series.chart.hasRendered) {
                each(series.points, function (point) {
                    point.shapeArgs.fill = point.color;
                });
            }
        },        
        drawPoints: seriesTypes.column.prototype.drawPoints,
        drawLegendSymbol: H.LegendSymbolMixin.drawRectangle,
    }));
}(Highcharts));