/** @jsx React.DOM */

define(['react'], function(React) {
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
      var devices = this.state.devices; //this.wrapAround(this.state.devices, this.state.deviceIndex);
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
  return Devices;
});
