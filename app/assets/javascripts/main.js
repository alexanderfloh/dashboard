requirejs.config({
  paths : {
    'jquery' : '../lib/jquery/jquery',
    'react' : '../lib/react/react-with-addons',
    'moment' : '../lib/momentjs/moment',
    'd3': '../lib/d3js/d3',
    'c3': '../lib/c3/c3',
    'audits': '../jsx/audits',
    'bvtResults': '../jsx/bvtResults',
    'bvtChart': '../jsx/bvtChart',
    'dashboardSilkTest' : '../jsx/dashboardSilkTest'
  }
});

require(['jquery', 'react', 'dashboardSilkTest'],
  function($, React, Dashboard) {
    React.render(React.createElement(Dashboard), document.getElementById('content'));
  }
);
