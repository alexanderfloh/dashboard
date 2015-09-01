/** @jsx React.DOM */

define(['react', 'avatar'], function(React, Avatar) {
  return React.createClass({
    propTypes: {
      audits: React.PropTypes.arrayOf(
        React.PropTypes.shape({
          phid: React.PropTypes.string.isRequired,
          count: React.PropTypes.number.isRequired,
          realName: React.PropTypes.string.isRequired
      }))
    },

    render: function() {
      var auditNodes = this.props.audits.slice(0, 12).map(function(audit) {
        return (
          <li className="audit" key={audit.phid}>
            <Avatar name={audit.realName} badge={audit.count} />
          </li>
        )}
      );

      return (
        <section className="audit-section">
          <h1>Open Audits</h1>
          <ul className="audit-list">
            {auditNodes}
          </ul>
        </section>
      );
    }
  });
});
