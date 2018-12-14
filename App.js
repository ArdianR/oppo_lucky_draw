import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, WebView, PermissionsAndroid, requireNativeComponent, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import firebase from 'react-native-firebase';
import PropTypes from 'prop-types';
import type { Notification, NotificationOpen } from 'react-native-firebase';

const IMEI = require('react-native-imei');
const RCTCustomWebView = requireNativeComponent("RCTCustomWebView", App, WebView.extraNativeComponentConfig);
const { CustomWebViewManager } = NativeModules;

export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            Token: null,
        };
    }

    componentDidMount = async () => {
      
        const enabled = await firebase.messaging().hasPermission();
        if (!enabled) {
            try {
                await firebase.messaging().requestPermission();
            } catch (error) {
                console.log(error);
            }
        }

        const Token = await firebase.messaging().getToken();
        if (Token) {
            this.setState({
                Token: Token
            });
        }

        const notificationListener = await firebase.notifications().onNotification((notification: Notification) => {

            notification.android.setChannelId('test-channel').android.setSmallIcon('ic_launcher');
            firebase.notifications().displayNotification(notification);

            const localNotification = new firebase.notifications.Notification({
                sound: 'default',
                show_in_foreground: true,
                show_in_background: true
            })
            .setNotificationId(notification.notificationId)
            .setTitle(notification.title)
            .setSubtitle(notification.subtitle)
            .setBody(notification.body)
            .setData(notification.data)
            .android.setChannelId('app_name')
            .android.setSmallIcon('ic_launcher')
            .android.setColor('#00e600')
            .android.setPriority(firebase.notifications.Android.Priority.High);

            firebase.notifications().displayNotification(localNotification).catch(err => console.error(err));
        });

        const notificationDisplayedListener = await firebase.notifications().onNotificationDisplayed((notification: Notification) => {
            
        });

        const notificationOpen = await firebase.notifications().getInitialNotification();
        if (notificationOpen) {

            const action = notificationOpen.action;

            const notification = notificationOpen.notification;

            firebase.notifications().removeDeliveredNotification(notification.notificationId);
        }

        const notificationOpenedListener = await firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {

            const action = notificationOpen.action;

            const notification = new firebase.notifications.Notification({
                sound: 'default',
                show_in_foreground: true,
                show_in_background: true
            })
            .setNotificationId(notificationOpen.notification.notificationId)
            .setTitle(notificationOpen.notification.title)
            .setSubtitle(notificationOpen.notification.subtitle)
            .setBody(notificationOpen.notification.body)
            .setData(notificationOpen.notification.data)
            .android.setChannelId('app_name')
            .android.setSmallIcon('ic_launcher')
            .android.setColor('#00e600')
            .android.setPriority(firebase.notifications.Android.Priority.High);

            firebase.notifications().removeDeliveredNotification(notification.notificationId);
        });

    }

  static propTypes = {
    ...WebView.propTypes,
    webviewRef: PropTypes.func
  };

  phoneData() {
    data = `
      document.getElementById('imei').value = '${IMEI.getImei()}';
      document.getElementById('token').value = '${this.state.Token}';
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
    alignItems: 'center',
  },
});
