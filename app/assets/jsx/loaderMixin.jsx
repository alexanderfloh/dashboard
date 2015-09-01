/** @jsx React.DOM */

define(['react', 'jquery'], function(React, $) {
  var LoadStatusMixin = {
    getInitialState: function() {
      return {
        buildCI: [],
        buildNightly: {
          culprits: [],
          setup: { },
        },
        users:[],
        project:[],
        audits:[],
        lastBuild:[],
        nevergreens:[],
        bvtResults:[],
        employeesAustria:""
      };
    },

    // load data from jenkins, austria and phabricator
    loadStatus: function() {
      $.ajax({
        url: '/buildMain',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });

      $.ajax({
          url: '/buildAside',
          dataType: 'json',
          success: function(data1) {
            this.setState(data1);
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });

      $.ajax({
        url: '/getAudits',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });

      $.ajax({
        url: '/getUsers',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });

      $.ajax({
        url: '/getBvtResult',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });
    },

    componentWillMount: function() {
      this.loadStatus();
      setInterval(this.loadStatus, this.props.pollInterval);
    },
  };

  return LoadStatusMixin;
});
