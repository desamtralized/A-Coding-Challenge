import { StatusBar } from 'expo-status-bar';
import React, { Component } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import AssetsSelector from './components/AssetsSelector';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { LineChart } from 'react-native-chart-kit';
import CheckBox from '@react-native-community/checkbox';

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
    this.state = {
      chartType: CHART_TYPE_HOUR, 
      lastOraclePrice: 0, 
      lastTerraSwapPrice: 0,
      showOraclePrice: true,
      showTerraSwapPrice: true
    }

    this.setChartType = this.setChartType.bind(this)
    this.loadAssetPrices = this.loadAssetPrices.bind(this)
    this.updateChart = this.updateChart.bind(this)
    this.setShowTerraSwapPrice = this.setShowTerraSwapPrice.bind(this)
    this.setShowOraclePrice = this.setShowOraclePrice.bind(this)

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
    this.setState({chartType}, () => {
      this.loadAssetPrices(this.state.mAsset)
    })
  }
 
  loadAssetPrices(mAsset) {
    this.setState({loading: true})
    let to = new Date().getTime()
    let from, interval
    if (this.state.chartType == CHART_TYPE_HOUR) {
      to = to - (HOUR/4)
      from = new Date(to - (DAY/3)).getTime()
      interval = 60 //minutes
    } else {
      to = to - (DAY/2)
      from = new Date(to - (DAY * 7)).getTime()
      interval = 24 * 60 //1 day in minutes
    }

    this.client.query({
      query: this.GET_PRICES,
      variables: {
        contract: mAsset.token,
        interval,
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

  setShowTerraSwapPrice(val) {
    this.setState({showTerraSwapPrice: val}, this.updateChart)
  }

  setShowOraclePrice(val) {
    this.setState({showOraclePrice: val}, this.updateChart)
  }

  updateChart() {
    let [history, labels] = this.state.history.reduce((accum, val) => {
      if (this.state.showTerraSwapPrice) {
        accum[0].push(parseFloat(val.price))
      }
      let date = new Date(parseInt(val.timestamp))
      if (this.state.chartType == CHART_TYPE_HOUR) {
        let minutes = date.getMinutes()
        minutes = minutes < 10 ? '0' + minutes : minutes
        accum[1].push(`${date.getHours()}:${minutes}`)
      } else {
        let month = date.getMonth() + 1
        let day = date.getDate()
        month = month < 10 ? '0' + month : month
        day = day < 10 ? '0' + day : day 
        accum[1].push(`${month}/${day}`)
      }

      return accum;
    }, [[], []])

    let [oracleHistory] = this.state.oracleHistory.reduce((accum, val) => {
      if (this.state.showOraclePrice) {
        accum[0].push(parseFloat(val.price))
      }
      return accum;
    }, [[]])

    let chartData = {
      legend: ['Terraswap Price', 'Oracle Price'],
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

    let lastTerraSwapPrice, lastOraclePrice, priceChange
    if (history.length >= 2) {
      lastTerraSwapPrice = history[history.length - 1]
      priceChange = lastTerraSwapPrice - history[history.length - 2]
      lastTerraSwapPrice = lastTerraSwapPrice.toFixed(2)
      if (this.state.chartType == CHART_TYPE_DAY) {
        priceChange = priceChange.toFixed(2) + ' in the last Day'
      } else {
        priceChange = priceChange.toFixed(2) + ' in the last Hour'
      }
    }
    if (oracleHistory.length >= 2) {
      lastOraclePrice = oracleHistory[oracleHistory.length - 1].toFixed(2)
    }

    this.setState({
      chartData, 
      loading: false, 
      lastOraclePrice, 
      lastTerraSwapPrice,
      priceChange
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <AssetsSelector onAssetSelected={this.loadAssetPrices}/>
        <View style={styles.labelsContainer}>
          <Text style={styles.label}>Last Oracle Price: ${this.state.lastOraclePrice}</Text>
          <Text style={styles.label}>Last TerraSwap Price: ${this.state.lastTerraSwapPrice}</Text>
          <Text style={styles.label}>TerraSwap Price Change: ${this.state.priceChange}</Text>
        </View>
        <View style={styles.chartContainer}>
          {this.state.chartData && <LineChart
            data={this.state.chartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}/>}
          {this.state.loading && <ActivityIndicator size="large" 
            color="#00ff00" style={styles.loading} />}
        </View>
        <View style={styles.buttonsContainer}>
          <View style={styles.checkboxesContainer}>
            <View style={styles.checkboxContainer}>
              <CheckBox disabled={false} value={this.state.showTerraSwapPrice}
                style={styles.checkbox} onValueChange={this.setShowTerraSwapPrice} />
              <Text style={styles.checkboxLabel}>TerraSwap Price</Text>
            </View>
            <View style={styles.checkboxContainer}>
              <CheckBox disabled={false} value={this.state.showOraclePrice} 
                style={styles.checkbox} onValueChange={this.setShowOraclePrice} />
              <Text style={styles.checkboxLabel}>Oracle Price</Text>
            </View>
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
    marginTop: 26,
    height: 220,
    justifyContent: 'center'
  },
  timeButtonsContainer: {
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
  },
  loading: {
    position: 'absolute',
    alignSelf: 'center',
  }, 
  labelsContainer: {
    marginTop: 8,
    paddingHorizontal: 16,
    width: '100%'
  },
  label: {
    color: '#7f7f7f'
  },
  checkboxesContainer: {
    paddingTop: 24
  },
  checkboxContainer: {
    paddingLeft: 16,
    flexDirection: 'row'
  },
  checkboxLabel: {
    marginTop: 6,
    color: '#7f7f7f'
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});

const chartConfig = {
  color: (opacity = 1) => `rgba(177, 177, 177, ${opacity})`,
  useShadowColorFromDataset: true,
};

export default App;