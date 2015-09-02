/** @jsx React.DOM */

define(['react', 'avatar', 'buildProgress'], function(React, Avatar, BuildProgress) {
  var DownstreamJob = React.createClass({
    getStatusClassSet: function(build, name){
      var cx = React.addons.classSet;
      return cx({
        'status': name === 'status',
        'regression': name === 'regression',
        'stable': build.status === 'stable',
        'cancelled': build.status === 'cancelled',
        'unstable': build.status === 'unstable',
        'failed': build.status === 'failed',
        'pending': build.status === 'pending'
      });
    },

    render: function() {
      var classesStatus = this.getStatusClassSet(this.props.result, "regression");
      var name = '/icon/' + this.props.result.name;
      return (
        <li className={classesStatus} key={this.props.result.link}>
          <a href={this.props.result.link}>
            <img src={name} className="regression-icon" title={this.props.result.name}/>
          </a>
        </li>);
    },

  });

  return React.createClass({
    propTypes: {
      build: React.PropTypes.shape({
        culprits: React.PropTypes.arrayOf(
          React.PropTypes.shape({
            fullName: React.PropTypes.string.isRequired,
          }).isRequired
        ).isRequired,

        regressions: React.PropTypes.arrayOf(
          React.PropTypes.shape({
            link: React.PropTypes.string.isRequired,
            name: React.PropTypes.string.isRequired,
          }).isRequired
        ).isRequired,

        number: React.PropTypes.any.isRequired,

      }).isRequired,

      lastBuild: React.PropTypes.shape({
        building: React.PropTypes.bool.isRequired,
        buildNumber: React.PropTypes.number.isRequired,
        timestamp: React.PropTypes.number.isRequired,
        estimatedDuration: React.PropTypes.number.isRequired,
      }).isRequired,
    },

    getStatusClassSet: function(build, name){
      var cx = React.addons.classSet;
      return cx({
        'status': name === 'status',
        'regression': name === 'regression',
        'stable': build.status === 'stable',
        'cancelled': build.status === 'cancelled',
        'unstable': build.status === 'unstable',
        'failed': build.status === 'failed',
        'pending': build.status === 'pending'
      });
    },

    buildStatus: function(build){
      var classesStatus = this.getStatusClassSet(build, "status");
      var currentBuild = this.props.lastBuild;

      if (currentBuild.building && currentBuild.buildNumber === build.number){
        return (
            <div className="status pending-ci">
            <a href={build.link} className="build-number">
              <BuildProgress lastBuild={currentBuild} />
            </a>
          </div>
        )
      }
      return (
          <div className={classesStatus}>
            <a href={build.link} className="build-number">
              {build.number}
            </a>
          </div>)
    },

    render: function(){
      var committerNodes = this.props.build.culprits.slice(0, 3).map(function(culprit) {
        return <Avatar name={culprit.fullName} />
      });
      var that = this;

      var resultNodes = this.props.build.regressions.map(function(result) {
        return <DownstreamJob result={result} />;
      });

      var classesRegressionResult = this.getStatusClassSet(this.props.build.regressions[0], "regression");

      var andOthers = "";
      if (this.props.build.culprits.length > 3){
        andOthers = "+ " + (this.props.build.culprits.length - 3) + " other" + (this.props.build.culprits.length > 1 ? "s" : "");
      }
      return (
          <li className="build-list-item" key={this.props.build.number}>
            <div className="ci-build-item">
              <div className="avatars">
                {committerNodes}
                <div>{andOthers}</div>
              </div>
              {this.buildStatus(this.props.build)}
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
});
