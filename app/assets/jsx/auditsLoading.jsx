/** @jsx React.DOM */

define(['react', 'avatar'], function(React, Avatar) {
  var AuditsLoading = React.createClass({
    render: function() {
      var auditNodes = new Array(16).fill('avatar').map(function(audit, index) {
        return (
          <li className="audit" key={index}>
            <Avatar name={audit} badgeRight={1} badgeLeft={1}/>
          </li>
        )}
      );

      return (
        <section className="audit-section font-blokk">
          <a href="http://lnz-phabricator.microfocus.com" target="_blank">
            <ul className="audit-list">
              {auditNodes}
            </ul>
          </a>
          <div className="darkOverlay"><img src="/assets/images/rolling.svg" /></div>
        </section>
      );
    }
  });
  return AuditsLoading;
});
