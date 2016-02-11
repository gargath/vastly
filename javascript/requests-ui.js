// Global Variables
var total_width;
var port;
var codemirrorPane;

//Set up Background Page connection
port = chrome.runtime.connect({name: "requests"});
port.onMessage.addListener(function(msg) {
  console.log("Listener on request: " + msg);
});

//Update total_width on widnow resize
$( window ).resize(function() {
  if (total_width != window.innerWidth) {
    total_width = window.innerWidth;
  }
});


//Doc Ready
$( document ).ready(function() {
  total_width = window.innerWidth;
  
  //Make pane resizable
  $("#leftpane").resizable({
      handles: "e",
      create: function( event, ui ) {
      // Prefers an another cursor with two arrows
        $(".ui-resizable-e").css("cursor","ew-resize");
        $(".ui-resizable-e").css("width","15px");
      }
  }).bind( "resize", resize_other);
  
  //Build initial tree
  tree();
  
  //Add click handler to tree node elements
  $('#jstree').on("select_node.jstree", function (e, data) {
    if (data.node.id != 1) {
      var req = findRequestById(data.node.id-1);
      console.log("Request is:");
      console.log(req);
      if ($( "#rightpane" ).is( ":hidden" )) {
        $('#rightpane').show();
        $('#tabs').tabs({active: 1});
      }
      $('#numfield').text(req.id);
      $('#urlfield').text(req.raw_request.request.url);
      req.raw_request.getContent(function(content, encoding) {
        if (!encoding) {
          console.log("Setting new codemirror content");
          codemirrorPane.swapDoc(CodeMirror.Doc(content, req.raw_request.response.content.mimeType));
        }
        else {
          console.log("Content is encoded. Clearing codemirror document.");
          codemirrorPane.swapDoc(CodeMirror.Doc(""));
        }
        codemirrorPane.refresh();
      });
    }
  });

  //Set up codemirror for response view
  codemirrorPane = CodeMirror(document.getElementById("tabs-2"), {
    value: "empty\n",
    mode:  "javascript",
    lineNumbers: true,
    lineWrapping: true,
    readOnly: true,
    styleActiveLine: true,
    scrollbarStyle: "overlay"
  });

  //Create tabs for right pane
  $('#tabs').tabs({
    active: 1,
    activate: function(event, ui) {
      if ((event.currentTarget) && (event.currentTarget.hash == "#tabs-2")) {
        codemirrorPane.refresh();
      }
      else if ((event.currentTarget) && (event.currentTarget.hash == "#tabs-0")) {
        $('#rightpane').hide();
      }
    }
  });
  
  //Add click handler to button
  $('.addTreeButton').click(function() {
    console.log("Clear button clicked");
    var the_tree = $('#jstree').jstree(true);
    var nodes = the_tree.get_children_dom ("1");
    jQuery.each(nodes, function(i, val) {the_tree.delete_node(val);});
    count = 1;
    traffic.length = 0;
  });
  
  //Add click handler to expandable header
  $('.header').click(function(event) {
    console.log("expanding " + $(this));
    $('#collapsed').toggle();
    $(this).toggleClass('open');
  });
  
  //TEMP: Background button
  var backgroundButton = document.querySelector('.backgroundButton');
  $('.backgroundButton').click(function() {
    console.log("Background clicked");
    port.postMessage({joke: "Knock knock"});;
  });
  
});

//Helper function for pane resize
function resize_other(event, ui) {
    var width = $("#leftpane").width();
    
    if(width > total_width) {
        width = total_width;
        
        $('#leftpane').css('width', width);
    }
    
    $('#rightpane').css('width', (total_width - width));
}

//Helper function for building initial tree
function tree() {
  $('#jstree').jstree({
    "core" : {
      "animation" : 0,
      "check_callback" : true,
      "themes" : { "stripes" : true },
      'data' : {
	    "url" : "./root.json",
		"dataType" : "json" // needed only if you do not supply JSON headers
	  }
    }
  });
}