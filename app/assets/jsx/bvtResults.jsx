/** @jsx React.DOM */

define(['react', 'jquery', 'bvtChart'], function(React, $, BvtChart) {

  var BvtGroup = React.createClass({
    render: function() {
      var latestBuild = this.props.latestBuild;
      var configs = this.props.group.configs.map(function(config) {
        return (<BvtConfig config={config} latestBuild={latestBuild} key={config.name} />);
      });
      return (
        <div className="bvt-group">
          <div className="bvt-group-header">{this.props.group.name}</div>
          <div className="bvt-group-results-container">
            {configs}
          </div>
        </div>);
    }
  });

  var BvtConfig = React.createClass({
    render: function() {
      var latestBuild = this.props.latestBuild;
      var config = this.props.config;
      var imgSrc = '/icon/' + encodeURIComponent(config.name);

      if(config.runs.length > 0) {
        var latest = config.runs[config.runs.length-1];

        if(latest.failed === 0 && latest.notExecuted === 0) {
          var classes = "bvtResult stable " + (latest.build === latestBuild ? ' latest-build' : 'old-build');
          var link = 'http://lnz-sc/silk/DEF/TM/Execution?nEx=' + latest.nodeId;
          return (
            <a className={classes} key={config.name + latest.build} href={link} target="_blank">
              <div className="image-container grow">
                <img src={imgSrc} title={config.name} className="bvt-icon-large" />

              </div>
              <div className="bvt-config-label">{config.name}</div>
            </a>
          );
        }

        else if(latest.failed === -1 || latest.notExecuted > 0) {
          var classes = "bvtResult failed " + (latest.build === latestBuild ? ' latest-build' : 'old-build');
          var link = 'http://lnz-sc/silk/DEF/TM/Execution?nEx=' + latest.nodeId;
          return (
            <a className={classes} key={config.name + latest.build} href={link} target="_blank">
              <div className="image-container grow">
                <img src={imgSrc} title={config.name} className="bvt-icon-large" />

              </div>
              <div className="bvt-config-label">{config.name}</div>
            </a>
          );
        }

        var link = 'http://lnz-sc/silk/DEF/TM/Execution?nEx=' + latest.nodeId;
        return (
          <a className="bvtResult unstable" key={config.name + latest.build} href={link} target="_blank">
            <div className="image-container no-grow">
              <img src={imgSrc} title={config.name} className="bvt-icon-medium" />
            </div>
            <BvtChart key={config.name} result={config} latestBuild={latestBuild}></BvtChart>
            <div className="bvt-latest-failed-count">{latest.failed}</div>
            <div className="bvt-config-label">{config.name}</div>
          </a>
        );
      }
    }
  });

  var BvtResults = React.createClass({
    /*
    propTypes: {
      bvtResults: React.PropTypes.arrayOf(
        React.PropTypes.shape({
          name: React.PropTypes.string.isRequired,
          values: React.PropTypes.arrayOf(
            React.PropTypes.shape({
              build: React.PropTypes.string.isRequired,
              name: React.PropTypes.string.isRequired,
              passed: React.PropTypes.number.isRequired,
              failed: React.PropTypes.number.isRequired,
              notExecuted: React.PropTypes.number.isRequired,
              nodeId: React.PropTypes.string.isRequired,
            })
          )

        }).isRequired
      ).isRequired,
      latestBuild: React.PropTypes.string.isRequired,
    },
    */

    render: function() {
      var latestBuild = this.props.latestBuild;
      var bvtNodes = this.props.bvtResults.map(function(group) {
        return (<BvtGroup group={group} latestBuild={latestBuild} key={group.name} />);
      });

      return (
        <section className="bvtResults">
          <ul className="bvtResults-container">
            {bvtNodes}
          </ul>
        </section>
      );

      /*


      return (
        <section className="bvtResults">
          <ul className="bvtResults-container">
            {bvtNodes}
          </ul>
        </section>
      );
      */
    }
  });

  return BvtResults;
});
