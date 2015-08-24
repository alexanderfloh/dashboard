/** @jsx React.DOM */

define(['react', 'jquery', 'moment', 'audits', 'bvtResults'], function(React, $, Moment, Audits, BvtResults) {
  function formatEmplName(name){
    return name.replace(" ", ".")
               .replace(/ä/g,"ae")
               .replace(/ö/g,"oe")
               .replace(/ü/g,"ue")
               .replace(/Ä/g,"Ae")
               .replace(/Ö/g,"Oe")
               .replace(/Ü/g,"Ue")
               .replace(/ß/g,"ss") + '.jpg';
  }

  function getDefaultPicture(){
    return '/assets/images/avatars/default.jpg';
  }

  var LoadStatusMixin = {
    getInitialState: function() {
      return {
        buildCI: [],
        buildNightly: {
          culprits: [],
          setup: { },
        },
        users:[],
        project:[],
        audits:[],
        lastBuild:[],
        nevergreens:[],
        bvtResults:[],
        employeesAustria:""
      };
    },

    // load data from jenkins, austria and phabricator
    loadStatus: function() {
      $.ajax({
        url: '/buildMain',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });

      $.ajax({
          url: '/buildAside',
          dataType: 'json',
          success: function(data1) {
            this.setState(data1);
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        });

      $.ajax({
        url: '/getAudits',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });

      $.ajax({
        url: '/getUsers',
        dataType: 'json',
        success: function(data1) {
          this.setState(data1);
        }.bind(this),
        error: function(xhr, status, err) {
          console.error(this.props.url, status, err.toString());
        }.bind(this)
      });

      $.ajax({
        url: '/getBvtResult',
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
  };

  var Dashboard = React.createClass({
    mixins: [LoadStatusMixin],
    getDefaultProps: function() {
      return {
        pollInterval: 10000
      };
    },

    render: function() {
      var empl = this.state.employeesAustria.toLowerCase();
      function getPicture(name){
        name = formatEmplName(name);

        if (name == "No.Auditor.jpg"){
          return '/assets/images/avatars/silkTestLogo.png';
        }
        else if (empl.match(name.toLowerCase()) == null){
          return getDefaultPicture();
        }
        else{
            return 'http://austria/global/images/employees/' +  name;
        }
      }

      function getCommitters(committer){
        var picture = getPicture(committer.fullName, empl);

        var avatarUrlStyle = {
            backgroundImage: 'url(' + picture + ')',
            backgroundSize: 'cover'
        };
        return (
            <div className="avatar"
                 style={avatarUrlStyle}
                 key={committer.fullName}
                 title={committer.fullName} >
            </div>
        );
      }

      function getAvatarClassSet(name){
        var cx = React.addons.classSet;
        return cx({
          'avatar': name !== 'No Auditor',
          'silkTest': name === 'No Auditor'
        });
      }

      function getStatusClassSet(build, name){
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
      }

   // ----------------------- render functions -----------------------//
      var currentBuild = this.state.lastBuild;
      function buildStatus(build){
        var classesStatus = getStatusClassSet(build, "status");

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
      }

      function regressionStatus(regression, name){
        var classesStatus = getStatusClassSet(regression, "regression");
        return (
            <li className={classesStatus}>
              <a href={regression.link}>
                {name}
              </a>
            </li>
          );
      }

      function buildItems(build){
        var committerNodes = build.culprits.map(getCommitters);

        var resultNodes = build.regressions.map(function(result) {
          var classesStatus = getStatusClassSet(result, "regression");
          return (
            <li className={classesStatus}>
              <a href={result.link}>
                {result.name}
              </a>
            </li>);
        });

        var classesRegressionResult = getStatusClassSet(build.regressions[0], "regression");

        var andOthers = "";
        if (committerNodes.length > 3){
          andOthers = "+ " + (committerNodes.length - 3) + " other" + (committerNodes.length > 1 ? "s" : "");
        }
        return (
            <li className="build-list-item"
              key={build.number}>
              <div className="build-item">
                <ul>
                  <li className="avatars">
                    {committerNodes.slice(0,3)}
                    <div>{andOthers}</div>
                  </li>
                  {buildStatus(build)}
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
      };

      function buildItemsNightly(build){
        var committerNodes = build.culprits.map(getCommitters);
        var classesStatus = getStatusClassSet(build, "status");
        var andOthers = "";
        if (committerNodes.length > 6){
          andOthers = "+ " + (committerNodes.length - 6) + " other" + (committerNodes.length > 1 ? "s" : "");
        }
        return (
            <li className="build-list-item">
              <div className="build-item">
                <ul>
                  <li className="avatars nightly">
                    {committerNodes.slice(0,6)}
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
                      {regressionStatus(build.setup, "Setup")}
                    </ul>
                  </div>
                  </li>
                </ul>
              </div>
            </li>
        );
      };

      function getNevergreens(nevergreen) {
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
      };

   // ----------------------- generate html -----------------------//
      var buildItems = this.state.buildCI.map(buildItems);
      var buildNightly = buildItemsNightly(this.state.buildNightly);
      var nevergreenNodes = this.state.nevergreens.map(getNevergreens);
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
              <Audits audits={audits} employeesAustria={this.state.employeesAustria} />
              <h1> Nevergreens </h1>
              <ul className="nevergreen-list">
                {nevergreenNodes.slice(0,26)}
              </ul>
            </aside>

          </article>
        </div>

      );
    }
  });

  var Devices = React.createClass({
    getInitialState: function() {
      return { devices: [],
        deviceIndex: -1 };
    },

    loadStatus: function() {
      $.ajax({
        url: '/getDevices/',
        dataType: 'json',
        success: function(data) {
          var newDeviceIndex = (this.state.deviceIndex + 1) % (data && data.length > 0 ? data.length : 1);
          this.setState({
            devices: data,
            deviceIndex: newDeviceIndex});
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

    editDeviceLocation: function(deviceLocation) {
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
    },

    isOffscreen: function(elem$) {
      var offset = elem$.offset();
      return offset.top > $(window).height();
    },

    wrapAround: function(originalDevices, deviceIndex) {
      var result = originalDevices.slice(0);
      var len = $("tr.deviceLine").length;
      if (len > 0) {
        var lastElem$ = $("tr.deviceLine:last");
        if (this.isOffscreen(lastElem$)) {
          var first = result.splice(0, deviceIndex);
          for (var i = 0; i < first.length; i++) {
            result.push(first[i]);
          }
        }
      }
      return result;
    },

    render: function() {
      var that = this;
      var devices = this.wrapAround(this.state.devices, this.state.deviceIndex);
      var deviceNodes = devices.map(function(device) {
        var deviceLocation = that.editDeviceLocation(device.location);
        var classString = " deviceName " + device.osType;
        return (
            <tr className="deviceLine" key={device.id}>
            <td className={classString}>{device.name}</td>
              <td className="deviceLocation"><div>{deviceLocation}</div></td>
            </tr>
          );
      });

      return (
          <div>
        <h1 className="deviceSummery">
          Connected devices ({devices.length}):
          <a href="/assets/DevicePusher/DevicePusher.UI.application" download="DevicePusher.UI.application">(Download Device Pusher)</a>
        </h1>

        <table className="deviceTable">
          {deviceNodes}
        </table>
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
