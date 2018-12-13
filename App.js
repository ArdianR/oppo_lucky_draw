import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, WebView, PermissionsAndroid, requireNativeComponent, NativeModules } from 'react-native';

import DeviceInfo from 'react-native-device-info';
const IMEI = require('react-native-imei');

const RCTCustomWebView = requireNativeComponent("RCTCustomWebView", App, WebView.extraNativeComponentConfig);
const { CustomWebViewManager } = NativeModules;

import PropTypes from 'prop-types';

async function requestPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      {
        'title': '',
        'message': ''
      }
    )
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("permission granted")
    } else {
      console.log("permission denied")
    }
  } catch (err) {
    console.log(err)
  }
}

export default class App extends Component {

  static propTypes = {
    ...WebView.propTypes,
    webviewRef: PropTypes.func
  };

  componentDidMount() {
    requestPermission()
  }

  phoneData() {
    data = `
      document.getElementById('imei').value = '${IMEI.getImei()}';
      document.getElementById('password').value = '${DeviceInfo.getDeviceName()}';
    `;
    return data;
  }

  getNativeConfig() {
    if (Platform.OS !== "android") {
      return null;
    }
    return {
      component: RCTCustomWebView,
      viewManager: CustomWebViewManager
    };
  }


  render() {

    const { webviewRef, ...props } = this.props;

    return (
      <WebView
        ref={webviewRef}
        {...props}
        nativeConfig={this.getNativeConfig()}
        source={{uri: 'http://odpbckmjg.oppomobile.id/app/android'}}
        style={styles.container}
        javaScriptEnabledAndroid={true}
        injectedJavaScript={this.phoneData()}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
});
