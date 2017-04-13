define(function () {

  // Fix table columns width dynamically
  var fixWidths = function ($table) {
    $table.find('tfoot tr td').each(function (index) {
      var width = $table.find('tbody tr td:eq('+index+')').innerWidth();
      $(this).innerWidth(width);
    });

    $table.find('thead tr th').each(function (index) {
      var width = $table.find('tbody tr td:eq('+index+')').innerWidth();
      $(this).innerWidth(width);
    });
  };

  var headerScroll = function ($el) {
    var tableLeft = $el.scrollLeft();
    var tableWidth = $el.find('table').width();
    var containerWidth = $el.width();
    var pageLeft = parseInt($('#content').css('left'), 10);

    $el.find('thead').css({
      'left': pageLeft - tableLeft,
      'right': -((tableWidth - containerWidth) - tableLeft)
    });
  };

  var headFootShadows = function ($el) {
    var pageScrollTop = $el.scrollTop();
    var scrollBottom = $el.find('table.fixed-header').height() - $el.height() - pageScrollTop + 64; // 64 is table padding
    var headScroll = Math.max(Math.min(pageScrollTop, 100), 0) / 100;
    $el.find('table.fixed-header thead').css({ boxShadow: '0px 2px 6px 0px rgba(200,200,200,'+headScroll+')' });
    var footScroll = Math.max(Math.min(scrollBottom, 100), 0) / 100;
    $el.find('table.fixed-header tfoot').css({ boxShadow: '0px -2px 6px 0px rgba(200,200,200,'+footScroll+')' });

    // Position Sticky Header
    if ($el.find('table.fixed-header').hasClass('charted')) {
      var headerDelta = ($(window).width() <= 500)? 244 : 304;
      var headerTop = Math.max(64, headerDelta - pageScrollTop); // 304 is tied to CSS/SASS (default top from charted)
      $el.find('table.fixed-header thead').css('top', headerTop);
    }
  };

  var hitBottom = function ($el) {
    return $el.scrollTop() + $el.innerHeight() >= $el.get(0).scrollHeight - 500; // 500 = pixels from bottom to fetch
  };

  return {
    hitBottom: hitBottom,
    fixWidths: fixWidths,
    headerScroll: headerScroll,
    headFootShadows: headFootShadows
  };
});
