# A-Coding-Challenge
ReactNative App that shows price information of mAssets from [Mirror Protocol](https://mirror.finance/).

<img src="https://user-images.githubusercontent.com/564039/110788252-617a8480-823c-11eb-85b9-e23868dbe45e.jpg" width="250"/>

## Environment Setup
- 1) Setup ReactNative environment with Expo: https://reactnative.dev/docs/environment-setup
- 2) Clone this repo with `git clone git@github.com:sambarboza/A-Coding-Challenge.git`
- 3) Using your terminal, Navigate to `A-Coding-Challenge` folder and run `npm install`
- 4) Run `expo start`

## Description
A list of mAssets is lodaded from https://whitelist.mirror.finance/columbus.json and shown in a selector.

When a user selects a mAsset, its Oracle and TerraSwap price history will be loaded using [Mirror's GraphQL](https://graph.mirror.finance/graphql) data source.

Users can toggle between 1H (Hourly interval) and 1D (Daily interval). The last 8 hours of data will be loaded for the Hourly graph and 7 days of data for the Daily.
