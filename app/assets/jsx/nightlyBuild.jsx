define(['react', 'avatar' ], function(React, Avatar) {
  var NightlyBuild = React.createClass({

    propTypes: {
      build: React.PropTypes.shape({
        culprits: React.PropTypes.arrayOf(
          React.PropTypes.shape({
            fullName: React.PropTypes.string.isRequired,
          }).isRequired
        ).isRequired,

        setup: React.PropTypes.shape({
          link: React.PropTypes.string,
        }).isRequired,

        number: React.PropTypes.any.isRequired,

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
            <a href={regression.link}>
              {name}
            </a>
          </li>
        );
    },

    render: function(){
      var culpritCount = 9;
      var committerNodes = this.props.build.culprits.slice(0, culpritCount).map(function(culprit) {
        return <Avatar name={culprit.fullName} key={culprit.fullName} />
      });

      var classesStatus = this.getStatusClassSet(this.props.build, 'status-nightly');
      var andOthers = "";
      if (this.props.build.culprits.length > culpritCount){
        andOthers = ("+ "
          + (this.props.build.culprits.length - culpritCount)
          + " other"
          + (this.props.build.culprits.length - culpritCount > 1 ? "s" : ""));
      }

      var arrowClass = 'arrow-right ' + this.props.build.status;
      var c = 'build-item ' + this.props.build.status;
      return (
        <div className="build-list-item">
          <ul className={c}>
            <li className="avatars nightly">
              {committerNodes}
              <div>{andOthers}</div>
            </li>
            <li className={classesStatus}>
              <a href={this.props.build.link}>
                {this.props.build.number}
              </a>
            </li>
            <li>
            <div>
              <ul className="downstream-jobs-nightly">
                {this.regressionStatus(this.props.build.setup, "Setup")}
              </ul>
            </div>
            </li>
          </ul>
          <div className={arrowClass} />
        </div>
      );
    },

  });
  return NightlyBuild;
});
