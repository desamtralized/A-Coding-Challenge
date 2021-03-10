import React, { Component, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker'

class AssetsSelector extends Component {

  constructor(props) {
    super(props)
    this.state = {
      selectedAsset: {},
      mAssets: []
    }
    this.onAssetSelected = this.onAssetSelected.bind(this)
  }

  onAssetSelected(mAsset) {
    this.props.onAssetSelected(mAsset)
    this.setState({selectedAsset: mAsset})
  }

  componentDidMount() {
    fetch('https://whitelist.mirror.finance/columbus.json').then(response =>{ 
      return response.json()
    }).then(mAssets => {
      this.setState({mAssets: Object.values(mAssets.whitelist)})
    })
  }

  render() {
    return (
      <View style={styles.pickerContainer}>
        <Picker
          style={styles.picker}
          label="Select a mAsset"
          selectedValue={this.state.selectedAsset}
          onValueChange={this.onAssetSelected}>
            {this.state.mAssets.filter(it => it.symbol != 'MIR').map(mAsset => {
              return <Picker.Item label={`${mAsset.symbol} - ${mAsset.name}`} 
                key={mAsset.token} value={mAsset} />
            })}
        </Picker>
      </View>
    )
  }
  
}

const styles = StyleSheet.create({
  pickerContainer: {
    paddingRight: 4,
    paddingLeft: 16,
    paddingBottom: 4,
    width: 180,
    height: 50,
    backgroundColor: '#26272A',
    borderRadius: 100,
  },
  picker: {
    color: '#7f7f7f'
  }
});

export default AssetsSelector;
