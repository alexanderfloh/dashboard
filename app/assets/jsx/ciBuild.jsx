/** @jsx React.DOM */

define(['react', 'avatar', 'buildProgress'], function(React, Avatar, BuildProgress) {
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
            <li className="status pending-ci">
            <a href={build.link}>
              <BuildProgress lastBuild={currentBuild} />
            </a>
          </li>
        )
      }
      return (
          <li className={classesStatus}>
            <a href={build.link}>
              {build.number}
            </a>
          </li>)
    },

    render: function(){
      var committerNodes = this.props.build.culprits.slice(0, 3).map(function(culprit) {
        return <Avatar name={culprit.fullName} />
      });
      var that = this;

      var resultNodes = this.props.build.regressions.map(function(result) {
        var classesStatus = that.getStatusClassSet(result, "regression");
        return (
          <li className={classesStatus} key={result.link}>
            <a href={result.link}>
              {result.name}
            </a>
          </li>);
      });

      var classesRegressionResult = this.getStatusClassSet(this.props.build.regressions[0], "regression");

      var andOthers = "";
      if (this.props.build.culprits.length > 3){
        andOthers = "+ " + (this.props.build.culprits.length - 3) + " other" + (this.props.build.culprits.length > 1 ? "s" : "");
      }
      return (
          <li className="build-list-item" key={this.props.build.number}>
            <div className="build-item">
              <ul>
                <li className="avatars">
                  {committerNodes}
                  <div>{andOthers}</div>
                </li>
                {this.buildStatus(this.props.build)}
                <li>
                  <div>
                    <ul className="regression-list">
                      {resultNodes}
                    </ul>
                  </div>
                </li>
              </ul>
            </div>
          </li>
      );
    },
  });
});
