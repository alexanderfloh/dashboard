/** @jsx React.DOM */

define(['react', 'jquery', 'moment', 'audits', 'bvtResults', 'devices', 'loaderMixin', 'avatar'], function(React, $, Moment, Audits, BvtResults, Devices, LoadStatusMixin, Avatar) {

  var Dashboard = React.createClass({
    mixins: [LoadStatusMixin],
    getDefaultProps: function() {
      return {
        pollInterval: 10000
      };
    },

    buildItemsNightly: function(build){
      var committerNodes = build.culprits.slice(0, 6).map(function(culprit) {
        return <Avatar name={culprit.fullName} />
      });

      var classesStatus = this.getStatusClassSet(build, "status");
      var andOthers = "";
      if (build.culprits.length > 6){
        andOthers = "+ " + (build.culprits.length - 6) + " other" + (build.culprits.length > 1 ? "s" : "");
      }
      return (
          <li className="build-list-item">
            <div className="build-item">
              <ul>
                <li className="avatars nightly">
                  {committerNodes}
                  <div>{andOthers}</div>
                </li>
                <li className={classesStatus}>
                  <a href={build.link}>
                    {build.number}
                  </a>
                </li>
                <li>
                <div>
                  <ul className="regression-list">
                    {this.regressionStatus(build.setup, "Setup")}
                  </ul>
                </div>
                </li>
              </ul>
            </div>
          </li>
      );
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

    regressionStatus: function(regression, name){
      var classesStatus = this.getStatusClassSet(regression, "regression");
      return (
          <li className={classesStatus}>
            <a href={regression.link}>
              {name}
            </a>
          </li>
        );
    },

    buildItems: function(build){
      var committerNodes = build.culprits.slice(0, 3).map(function(culprit) {
        return <Avatar name={culprit.fullName} />
      });
      var that = this;

      var resultNodes = build.regressions.map(function(result) {
        var classesStatus = that.getStatusClassSet(result, "regression");
        return (
          <li className={classesStatus} key={result.link}>
            <a href={result.link}>
              {result.name}
            </a>
          </li>);
      });

      var classesRegressionResult = this.getStatusClassSet(build.regressions[0], "regression");

      var andOthers = "";
      if (build.culprits.length > 3){
        andOthers = "+ " + (build.culprits.length - 3) + " other" + (build.culprits.length > 1 ? "s" : "");
      }
      return (
          <li className="build-list-item"
            key={build.number}>
            <div className="build-item">
              <ul>
                <li className="avatars">
                  {committerNodes}
                  <div>{andOthers}</div>
                </li>
                {this.buildStatus(build)}
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

    buildStatus: function(build){
      var classesStatus = this.getStatusClassSet(build, "status");
      var currentBuild = this.state.lastBuild;

      if (currentBuild.building && currentBuild.buildNumber === build.number){
        return (
            <li className="status pending">
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

    getNevergreens: function(nevergreen) {
      var linkText = nevergreen.definitionName;
      // cut off namespaces
      var nameArray = linkText.split(".");
      linkText = nameArray[nameArray.length-1];
      // fix in case of "... cases_None.opt\""," string
      if (linkText.length < 5){
        linkText = nevergreen.definitionName;
      }
      return (
        <li key={nevergreen.id} className="nevergreen">
          <a href={nevergreen.link}>
            {nevergreen.nrOfFailures} &times; {linkText}
          </a>
        </li>
      );
    },

    render: function() {
   // ----------------------- generate html -----------------------//
      var buildItems = this.state.buildCI.map(this.buildItems);
      var buildNightly = this.buildItemsNightly(this.state.buildNightly);
      var nevergreenNodes = this.state.nevergreens.map(this.getNevergreens);
      var audits = this.state.audits.sort(function(a, b){
        var countDiff = b.count-a.count;
        if(countDiff !== 0) {
          return countDiff;
        }
        // break ties
        return a.realName.localeCompare(b.realName);
      });

   // ----------------------- html site structure -----------------------//
      return (
        <div>
          <article className="dashboard">
            <section className="build-section">
              <ul className="ci-build-list">
                {buildItems}
              </ul>
            </section>

            <BvtResults bvtResults={this.state.bvtResults} />

            <section className="deviceSection">
              <Devices pollInterval={15000}/>
            </section>

            <aside id="nightly-build" className="nightly-build">
              {buildNightly}
              <Audits audits={audits} />
              <h1> Nevergreens </h1>
              <ul className="nevergreen-list">
                {nevergreenNodes}
              </ul>
            </aside>

          </article>
        </div>

      );
    }
  });

  var BuildProgress = React.createClass({
    render: function() {
      if(this.props.lastBuild.building) {
        var timeSpent = Date.now() - this.props.lastBuild.timestamp;
        var timeLeft = (this.props.lastBuild.timestamp + this.props.lastBuild.estimatedDuration) - Date.now();
        var progress = parseInt((timeSpent / this.props.lastBuild.estimatedDuration) * 100, 10);
        var formatTime = function(d) {
          if(timeLeft > 0) {
            return Moment(d).from(Moment(0), true) + ' remaining';
          } else {
            return 'any moment now...';
          }
        };
        var widthStyle = {
          width: Math.min(progress, 95) + '%'
        }
        return (
          <div className="buildProgress">
            <div className="progress-bar-background">
              <span className="bar" style={widthStyle}> </span>
            </div>
            <div className="label">
              <div className="buildNumber">
                {this.props.lastBuild.buildNumber}
              </div>
              <div className="timeLeft">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        );
      }
      else {
        return (<div className="buildProgress" />);
      }
    }
  });

  return Dashboard;
});
