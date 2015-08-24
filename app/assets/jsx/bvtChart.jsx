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

    componentDidMount: function() {
      var node = React.findDOMNode(this.refs.chart);
      var chart = c3.generate({
        bindto: node,
        size: {
         width: 360,
          height: 200,
        },
        data: {
          json: this.props.result.values,
          groups: [['passed', 'failed', 'notExecuted']],
          keys: {
            x: 'build',
            value: ['passed', 'failed', 'notExecuted'],
            //value: ['failed', 'notExecuted']
          },

          type: 'bar',
        },
        axis: {
          x: {
            type: 'category',
          },
          y: {
            show: false,
            /*
            tick: {
              count: 3,
              format: d3.format("f")
            }
            */
          }
        },
        legend: {
          show: false,
        },
        color: {
          //pattern: [/*'#458B00',*/ '#c0392b', '#CCCCCC'],
          pattern: ['#458B00', '#c0392b', '#CCCCCC'],
        }
      });
      this.setState({chart: chart});
    },

    componentWillReceiveProps: function(nextProps) {
      if(this.state.chart) {
        this.state.chart.load({
          json: nextProps.result.values,
          groups: [['passed', 'failed', 'notExecuted']],
          keys: {
            x: 'build',
            value: ['passed', 'failed', 'notExecuted'],
            //value: ['failed', 'notExecuted']
          },
        });
      }
    },

    render: function() {
      return (<div ref="chart"></div>);
    },

  });

  return BvtChart;
});
