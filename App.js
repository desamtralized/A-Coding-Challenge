import { StatusBar } from 'expo-status-bar';
import React, { Component } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import AssetsSelector from './components/AssetsSelector';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

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
    this.state = {}
    this.loadAssetPrices = this.loadAssetPrices.bind(this)
    this.client = new ApolloClient({
      uri: 'https://graph.mirror.finance/graphql',
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {fetchPolicy: 'no-cache'},
        query: {fetchPolicy: 'no-cache'}
      }
    });

  }
 
  loadAssetPrices(mAsset) {
    let to = new Date().getTime()
    let from = new Date(to - DAY).getTime()

    this.client.query({
      query: this.GET_PRICES,
      variables: {
        contract: mAsset.token,
        interval: 180, 
        from, 
        to
      }
    }).then(result => {
      let prices = result.data.asset.prices

      let [history, labels] = prices.history.reduce((accum, val) => {
        accum[0].push(parseFloat(val.price))
        let time = new Date(parseInt(val.timestamp))
        let minutes = time.getMinutes()
        minutes = minutes < 10 ? '0' + minutes : minutes
        accum[1].push(`${time.getHours()}:${minutes}`)
        return accum;
      }, [[], []])

      let [oracleHistory] = prices.oracleHistory.reduce((accum, val) => {
        accum[0].push(parseFloat(val.price))
        return accum;
      }, [[]])

      console.log('oracleHistory', oracleHistory)

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
    }).catch(e => console.error(e))
  }

  render() {
    return (
      <View style={styles.container}>
        <AssetsSelector onAssetSelected={this.loadAssetPrices}/>
        <StatusBar style="auto" />
        <View style={styles.chartContainer}>
          {this.state.chartData && <LineChart
            data={this.state.chartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}/>}
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
  }
});

const chartConfig = {
  color: (opacity = 1) => `rgba(177, 177, 177, ${opacity})`,
  useShadowColorFromDataset: true,
};

export default App;