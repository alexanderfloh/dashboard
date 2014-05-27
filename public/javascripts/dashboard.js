/** @jsx React.DOM */

var LoadStatusMixin = {
  getInitialState: function() {
    return {
      lastCompletedBuild: { culprits: [], changesetItems: [] },
      lastBuild: {}
    };
  },

  loadStatus: function() {
    $.ajax({
      url: '/fetchAll/'+ encodeURIComponent(this.props.url),
      dataType: 'json',
      success: function(data1) {
        this.setState(data1);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  componentWillMount: function() {
    this.loadStatus();
    setInterval(this.loadStatus, this.props.pollInterval);
  },

  calculateBuildResult: function() {
    var isStable = this.state.lastStableBuild === this.state.lastCompletedBuild.buildNumber;
    var isSuccessful = !isStable && this.state.lastSuccessfulBuild === this.state.lastCompletedBuild.buildNumber;
    var isFailed = !isStable && !isSuccessful;
    var resultString = isStable ? 'stable' : (isSuccessful ? 'unstable' : 'failed');
    return {
      stable: isStable,
      successful: isSuccessful,
      failed: isFailed,
      resultFormatted: resultString
    };
  }
};

var Dashboard = React.createClass({
  mixins: [LoadStatusMixin],

  getDefaultProps: function() {
    return {
      url: "http://lnz-bobthebuilder/hudson/job/SilkTest%20CI",
      pollInterval: 5000
    };
  },

  render: function() {
    // <div className="vertical-separator" />
    return (
      <div>
        <div className="left">
        <article className="build-status-container">
          <BuildStatusCI
            buildName="CI Build"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest%20CI"
            pollInterval={5000}
            buildResult={this.calculateBuildResult()}
            lastBuild={this.state.lastBuild}
            lastCompletedBuild={this.state.lastCompletedBuild} />



          <BuildStatusNightly
            buildName="Nightly Build"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest"
            pollInterval={5000} />
        </article>



        <article className="commit-message-container">
          <RecentCommits
            commits={this.state.lastCompletedBuild.changesetItems} />
        </article>
        </div>
        <div className="right">
        <article className="device-container">
          <Devices pollInterval={5000}/>
        </article>
        </div>
      </div>
    );
  }

});

var BuildStatusCI = React.createClass({
  render: function() {
    return (
      <section className="build-status-ci">
        <header>
          <svg id="repeat" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" >
            <g>
              <path d="M63.374,73.743H36.625c-5.717,0-10.369-4.652-10.369-10.369h11.339L21.298,42.336L5,63.374h11.339   c0,11.186,9.101,20.287,20.287,20.287h26.749c11.186,0,20.287-9.101,20.287-20.287h-9.918   C73.743,69.091,69.091,73.743,63.374,73.743z"/>
              <path d="M36.625,26.257h26.749c5.687,0,10.315,4.603,10.364,10.279H62.405l16.298,21.038L95,36.535H83.659   C83.61,25.39,74.53,16.338,63.374,16.338H36.625c-11.186,0-20.287,9.101-20.287,20.287h9.918   C26.257,30.908,30.908,26.257,36.625,26.257z"/>
            </g>
          </svg>
          <h2>
            {this.props.buildName}
          </h2>
        </header>
        <div className="status-details">
          <BuildStatusTrafficLight
            buildResult={this.props.buildResult}
            buildType="ci"
          />

          <Culprits
            isFailed={this.props.buildResult.failed}
            culprits={this.props.lastCompletedBuild.culprits} />
        </div>
        <footer>
          <BuildProgress lastBuild={this.props.lastBuild} />
        </footer>
      </section>
    );
  }
});

var BuildStatusNightly = React.createClass({
  mixins: [LoadStatusMixin],

  render: function() {
    var buildResult = this.calculateBuildResult();

    return (
      <section>
        <header>
          <svg id="moon" x="0px" y="0px" width="100px" height="100px" viewBox="-10 -10 120 120">
            <g>
            	<path d="M76.978,69.324c-25.586,0-46.313-20.74-46.313-46.314c0-8.422,2.417-16.211,6.348-23.01   C15.686,6.152,0,25.586,0,48.889C0,77.111,22.876,100,51.099,100C74.402,100,93.848,84.302,100,62.988   C93.188,66.906,85.4,69.324,76.978,69.324z"/>
            </g>
          </svg>
          <h2>
            {this.props.buildName}
          </h2>
        </header>

        <div className="status-details">
          <BuildStatistics
            buildResult={buildResult}
            buildnumber={this.state.lastCompletedBuild.buildNumber} />
          <BuildStatusTrafficLight
            buildResult={buildResult}
            buildType="nightly"
          />
          <Culprits isFailed={buildResult.failed} culprits={this.state.lastCompletedBuild.culprits} />
        </div>
      </section>
    );
  }
});

var BuildProgress = React.createClass({
  render: function() {
    if(this.props.lastBuild.building) {
      var timeSpent = Date.now() - this.props.lastBuild.timestamp;
      var timeLeft = (this.props.lastBuild.timestamp + this.props.lastBuild.estimatedDuration) - Date.now();
      var progress = parseInt((timeSpent / this.props.lastBuild.estimatedDuration) * 100, 10);
      var formatTime = function(d) { return moment(d).from(moment(0), true); };
      var widthStyle = {
        width: progress + '%'
      }
      return (
        <div className="buildProgress">
          <div className="progress-bar-background">
            <span className="bar" style={widthStyle}> </span>
          </div>
          <span className="label">{formatTime(timeLeft) + ' remaining'}</span>
        </div>
      );
    }
    else {
      return (<div className="buildProgress" />);
    }
  }
});

var BuildStatusTrafficLight = React.createClass({
  render: function() {
    var cx = React.addons.classSet;
    var classes = cx({
      'build-status' : true,
      'stable': this.props.buildResult.stable,
      'successful': this.props.buildResult.successful,
      'failed': this.props.buildResult.failed,
      'ci': this.props.buildType === 'ci',
      'nightly': this.props.buildType === 'nightly'
    });

    return (
      <div className={classes} id="status">
        {this.props.buildResult.resultFormatted}
      </div>
    );
  }
});

var Culprits = React.createClass({
  render: function() {
    var culpritNodes = this.props.culprits.map(function(item) {
      return <li key={item.fullName}>{item.fullName}</li>;
    });

    if(this.props.isFailed) {
      return(
        <div className="culprits">
          <h2>Possible culprits</h2>
          <ul>
            {this.props.isFailed ? culpritNodes : ''}
          </ul>
        </div>
      );
    }
    else {
      return (<div/>);
    }
  }
});

var BuildStatistics = React.createClass({
  render: function() {
    var cx = React.addons.classSet;
    var classes = cx({
      'buildstats' : true,
      'stable': this.props.buildResult.stable,
      'successful': this.props.buildResult.successful,
      'failed': this.props.buildResult.failed,
    });
    return (
      <div className={classes}>
        <div className="buildnumber">{this.props.buildnumber}</div>
      </div>
    );
  }
});

var RecentCommits = React.createClass({
  render: function() {
    var commitNodes = this.props.commits.map(function(item) {
      return (
        <li key={item.commitId} className="commitMsg">
          {item.msg}
          <div className="commitTimeAndUser">
            <span className="user">{item.user}</span>, {moment(item.date).fromNow()}
          </div>
        </li>
      );
    });

    return (
      <section>
        <header>
        <svg id="commit" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 26 26">
        <g>
          <path d="M25,20c-0.553,0-1,0.447-1,1v3H2v-3c0-0.553-0.448-1-1-1s-1,0.447-1,1v4c0,0.553,0.448,1,1,1h24c0.553,0,1-0.447,1-1v-4   C26,20.447,25.553,20,25,20z"/>
          <path d="M12.695,11.863c0.091,0.072,0.203,0.109,0.315,0.109c0.111,0,0.222-0.036,0.315-0.109c0.091-0.071,2.207-2.023,3.564-4.031   c0.104-0.155,0.114-0.354,0.026-0.519c-0.089-0.165-0.261-0.268-0.448-0.268H14.69c0,0-0.314-5.359-0.443-5.539   c-0.188-0.266-0.729-0.447-1.239-0.447c-0.511,0-1.124,0.181-1.313,0.447c-0.128,0.181-0.37,5.539-0.37,5.539H9.553   c-0.188,0-0.361,0.103-0.449,0.268c-0.088,0.164-0.078,0.364,0.027,0.52C10.488,9.84,12.606,11.792,12.695,11.863z"/>
          <path d="M5.692,16.841L4.11,17.654c-0.166,0.085-0.273,0.256-0.276,0.443c-0.003,0.187,0.097,0.36,0.261,0.45   c2.125,1.165,5.051,2.069,5.164,2.091h0c0.116,0.022,0.231,0.004,0.331-0.047c0.1-0.051,0.182-0.135,0.231-0.242   c0.047-0.104,0.887-2.944,1.176-5.349c0.022-0.186-0.061-0.368-0.214-0.474c-0.153-0.106-0.354-0.119-0.521-0.033l-1.577,0.81   c0,0-2.712-5.336-8.575-2.324C3.767,11.861,5.692,16.841,5.692,16.841z"/>
          <path d="M15.217,14.526c-0.153,0.106-0.236,0.288-0.214,0.474c0.289,2.405,1.129,5.245,1.176,5.349   c0.049,0.107,0.131,0.191,0.231,0.242c0.1,0.051,0.215,0.069,0.331,0.047c0.113-0.022,3.039-0.926,5.163-2.092   c0.164-0.09,0.264-0.263,0.261-0.45s-0.11-0.358-0.276-0.443l-1.581-0.812c0,0,1.925-4.98,5.582-3.862   c-5.863-3.012-8.575,2.324-8.575,2.324l-1.577-0.81C15.571,14.407,15.37,14.42,15.217,14.526z"/>
        </g>
        </svg>
          <h2>
            Recent Commits
          </h2>
        </header>
        <ul className="commitMsgs">
          {commitNodes}
        </ul>
      </section>
    );
  }
})

var Devices = React.createClass({
    getInitialState: function() {
      return { devices: [] };
    },

    loadStatus: function() {
      $.ajax({
        url: '/getDevices/',
        dataType: 'json',
        success: function(data) {
            this.setState({
              devices: data
            })
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(status, err.toString());
        }.bind(this)
      });
    },

    componentWillMount: function() {
      this.loadStatus();
      setInterval(this.loadStatus, this.props.pollInterval);
    },

    render: function() {
      var editDeviceLocation = function(deviceLocation) {
        var result = '';
        if (deviceLocation) {
          result = deviceLocation;
          var dashIndex = result.indexOf("-");
          if (dashIndex > -1) {
            result = result.substring(dashIndex + 1, result.length);
          }
          result = result.toLowerCase();
        }

        return result;
      }

      var deviceNodes = this.state.devices.map(function(device) {
        var deviceLocation = editDeviceLocation(device.location);
        return (
          <tr className="deviceLine" key={device.id}>
            <td className="deviceLocation"><div>{deviceLocation}</div></td>
            <td className="deviceName">{device.name}</td>
          </tr>
        );
      });

      return (
        <section>
          <header>
            <svg id="smartphone" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100">
              <g>
              	<path d="M64.812,14.25H35.188c-4.418,0-8,3.582-8,8v55.5c0,4.418,3.582,8,8,8h29.625c4.418,0,8-3.582,8-8v-55.5   C72.812,17.831,69.23,14.25,64.812,14.25z M64.812,77.75H35.188v-55.5h29.625V77.75z"/>
              	<circle cx="49.579" cy="70.85" r="4"/>
              </g>
            </svg>
            <h2>
              Device Renting
            </h2>
          </header>
          <table className="device">
            {deviceNodes}
          </table>
        </section>
      );
    }
  });

React.renderComponent(
    <Dashboard />,
    document.getElementById('content')
  );
