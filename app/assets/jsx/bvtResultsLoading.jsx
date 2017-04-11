/** @jsx React.DOM */

define(['react', 'jquery', 'bvtChart'], function(React, $, BvtChart) {

  var BvtGroupLoading = React.createClass({
    render: function() {
      
      var configs = new Array(6).fill('').map(function(config, index) {
        return (<BvtConfigLoading key={index} />);
      });
      return (
        <div className="bvt-group">
          <div className="font-blokk bvt-group-header">Header</div>
          <div className="bvt-group-results-container">
            {configs}
          </div>
        </div>);
    }
  });

  var BvtConfigLoading = React.createClass({
    render: function() {
      var imgSrc = '/assets/images/icons/' + encodeURIComponent('windows.png');
      var classes = "bvtResult stable latest-build";
      return (
        <a className={classes} href='' target="_blank">
          <div className="image-container grow">
            <img src={imgSrc} className="bvt-icon-large" />

          </div>
          <div className="bvt-config-label">Name</div>
        </a>
      );
    }
  });

  var BvtResultsLoading = React.createClass({

    render: function() {
      var bvtNodes = new Array(2).fill('').map(function(group, index) {
        return (<BvtGroupLoading key={index} />);
      });

      return (
        <section className="bvtResults font-blokk">
          
          <div className="bvtResults-container">
            
            {bvtNodes}
            
            <div className="darkOverlay"><img src="/assets/images/rolling.svg" /></div>
          </div>
          
        </section>
      );
    }
  });

  return BvtResultsLoading;
});
