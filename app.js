;
var inreadVastApp = function () {
  
  // dev/production fixes
  window.ox_vars = window.ox_vars || {
    'init': function () {
    },
    'setVars': function () {
      return "";
    }};
  window.ox_vars.init();
  var custVars = ox_vars.setVars();
  var oxParms = (custVars !== '') ? custVars : '';
  var VASTURL = window.inreadVastVideoVASTURL || '/vast.php?auid=' + window.vastId + '&vars=' + oxParms || '/vast.php?auid=538258025&vars=' + oxParms;   //var VASTURL = 'http://diwanee-d.openx.net/v/1.0/av?auid=537209182';
  //var VASTURL =  'vast.php?auid=538258025';
    
  var imgBaseUrl = window.inreadVastVideoImgBaseUrl || '/assets/images/';
  
  
  var $wrap = $('.in-read-vast-player-holder');
  var skipAddDelay = 2016; // ms
  var $container = $('<div class="video-inread-wrap muted"></div>');  
  // no inread banner on page
  if($container.length===0) {
    return;
  }  
  
  // templating & referencing objects
  var player = $('<video id="video-inread" autoplay muted playsinline preload="auto" class="video-inread" style="pointer-events:none"></video>')[0]; //  pointer-events disables play for <video>.click
  var $skipAd = $('<a href="#" class="ivv-skip-ad" ></a>'); 
  var $speaker = $('<a href="#" class="ivv-speaker"></a>');
  $container
          .append( '<div class="ivv-ad-notation"></div>' )
          .append( $("<div class='ivv-video-wrap' />").append(player).append($skipAd).append($speaker) )          
          .append('<div class="poster-button ivv-poster-button"></div>')
          .appendTo($wrap);  
    
  player.controls = false;
  player.crossOrigin = true;
  
  // pull vast file
  var vast = new dynamicVast(VASTURL);

  // adVideo container is in view for the first time
  $container.one('inview', function (event, isInView) {
    if (isInView) {
      inviewStart();      
    }
  });

  // go go go 
  var inviewStart = function () {
    
    vastReady = function () {
      
      // impresion 
      //var impresionImg = new Image();
      //impresionImg.src = vast.impresion;
      //$container.append("<img scr='"+vast.impresion+"' style='position:absolute;'>");      
      vast.impression();

      // functionalities
      var terminator = function(){
        $container.off('inview');
        $container.removeClass('expanded');
        player.src = "";
        if (player.webkitExitFullscreen) {
          player.webkitExitFullscreen();
        }
      };
      var addClickTroughButton = function(){
        var $button = $("<div class='ivv-ctb'>&nbsp;</div>");
        $container.append($button);
        $button.on('click', function(){
          window.open(vast.clickTrought, '_blank');
          $button.remove();
          terminator();
        });        
      };
      addClickTroughButton();
      $skipAd.on('click', function(e){
        e.stopPropagation();
        e.preventDefault();
        vast.track('close');
        terminator();
      });

      // not neaded because of pointer-events:none
      //$(player).on('click', function(e){
      //  e.preventDefault()
      //});

      $container.on('click', function () {
        if (player.paused) {
          player.play();        
          if (player.muted) {
            player.muted = false;
          }
        }
        else if (player.currentTime > 0) {
          window.open(vast.clickTrought, '_blank');
          terminator();
        }
      });
      $speaker.on('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        player.muted = (player.muted) ? false : true;
      });
      $container.addClass('paused');
      $(player).on('play', function () {
        $container.removeClass('paused');
      });
      $(player).on('pause', function () {
        $container.addClass('paused');
      });
      $container.on('inview', function (event, isInView) {
        if (isInView) {
          player.play();
        }
        else {
          player.pause();
        }
      });
      
      $(player).on('ended', function () {
        if (navigator.userAgent.match(/iPhone/i) && !('playsInline' in document.createElement('video'))) {
          player.webkitExitFullscreen();
          return;
        }
        terminator();
      });
        
      // iphone exit/enter fullscreen
      $(player).on('webkitendfullscreen', function () {
        player.pause();
        $container.off('inview');
      });
      $(player).on('webkitbeginfullscreen', function () {
        player.play();
      });
      // analytics
      $(player).one('play', function (e) {
        vast.track('start');
        $(player).on('play', function (e) {
          vast.track('resume');
        });
      });
      $(player).on('pause', function (e) {
        if (player.currentTime / player.duration !== 1) {
          vast.track("pause");
        }
      });
      $(player).on('volumechange', function (e) {
        if (!player.paused) {
          if (player.muted) {
            $container.addClass('muted');
            vast.track('mute');
          }
          else {
            $container.removeClass('muted');
            vast.track('unmute');
          }
        }
      });
      var pct75 = function () {
        vast.track('thirdQuartile');
        window.inreadVastKruks['pct75']();
        pct75 = function () {
        };
      };
      var pct50 = function () {
        vast.track('midpoint');
        window.inreadVastKruks['pct50']();
        pct50 = function () {
        };
      };
      var pct25 = function () {
        vast.track('firstQuartile');
        pct25 = function () {
        };
      };
      $(player).on('timeupdate', function (e) {
        var pct = Math.round((player.currentTime / player.duration) * 100);
        if (pct > 75) {
          pct75();
        }
        else if (pct > 50) {
          pct50();
        }
        else if (pct > 25) {
          pct25();
        }
      });
      $(player).on('ended', function () {
        vast.track('complete');
      });
      // run handler
      if (vast.mediaFileUrl.toLowerCase().indexOf("kaltura") !== -1) {
        var partnerId = vast.mediaFileUrl.match(/\/p\/([0-9]+)\//)[1];
        var entityId = vast.mediaFileUrl.match(/\/entryId\/([A-Za-z0-9\-\_]+)\//)[1];
        player.poster = location.protocol + "//cfvod.kaltura.com/p/" + partnerId + "/thumbnail/entry_id/" + entityId + "/width/600";
      }
      player.src = vast.mediaFileUrl;
      $container.addClass('expanded');
      player.play();
      setTimeout(function () {
        $skipAd.addClass('ivv-visible');
      }, skipAddDelay);
      
      
    };

    // vast is ready -> play video 
    if (vast.ready) {
      vastReady();
    } else {
      $(vast).on('ready', function (res) {
        vastReady();
      });
    }

  };

};


/*
window.postMessage("ad-in-read-krux-"+JSON.stringify({
  pct75: ['ns:webedia','admEvent', 'LmWbNhCi', {Time:'2'}],
  pct50: ['ns:webedia','admEvent', 'LmWaWYUc', {Time:'1'}]
}), "*")
*/
window.inreadVastKruks = {
  pct75: function(){
    if (!window.inreadVastKruksData) {return;}
    window.Krux.apply(null, window.inreadVastKruksData['pct75']);
  },
  pct50: function(){
    if (!window.inreadVastKruksData) {return;}
    window.Krux.apply(null, window.inreadVastKruksData['pct50']);
  }  
};




$(window).on('message', function (e) {
  if (typeof(e.originalEvent.data)==="string" && e.originalEvent.data.indexOf('ad-in-read-data') === 0) {
    window.vastId = e.originalEvent.data.match(/ad-in-read-data-(.*)/)[1];    
    inreadVastApp();
  }
  if (typeof(e.originalEvent.data)==="string" && e.originalEvent.data.indexOf('ad-in-read-krux') === 0) {
    var kruxData = e.originalEvent.data.match(/ad-in-read-krux-(.*)/)[1];
    window.inreadVastKruksData = JSON.parse(kruxData);
  }
});

