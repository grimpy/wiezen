var graph = null;
var gameprogress = null;
var inputtype = "";
var inputgamenum = -1;

var getGraphOptions = function () {
    var maxtick = graph[0].length;
    var options = {axes: { xaxis: {min: 0, 
                                   max: maxtick,
                                   numberTicks: maxtick+1,}
                         },
                   seriesDefaults: { 
                       showMarker:false,
                       pointLabels: { show:true }},
                   axes:{ yaxis:{ pad: 1.3 } },
                   legend: { show: true}};
    var series = [];
    $.each($('.name'), function(idx, val){
        series.push({label: val.innerHTML});
    });
    options.series = series;
    return options;
};

var getBaseScore = function(tricks, multiplier){
    if (! multiplier){
        multiplier = 1;
    }
    if (tricks == 13){
        multiplier *= 2;
    }
    if ('multiplier' in this){
        multiplier *= this.multiplier;
    }
    var amount = 0;
    var trickdelta = tricks - this.tricks;
    amount = trickdelta >= 0 ? this.score: -this.score;
    amount += trickdelta;
    return amount * multiplier;
};

var getMiserieScore = function(tricks, multiplier){
    if (! multiplier){
        multiplier = 1;
    }
    if ('multiplier' in this){
        multiplier *= this.multiplier;
    }
    var score = this.score * multiplier
    return tricks == 0 ? score: -score;

};

var validate = function(players){
    return $.inArray(players, this.players) != -1;
};

var plain = { players: [1], score: 2, multiplier: 1, getBaseScore: getBaseScore, validate: validate }

var alone = $.extend({}, plain, {tricks: 5, name: 'alone'});
var withtwo = $.extend({}, plain, {players: [2], tricks: 8, name: 'withtwo'});
var arbendance = $.extend({}, plain, {tricks: 9, score: 5, name: 'arbendance'});
var trul = $.extend({}, plain, {players: [2], tricks: 8, score: 3, multiplier: 2, name: 'trul'});
var miserie = $.extend({}, plain, {players: [1,2,3,4], tricks: 0, score: 5, name: 'miserie', getBaseScore: getMiserieScore});
var miserietable = $.extend({}, plain, {players: [1,2,3,4], tricks: 0, score: 20, name: 'miserietable', getBaseScore: getMiserieScore});
var soloslim = $.extend({}, plain, {players: [1], tricks: 13, score: 20, name: 'soloslim'});

var games = {alone: alone, withtwo: withtwo,
             arbendance: arbendance, trul: trul,
             miserie: miserie, miserietable: miserietable,
             soloslim: soloslim };

var getSelectedGame = function(){
    return games[$("input[name=game]:checked").val()];
};

var getTricks = function() {
    return parseInt($("#tricks").val());
};

var isDouble = function() {
    return $("#dbl").is(':checked')
}


var addScore = function(game, tricks, currentplayers, dbl) {
    var multiplier = dbl ? 2: 1;
    var basescore = game.getBaseScore(tricks, multiplier);
    var scores = $(".score");
    var amount = currentplayers.length;
    if (! game.validate(amount)){
        alert("Invalid amount of players!");
        return false
    }
    //TODO: think of triplie miserie
    var alone = amount == 2 ? 1: 3;
    var play = {game: game.name, tricks: tricks, players: currentplayers, dbl: dbl};
    $.each($('.name'), function(idx, val){
        var score = parseInt(scores[idx].innerHTML);
        if(currentplayers.indexOf(idx) != -1){
            score += basescore * alone;
        }
        else{
            score -= basescore;
        }
        scores[idx].innerHTML = score;

        graph[idx].push([graph[idx].length, score, play ]);
    });
        if(inputtype != 'replace') {
            gameprogress['games'].push(play)
            saveGame();
        }
        else {
            gameprogress.games[inputgamenum] = play;
            inputtype='';
            inputgamenum=-1;
            $('#submit').html('Enter');	
            reInitialize();
        }
    return true;

};

var drawGraph = function(){
    $("#charts").empty();
    $("#charts").append($("<div id='chart'>"));
    $.jqplot('chart', graph, getGraphOptions());
}

var getKey = function(name){
    var key = 'currentgame';
    if (name)
        key = 'game.' + name;
    return key;
}

var saveGame = function(name) {
    var key = getKey(name); 
    localStorage.setItem(key, JSON.stringify(gameprogress));
}

var loadGame = function(name) {
    initVars();
    var key = getKey(name);
    var oldgame = JSON.parse(localStorage.getItem(key));
    $.each(oldgame.games, function(idx, game) {
        var gametype = games[game.game];
        addScore(gametype, game.tricks, game.players, game.dbl);

    });
    var myplayers = $('.name');
    $.each(oldgame.players, function(idx, player) {
        $(myplayers[idx]).html(player);
    });
    drawGraph();
}

