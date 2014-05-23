/** @jsx React.DOM */

var Dashboard = React.createClass({
  render: function() {
    return (
        <div>
          <article>
            <BuildStatusCI
              buildName="CI Build Status"
              url="http://lnz-bobthebuilder/hudson/job/SilkTest%20CI"
              pollInterval={5000} />
            <BuildStatusNightly
              buildName="Latest nightly build"
              url="http://lnz-bobthebuilder/hudson/job/SilkTest"
              pollInterval={5000} />
          </article>
          <article className="deviceArticle">
            <Devices pollInterval={5000}/>
          </article>
        </div>
        );
  }

});

var LoadStatusMixin = {
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

var BuildStatusCI = React.createClass({
mixins: [LoadStatusMixin],

  getInitialState: function() {
    return {lastCompletedBuild: { culprits: [], changesetItems: [] }};
  },
  
  render: function() {
    var buildResult = this.calculateBuildResult();

    return (
      <section>
        <BuildLabel buildName={this.props.buildName} />
        <BuildStatusTrafficLight
          buildResult={buildResult}
          buildType="ci"
        />
        <BuildProgress lastBuild={this.state.lastBuild ? this.state.lastBuild : {}} />
        <Culprits isFailed={buildResult.failed} culprits={this.state.lastCompletedBuild.culprits} />
        <RecentCommits commits={this.state.lastCompletedBuild.changesetItems} />
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
      return (<span className="buildProgress" />);
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
      .color(['#FF800D', '#3498DB'])
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
    return (<span className="buildProgress"><svg/></span>);
  }
});

var BuildStatusNightly = React.createClass({
  mixins: [LoadStatusMixin],

  getInitialState: function() {
    return {lastCompletedBuild: { culprits: [], changesetItems: [] }};
  },

  render: function() {
    var buildResult = this.calculateBuildResult();

    return (
      <section>
        <BuildLabel buildName={this.props.buildName} />
        <BuildStatistics
          buildResult={buildResult}
          buildnumber={this.state.lastCompletedBuild.buildNumber} />
        <BuildStatusTrafficLight
          buildResult={buildResult}
          buildType="nightly"
        />
        <Culprits isFailed={buildResult.failed} culprits={this.state.lastCompletedBuild.culprits} />
      </section>
    );
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

var BuildLabel = React.createClass({
  render: function() {
    return (
      <div className="label">
        {this.props.buildName}
      </div>
    );
  }
});

var Culprits = React.createClass({
  render: function() {
    var culpritNodes = this.props.culprits.map(function(item) {
      return <div>{item.fullName}</div>;
    });

    return(
      <div className="contributes" >
        {this.props.isFailed ? culpritNodes : ''}
      </div>
    );
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
      <ul className="commitMsgs">
        {commitNodes}
      </ul>
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
