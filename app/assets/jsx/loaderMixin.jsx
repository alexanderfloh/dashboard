/** @jsx React.DOM */

define(['react', 'jquery'], function(React, $) {
  var LoadStatusMixin = {
    getInitialState: function() {
      return {
        buildCI: null,
        audits: null,
        bvtResults: null
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
          var newState = this.state;
          newState.buildCI = null;
          this.setState(newState);
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
            var newState = this.state;
            newState.buildNightly = null;
            this.setState(newState);
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

    componentDidMount: function() {
      this.loadStatus();
      setInterval(this.loadStatus, this.props.pollInterval);
    },
  };

  return LoadStatusMixin;
});
