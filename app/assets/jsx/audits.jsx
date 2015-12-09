/** @jsx React.DOM */

define(['react', 'avatar'], function(React, Avatar) {
  return React.createClass({
    propTypes: {
      audits: React.PropTypes.arrayOf(
        React.PropTypes.shape({
          phid: React.PropTypes.string.isRequired,
          auditCount: React.PropTypes.number.isRequired,
          concernCount: React.PropTypes.number.isRequired,
          realName: React.PropTypes.string.isRequired
      }))
    },

    render: function() {
      var auditNodes = this.props.audits.slice(0, 16).map(function(audit) {
        return (
          <li className="audit" key={audit.phid}>
            <Avatar name={audit.realName} badgeRight={audit.auditCount} badgeLeft={audit.concernCount}/>
          </li>
        )}
      );

      return (
        <section className="audit-section">
          <ul className="audit-list">
            {auditNodes}
          </ul>
        </section>
      );
    }
  });
});
