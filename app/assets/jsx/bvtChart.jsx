/** @jsx React.DOM */

define(['react', 'jquery', 'c3', 'chartist-react', 'chartist'], function(React, $, c3, ChartistReact, Chartist) {
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
        },

        axisY: {
          showGrid: false,
          showLabel: false,
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
