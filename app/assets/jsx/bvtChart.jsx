/** @jsx React.DOM */

define(['react', 'jquery', 'c3'], function(React, $, c3) {
  var BvtChart = React.createClass({
    propTypes: {
      result: React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
      }).isRequired,
    },

    getInitialState: function() {
      return {};
    },

    transformDataToLog: function(data) {
      function map(value) {
        if(value !==0) {
          return (Math.log10(value) + 0.25);
        }
        else {
          return 0;
        }
      }
      return data.map(function(result) {
        return {
          build: result.build,
          name: result.name,
          passed: map(result.passed),
          failed: map(result.failed),
          notExecuted: map(result.notExecuted),
        }
      });
    },

    componentDidMount: function() {
      var logData = this.transformDataToLog(this.props.result.values);
      var node = React.findDOMNode(this.refs.chart);
      var chart = c3.generate({
        bindto: node,
        size: {
         width: 360,
          height: 200,
        },
        data: {
          json: this.props.result.values,
          groups: [['failed']],
          keys: {
            x: 'build',
            value: ['failed'],
          },
          type: 'bar',
          labels: true,
        },
        axis: {
          x: {
            type: 'category',
          },
          y: {
            show: false,
          }
        },
        legend: {
          show: false,
        },
        color: {
          //pattern: ['#458B00', '#c0392b', '#CCCCCC'],
          pattern: ['#F9BF3B'],
        },
        tooltip: {
          format: {
            // value: function (value, ratio, id, index) {
            //   if(value === 0) {
            //     return 0;
            //   }
            //   else {
            //     return d3.format('f')(Math.pow(10, ((value) - 0.25)));
            //   }
            // }
          }
        }
      });
      this.setState({chart: chart});
    },

    componentWillReceiveProps: function(nextProps) {
      if(this.state.chart) {
        var logData = this.transformDataToLog(this.props.result.values);

        this.state.chart.load({
          json: this.props.result.values,
          groups: [['failed']],
          keys: {
            x: 'build',
            value: ['failed'],
            //value: ['failed', 'notExecuted']
          },
          //unload: true,
        });
      }
    },

    render: function() {
      return (<div ref="chart"></div>);
    },

    componentWillUnmount: function() {
      if(this.state.chart) {
        this.state.chart.destroy();
        this.setState({});
      }
    }

  });

  return BvtChart;
});
