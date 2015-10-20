/** @jsx React.DOM */

define(['react', 'jquery', 'chartist-react', 'chartist'], function(React, $, ChartistReact, Chartist) {
  var BvtChart = React.createClass({
    propTypes: {
      result: React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
      }).isRequired,
    },

    render: function() {
      var data = {
        labels: this.props.result.values.map(function(r) {
          return r.build;
        }),
        series: [
          this.props.result.values.map(function(r) {
            return r.failed;
          })
        ]
      };
      var options = {
        axisX: {
          showGrid: false,
          showLabel: true,
        },

        axisY: {
          showGrid: false,
          showLabel: false,
          offset: 10,
        },

        chartPadding: {
          top: 15,
          right: 50,
          bottom: 0,
          left: 40,
        },
      };

      var listener = {
        draw: function(data) {
          if(data.type === 'bar') {
            // draw the 'y'-value on top of the bar
            data.group.append(new Chartist.Svg('text', {
              x: data.x2 - 5,
              y: data.y2 - 5,
            }, 'ct-label').text(data.value.y));
          }
        },
      }

      return <ChartistReact data={data} options={options} listener={listener} type={'Bar'} />;
    },

  });

  return BvtChart;
});
