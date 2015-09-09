/*
  Copied and adapted to remove ES6 stuff from https://github.com/fraserxu/react-chartist
  under the following license:

The MIT License (MIT)

Copyright (c) 2014 xvfeng

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

'use strict';

define(['react', 'chartist'], function(React, Chartist) {
  return React.createClass({
    propTypes: {
      type: React.PropTypes.string.isRequired,
      data: React.PropTypes.object.isRequired,
      options: React.PropTypes.object,
      responsiveOptions: React.PropTypes.array
    },

    displayName: 'ChartistGraph',

    componentWillReceiveProps: function(newProps) {
      this.updateChart(newProps);
    },

    componentWillUnmount: function() {
      if (this.chartist) {
        try {
          this.chartist.detach();
        } catch (err) {
          throw new Error('Internal chartist error', err);
        }
      }
    },

    componentDidMount: function() {
      this.updateChart(this.props);
    },

    updateChart: function(config) {
      let Chartist = require('chartist');

      let { type, data } = config;
      let options = config.options || {};
      let responsiveOptions = config.responsiveOptions || [];
      let event;

      if (this.chartist) {
        this.chartist.update(data, options, responsiveOptions);
      } else {
        this.chartist = new Chartist[type](React.findDOMNode(this), data, options, responsiveOptions);

        if (config.listener) {
          for (event in config.listener) {
            if (config.listener.hasOwnProperty(event)) {
              this.chartist.on(event, config.listener[event]);
            }
          }
        }

      }

      return this.chartist;
    },

    render: function() {
      return React.DOM.div({className: 'ct-chart'})
    },

  });

});
