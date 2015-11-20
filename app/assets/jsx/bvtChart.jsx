/** @jsx React.DOM */

define(['react', 'jquery', 'chartist-react', 'chartist'], function(React, $, ChartistReact, Chartist) {
  var BvtChart = React.createClass({

    propTypes: {
      result: React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
      }).isRequired,
      latestBuild: React.PropTypes.string.isRequired,
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      if(this.props.result.length != nextProps.result.length
        || this.props.latestBuild != nextProps.latestBuild) {
        return true;
      }
      var i;
      var same = true;
      for(i = 0; same && i < this.props.result.length; i++) {
        same = same && this.props.result[i].name === nextProps.result[i].name;
        same = same && this.props.result[i].build === nextProps.result[i].build;
        same = same && this.props.result[i].failed === nextProps.result[i].failed;
      }
      return !same;
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

      var latestBuild = this.props.latestBuild;
      var listener = {
        draw: function(data) {
          if(data.type === 'bar') {
            // draw the 'y'-value on top of the bar
            data.group.append(new Chartist.Svg('text', {
              x: data.x2 - 5,
              y: data.y2 - 5,
            }, 'ct-label').text(data.value.y));
            if(data.axisX.ticks[data.index] === latestBuild) {
              data.element.addClass('latest-build');
            }
          }
        },
      }

      return <ChartistReact data={data} options={options} listener={listener} type={'Bar'} />;
    },

  });

  return BvtChart;
});
