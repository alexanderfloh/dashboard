requirejs.config({
  paths : {
    'jquery' : '../lib/jquery/jquery',
    'react' : '../lib/react/react-with-addons',
    'chartist': '../lib/chartist/dist/chartist',
    'moment' : '../lib/momentjs/moment',
    'd3': '../lib/d3js/d3',
    'c3': '../lib/c3/c3',
    'chartist-react': '../jsx/thirdparty/chartist',
    'audits': '../jsx/audits',
    'auditsLoading': '../jsx/auditsLoading',
    'bvtResults': '../jsx/bvtResults',
    'bvtResultsLoading': '../jsx/bvtResultsLoading',
    'bvtChart': '../jsx/bvtChart',
    'devices': '../jsx/devices',
    'loaderMixin': '../jsx/loaderMixin',
    'avatar': '../jsx/avatar',
    'ciBuild': '../jsx/ciBuild',
    'ciBuildLoading': '../jsx/ciBuildLoading',
    'nightlyBuild': '../jsx/nightlyBuild',
    'nightlyBuildLoading': '../jsx/nightlyBuildLoading',
    'buildProgress': '../jsx/buildProgress',
    'dashboardSilkTest' : '../jsx/dashboardSilkTest'
  }
});

require(['jquery', 'react', 'dashboardSilkTest'],
  function($, React, Dashboard) {
    React.render(React.createElement(Dashboard), document.getElementById('content'));
  }
);
