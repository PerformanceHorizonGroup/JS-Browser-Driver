jQuery(document).ready(function($){

$(".logo").rotate({ 
   bind: 
     { 
        mouseover : function() { 
            $("#cog").rotate({animateTo:180})
        },
        mouseout : function() { 
            $("#cog").rotate({animateTo:0})
        }
     } 
   
});

});