var submitGame = function() {
    if ($('.name > input').length != 0) return false;
    var allplayers = $(".name");
    var currentplayers = [];
    $.each($('.name.playing'), function(idx, player) {
        currentplayers.push(allplayers.index(player));
        
    });
    var game = getSelectedGame();
    var tricks = getTricks();
    var dbl = isDouble();
    if (addScore(game, tricks, currentplayers, dbl)){
        drawGraph();
        $("#tricks").val('');
        $(".playing").removeClass('playing');
        $('#dbl').attr('checked', false);
    }

}

var reInitialize = function() {
    localStorage.setItem('currentgame', JSON.stringify(gameprogress));
    $('.score').html('0');
    initVars();
    loadGame();
}


var initVars = function() {
    var players = [];
    $.each($('.name'), function(idx, name) {
        players.push($(name).html());
    });
    gameprogress = {players: players, games: []};
    $('.score').html('0');
    graph = [[[0, 0]], [[0, 0]], [[0, 0]], [[0, 0]]];
};

$(document).ready(function() {
    initVars();

    // hover game in history
    $('.jqplot-point-label').live('hover', function(ev) {
        $this = $(this);
        if (! $this.data('nr'))
            $this.data('nr', $this.html());
        if (ev.type == 'mouseenter'){
            var classes = $this.attr('class').split(' ');
            var serieid = classes[1].split('-')[2];
            var pointid = classes[2].split('-')[2];
            var game = graph[serieid][pointid][2];
            var players = [];
            $.each(game.players, function(_, idx) {
                players.push(gameprogress.players[idx]);
            });
            var deletelink = $("<a style='cursor: pointer;'>").html("Delete").click(function(){
                gameprogress.games.splice(pointid -1, 1);
                reInitialize();
            });
            var replacelink = $("<a style='cursor: pointer;'>").html("Replace").click(function(){
                    inputtype = 'replace';
                    inputgamenum = pointid -1;
                    $('#submit').html('Replace');
                    $('#tricks').val(game.tricks);
                    $(".playing").removeClass('playing');
                    var names = $('.name');
                    $.each(game.players, function(ndx, idx) {
                        $(names[idx]).toggleClass("playing");
                    });
                    $('#'+game.game).click();
                    $('#dbl').attr('checked', game.dbl ? true : false);
            });
            var gameinfo = $("<div>").append("Payer(s) " + players.join(', ') + "<br/>Played " + (game.dbl ? ' <b>double</b> ' : '') +  game.game + "<br/> and made " + game.tricks + " tricks.<br/>");
            gameinfo.append(deletelink);
            gameinfo.append("&nbsp;");
            gameinfo.append(replacelink);
            var data = $('<div class="jqplot-highlighter-tooltip" style="font-size: 14px;">').html(gameinfo);
            $this.html(data);
        }
        else
            $this.html($this.data('nr'));
    });
    
    //name change
    $('.name').dblclick(function() {
        $("#submit").attr("disabled", "disabled");
        $this = $(this);
        var oldname = $this.html();
        if (oldname.substring(0,1) != "<") {
            var inp = $("<input class='inpbox'>");
            inp.val(oldname);
            $this.html(inp);
            inp.select();
            inp.keyup(function (ev) {
                switch(ev.keyCode){
                    case 13: {
                        $this.html(inp.val());
                        gameprogress.players[$('.name').index($this)] = $this.html();
                        drawGraph();
                        break;
                    }
                    case 27: {
                        $this.html(oldname);
                        break;
                    }
                }

                $("#submit").removeAttr("disabled");
                return true
            });
        }
    });
    //player select
    $('.name').click(function() {
        var gametype = getSelectedGame();
        $this = $(this)
        $this.toggleClass("playing");
    });
    $("#submit").click(submitGame);
    $("#undo").click(function() {
        gameprogress.games.pop();
        reInitialize();
    });
    $('#tricks').keydown(function (ev) {
        console.log(ev.keyCode);
        if ((ev.keyCode >= 48 && ev.keyCode <= 57) || //number codes
             [8, 9, 17, 46].indexOf(ev.keyCode) != -1 || //backspace, tab, ctrl and delete
             (ev.keyCode >= 96 && ev.keyCode <= 105) || //numeric keys
             (ev.keyCode >= 35 && ev.keyCode <= 40) //arrow keys, home and end
             ){
            return true;
        }
        if (ev.keyCode == 13){
            submitGame();
        }
        if (ev.keyCode == 27){
            inputtype = "";
            inputgamenum = -1;
            $('#submit').html('Enter');
            $(".playing").removeClass('playing');
            $('#dbl').attr('checked', false);
            $('#alone').click();
            $('#tricks').val('');
            $('#submit').focus();
            $('#tricks').focus();
            
        }
        return false;
    });

    if(localStorage.hasOwnProperty('currentgame')){
        if (confirm('Do you want to resume previous game?')) loadGame();
    }

    $.jqplot('chart', graph, getGraphOptions());
});
