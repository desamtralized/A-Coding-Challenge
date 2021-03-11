import { StatusBar } from 'expo-status-bar';
import React, { Component } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable } from 'react-native';
import AssetsSelector from './components/AssetsSelector';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const CHART_TYPE_HOUR = 0
const CHART_TYPE_DAY = 1

class App extends Component {
  
  GET_PRICES= gql`
    query($contract: String!, $interval: Float!, $from: Float!, $to: Float!) {
      asset(token: $contract) {
        prices {
          history(interval: $interval, from: $from, to: $to) {
            timestamp
            price
          }
          oracleHistory(interval: $interval, from: $from, to: $to) {
            timestamp
            price
          }
        }
      }
    }
  `;

   constructor(props) {
    super(props)
    this.state = {chartType: CHART_TYPE_HOUR}
    this.setChartType = this.setChartType.bind(this)
    this.loadAssetPrices = this.loadAssetPrices.bind(this)
    this.updateChart = this.updateChart.bind(this)

    this.client = new ApolloClient({
      uri: 'https://graph.mirror.finance/graphql',
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {fetchPolicy: 'no-cache'},
        query: {fetchPolicy: 'no-cache'}
      }
    });

  }

  setChartType(chartType) {
    this.setState({chartType})
  }
 
  loadAssetPrices(mAsset) {
    let to = new Date().getTime()
    let from = new Date(to - (DAY/3)).getTime()

    this.client.query({
      query: this.GET_PRICES,
      variables: {
        contract: mAsset.token,
        interval: 60, 
        from, 
        to
      }
    }).then(result => {
      let prices = result.data.asset.prices
      this.setState({
        mAsset, 
        history: prices.history, 
        oracleHistory: prices.oracleHistory
      })
      this.updateChart()
    }).catch(e => console.error(e))
  }

  updateChart() {
    let mAsset = this.state.mAsset
    let [history, labels] = this.state.history.reduce((accum, val) => {
      accum[0].push(parseFloat(val.price))
      let time = new Date(parseInt(val.timestamp))
      let minutes = time.getMinutes()
      minutes = minutes < 10 ? '0' + minutes : minutes
      accum[1].push(`${time.getHours()}:${minutes}`)
      return accum;
    }, [[], []])

    let [oracleHistory] = this.state.oracleHistory.reduce((accum, val) => {
      accum[0].push(parseFloat(val.price))
      return accum;
    }, [[]])

    let chartData = {
      legend: [mAsset.name],
      labels,
      datasets: [{
        data: history,
        backgroundGradientFrom: `rgba(15, 83, 255, 1)`, 
        backgroundGradientFromOpacity: 1,
        backgroundGradientTo: `rgba(15, 83, 255, 1)`, 
        backgroundGradientToOpacity: 0.6,
        color: (opacity = 1) => `rgba(15, 83, 255, ${opacity})`
      }, {
        data: oracleHistory,
        backgroundGradientFrom: `rgba(0, 199, 53, 1)`, 
        backgroundGradientFromOpacity: 1,
        backgroundGradientTo: `rgba(0, 199, 53, 1)`, 
        backgroundGradientToOpacity: 0.6,
        color: (opacity = 1) => `rgba(0, 199, 53, ${opacity})`
      }]
    }

    this.setState({chartData})
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <AssetsSelector onAssetSelected={this.loadAssetPrices}/>
        <View style={styles.chartContainer}>
          {this.state.chartData && <LineChart
            data={this.state.chartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}/>}
        </View>
        <View style={styles.timeButtonsContainer}>
          <Pressable style={[styles.timeButton, {
            backgroundColor: (this.state.chartType == CHART_TYPE_HOUR ? 
            'rgba(53, 182, 228, 0.3)' : '#323438')}]}
             onPress={() => {this.setChartType(CHART_TYPE_HOUR)}}>
            <Text style={styles.timeButtonText}>1H</Text>
          </Pressable>
          <Pressable style={[styles.timeButton, {
            backgroundColor: (this.state.chartType == CHART_TYPE_DAY ? 
            'rgba(53, 182, 228, 0.3)' : '#323438')}]}
             onPress={() => {this.setChartType(CHART_TYPE_DAY)}}>
            <Text style={styles.timeButtonText}>1D</Text>
          </Pressable>
        </View>
      </View>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2023'
  },
  chartContainer: {
    marginVertical: 10,
    height: 220
  },
  timeButtonsContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    marginTop: 30,
    padding: 8
  },
  timeButton: {
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: '#323438',
    padding: 4,
    marginHorizontal: 6,
    width: 50,
    height: 40,
    borderRadius: 8,
  },
  timeButtonSelected: {
    backgroundColor: 'rgba(53, 182, 228, 0.1)'
  },
  timeButtonText: {
    textAlign: 'center',
    width: '100%',
    alignContent: 'center',
    color: '#7f7f7f'
  }
});

const chartConfig = {
  color: (opacity = 1) => `rgba(177, 177, 177, ${opacity})`,
  useShadowColorFromDataset: true,
};

export default App;