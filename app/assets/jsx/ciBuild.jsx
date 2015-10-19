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
          <a href={this.props.result.link}>
            <img src={name} className="regression-icon" title={this.props.result.name}/>
          </a>
        </li>);
    },

  });

  var CiBuild = React.createClass({
    propTypes: {
      build: React.PropTypes.shape({
        culprits: React.PropTypes.arrayOf(
          React.PropTypes.shape({
            fullName: React.PropTypes.string.isRequired,
          }).isRequired
        ).isRequired,

        regressions: React.PropTypes.arrayOf(
          React.PropTypes.shape({
            link: React.PropTypes.string,
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
        'cancelled': build.status === 'cancelled' || build.status ==='n/a',
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
      var culpritCount = 3;
      var committerNodes = this.props.build.culprits.slice(0, culpritCount).map(function(culprit) {
        return <Avatar name={culprit.fullName} key={culprit.fullName} />
      });
      var that = this;

      var resultNodes = this.props.build.regressions.map(function(result) {
        return <DownstreamJob result={result} key={result.name} />;
      });

      var classesRegressionResult = this.getStatusClassSet(this.props.build.regressions[0], "regression");

      var andOthers = "";
      if (this.props.build.culprits.length > culpritCount){
        andOthers = ("+ "
          + (this.props.build.culprits.length - culpritCount)
          + " other"
          + (this.props.build.culprits.length - culpritCount > 1 ? "s" : ""));
      }
      var pending = this.props.lastBuild.building && this.props.lastBuild.buildNumber === this.props.build.number;
      var c = 'ci-build-item ' + (pending ? 'pending' : this.props.build.status);
      return (
          <li className="build-list-item">
            <div className={c}>
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
  return CiBuild;
});
