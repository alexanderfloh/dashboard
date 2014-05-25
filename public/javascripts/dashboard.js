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
            buildName="CI Build Status"
            url="http://lnz-bobthebuilder/hudson/job/SilkTest%20CI"
            pollInterval={5000}
            buildResult={this.calculateBuildResult()}
            lastBuild={this.state.lastBuild}
            lastCompletedBuild={this.state.lastCompletedBuild} />



          <BuildStatusNightly
            buildName="Latest nightly build"
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
        <div>
          <BuildProgress
            lastBuild={this.props.lastBuild} />

          <div className="status-details">
            <BuildStatusTrafficLight
              buildResult={this.props.buildResult}
              buildType="ci"
            />

            <Culprits
              isFailed={this.props.buildResult.failed}
              culprits={this.props.lastCompletedBuild.culprits} />
          </div>
        </div>
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
          <svg id="moon" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100">
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

  chartData: function () {
    var timeSpent = Date.now() - this.props.lastBuild.timestamp;
    var timeLeft = (this.props.lastBuild.timestamp + this.props.lastBuild.estimatedDuration) - Date.now();
    return  [
        {
          "label": "Time Spent",
          "value" : timeSpent
        } ,
        {
          "label": "Time Left",
          "value" : timeLeft
        }
      ];
  },

  render: function() {
    if(this.props.lastBuild.building) {
      return (<BuildProgressGraph chartData={this.chartData()} />);
    }
    else {
      return (<div className="buildProgress" />);
    }
  }
});

var BuildProgressGraph = React.createClass({
  getInitialState: function() {
    return {};
  },

  componentDidMount: function() {
    var self = this;
    //Donut chart example
    nv.addGraph(function() {
      var formatTime = d3.time.format("%X");
      var formatMinutes = function(d) { return moment(d).from(moment(0), true); };

      var chart = nv.models.pieChart()
      .x(function(d) { return d.label })
      .y(function(d) { return d.value })
      .showLabels(true)     //Display pie labels
      .labelThreshold(.05)  //Configure the minimum slice size for labels to show up
      .labelType("value") //Configure what type of data to show in the label. Can be "key", "value" or "percent"
      .donut(true)          //Turn on Donut mode. Makes pie chart look tasty!
      .donutRatio(0.35)     //Configure how big you want the donut hole size to be.
      .showLegend(false)
      .tooltips(false)
      .valueFormat(formatMinutes)
      .labelFormat(formatMinutes)
      .color(['#FF800D', '#DDD'])
      .donutLabelsOutside(true)
      ;

      d3.select(".buildProgress svg")
      .datum(self.props.chartData)
      .transition().duration(350)
      .call(chart);

      self.setState({
        chart: chart
      });
      return chart;
    });
  },

  componentWillReceiveProps: function(nextProps) {
    if(this.state.chart) {
      d3.select(".buildProgress svg").datum(nextProps.chartData).call(this.state.chart);
    } else {
      this.componentDidMount();
    }
  },

  render: function() {
    return (<div className="buildProgress"><svg/></div>);
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
            {item.user}, {moment(item.date).fromNow()}
          </div>
        </li>
      );
    });

    return (
      <section>
        <header>
          <svg id="commit" x="0px" y="0px" width="100px" height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100">
            <g>
            	<path d="M45.923,11.686L19.979,37.629c-2.231,2.232-2.231,5.852,0,8.081c2.23,2.232,5.85,2.232,8.082,0l16.188-16.188v54.92   c0,3.156,2.559,5.715,5.715,5.715s5.715-2.559,5.715-5.715v-54.92L71.866,45.71c2.23,2.232,5.851,2.232,8.082,0   c1.115-1.115,1.674-2.578,1.674-4.041c0-1.462-0.559-2.926-1.674-4.04L54.005,11.686C51.773,9.453,48.155,9.453,45.923,11.686z"/>
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
          if(result !== '') {
            result += ' -';
          }
        }

        return result;
      }

      var deviceNodes = this.state.devices.map(function(device) {
        var deviceLocation = editDeviceLocation(device.location);
        return (
          <tr className="deviceLine" key={device.id}>
            <td className="deviceLocation">{deviceLocation}</td>
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
