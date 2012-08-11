var graph = [[[0, 0]], [[0, 0]], [[0, 0]], [[0, 0]]];
var getGraphOptions = function () {
    var maxtick = graph[0].length;
    var options = {axes: { xaxis: {min: 0, max: maxtick, numberTicks: maxtick+1}},
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


var addScore = function() {
    var game = getSelectedGame();
    var tricks = getTricks();
    var multiplier = isDouble() ? 2: 1;
    var basescore = game.getBaseScore(tricks, multiplier);
    var scores = $(".score");
    var amount = $('.playing').length;
    if (! game.validate(amount)){
        alert("Invalid amount of players!");
        return false
    }
    //TODO: think of triplie miserie
    var alone = amount == 2 ? 1: 3;
    $.each($('.name'), function(idx, val){
        var score = parseInt(scores[idx].innerHTML);
        if($(val).hasClass('playing')){
            score += basescore * alone;
        }
        else{
            score -= basescore;
        }
        scores[idx].innerHTML = score;

        graph[idx].push([graph[idx].length, score]);
    });
    $("#charts").empty();
    $("#charts").append($("<div id='chart'>"));
    $.jqplot('chart', graph, getGraphOptions());
    var t = +new Date();
    var play = {ts: t, game: game, tricks: tricks}
    localStorage.setItem('game.' + t, JSON.stringify(play));
    return true;

};

$(document).ready(function() {

    //name change
    $('.name').dblclick(function() {
        var newname = prompt("Enter new name:")
        this.innerHTML = newname;
    } );
    //player select
    $('.name').click(function() {
        var gametype = getSelectedGame();

        $this = $(this)
        $this.toggleClass("playing");
    } );
    $('#tricks').keydown(function (ev) {
        console.log(ev.keyCode);
        if ((ev.keyCode >= 48 && ev.keyCode <= 57) || ev.keyCode == 8 || ev.keyCode == 9 || ev.keyCode == 17){
            return true;
        }
        if (ev.keyCode == 13){
            if (addScore()){
                $("#tricks").val('');
                $(".playing").removeClass('playing');
                $('#dbl').attr('checked', false);
            }
        }
        return false;
    });

    $.jqplot('chart', graph, getGraphOptions());
});
