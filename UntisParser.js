// var htmlparser = require("htmlparser2");
const CONFIG = require("./config");
let SCHEDULE_BASE_URL = CONFIG.get_schedule_base_url();


exports.get_data = function() {

// var options = {hostname: SCHEDULE_BASE_URL, port: 80, path: '/f1/subst_004.htm', method: 'GET'};

var data = [];

fetch("http://www.primo-levi-gymnasium.cidsnet.de/vertretungsplan/UrsprungS/ticker.htm").then(function(response) {
  return response.text();
}).then(function(html_data) {
    var message_of_the_day = html_data.match(/<marquee.*>(.*)<\/marquee>/g)[1];
    data.push(message_of_the_day);
});

fetch("http://www.primo-levi-gymnasium.cidsnet.de/vertretungsplan/UrsprungS/f1/subst_004.htm").then(function(response) {
  // console.log(response.text());
  return response.text();
}).then(function(html_data) {
    console.log(html_data);
    console.log("With type: " + typeof html_data);
    console.log("Now there comes the regex!");
    var meta_data = html_data.match(/<div class="mon_title">([0-9.]*)\s*([a-zA-Z]*)\s*(?:\(Seite \d+ \/ \d+\))?<\/div>\s*/g);
    var date = meta_data[1];
    data.push(date);
    var day_of_week = meta_data[2];
    data.push(day_of_week);
    var schedule_data = html_data.match(/<table class="mon_list" >[\s\S]*<\/table>/g)[0];
    schedule_data = schedule_data.substring("<table class=\"mon_list\" >".length, schedule_data.length - "</table>".length).split("</tr>").slice(1,-1);
    get_schedule_entry_contents = function (element){
      console.log(element);
      var raw_data = element.match(/<td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td>/);
      return {class: raw_data[1],
              lesson: raw_data[2],
              substitute_teacher: raw_data[3],
              subject: raw_data[4],
              substituted_teacher: raw_data[5],
              room: raw_data[6],
              notes: raw_data[7]};
    }
    schedule_data = schedule_data.map(get_schedule_entry_contents);
    data.push(schedule_data);

    /*
    regexStr = "<div class=\"mon_title\">";
    regexStr += "(.*)\\s*";                      // date, format: (D)D.(M)M.YYYY e.g. 3.11.2017, 12.1.2020
    regexStr += "([a-zA-Z]*)\\s*";               // day of the week e.g. 'Donnerstag'
    regexStr += "(?:\(Seite .*\))?</div>\\s.*";
    regexStr += "<table class=\"mon_list\" >\\s*";
    regexStr += "(?:<tr.*>(?:<th.*>.*</th>){7}</tr>)\\s*"; // table head
    regexStr += "(?:<tr.*>";
    regexStr += "(?:<td.*>(.*)</td>){7}";      // values: class, lesson, substitute teacher, subject, substituted teacher, room, notes
    regexStr += "</tr>\\s*)*";
    regexStr += "</table>";
    console.log("Regex compiled.");
    console.log(regexStr);
    var regex = new RegExp(regexStr);
    console.log("Regex created.");
    data = html_data.match(regex);
    console.log("Regex matched.");
    console.log(data); */
});

return data;
}
