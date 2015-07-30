requirejs.config({
  paths : {
    'jquery' : '../lib/jquery/jquery',
    'react' : '../lib/react/react-with-addons',
    'moment' : '../lib/momentjs/moment',
    'dashboardSilkTest' : '../jsx/dashboardSilkTest'
  }
});

require(['jquery', 'react', 'dashboardSilkTest'],
  function($, React, Dashboard) {
    React.renderComponent(Dashboard(), document.getElementById('content'));
    return function () {};
  }
);
