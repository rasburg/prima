import React from 'react';
import { StyleSheet, Text, View, StatusBar, Dimensions } from 'react-native';
import { StackNavigator, } from 'react-navigation';
import { Container, Card, CardItem, Header, Title, Content, Button, Body, Icon, Spinner } from 'native-base';
import { Constants } from 'expo';

function format_date(date) {
  var monthNames = [
    "Januar", "Februar", "März",
    "April", "Mai", "Juni", "Juli",
    "August", "September", "Oktober",
    "November", "Dezember"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return day + '. ' + monthNames[monthIndex] + ' ' + year;
}

function add_leading_zero(x) {
  if (x < 10) {
    x = "0" + x;
  }
  return x;
}

function add_leading_zeroes(x) {
  if (x < 10) {
    x = "00" + x;
  } else if (x >= 10 && x < 100) {
    x = "0" + x;
  }
  return x;
}

function format_time(date) {
  var hour = add_leading_zero(date.getHours());
  var minutes = add_leading_zero(date.getMinutes());

  return hour + ':' + minutes;
}

function next_lesson(date) {
        let time = date.getHours() * 100 + date.getMinutes();
        let day_of_week = date.getDay();
        if ( day_of_week == 0 || day_of_week == 6 ) { return ["Schulschluss", true]; }
        let schedule = [[ 705,   750],  // 0. Stunde
                        [ 800,   845],  // 1. Stunde
                        [ 845,   930],  // etc.
                        [ 950,  1035],
                        [1035,  1120],
                        [1150,  1235],
                        [1245,  1330],
                        [1350,  1435],
                        [1435,  1520]];
      var next_up = 0;
      var has_started = false;
      for (i = 0; i < schedule.length; i++) {
        if ( time >= schedule[i][0] && time <= schedule[i][1] ) {
          next_up = i;
          has_started = true;
          return [next_up, has_started];
        }
        if (i + 1 < schedule.length) {
          if (time > schedule[i][1] && time < schedule[i+1][0]) {
            next_up = i + 1;
            if ( next_up > schedule[schedule.length - 1][1] ) {
              next_up = "Schulschluss";
            }
            return [next_up, has_started];
          }
        }
          return ["Schulschluss", true];
        }
}

// export default class App extends React.Component {
class HomeScreen extends React.Component {
  constructor() {
      super();
      this.state =    { loading:            true    };
      this.data =     { message_of_the_day: "Keine",
                        date:               "",
                        day_of_week:        "",
                        schedule_data:      []      };
      /* Expo.Font.loadAsync({
        'Roboto': require('./node_modules/native-base/Fonts/Roboto.ttf'),
        'Roboto_medium': require('./node_modules/native-base/Fonts/Roboto_medium.ttf'),
      }); */
  }

  /*
  async componentWillMount() {
    await Expo.Font.loadAsync({
      'Roboto': require('native-base/Fonts/Roboto.ttf'),
      'Roboto_medium': require('native-base/Fonts/Roboto_medium.ttf'),
    });
    this.status.loaded_fonts = true;
  }
  */

  async componentDidMount() {
    await Expo.Font.loadAsync({
      'Roboto': require('./node_modules/native-base/Fonts/Roboto.ttf'),
      'Roboto_medium': require('./node_modules/native-base/Fonts/Roboto_medium.ttf'),
    });

    console.log("Fonts loaded.");

    await this.fetch_data();

    console.log("Data fetched.");

    this.setState({ loading: false });

    console.log(this.state);
  }

  async fetch_data() {

    var response = await fetch("http://www.primo-levi-gymnasium.cidsnet.de/vertretungsplan/UrsprungS/ticker.htm");
    var html_data = await response.text();
    var message_of_the_day = html_data.match(/<marquee.*>(.*)<\/marquee>/)[1];
    if (message_of_the_day !== undefined) {
      this.data.message_of_the_day = message_of_the_day;
    }
    console.log(this.data.message_of_the_day);

    response = await fetch("http://www.primo-levi-gymnasium.cidsnet.de/vertretungsplan/UrsprungS/f1/subst_004.htm");
    html_data = await response.text();
    // console.log(html_data);
    // console.log("With type: " + typeof html_data);
    // console.log("Now there comes the regex!");
    var meta_data = html_data.match(/<div class="mon_title">([0-9.]*)\s*([a-zA-Z]*)\s*(?:\(Seite \d+ \/ \d+\))?<\/div>\s*/);
    this.data.date = meta_data[1];
    this.data.day_of_week = meta_data[2];
    var schedule_data = html_data.match(/<table class="mon_list" >[\s\S]*<\/table>/g)[0];
    schedule_data = schedule_data.substring("<table class=\"mon_list\" >".length, schedule_data.length - "</table>".length).split("</tr>").slice(1,-1);
    get_schedule_entry_contents = function (element) {
      // console.log(element);
      var raw_data = element.match(/<td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td>/);
      processed_data = raw_data.map(function(x){return x.replace("&nbsp;", "")});
      return {class: processed_data[1],
              lesson: processed_data[2],
              substitute_teacher: processed_data[3],
              subject: processed_data[4],
              substituted_teacher: processed_data[5],
              room: processed_data[6],
              notes: processed_data[7]};
    }
    this.data.schedule_data = schedule_data.map(get_schedule_entry_contents);

    // console.log(this.data);
  }

  static navigationOptions = {
    title: 'Prima Agenda',
  };

  render() {
    const { navigate } = this.props.navigation;
    const {height: screenHeight} = Dimensions.get('window');
    var date = new Date();
    var date_str = format_date(date);
    var time_str = format_time(date);
    var next_up = next_lesson(date);
    var next_up_str = next_up[0] + ".";
    if ( next_up[1] ) { next_up_str += " (läuft)"; }
    if (this.state.loading) {
      return (
        <Container>
         <Content>
            <View style={{flex: 1, height: screenHeight, justifyContent: 'center'}}>
                <Spinner />
            </View>
         </Content>
       </Container>
      );
    } else {
      return (
        <Container>
         <Content>
         <Card>
            <CardItem>
                <Text>
                  {date_str}
                </Text>
            </CardItem>
            <CardItem>
                <Text>
                  {time_str}
                </Text>
            </CardItem>
            <CardItem>
                <Text>
                Nächste Stunde: {next_up_str}
                </Text>
            </CardItem>
         </Card>
         <Card>
            <CardItem header>
                <Text style={{fontWeight: 'bold'}}>
                  Nachricht des Tages
                </Text>
            </CardItem>
            <CardItem>
              <Body>
                <Text>
                   {this.data.message_of_the_day}
                </Text>
              </Body>
            </CardItem>
          </Card>
           <Button iconLeft large full light onPress={() => navigate('MySchedule', { })}>
            <Icon name='person' />
            <Text>Mein Vertretungsplan</Text>
           </Button>
           <Button iconLeft large full light onPress={() => navigate('Schedule', { })}>
            <Icon name='paper' />
            <Text>Alle Vertretungen</Text>
           </Button>
           <Button iconLeft large full light onPress={() => navigate('Settings', { })}>
            <Icon name='settings' />
            <Text>Einstellungen</Text>
           </Button>
         </Content>
       </Container>
        /*
        <View style={styles.container}>
          <Text>Open up App.js to start working on your app!</Text>
          <Text>Changes you make will automatically reload.</Text>
          <Text>Shake your phone to open the developer menu.</Text>
        </View>
        */
      );
    }
  }
  /*
  render() {
    console.log("Rendering");
    return (
      <View style={styles.container}>
        <Text>Open up App.js to start working on your app!</Text>
        <Text>Changes you make will automatically reload.</Text>
        <Text>Shake your phone to open the developer menu.</Text>
        <Text>sdf{this.data.message_of_the_day}</Text>
      </View>
    );
  }
  */
}

class MyScheduleScreen extends React.Component {
  static navigationOptions = {
    title: 'Mein Vertretungsplan',
  };
  render() {
    const { navigate } = this.props.navigation;
    return <Text> my schedule </Text>;
  }
}

class ScheduleScreen extends React.Component {
  constructor() {
      super();
      this.state =    { loading: true };
      this.days =     [];
  }

  async componentDidMount() {
    /*await Expo.Font.loadAsync({
      'Roboto': require('./node_modules/native-base/Fonts/Roboto.ttf'),
      'Roboto_medium': require('./node_modules/native-base/Fonts/Roboto_medium.ttf'),
    });*/

    // console.log("Fonts loaded.");

    await this.fetch_data();

    // console.log("Data fetched.");

    this.setState({ loading: false });
  }

  async fetch_data() {

    var days = [];
    const BASE_LINK = "http://www.primo-levi-gymnasium.cidsnet.de/vertretungsplan/UrsprungS/";
    var finished = false;
    // initial page to parse, i.d. first page of first day available
    var day = 1;

    while (!finished){
      var finished_day = false;
      var day_data =  { date:               "",
                        day_of_week:        "",
                        schedule_data:      []      };
      var page = 1;

      var link = BASE_LINK + "f" + day + "/subst_" + add_leading_zeroes(page) + ".htm";
      var response = await fetch(link);
      var html_data = await response.text();
      var meta_data = html_data.match(/<div class="mon_title">([0-9.]*)\s*([a-zA-Z]*)\s*(?:\(Seite \d+ \/ \d+\))?<\/div>\s*/);
      day_data.date = meta_data[1];
      day_data.day_of_week = meta_data[2];
      console.log(day_data.day_of_week);

      while (!finished_day){
        link = BASE_LINK + "f" + day + "/subst_" + add_leading_zeroes(page) + ".htm";
        response = await fetch(link);
        html_data = await response.text();
        console.log("day: " + day + ", page: " + page);
        const next_up = parseInt(html_data.match(/<meta http-equiv="refresh" content="10; URL=subst_(.*).htm">/)[1], 10);
        console.log(next_up);
        let schedule_data = html_data.match(/<table class="mon_list" >[\s\S]*<\/table>/g)[0];
        schedule_data = schedule_data.substring("<table class=\"mon_list\" >".length, schedule_data.length - "</table>".length).split("</tr>").slice(1,-1);
        day_data.schedule_data = day_data.schedule_data.concat(schedule_data.map( function (element) {
          let raw_data = element.match(/<td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td><td.*>(.*)<\/td>/);
          processed_data = raw_data.map(function(x){return x.replace("&nbsp;", "")});
          return {class: processed_data[1],
                  lesson: processed_data[2],
                  substitute_teacher: processed_data[3],
                  subject: processed_data[4],
                  substituted_teacher: processed_data[5],
                  room: processed_data[6],
                  notes: processed_data[7]};
        }));
        page++;
        if (next_up == 1) {
          finished_day = true;
        }
      }
      days.push(day_data);
      console.log("Pushed day: " + day_data.day_of_week);
      day++;

      // check whetcher a succeeding folder is available
      link = BASE_LINK + "f" + day + "/subst_001.htm";
      response = await fetch(link);
      html_data = await response.text();
      const has_no_next = html_data.match(/Objekt nicht gefunden!|Error 404/);
      if (has_no_next !== null) {
        finished = true;
      }
    }

    this.days = days;
    console.log(days);
  }

  static navigationOptions = {
    title: 'Alle Vertretungen',
  };

  render() {
    const { navigate } = this.props.navigation;
    // console.log("days:" + this.days);
    const {height: screenHeight} = Dimensions.get('window');
    if (this.state.loading) {
      return (
        <Container>
         <Content>
            <View style={{flex: 1, height: screenHeight, justifyContent: 'center'}}>
                <Spinner />
            </View>
         </Content>
       </Container>
      );
    } else {
      var days = this.days.map(function(day, k){
        console.log("day:" + day.schedule_data);
        var cards = day.schedule_data.map(function(card_data, i){
          console.log("card data:" + card_data);
          var card = Object.values(card_data).map(function(val, j){
            return <CardItem key={k + "_" + i + "_" + j}><Text>{val}</Text></CardItem>;
          });
          return <Card key={k + "_" + i}>{card}</Card>;
        });
        let ret = [];
        ret.push(
          <Card key={k}>
            <CardItem key={k + "_0"}>
              <Text style={{fontSize: 30, fontWeight: '600'}}>
                {day.day_of_week + ', ' + day.date}
              </Text>
            </CardItem>
          </Card>
        );
        for (var d=0; d < cards.length; d++) {
          ret.push(cards[d]);
        }
        return ret;
      });
      return (
          <Container>
            <Content>
              {days}
            </Content>
          </Container>
      );
    }
  }
}

class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Einstellungen',
  };
  render() {
    const { navigate } = this.props.navigation;
    return <Text> settings </Text>;
  }
}

const MainScreenNavigator = StackNavigator({
  Home: { screen: HomeScreen },
  MySchedule: { screen: MyScheduleScreen },
  Schedule: { screen: ScheduleScreen },
  Settings: { screen: SettingsScreen }
});

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <MainScreenNavigator style={{ width: Dimensions.get('window').width }} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  header: {
    marginTop: StatusBar.currenHeight,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
  },
});
