/** @jsx React.DOM */

define(['react', 'avatar', 'buildProgress'], function(React, Avatar, BuildProgress) {
  var DownstreamJob = React.createClass({
    getStatusClassSet: function(build, name){
      var cx = React.addons.classSet;
      return cx({
        'status': name === 'status',
        'regression': name === 'regression',
        'stable': build.status === 'stable',
        'cancelled': build.status === 'cancelled' || build.status ==='n/a',
        'unstable': build.status === 'unstable',
        'failed': build.status === 'failed',
        'pending': build.status === 'pending'
      });
    },

    render: function() {
      var classesStatus = this.getStatusClassSet(this.props.result, "regression");
      var name = '/icon/' + this.props.result.name;
      return (
        <li className={classesStatus}>
          <a href={this.props.result.link} target="_blank">
            <img src={name} className="regression-icon" title={this.props.result.name}/>
          </a>
        </li>);
    },

  });

  var CiBuild = React.createClass({
    propTypes: {
      build: React.PropTypes.shape({

        buildNumber: React.PropTypes.any.isRequired,
        timestamp: React.PropTypes.number.isRequired,
        estimatedDuration: React.PropTypes.number.isRequired,
        building: React.PropTypes.bool.isRequired,

        culprits: React.PropTypes.arrayOf(
          React.PropTypes.string.isRequired
        ).isRequired,

        regressions: React.PropTypes.arrayOf(
          React.PropTypes.shape({
            link: React.PropTypes.string,
            name: React.PropTypes.string.isRequired,
          }).isRequired
        ).isRequired,

      }).isRequired,
    },

    getStatusClassSet: function(build, name){
      var cx = React.addons.classSet;
      return cx({
        'status': name === 'status',
        'regression': name === 'regression',
        'stable': build.status === 'stable',
        'cancelled': build.status === 'cancelled' || build.status ==='n/a',
        'unstable': build.status === 'unstable',
        'failed': build.status === 'failed',
        'pending': build.status === 'pending'
      });
    },

    buildStatus: function(build){
      var classesStatus = this.getStatusClassSet(build, "status");

      if (build.building) {
        return (
            <div className="status pending-ci">
            <a href={build.link} className="build-number" target="_blank">
              <BuildProgress lastBuild={build} />
            </a>
          </div>
        );
      }
      else {
        return (
          <div className={classesStatus}>
            <a href={build.link} className="build-number" target="_blank">
              {build.buildNumber}
            </a>
          </div>
        );
      }
    },

    render: function(){
      var committerNodes = this.props.build.culprits.map(function(culprit) {
        return <Avatar name={culprit} key={culprit} />
      });
      var that = this;

      var resultNodes = this.props.build.regressions.map(function(result) {
        return <DownstreamJob result={result} key={result.name} />;
      });

      var classesRegressionResult = this.getStatusClassSet(this.props.build.regressions[0], "regression");

      var c = 'ci-build-item ' + this.props.build.status;
      var arrowClass = 'arrow-down ' + this.props.build.status;
      return (
          <li className="build-list-item">
            <div className={c}>
              <div className="avatars">
                {committerNodes}
              </div>
              {this.buildStatus(this.props.build)}
              <div className="arrow-container">
              <div className={arrowClass} />
              </div>
              <div>
                <ul className="regression-list">
                  {resultNodes}
                </ul>
              </div>
            </div>
          </li>
      );
    },
  });
  return CiBuild;
});
