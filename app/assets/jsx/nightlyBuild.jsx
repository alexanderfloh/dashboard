define(['react', 'avatar' ], function(React, Avatar) {
  var NightlyBuild = React.createClass({

    propTypes: {
      build: React.PropTypes.shape({
        culprits: React.PropTypes.arrayOf(
          React.PropTypes.string.isRequired
        ).isRequired,

        setup: React.PropTypes.shape({
          link: React.PropTypes.string,
        }).isRequired,

        buildNumber: React.PropTypes.any.isRequired,

      }).isRequired,
    },

    getStatusClassSet: function(build, additional){
      var cx = React.addons.classSet;
      return cx({
        'nightly-setup': additional === 'nightly-setup',
        'status-nightly': additional === 'status-nightly',
        'stable': build.status === 'stable',
        'cancelled': build.status === 'cancelled',
        'unstable': build.status === 'unstable',
        'failed': build.status === 'failed',
        'pending': build.status === 'pending'
      });
    },

    regressionStatus: function(regression, name){
      var classesStatus = this.getStatusClassSet(regression, 'nightly-setup');
      return (
          <li className={classesStatus}>
            <a href={regression.link} target="_blank">
              {name}
            </a>
          </li>
        );
    },

    render: function(){
      var committerNodes = this.props.build.culprits.map(function(culprit) {
        return <Avatar name={culprit} key={culprit} />
      });

      var classesStatus = this.getStatusClassSet(this.props.build, 'status-nightly');

      var arrowClass = 'arrow-right ' + this.props.build.status;
      var c = 'build-item ' + this.props.build.status;
      return (
        <div className="build-list-item">
          <div className={c}>
            <div className="avatars nightly">
              {committerNodes}
            </div>
            <div className="build-description">{this.props.build.description}</div>
            <div className={classesStatus}>
              <a className="build-number" href={this.props.build.link} target="_blank">
                {this.props.build.buildNumber}
              </a>
            </div>
            <div>
            <div>
              <ul className="downstream-jobs-nightly">
                {this.regressionStatus(this.props.build.setup, "Setup")}
              </ul>
            </div>
            </div>
          </div>
          <div className={arrowClass} />
        </div>
      );
    },

  });
  return NightlyBuild;
});
