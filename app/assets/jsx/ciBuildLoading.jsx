/** @jsx React.DOM */

define(['react', 'avatar', 'buildProgress'], function(React, Avatar, BuildProgress) {
  var DownstreamJobLoading = React.createClass({
    render: function() {
      var classesStatus = "regression cancelled";
      var name = '/icon/Core';
      return (
        <li className={classesStatus}>
          <a href='' target="_blank">
            <div className="regression-icon">Ab</div>
          </a>
        </li>);
    },

  });

  var CiBuildLoading = React.createClass({
 
    render: function(){
      var committerNodes = <Avatar name='avatar' key='avatar' />;
      var that = this;
      
      var resultNodes = new Array(10).fill('').map(function(result, index) {
        return <DownstreamJobLoading key={index}/>;
      });

      var classesRegressionResult = "regression cancelled";

      var c = 'ci-build-item cancelled';
      var arrowClass = 'arrow-down cancelled';
      var arrowContainerClass = 'arrow-container cancelled';
      var testContainerClass = 'test-container';
      return (
          <li className="build-list-item font-blokk">
            <div className={c}>
              <div className="avatars">
                {committerNodes}
              </div>
              <div className="build-description">description could be here</div>
                <div className='status cancelled'>
                  <a href='' className="build-number" target="_blank">
                    12
                  </a>
                </div>
              <div className={arrowContainerClass}>
              <div className={arrowClass} />
              </div>
              <div className={testContainerClass}>
                <ul className="regression-list">
                  {resultNodes}
                </ul>
              </div>
            </div>
            <div className="darkOverlay"><img src="/assets/images/rolling.svg" /></div>
          </li>
      );
    },
  });
  return CiBuildLoading;
});
