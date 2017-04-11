/** @jsx React.DOM */

define(['react', 'avatar' ], function(React, Avatar) {
  var NightlyBuildLoading = React.createClass({
    render: function(){
      var committerNodes = new Array(3).fill('avatar').map(function(culprit, index) {
        return <Avatar name={culprit} key={culprit + '_' + index} />
      });

      var classesStatus = 'cancelled';

      var arrowClass = 'arrow-right cancelled';
      var c = 'build-item cancelled';

      return (
        <div className="build-list-item font-blokk">
          <div className={c}>
            <div className="avatars nightly">
              {committerNodes}
            </div>
            <div className="build-description">a description could be here</div>
            <div className='cancelled status-nightly'>
              <a className="build-number" href="" target="_blank">
                12
              </a>
            </div>
            <div>
            <div>
              <ul className="downstream-jobs-nightly">
                <li className='cancelled nightly-setup'>
                  <a href="" target="_blank">
                    Setup
                  </a>
                </li>
              </ul>
            </div>
            </div>
          </div>
          <div className={arrowClass} />
          <div className="darkOverlay"><img src="/assets/images/rolling.svg" /></div>
        </div>
      );
    }
  });
  return NightlyBuildLoading;
});